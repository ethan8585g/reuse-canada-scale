import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database; CAMERA_STATION_TOKEN?: string }

// Cameras module. The cameras sit on the yard LAN, which neither a browser
// elsewhere nor this Worker can reach, so the scale-bridge on the scale-house
// Mac (running 24/7 under launchd) is the relay:
//
//   bridge  GET  /api/camera-station/work    which cameras, who is watching
//   bridge  POST /api/camera-station/frame   latest picture of a watched camera
//   bridge  POST /api/camera-station/status  health of every camera + heartbeat
//   page    GET  /api/cameras/:id/frame      read the picture; this read is the
//                                            "somebody is watching" signal
//
// Nothing is uploaded unless a page asked for that camera in the last few
// seconds. Camera passwords live in D1 and only ever leave through the
// token-protected station endpoint.

const VIEW_ROLES = ['admin', 'manager', 'yard_operator']
const EDIT_ROLES = ['admin', 'manager']
const KINDS = ['reolink', 'agent_dvr', 'snapshot_url']
const WATCH_S = 8          // a viewer counts as watching this long after its last read
const LIVE_S = 150         // a camera checked OK this recently is "live"
const MAX_FRAME = 600_000  // base64 data URL length (~450 KB JPEG)

const PRIVATE_HOST = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)[0-9.]+$/

function ageSql(col: string) {
  return `CAST((julianday('now') - julianday(${col})) * 86400 AS INTEGER)`
}

// Fields a browser may see. The password is reduced to has_password.
function publicCamera(r: any) {
  return {
    id: r.id, name: r.name, location: r.location, kind: r.kind,
    host: r.host, port: r.port, use_https: r.use_https, channel: r.channel, username: r.username,
    has_password: !!r.password, agent_dvr_oid: r.agent_dvr_oid, snapshot_url: r.snapshot_url,
    rotate: r.rotate || 0, sort_order: r.sort_order,
    width: r.width, height: r.height, last_error: r.last_error,
    ok_age: r.ok_age, checked_age: r.checked_age, frame_age: r.frame_age,
    status: r.ok_age !== null && r.ok_age <= LIVE_S && !r.last_error ? 'live'
      : r.last_error ? 'offline'
      : 'waiting',
  }
}

type CleanCamera = Record<string, any>

function cleanCamera(b: any, existing: any | null): CleanCamera | string {
  const name = String(b?.name ?? existing?.name ?? '').trim().slice(0, 60)
  if (!name) return 'Give the camera a name.'
  const location = String(b?.location ?? existing?.location ?? '').trim().slice(0, 40) || null
  const kind = String(b?.kind ?? existing?.kind ?? '')
  if (!KINDS.includes(kind)) return 'Pick a camera type.'
  const out: CleanCamera = {
    name, location, kind,
    host: null, port: null, use_https: null, channel: 0, username: null,
    agent_dvr_oid: null, snapshot_url: null,
    rotate: [0, 90, 180, 270].includes(Number(b?.rotate)) ? Number(b.rotate) : (existing?.rotate || 0),
  }
  if (kind === 'reolink') {
    const host = String(b?.host ?? '').trim().toLowerCase()
    if (!PRIVATE_HOST.test(host) && !/^[a-z0-9-]+\.local$/.test(host)) {
      return 'Enter the camera IP address on the yard network, e.g. 192.168.1.50.'
    }
    out.host = host
    const port = b?.port === '' || b?.port == null ? null : Number(b.port)
    if (port !== null && !(Number.isInteger(port) && port > 0 && port < 65536)) return 'Port must be a number between 1 and 65535.'
    out.port = port
    out.use_https = b?.use_https === true || b?.use_https === 1 ? 1 : b?.use_https === false || b?.use_https === 0 ? 0 : null
    const ch = Number(b?.channel ?? 0)
    out.channel = Number.isInteger(ch) && ch >= 0 && ch < 64 ? ch : 0
    out.username = String(b?.username ?? '').trim().slice(0, 60) || null
    if (!out.username) return 'Enter the camera username (usually admin).'
  } else if (kind === 'agent_dvr') {
    const oid = Number(b?.agent_dvr_oid)
    if (!Number.isInteger(oid) || oid <= 0) return 'Pick the Agent DVR camera.'
    out.agent_dvr_oid = oid
  } else {
    const url = String(b?.snapshot_url ?? '').trim()
    if (!/^https?:[/][/]/i.test(url) || url.length > 500) return 'The snapshot address must start with http:// or https://'
    out.snapshot_url = url
    out.username = String(b?.username ?? '').trim().slice(0, 60) || null
  }
  // Password: blank on edit keeps the stored one; switching to a type that
  // takes no password drops it.
  const pw = typeof b?.password === 'string' ? b.password : ''
  if (kind === 'agent_dvr') out.password = null
  else if (pw) out.password = pw.slice(0, 120)
  else if (existing && existing.kind === kind) out.password = existing.password
  else out.password = null
  if (kind === 'reolink' && !out.password) return 'Enter the camera password.'
  return out
}

const CAMERA_LIST_SQL = `
  SELECT c.*, ${ageSql('c.last_ok_at')} AS ok_age, ${ageSql('c.last_checked_at')} AS checked_age,
         ${ageSql('f.captured_at')} AS frame_age
  FROM cameras c LEFT JOIN camera_frames f ON f.camera_id = c.id
  WHERE c.is_active = 1`

export const cameraRoutes = new Hono<{ Bindings: Bindings }>()
cameraRoutes.use('*', authMiddleware, employeeOnly)

cameraRoutes.get('/', roleRequired(...VIEW_ROLES), async (c) => {
  try {
    const db = c.env.DB
    const { results } = await db.prepare(CAMERA_LIST_SQL + ' ORDER BY c.sort_order, c.id').all()
    const st = await db.prepare(`SELECT ${ageSql('last_seen_at')} AS age, version FROM camera_station WHERE id = 1`).first<any>()
    return c.json({
      cameras: (results as any[]).map(publicCamera),
      relay: { age_seconds: st?.age ?? null, version: st?.version || null },
    })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

// What the relay found in Agent DVR, for the Add form.
cameraRoutes.get('/agentdvr', roleRequired(...EDIT_ROLES), async (c) => {
  const st = await c.env.DB.prepare('SELECT agentdvr_cameras FROM camera_station WHERE id = 1').first<any>()
  let list: any[] = []
  try { list = st?.agentdvr_cameras ? JSON.parse(st.agentdvr_cameras) : [] } catch { list = [] }
  return c.json({ cameras: list })
})

cameraRoutes.get('/:id/frame', roleRequired(...VIEW_ROLES), async (c) => {
  try {
    const db = c.env.DB
    const id = Number(c.req.param('id'))
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Bad camera id' }, 400)
    const full = c.req.query('size') === 'full'
    await db.prepare(
      `INSERT INTO camera_watch (camera_id, seen_at, want_full_at) VALUES (?, CURRENT_TIMESTAMP, ${full ? 'CURRENT_TIMESTAMP' : 'NULL'})
       ON CONFLICT(camera_id) DO UPDATE SET seen_at = CURRENT_TIMESTAMP${full ? ', want_full_at = CURRENT_TIMESTAMP' : ''}`
    ).bind(id).run()
    const row = await db.prepare(CAMERA_LIST_SQL + ' AND c.id = ?').bind(id).first<any>()
    if (!row) return c.json({ error: 'Camera not found' }, 404)
    const f = await db.prepare('SELECT image FROM camera_frames WHERE camera_id = ?').bind(id).first<any>()
    const cam = publicCamera(row)
    return c.json({ image: f?.image || null, age_seconds: row.frame_age, status: cam.status, error: cam.last_error })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

cameraRoutes.post('/', roleRequired(...EDIT_ROLES), async (c) => {
  try {
    const b = await c.req.json().catch(() => ({}))
    const cam = cleanCamera(b, null)
    if (typeof cam === 'string') return c.json({ error: cam }, 400)
    const db = c.env.DB
    const max = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM cameras').first<any>()
    const r = await db.prepare(
      `INSERT INTO cameras (name, location, kind, host, port, use_https, channel, username, password, agent_dvr_oid, snapshot_url, rotate, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(cam.name, cam.location, cam.kind, cam.host, cam.port, cam.use_https, cam.channel, cam.username, cam.password,
      cam.agent_dvr_oid, cam.snapshot_url, cam.rotate, (max?.m || 0) + 1, c.get('userId')).run()
    return c.json({ id: r.meta.last_row_id })
  } catch (err: any) {
    return c.json({ error: err?.message || 'save failed' }, 500)
  }
})

cameraRoutes.put('/:id', roleRequired(...EDIT_ROLES), async (c) => {
  try {
    const db = c.env.DB
    const id = Number(c.req.param('id'))
    const existing = await db.prepare('SELECT * FROM cameras WHERE id = ? AND is_active = 1').bind(id).first<any>()
    if (!existing) return c.json({ error: 'Camera not found' }, 404)
    const b = await c.req.json().catch(() => ({}))
    const cam = cleanCamera(b, existing)
    if (typeof cam === 'string') return c.json({ error: cam }, 400)
    // A changed connection resets the health so the page shows "Checking"
    // until the relay has tried the new settings.
    await db.batch([
      db.prepare(
        `UPDATE cameras SET name = ?, location = ?, kind = ?, host = ?, port = ?, use_https = ?, channel = ?, username = ?, password = ?,
           agent_dvr_oid = ?, snapshot_url = ?, rotate = ?, last_ok_at = NULL, last_error = NULL, last_checked_at = NULL,
           updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(cam.name, cam.location, cam.kind, cam.host, cam.port, cam.use_https, cam.channel, cam.username, cam.password,
        cam.agent_dvr_oid, cam.snapshot_url, cam.rotate, id),
      db.prepare('DELETE FROM camera_frames WHERE camera_id = ?').bind(id),
    ])
    return c.json({ ok: true })
  } catch (err: any) {
    return c.json({ error: err?.message || 'save failed' }, 500)
  }
})

cameraRoutes.delete('/:id', roleRequired(...EDIT_ROLES), async (c) => {
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const r = await db.prepare('UPDATE cameras SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1').bind(id).run()
  if (!r.meta.changes) return c.json({ error: 'Camera not found' }, 404)
  await db.prepare('DELETE FROM camera_frames WHERE camera_id = ?').bind(id).run()
  return c.json({ ok: true })
})

cameraRoutes.post('/reorder', roleRequired(...EDIT_ROLES), async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  const ids = Array.isArray(b?.ids) ? b.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0) : []
  if (!ids.length) return c.json({ error: 'ids required' }, 400)
  const db = c.env.DB
  await db.batch(ids.map((id: number, i: number) => db.prepare('UPDATE cameras SET sort_order = ? WHERE id = ?').bind(i + 1, id)))
  return c.json({ ok: true })
})

// ─── Relay (scale-bridge) side ─────────────────────────────────────────
// No user session: the bridge authenticates with a shared secret set as the
// CAMERA_STATION_TOKEN Pages secret and CRM_CAMERA_TOKEN in the bridge's
// launchd environment.

function sameSecret(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const cameraStationRoutes = new Hono<{ Bindings: Bindings }>()
cameraStationRoutes.use('*', async (c, next) => {
  const want = c.env.CAMERA_STATION_TOKEN || ''
  if (!want || !sameSecret(c.req.header('X-Camera-Station-Token') || '', want)) {
    return c.json({ error: 'Bad or missing station token' }, 401)
  }
  await next()
})

cameraStationRoutes.get('/work', async (c) => {
  try {
    const db = c.env.DB
    const { results } = await db.prepare(
      `SELECT c.id, c.name, c.kind, c.host, c.port, c.use_https, c.channel, c.username, c.password,
              c.agent_dvr_oid, c.snapshot_url, c.updated_at,
              CASE WHEN w.want_full_at IS NOT NULL AND ${ageSql('w.want_full_at')} <= ${WATCH_S} THEN 'full'
                   WHEN w.seen_at IS NOT NULL AND ${ageSql('w.seen_at')} <= ${WATCH_S} THEN 'thumb'
                   ELSE 'none' END AS watch
       FROM cameras c LEFT JOIN camera_watch w ON w.camera_id = c.id
       WHERE c.is_active = 1 ORDER BY c.sort_order, c.id`
    ).all()
    // The relay asks every 0.5-5 s; the heartbeat only needs to move every 30 s.
    await db.prepare(
      `UPDATE camera_station SET last_seen_at = CURRENT_TIMESTAMP
       WHERE id = 1 AND (last_seen_at IS NULL OR last_seen_at < datetime('now', '-30 seconds'))`
    ).run()
    return c.json({ cameras: results })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

cameraStationRoutes.post('/frame', async (c) => {
  try {
    const b = await c.req.json().catch(() => ({})) as any
    const id = Number(b?.camera_id)
    const img = typeof b?.image === 'string' ? b.image : ''
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'camera_id required' }, 400)
    if (!img.startsWith('data:image/jpeg;base64,') || img.length > MAX_FRAME) {
      return c.json({ error: 'image must be a JPEG data URL under ~450 KB' }, 400)
    }
    const w = Number(b?.width) || null, h = Number(b?.height) || null
    const db = c.env.DB
    await db.batch([
      db.prepare(
        `INSERT INTO camera_frames (camera_id, image, bytes, captured_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(camera_id) DO UPDATE SET image = excluded.image, bytes = excluded.bytes, captured_at = excluded.captured_at`
      ).bind(id, img, img.length),
      db.prepare(
        `UPDATE cameras SET last_ok_at = CURRENT_TIMESTAMP, last_checked_at = CURRENT_TIMESTAMP, last_error = NULL,
           width = COALESCE(?, width), height = COALESCE(?, height) WHERE id = ?`
      ).bind(w, h, id),
    ])
    return c.json({ ok: true })
  } catch (err: any) {
    return c.json({ error: err?.message || 'write failed' }, 500)
  }
})

cameraStationRoutes.post('/status', async (c) => {
  try {
    const b = await c.req.json().catch(() => ({})) as any
    const db = c.env.DB
    const stmts: D1PreparedStatement[] = []
    for (const r of (Array.isArray(b?.results) ? b.results : []).slice(0, 100)) {
      const id = Number(r?.camera_id)
      if (!Number.isInteger(id) || id <= 0) continue
      if (r.ok) {
        stmts.push(db.prepare(
          `UPDATE cameras SET last_ok_at = CURRENT_TIMESTAMP, last_checked_at = CURRENT_TIMESTAMP, last_error = NULL,
             width = COALESCE(?, width), height = COALESCE(?, height) WHERE id = ?`
        ).bind(Number(r.width) || null, Number(r.height) || null, id))
      } else {
        stmts.push(db.prepare(
          `UPDATE cameras SET last_checked_at = CURRENT_TIMESTAMP, last_error = ? WHERE id = ?`
        ).bind(String(r.error || 'Camera did not answer').slice(0, 300), id))
      }
    }
    const dvr = Array.isArray(b?.agentdvr) ? JSON.stringify(b.agentdvr.slice(0, 64).map((x: any) => ({
      id: Number(x?.id) || 0, name: String(x?.name || '').slice(0, 60),
    })).filter((x: any) => x.id > 0)) : null
    stmts.push(db.prepare(
      `UPDATE camera_station SET last_seen_at = CURRENT_TIMESTAMP, version = ?, agentdvr_cameras = COALESCE(?, agentdvr_cameras) WHERE id = 1`
    ).bind(String(b?.version || '').slice(0, 40) || null, dvr))
    await db.batch(stmts)
    return c.json({ ok: true })
  } catch (err: any) {
    return c.json({ error: err?.message || 'write failed' }, 500)
  }
})
