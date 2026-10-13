import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

// ══════════════════════════════════════════════════════════════════════
// SCALE CAMERA — shared setup and remote view
// ══════════════════════════════════════════════════════════════════════
// The yard camera only exists on the scale-house Mac (Agent DVR + the local
// scale-bridge, both on loopback). This router is what lets every other
// browser that opens Scale House land on the same camera:
//
//   GET/PUT /config  which yard camera the scale house uses
//   POST    /frame   the scale-house browser relays its latest still
//   GET     /frame   any other computer shows that still
//
// See migrations/0023_scale_camera.sql for why each half exists. Scoped to the
// roles that can open Scale House at all; a driver has no use for a yard feed.

export const scaleCameraRoutes = new Hono<{ Bindings: Bindings }>()

scaleCameraRoutes.use('*', authMiddleware, employeeOnly, roleRequired('admin', 'manager', 'yard_operator'))

// A relayed frame is a viewing aid, not evidence, so it is posted small. The
// page downsizes to ~960px wide; this only stops a bad client parking
// megabytes in a row that every viewer reads every two seconds.
const MAX_FRAME_LEN = 600_000
// The page publishes every 10s with nobody watching. A frame older than this
// means the scale house has stopped sending, not that it is between posts.
const FRESH_SECONDS = 45
// How recently a viewer must have asked for the publisher to speed up to 2s.
const WATCHED_SECONDS = 30
const STATION_RE = /^[A-Za-z0-9_-]{1,64}$/

// Only what describes the yard camera itself. Credentials are deliberately
// absent: this is read by every Scale House user, and a camera behind Agent
// DVR on loopback needs none. A webcam deviceId is meaningless off the
// machine that produced it.
function cleanConfig(raw: any): { ok: true; config: any } | { ok: false; error: string } {
  const b = raw && typeof raw === 'object' ? raw : {}
  const out: any = {}
  if (typeof b.url !== 'string' || !b.url.trim()) return { ok: false, error: 'url is required' }
  let u: URL
  try { u = new URL(b.url.trim()) } catch { return { ok: false, error: 'url is not a valid URL' } }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, error: 'url must be http:// or https://' }
  // A password typed into the address would otherwise be handed to everyone.
  u.username = ''; u.password = ''
  out.url = u.toString().slice(0, 500)
  out.netMode = b.netMode === 'mjpeg' ? 'mjpeg' : 'snapshot'
  const fps = Number(b.fps)
  out.fps = Number.isFinite(fps) ? Math.min(10, Math.max(0.2, fps)) : 2
  const rot = Number(b.rotate)
  out.rotate = [0, 90, 180, 270].includes(rot) ? rot : 0
  out.mirror = !!b.mirror
  out.stamp = b.stamp === undefined ? true : !!b.stamp
  if (typeof b.agentCamera === 'string' && b.agentCamera.trim()) out.agentCamera = b.agentCamera.trim().slice(0, 100)
  return { ok: true, config: out }
}

scaleCameraRoutes.get('/config', async (c) => {
  try {
    const row = await c.env.DB.prepare(
      `SELECT k.config, k.updated_at, e.first_name || ' ' || e.last_name AS updated_by_name
       FROM scale_camera_config k
       LEFT JOIN employees e ON e.id = k.updated_by
       WHERE k.id = 1`
    ).first<any>()
    let config: any = {}
    try { config = JSON.parse(row?.config || '{}') || {} } catch { config = {} }
    return c.json({ config, updated_at: row?.updated_at || null, updated_by_name: row?.updated_by_name || null })
  } catch (err: any) {
    // Missing table on a deploy that ran ahead of its migration: the page
    // falls back to what this browser remembers, which is the old behaviour.
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})

scaleCameraRoutes.put('/config', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const r = cleanConfig(body)
    if (!r.ok) return c.json({ error: r.error }, 400)
    await c.env.DB.prepare(
      `UPDATE scale_camera_config SET config = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`
    ).bind(JSON.stringify(r.config), c.get('userId')).run()
    return c.json({ ok: true, config: r.config })
  } catch (err: any) {
    return c.json({ error: err?.message || 'save failed' }, 500)
  }
})

scaleCameraRoutes.post('/frame', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const frame = typeof body?.frame === 'string' ? body.frame : ''
    if (frame.indexOf('data:image/jpeg;base64,') !== 0) return c.json({ error: 'frame must be a JPEG data URL' }, 400)
    if (frame.length > MAX_FRAME_LEN) return c.json({ error: 'frame too large' }, 413)
    const station = typeof body?.station === 'string' && STATION_RE.test(body.station) ? body.station : null
    if (!station) return c.json({ error: 'station is required' }, 400)
    const dim = (v: any) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 && n <= 10000 ? n : null }
    const w = Number(body?.weight)
    const weight = Number.isFinite(w) && Math.abs(w) <= 200000 ? w : null

    const row = await c.env.DB.prepare(
      `UPDATE scale_camera_frame
       SET frame = ?, width = ?, height = ?, weight_kg = ?, seq = seq + 1,
           publisher_employee_id = ?, publisher_station = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING seq, CAST((julianday('now') - julianday(viewer_seen_at)) * 86400 AS INTEGER) AS viewer_age`
    ).bind(frame, dim(body?.width), dim(body?.height), weight, c.get('userId'), station).first<any>()

    const age = row?.viewer_age
    return c.json({ ok: true, seq: row?.seq ?? null, watched: typeof age === 'number' && age >= 0 && age < WATCHED_SECONDS })
  } catch (err: any) {
    return c.json({ error: err?.message || 'publish failed' }, 500)
  }
})

// ?have=<seq> skips resending a frame the viewer already holds, which is most
// polls while nobody is on the scale. ?station=<id> keeps the scale house from
// counting itself as a viewer (or adopting its own relay) after a reload.
scaleCameraRoutes.get('/frame', async (c) => {
  try {
    const have = parseInt(c.req.query('have') || '-1', 10)
    const stationQ = c.req.query('station') || ''
    const station = STATION_RE.test(stationQ) ? stationQ : ''

    // At most one write per 10s however many viewers are polling: a WHERE that
    // matches nothing writes nothing.
    const mark = c.env.DB.prepare(
      `UPDATE scale_camera_frame SET viewer_seen_at = CURRENT_TIMESTAMP
       WHERE id = 1 AND frame IS NOT NULL
         AND (publisher_station IS NULL OR publisher_station != ?)
         AND (viewer_seen_at IS NULL OR viewer_seen_at < datetime('now', '-10 seconds'))`
    ).bind(station)
    const read = c.env.DB.prepare(
      `SELECT f.seq, f.width, f.height, f.weight_kg, f.publisher_station, f.updated_at,
              CASE WHEN f.seq = ? THEN NULL ELSE f.frame END AS frame,
              f.frame IS NOT NULL AS has_frame,
              CAST((julianday('now') - julianday(f.updated_at)) * 86400 AS INTEGER) AS age_seconds,
              e.first_name || ' ' || e.last_name AS publisher_name
       FROM scale_camera_frame f
       LEFT JOIN employees e ON e.id = f.publisher_employee_id
       WHERE f.id = 1`
    ).bind(Number.isFinite(have) ? have : -1)
    const [, res] = await c.env.DB.batch([mark, read])
    const row: any = (res as any)?.results?.[0]
    if (!row || !row.has_frame) return c.json({ fresh: false, seq: null })

    const age = row.age_seconds
    return c.json({
      seq: row.seq,
      frame: row.frame || null,
      unchanged: !row.frame,
      width: row.width,
      height: row.height,
      weight_kg: row.weight_kg,
      age_seconds: age,
      fresh: typeof age === 'number' && age >= 0 && age < FRESH_SECONDS,
      self: !!station && row.publisher_station === station,
      publisher_name: row.publisher_name || null,
    })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})
