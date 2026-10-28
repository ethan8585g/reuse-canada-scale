import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

export const dispatchRoutes = new Hono<{ Bindings: Bindings }>()

dispatchRoutes.use('*', authMiddleware, employeeOnly)

// Dispatch chat: one thread per driver (dispatch_messages.driver_id), shared
// by every admin and manager. The driver side ("/me") is open to any employee
// and only ever touches the caller's own thread; the office side ("/threads")
// is admin/manager only.
//
// Files are stored base64 in D1 like every other upload here (no R2 binding).
// 700 KB per file keeps a row well under D1's limits; photos are shrunk on the
// phone before upload, so the cap only bites on large PDFs.

const MAX_BODY = 4000
const MAX_FILES = 4
const MAX_FILE_BYTES = 700_000

// Served inline only when the browser can't execute them; anything else is
// sent as a download with a neutral type so an uploaded .html can never run
// on this origin.
const INLINE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

const OFFICE_ROLES = ['admin', 'manager']

async function roleOf(c: any): Promise<string> {
  const row = await c.env.DB.prepare('SELECT role FROM employees WHERE id = ?').bind(c.get('userId')).first()
  return (row?.role as string) || ''
}

type IncomingFile = { filename: string; mime: string; size: number; data: string }

function cleanFiles(raw: any): IncomingFile[] | string {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) return 'Attachments must be a list'
  if (raw.length > MAX_FILES) return `At most ${MAX_FILES} files per message`
  const out: IncomingFile[] = []
  for (const f of raw) {
    let data = String(f?.data || '')
    const comma = data.indexOf(',')
    if (data.startsWith('data:') && comma > 0) data = data.slice(comma + 1)
    if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) return 'An attachment could not be read'
    const size = Math.floor(data.length * 3 / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0)
    if (size > MAX_FILE_BYTES) return `${f?.filename || 'A file'} is larger than 700 KB`
    const filename = String(f?.filename || 'file').replace(/[\r\n"\\/]/g, '_').slice(0, 120) || 'file'
    const mime = String(f?.mime || 'application/octet-stream').toLowerCase().slice(0, 100)
    out.push({ filename, mime, size, data })
  }
  return out
}

// Insert a message plus its files. Exported so the My Truck routes can drop a
// system note into the driver's thread.
export async function postDispatchMessage(
  db: D1Database, driverId: number, senderId: number | null,
  kind: 'driver' | 'dispatch' | 'system', body: string | null, files: IncomingFile[] = []
): Promise<number> {
  const res = await db.prepare(
    'INSERT INTO dispatch_messages (driver_id, sender_id, sender_kind, body) VALUES (?, ?, ?, ?)'
  ).bind(driverId, senderId, kind, body).run()
  const id = res.meta.last_row_id as number
  if (files.length) {
    await db.batch(files.map((f) => db.prepare(
      'INSERT INTO dispatch_attachments (message_id, filename, mime, size, data) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, f.filename, f.mime, f.size, f.data)))
  }
  return id
}

// Messages after `after` (exclusive), oldest first, each with file metadata
// but never file bodies. First load returns the latest 200.
async function threadMessages(db: D1Database, driverId: number, after: number) {
  const { results } = after > 0
    ? await db.prepare(
        `SELECT m.*, e.first_name || ' ' || e.last_name AS sender_name
         FROM dispatch_messages m LEFT JOIN employees e ON e.id = m.sender_id
         WHERE m.driver_id = ? AND m.id > ? ORDER BY m.id LIMIT 200`
      ).bind(driverId, after).all()
    : await db.prepare(
        `SELECT * FROM (SELECT m.*, e.first_name || ' ' || e.last_name AS sender_name
         FROM dispatch_messages m LEFT JOIN employees e ON e.id = m.sender_id
         WHERE m.driver_id = ? ORDER BY m.id DESC LIMIT 200) ORDER BY id`
      ).bind(driverId).all()
  const msgs = results as any[]
  if (msgs.length) {
    const ids = msgs.map((m) => m.id)
    const { results: files } = await db.prepare(
      `SELECT id, message_id, filename, mime, size FROM dispatch_attachments WHERE message_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`
    ).bind(...ids).all()
    const byMsg = new Map<number, any[]>()
    for (const f of files as any[]) {
      if (!byMsg.has(f.message_id)) byMsg.set(f.message_id, [])
      byMsg.get(f.message_id)!.push({ id: f.id, filename: f.filename, mime: f.mime, size: f.size, inline: INLINE_TYPES.includes(f.mime) })
    }
    for (const m of msgs) m.attachments = byMsg.get(m.id) || []
  }
  return msgs
}

function parseAfter(c: any) {
  const n = parseInt(c.req.query('after') || '0', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

// ── Driver side ──────────────────────────────────────────────────────────

dispatchRoutes.get('/me', async (c) => {
  try {
    const me = c.get('userId') as number
    const messages = await threadMessages(c.env.DB, me, parseAfter(c))
    // Opening the chat reads everything the office sent.
    await c.env.DB.prepare(
      "UPDATE dispatch_messages SET read_at = datetime('now') WHERE driver_id = ? AND sender_kind = 'dispatch' AND read_at IS NULL"
    ).bind(me).run()
    return c.json({ messages })
  } catch (err: any) {
    console.error('dispatch me error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

dispatchRoutes.get('/me/unread', async (c) => {
  try {
    const row = await c.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM dispatch_messages WHERE driver_id = ? AND sender_kind = 'dispatch' AND read_at IS NULL"
    ).bind(c.get('userId')).first()
    return c.json({ unread: (row?.n as number) || 0 })
  } catch (err: any) {
    console.error('dispatch unread error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

dispatchRoutes.post('/me', async (c) => {
  try {
    const { body, attachments } = await c.req.json()
    const text = String(body || '').trim()
    if (text.length > MAX_BODY) return c.json({ error: 'Message is too long' }, 400)
    const files = cleanFiles(attachments)
    if (typeof files === 'string') return c.json({ error: files }, 400)
    if (!text && !files.length) return c.json({ error: 'Type a message or attach a file' }, 400)
    const id = await postDispatchMessage(c.env.DB, c.get('userId'), c.get('userId'), 'driver', text || null, files)
    return c.json({ success: true, id })
  } catch (err: any) {
    console.error('dispatch send error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Office side (admin / manager) ────────────────────────────────────────

// Every active driver appears even with no messages yet, so the office can
// start a conversation; anyone else who has written in appears too.
dispatchRoutes.get('/threads', roleRequired(...OFFICE_ROLES), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT e.id AS driver_id, e.first_name || ' ' || e.last_name AS driver_name, e.phone, e.role, e.is_active,
              lm.id AS last_id, lm.body AS last_body, lm.sender_kind AS last_kind, lm.created_at AS last_at,
              (SELECT COUNT(*) FROM dispatch_attachments a WHERE a.message_id = lm.id) AS last_files,
              (SELECT COUNT(*) FROM dispatch_messages u WHERE u.driver_id = e.id AND u.sender_kind IN ('driver','system') AND u.read_at IS NULL) AS unread,
              ds.status AS driver_status
       FROM employees e
       LEFT JOIN dispatch_messages lm ON lm.id = (SELECT MAX(id) FROM dispatch_messages x WHERE x.driver_id = e.id)
       LEFT JOIN driver_status ds ON ds.employee_id = e.id
       WHERE (e.role = 'driver' AND e.is_active = 1) OR lm.id IS NOT NULL
       ORDER BY (lm.id IS NULL), lm.id DESC, e.first_name`
    ).all()
    return c.json({ threads: results })
  } catch (err: any) {
    console.error('dispatch threads error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

dispatchRoutes.get('/unread', roleRequired(...OFFICE_ROLES), async (c) => {
  try {
    const row = await c.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM dispatch_messages WHERE sender_kind IN ('driver','system') AND read_at IS NULL"
    ).first()
    return c.json({ unread: (row?.n as number) || 0 })
  } catch (err: any) {
    console.error('dispatch unread error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

dispatchRoutes.get('/threads/:driverId', roleRequired(...OFFICE_ROLES), async (c) => {
  try {
    const driverId = parseInt(c.req.param('driverId'), 10)
    const driver = await c.env.DB.prepare(
      "SELECT id, first_name || ' ' || last_name AS name, phone, role FROM employees WHERE id = ?"
    ).bind(driverId).first()
    if (!driver) return c.json({ error: 'Driver not found' }, 404)
    const messages = await threadMessages(c.env.DB, driverId, parseAfter(c))
    await c.env.DB.prepare(
      "UPDATE dispatch_messages SET read_at = datetime('now') WHERE driver_id = ? AND sender_kind IN ('driver','system') AND read_at IS NULL"
    ).bind(driverId).run()
    return c.json({ driver, messages })
  } catch (err: any) {
    console.error('dispatch thread error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

dispatchRoutes.post('/threads/:driverId', roleRequired(...OFFICE_ROLES), async (c) => {
  try {
    const driverId = parseInt(c.req.param('driverId'), 10)
    const driver = await c.env.DB.prepare('SELECT id FROM employees WHERE id = ?').bind(driverId).first()
    if (!driver) return c.json({ error: 'Driver not found' }, 404)
    const { body, attachments } = await c.req.json()
    const text = String(body || '').trim()
    if (text.length > MAX_BODY) return c.json({ error: 'Message is too long' }, 400)
    const files = cleanFiles(attachments)
    if (typeof files === 'string') return c.json({ error: files }, 400)
    if (!text && !files.length) return c.json({ error: 'Type a message or attach a file' }, 400)
    const id = await postDispatchMessage(c.env.DB, driverId, c.get('userId'), 'dispatch', text || null, files)
    return c.json({ success: true, id })
  } catch (err: any) {
    console.error('dispatch reply error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Files ────────────────────────────────────────────────────────────────
// A driver may only open files in their own thread; the office may open any.
dispatchRoutes.get('/attachments/:id', async (c) => {
  try {
    const f = await c.env.DB.prepare(
      `SELECT a.filename, a.mime, a.data, m.driver_id FROM dispatch_attachments a
       JOIN dispatch_messages m ON m.id = a.message_id WHERE a.id = ?`
    ).bind(c.req.param('id')).first() as any
    if (!f) return c.json({ error: 'File not found' }, 404)
    if (f.driver_id !== c.get('userId') && !OFFICE_ROLES.includes(await roleOf(c))) {
      return c.json({ error: 'File not found' }, 404)
    }
    const bin = atob(f.data)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const inline = INLINE_TYPES.includes(f.mime)
    return new Response(bytes, {
      headers: {
        'Content-Type': inline ? f.mime : 'application/octet-stream',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${f.filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (err: any) {
    console.error('dispatch file error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
