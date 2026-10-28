import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

// The web scale-bridge: the scale-house terminal POSTs its live reading here
// so other clients (phones, the scale-tickets weight modal, the office) can
// pull the same value without needing their own Web Bluetooth pairing.
//
// Distinct from `scale-bridge.js`, which is a local USB-Serial → localhost
// helper that runs on the scale-house PC. This route is the network-side
// fan-out.

export const scaleBridgeRoutes = new Hono<{ Bindings: Bindings }>()

scaleBridgeRoutes.use('*', authMiddleware, employeeOnly)

// Scale-house terminal publishes the current reading. Gated to the roles
// that actually operate the scale so a compromised driver session can't
// poison the value every other client trusts.
scaleBridgeRoutes.post('/publish',
  roleRequired('admin', 'manager', 'yard_operator'),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({})) as any
      const weight = Number(body?.weight)
      const stable = body?.stable ? 1 : 0
      const modeRaw = typeof body?.connection_mode === 'string' ? body.connection_mode : null
      const mode = modeRaw ? modeRaw.slice(0, 16) : null

      if (!Number.isFinite(weight)) {
        return c.json({ error: 'weight must be a finite number' }, 400)
      }
      // Reject obvious junk readings — the APX is rated ~30 t, anything past
      // 200 t is wrong and should not be propagated to other clients.
      if (Math.abs(weight) > 200000) {
        return c.json({ error: 'weight out of range' }, 400)
      }

      const employeeId = c.get('userId')
      await c.env.DB.prepare(
        `UPDATE scale_bridge_state
         SET weight_kg = ?, is_stable = ?, connection_mode = ?,
             publisher_employee_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`
      ).bind(weight, stable, mode, employeeId).run()

      return c.json({ ok: true })
    } catch (err: any) {
      return c.json({ error: err?.message || 'publish failed' }, 500)
    }
  }
)

// Any logged-in employee can read the most-recent published weight.
// Returns staleness so the caller can refuse to use an old reading.
scaleBridgeRoutes.get('/current', async (c) => {
  try {
    const row = await c.env.DB.prepare(
      `SELECT s.weight_kg, s.is_stable, s.connection_mode, s.updated_at,
              s.publisher_employee_id,
              e.first_name || ' ' || e.last_name AS publisher_name,
              CAST((julianday('now') - julianday(s.updated_at)) * 86400 AS INTEGER) AS age_seconds
       FROM scale_bridge_state s
       LEFT JOIN employees e ON s.publisher_employee_id = e.id
       WHERE s.id = 1`
    ).first<any>()

    if (!row) {
      return c.json({
        weight_kg: 0,
        is_stable: false,
        connection_mode: null,
        updated_at: null,
        age_seconds: null,
        publisher_name: null,
        fresh: false,
      })
    }

    const age = row.age_seconds
    // A reading older than 15s is treated as stale to match the scale-house
    // STALE_AFTER_MS guard — keeps both sides agreeing on "is the scale live".
    const fresh = typeof age === 'number' && age >= 0 && age < 15 && !!row.connection_mode

    return c.json({
      weight_kg: row.weight_kg,
      is_stable: !!row.is_stable,
      connection_mode: row.connection_mode,
      updated_at: row.updated_at,
      age_seconds: age,
      publisher_name: row.publisher_name || null,
      fresh,
    })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

// ─── Remote control ────────────────────────────────────────────────────
// A screen anywhere (another computer, a phone abroad) can ask the yard
// computer to capture or weigh out. The yard computer -- the one actually
// connected to the scale -- claims the command, does it with its own scale,
// camera, receipt printer and Square Terminal, and reports the result. The
// remote screen never writes a ticket itself, so the photo is the yard's and
// the receipt prints in the yard, not wherever the person happens to be.

const OPERATOR_ROLES = ['admin', 'manager', 'yard_operator'] as const
const COMMAND_TTL = '-30 seconds'   // an unclaimed or unfinished command dies
const STATION_FRESH_S = 6           // the yard must have published this recently

let remoteTablesReady = false
async function ensureRemoteTables(db: D1Database) {
  if (remoteTablesReady) return
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS scale_remote_commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, ticket_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending', requested_by INTEGER, claimed_by INTEGER,
      result TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, claimed_at TEXT, done_at TEXT)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_scale_remote_commands_status ON scale_remote_commands(status, id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS scale_station_view (
      id INTEGER PRIMARY KEY CHECK (id = 1), image TEXT, image_at TEXT, viewer_seen_at TEXT)`),
    db.prepare(`INSERT OR IGNORE INTO scale_station_view (id) VALUES (1)`),
  ])
  remoteTablesReady = true
}

async function expireStale(db: D1Database) {
  await db.prepare(
    `UPDATE scale_remote_commands SET status = 'expired', done_at = CURRENT_TIMESTAMP
     WHERE status IN ('pending','claimed') AND created_at < datetime('now', ?)`
  ).bind(COMMAND_TTL).run()
}

// Ask the yard computer to do something.
scaleBridgeRoutes.post('/commands', roleRequired(...OPERATOR_ROLES), async (c) => {
  try {
    const db = c.env.DB
    await ensureRemoteTables(db)
    const body = await c.req.json().catch(() => ({})) as any
    const kind = body?.kind === 'weigh_out' ? 'weigh_out' : body?.kind === 'capture' ? 'capture' : null
    if (!kind) return c.json({ error: 'kind must be capture or weigh_out' }, 400)

    const st = await db.prepare(
      `SELECT connection_mode, CAST((julianday('now') - julianday(updated_at)) * 86400 AS INTEGER) AS age
       FROM scale_bridge_state WHERE id = 1`
    ).first<{ connection_mode: string | null, age: number | null }>()
    if (!st || !st.connection_mode || st.connection_mode === 'sim' || st.age === null || st.age > STATION_FRESH_S) {
      return c.json({ error: 'No computer is connected to the scale right now. Open Scale House on the yard computer and connect the scale.' }, 409)
    }

    let ticketId: number | null = null
    if (kind === 'weigh_out') {
      ticketId = Number(body?.ticket_id)
      if (!Number.isInteger(ticketId) || ticketId <= 0) return c.json({ error: 'ticket_id required' }, 400)
      const t = await db.prepare('SELECT status, weight_out FROM scale_tickets WHERE id = ?').bind(ticketId).first<any>()
      if (!t) return c.json({ error: 'Ticket not found' }, 404)
      if (t.status !== 'weighed_in' || t.weight_out) return c.json({ error: 'That ticket is not waiting to weigh out.' }, 409)
    }

    await expireStale(db)
    const busy = await db.prepare(
      `SELECT id FROM scale_remote_commands WHERE status IN ('pending','claimed') LIMIT 1`
    ).first()
    if (busy) return c.json({ error: 'The yard computer is still finishing the last request. Try again in a few seconds.' }, 409)

    const res = await db.prepare(
      `INSERT INTO scale_remote_commands (kind, ticket_id, requested_by) VALUES (?, ?, ?)`
    ).bind(kind, ticketId, c.get('userId')).run()
    return c.json({ id: res.meta.last_row_id })
  } catch (err: any) {
    return c.json({ error: err?.message || 'request failed' }, 500)
  }
})

// The requester polls this for the outcome.
scaleBridgeRoutes.get('/commands/:id', roleRequired(...OPERATOR_ROLES), async (c) => {
  try {
    await ensureRemoteTables(c.env.DB)
    await expireStale(c.env.DB)
    const row = await c.env.DB.prepare(
      'SELECT id, kind, ticket_id, status, result FROM scale_remote_commands WHERE id = ?'
    ).bind(c.req.param('id')).first<any>()
    if (!row) return c.json({ error: 'Not found' }, 404)
    let result = null
    try { result = row.result ? JSON.parse(row.result) : null } catch { /* keep null */ }
    return c.json({ id: row.id, kind: row.kind, ticket_id: row.ticket_id, status: row.status, result })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

// The yard computer takes the next command. The UPDATE ... WHERE status =
// 'pending' is the lock: if two yard screens are open, only one gets it.
scaleBridgeRoutes.get('/station/next', roleRequired(...OPERATOR_ROLES), async (c) => {
  try {
    const db = c.env.DB
    await ensureRemoteTables(db)
    await expireStale(db)
    const cmd = await db.prepare(
      `UPDATE scale_remote_commands SET status = 'claimed', claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM scale_remote_commands WHERE status = 'pending' ORDER BY id LIMIT 1)
         AND status = 'pending'
       RETURNING id, kind, ticket_id`
    ).bind(c.get('userId')).first<any>()
    const view = await db.prepare(
      `SELECT CAST((julianday('now') - julianday(viewer_seen_at)) * 86400 AS INTEGER) AS age FROM scale_station_view WHERE id = 1`
    ).first<{ age: number | null }>()
    return c.json({ command: cmd || null, viewers_active: !!view && view.age !== null && view.age <= 20 })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

scaleBridgeRoutes.post('/station/commands/:id/result', roleRequired(...OPERATOR_ROLES), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const ok = !!body?.ok
    const result = JSON.stringify({
      ok,
      message: String(body?.message || '').slice(0, 300),
      ticket_id: Number(body?.ticket_id) || null,
      ticket_number: String(body?.ticket_number || '').slice(0, 40) || null,
      weight: Number.isFinite(Number(body?.weight)) ? Number(body.weight) : null,
      net_weight: Number.isFinite(Number(body?.net_weight)) ? Number(body.net_weight) : null,
      grand_total: Number.isFinite(Number(body?.grand_total)) ? Number(body.grand_total) : null,
      ticket_type: body?.ticket_type === 'pickup' ? 'pickup' : body?.ticket_type === 'dropoff' ? 'dropoff' : null,
    })
    const r = await c.env.DB.prepare(
      `UPDATE scale_remote_commands SET status = ?, result = ?, done_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'claimed'`
    ).bind(ok ? 'done' : 'failed', result, c.req.param('id')).run()
    if ((r.meta?.changes ?? 0) === 0) return c.json({ error: 'Command is not in progress' }, 409)
    return c.json({ ok: true })
  } catch (err: any) {
    return c.json({ error: err?.message || 'write failed' }, 500)
  }
})

// Yard camera picture for remote screens. The yard computer only sends one
// while somebody is watching (viewers_active above).
const MAX_VIEW_IMAGE = 400_000
scaleBridgeRoutes.post('/station/snapshot', roleRequired(...OPERATOR_ROLES), async (c) => {
  try {
    await ensureRemoteTables(c.env.DB)
    const body = await c.req.json().catch(() => ({})) as any
    const img = typeof body?.image === 'string' ? body.image : ''
    if (!img.startsWith('data:image/jpeg;base64,') || img.length > MAX_VIEW_IMAGE) {
      return c.json({ error: 'image must be a JPEG data URL under 400 KB' }, 400)
    }
    await c.env.DB.prepare(
      `UPDATE scale_station_view SET image = ?, image_at = CURRENT_TIMESTAMP WHERE id = 1`
    ).bind(img).run()
    return c.json({ ok: true })
  } catch (err: any) {
    return c.json({ error: err?.message || 'write failed' }, 500)
  }
})

// Reading the picture is also the "somebody is watching" signal.
scaleBridgeRoutes.get('/snapshot', async (c) => {
  try {
    const db = c.env.DB
    await ensureRemoteTables(db)
    await db.prepare(`UPDATE scale_station_view SET viewer_seen_at = CURRENT_TIMESTAMP WHERE id = 1`).run()
    const row = await db.prepare(
      `SELECT image, CAST((julianday('now') - julianday(image_at)) * 86400 AS INTEGER) AS age FROM scale_station_view WHERE id = 1`
    ).first<{ image: string | null, age: number | null }>()
    return c.json({ image: row?.image || null, age_seconds: row?.age ?? null })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})
