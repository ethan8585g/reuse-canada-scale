import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { photoOversize } from '../utils/photo'
import { GST_RATE, cents, billableKg } from '../utils/money'
import { getBranding } from '../utils/branding'
import { parseTicketType, ticketTypeOf, ticketNet, pickupRate, priceTicket } from '../utils/ticketPricing'
import { todayEdmonton, edmontonDayRangeUtc, edmontonDayStartUtc, YMD } from '../utils/date'
import { hashPassword } from '../utils/passwords'
import { normalizeAppearance } from './scaleAgent'
import { parseJobNumber, formatJobNumber, loadJob, jobProblems, jobSnapshot, jobPreview, jobMaterial } from '../utils/jobs'

type Bindings = { DB: D1Database }

export const scaleTicketRoutes = new Hono<{ Bindings: Bindings }>()

// What the camera saw, validated through the SAME function the matcher uses.
// A writer and a matcher that disagree about what a valid appearance looks like
// would silently stop matching, so there is deliberately only one definition.
function appearanceJson(raw: unknown): string | null {
  const a = normalizeAppearance(raw)
  return a ? JSON.stringify(a) : null
}

// Apply auth middleware
scaleTicketRoutes.use('*', authMiddleware, employeeOnly)

// Drivers may read their own tickets (with no money on them) and submit field
// forms. Every other scale-ticket action -- weigh-in, void, payment, weight
// edits, job lookups -- is office/scale-house only. This used to be enforced
// only by which buttons the driver portal happened to draw.
const DRIVER_ROUTES: [string, RegExp][] = [
  ['GET', /^\/api\/scale-tickets\/?$/],
  ['GET', /^\/api\/scale-tickets\/\d+$/],
  ['POST', /^\/api\/scale-tickets\/field$/],
]
scaleTicketRoutes.use('*', async (c, next) => {
  const me = await c.env.DB.prepare('SELECT role FROM employees WHERE id = ?').bind(c.get('userId')).first()
  const isDriver = me?.role === 'driver'
  c.set('isDriver', isDriver)
  if (isDriver && !DRIVER_ROUTES.some(([m, re]) => m === c.req.method && re.test(c.req.path))) {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }
  return next()
})

// A driver's tickets: loads from a pickup or route assigned to them, or a
// field form they filled in. (st.employee_id is the scale operator for
// everything else, so it is NOT the driver.)
const DRIVER_TICKET_SQL = '(st.employee_id = ? OR pr.assigned_employee_id = ? OR r.assigned_employee_id = ?)'

// Drivers never see prices, totals, tax or payment state.
const MONEY_KEY = /price|total|tax|payment|square|invoice|amount|revenue|settle|charge|rate/i
function forDriver(t: any) {
  const out: any = {}
  for (const k of Object.keys(t)) if (!MONEY_KEY.test(k)) out[k] = t[k]
  return out
}

// Generate ticket number: RC-YYYY-NNNNN
// We pick a candidate from the highest existing number for the year, then add
// jitter on retry so two concurrent inserts that race past the SELECT don't
// both pick the same number and one of them collide on UNIQUE(ticket_number).
async function generateTicketNumber(db: D1Database, attempt = 0): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RC-${year}-`
  const last = await db.prepare(
    "SELECT ticket_number FROM scale_tickets WHERE ticket_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).bind(prefix + '%').first()

  let nextNum = 1
  if (last && last.ticket_number) {
    const parts = (last.ticket_number as string).split('-')
    nextNum = parseInt(parts[2]) + 1
  }
  // On retry, add the attempt count so we skip past whatever a concurrent insert claimed.
  nextNum += attempt
  return `${prefix}${String(nextNum).padStart(5, '0')}`
}

// Insert a scale ticket with automatic retry on ticket-number UNIQUE conflict.
async function insertTicketWithRetry(
  db: D1Database,
  buildSqlAndParams: (ticketNumber: string) => { sql: string, params: any[] }
): Promise<{ ticketNumber: string, ticketId: number }> {
  const MAX_ATTEMPTS = 5
  let lastErr: any = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ticketNumber = await generateTicketNumber(db, attempt)
    try {
      const { sql, params } = buildSqlAndParams(ticketNumber)
      const result = await db.prepare(sql).bind(...params).run()
      return { ticketNumber, ticketId: result.meta.last_row_id as number }
    } catch (err: any) {
      lastErr = err
      const msg = String(err?.message || err)
      if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw err
      // Otherwise loop and try the next number.
    }
  }
  throw lastErr || new Error('Could not allocate ticket number after retries')
}

// Resolve the sentinel "Walk-In" customer's id. The print-trigger flow needs
// to create a ticket BEFORE the operator knows which customer it belongs to;
// the FK on scale_tickets.customer_id forces a placeholder, which we keep at
// is_active=0 so it never appears in pickers. Provisioned by migration 0007.
async function getWalkInCustomerId(db: D1Database): Promise<number> {
  const row = await db.prepare(
    "SELECT id FROM customers WHERE email = 'walk-in@reuse-canada.local' LIMIT 1"
  ).first<{ id: number }>()
  if (!row?.id) throw new Error('Walk-In sentinel customer missing — run migration 0007')
  return row.id
}

// Audit log helper
async function auditLog(db: D1Database, ticketId: number, action: string, employeeId: number | null, details?: Record<string, any>) {
  try {
    await db.prepare(
      'INSERT INTO scale_audit_log (scale_ticket_id, action, employee_id, details) VALUES (?, ?, ?, ?)'
    ).bind(ticketId, action, employeeId, details ? JSON.stringify(details) : null).run()
  } catch (e) { /* non-critical */ }
}

// ═══════════════════════════════════════
// LIST & DETAIL
// ═══════════════════════════════════════

// List all scale tickets with filters
// ── Pickup jobs ──────────────────────────────────────────────────────────
// A job number links a ticket to the pickup it came from and freezes the
// load's origin onto the ticket (ARMA). Resolving it is the same for every
// entry point, so it lives here once.
type JobResolution = { job: any } | { error: string; code: string; status: number; job?: any }

async function resolveJob(db: D1Database, raw: unknown, allowRepeat: boolean, ignoreTicketId?: number): Promise<JobResolution> {
  const n = parseJobNumber(raw)
  if (!n) return { error: 'That is not a job number. Job numbers look like J-1042.', code: 'job_invalid', status: 400 }
  const job = await loadJob(db, n)
  if (!job) return { error: 'No pickup has job number ' + formatJobNumber(n) + '.', code: 'job_not_found', status: 404 }
  const p = jobProblems(job, ignoreTicketId)
  if (p.blocking) return { error: p.blocking, code: 'job_blocked', status: 409, job: jobPreview(job) }
  if (p.repeat && !allowRepeat) return { error: p.repeat + ' One job is one load. Confirm to use it again.', code: 'job_repeat', status: 409, job: jobPreview(job) }
  return { job }
}

// Write the origin snapshot onto a ticket. The driver fields are only filled
// when empty so an operator-typed driver is never overwritten.
async function applyJobToTicket(db: D1Database, ticketId: number, job: any, employeeId: number, source: string) {
  const snap = jobSnapshot(job)
  const cols = Object.keys(snap)
  await db.prepare(
    `UPDATE scale_tickets SET ${cols.map((k) => k + ' = ?').join(', ')},
       driver_name = COALESCE(NULLIF(driver_name, ''), ?),
       driver_phone = COALESCE(NULLIF(driver_phone, ''), ?),
       updated_at = datetime('now')
     WHERE id = ?`
  ).bind(...cols.map((k) => snap[k]), job.driver_name || null, job.driver_phone || null, ticketId).run()
  await auditLog(db, ticketId, 'job_attached', employeeId, {
    job_number: job.job_number, pickup_request_id: job.id, customer_id: job.customer_id,
    origin_zone: snap.origin_zone, origin_tire_count: snap.origin_tire_count,
    tire_count_estimated: !!snap.origin_tire_count_estimated, source,
  })
}

// Completed (or still in progress) jobs that have no live ticket yet: the
// trucks the scale house should expect. Newest first, last 7 days.
scaleTicketRoutes.get('/jobs/incoming', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT pr.job_number FROM pickup_requests pr
       WHERE pr.status IN ('in_progress', 'completed') AND pr.job_number IS NOT NULL
         AND COALESCE(pr.completed_at, pr.updated_at) > datetime('now', '-7 days')
         AND NOT EXISTS (SELECT 1 FROM scale_tickets st WHERE st.pickup_request_id = pr.id AND st.status != 'voided')
       ORDER BY (pr.status = 'completed') DESC, COALESCE(pr.completed_at, pr.updated_at) DESC LIMIT 20`
    ).all()
    const jobs = []
    for (const r of results as any[]) {
      const j = await loadJob(c.env.DB, r.job_number)
      if (j) jobs.push(jobPreview(j))
    }
    return c.json({ jobs })
  } catch (err: any) {
    console.error('scaleTickets jobs error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Look a job up before the truck pulls on, so the operator sees who it is.
scaleTicketRoutes.get('/jobs/:number', async (c) => {
  try {
    const n = parseJobNumber(c.req.param('number'))
    if (!n) return c.json({ error: 'That is not a job number. Job numbers look like J-1042.', code: 'job_invalid' }, 400)
    const job = await loadJob(c.env.DB, n)
    if (!job) return c.json({ error: 'No pickup has job number ' + formatJobNumber(n) + '.', code: 'job_not_found' }, 404)
    return c.json({ job: jobPreview(job) })
  } catch (err: any) {
    console.error('scaleTickets jobs error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

scaleTicketRoutes.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const date = c.req.query('date')
    const dateFrom = c.req.query('date_from')
    const dateTo = c.req.query('date_to')
    const search = c.req.query('search')
    const material = c.req.query('material')
    // Photos are base64 blobs of 50-150 KB EACH, and every agent ticket now
    // carries two. Shipping them with every list row turned a 100-row history
    // page into a multi-megabyte response for data the list only ever uses as
    // a yes/no. They are opt-in now; the one caller that actually renders a
    // thumbnail (the live-ticket cards, never more than a handful of rows)
    // asks for them explicitly.
    const wantPhotos = c.req.query('photos') === '1'
    const limit = Math.min(500, Math.max(1, Number(c.req.query('limit')) || 100))

    let sql = `SELECT st.*, c.company_name, e.first_name || ' ' || e.last_name as employee_name,
                      COALESCE(NULLIF(st.driver_name, ''), dr.first_name || ' ' || dr.last_name) as driver_display_name,
                      COALESCE(NULLIF(st.driver_phone, ''), dr.phone) as driver_display_phone
               FROM scale_tickets st
               LEFT JOIN customers c ON st.customer_id = c.id
               LEFT JOIN employees e ON st.employee_id = e.id
               -- Driver = whoever actually drove the truck. Resolved from the
               -- route the ticket's stop belongs to, else from the pickup
               -- request's assigned driver. NULL for walk-ins, which have
               -- neither -- st.employee_id is the scale operator, not a driver.
               LEFT JOIN route_stops rs ON st.route_stop_id = rs.id
               LEFT JOIN routes r ON rs.route_id = r.id
               LEFT JOIN pickup_requests pr ON st.pickup_request_id = pr.id
               LEFT JOIN employees dr ON dr.id = COALESCE(r.assigned_employee_id, pr.assigned_employee_id)
               WHERE 1=1`
    const params: any[] = []
    const isDriver = !!c.get('isDriver')
    if (isDriver) {
      const me = c.get('userId')
      sql += ' AND ' + DRIVER_TICKET_SQL
      params.push(me, me, me)
    }

    if (status) {
      const allStatus = c.req.queries('status') || [status]
      const statuses = allStatus.flatMap(s => s.split(','))
      sql += ` AND st.status IN (${statuses.map(() => '?').join(',')})`
      params.push(...statuses)
    }
    // Dates are Edmonton calendar days; created_at is UTC (see utils/date).
    if (date && YMD.test(date)) {
      sql += ' AND st.created_at >= ? AND st.created_at < ?'
      params.push(...edmontonDayRangeUtc(date))
    }
    if (dateFrom && YMD.test(dateFrom)) {
      sql += ' AND st.created_at >= ?'
      params.push(edmontonDayStartUtc(dateFrom))
    }
    if (dateTo && YMD.test(dateTo)) {
      sql += ' AND st.created_at < ?'
      params.push(edmontonDayRangeUtc(dateTo)[1])
    }
    if (search) {
      // Plate included deliberately: once the camera reads them, "which ticket
      // was that truck" is the question an operator actually has, and the
      // ticket number is the one thing they do not have in front of them.
      // A job number ("J-1042" or "1042") matches that job exactly, as well as
      // the usual partial matches.
      const jn = parseJobNumber(search)
      sql += ' AND (st.ticket_number LIKE ? OR c.company_name LIKE ? OR st.vehicle_plate LIKE ? OR st.origin_company LIKE ? OR st.job_number = ?)'
      params.push('%' + search + '%', '%' + search + '%', '%' + search + '%', '%' + search + '%', jn ?? -1)
    }
    const zone = c.req.query('zone')
    if (zone === 'none') sql += ' AND st.origin_zone IS NULL'
    else if (zone && ['1', '2', '3'].includes(zone)) { sql += ' AND st.origin_zone = ?'; params.push(Number(zone)) }
    if (c.req.query('job') === 'with') sql += ' AND st.job_number IS NOT NULL'
    else if (c.req.query('job') === 'without') sql += ' AND st.job_number IS NULL'
    if (material) {
      sql += ' AND st.tire_type = ?'
      params.push(material)
    }
    const typeFilter = parseTicketType(c.req.query('type'))
    if (typeFilter) {
      sql += ' AND st.ticket_type = ?'
      params.push(typeFilter)
    }

    // The totals are computed over the WHOLE filtered set, not over the page of
    // rows returned, so "this month" reports the real month even when the list
    // is truncated. Built from the same WHERE clause for exactly that reason.
    const whereOnly = sql.slice(sql.indexOf('WHERE 1=1'))
    const sumSql = `SELECT COUNT(*) AS n,
                           SUM(CASE WHEN st.status = 'completed' THEN st.net_weight ELSE 0 END) AS net_kg,
                           SUM(CASE WHEN st.status = 'completed' THEN st.grand_total ELSE 0 END) AS revenue
                      FROM scale_tickets st
                      LEFT JOIN customers c ON st.customer_id = c.id
                      LEFT JOIN route_stops rs ON st.route_stop_id = rs.id
                      LEFT JOIN routes r ON rs.route_id = r.id
                      LEFT JOIN pickup_requests pr ON st.pickup_request_id = pr.id
                      ${whereOnly}`

    sql += ' ORDER BY st.created_at DESC LIMIT ' + limit

    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)
    let sumStmt = c.env.DB.prepare(sumSql)
    if (params.length > 0) sumStmt = sumStmt.bind(...params)

    const [{ results }, summary] = await Promise.all([stmt.all(), sumStmt.first<any>()])

    const tickets = (results || []).map((t: any) => {
      const hasIn = !!(t.photo_in && String(t.photo_in).length)
      const hasOut = !!(t.photo_out && String(t.photo_out).length)
      const row = { ...t, has_photo_in: hasIn, has_photo_out: hasOut }
      if (!wantPhotos) { delete row.photo_in; delete row.photo_out }
      return isDriver ? forDriver(row) : row
    })

    return c.json({
      tickets,
      summary: {
        count: Number(summary?.n || 0),
        net_kg: Number(summary?.net_kg || 0),
        revenue: isDriver ? null : Number(summary?.revenue || 0),
        truncated: tickets.length >= limit,
      },
    })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Get single ticket detail (includes audit log)
// Mint (or reuse) a shareable read-only link for a ticket. One live token per
// ticket, so re-sharing the same ticket always hands out the same URL instead of
// littering the table. The link needs no login by design - it gets texted or
// emailed to the customer - so the token is the only thing guarding it.
scaleTicketRoutes.post('/:id/share', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare('SELECT id FROM scale_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    const existing = await c.env.DB.prepare(
      'SELECT token FROM ticket_shares WHERE scale_ticket_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1'
    ).bind(id).first() as any

    let token = existing?.token as string | undefined
    if (!token) {
      const bytes = new Uint8Array(24)
      crypto.getRandomValues(bytes)
      token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      await c.env.DB.prepare(
        'INSERT INTO ticket_shares (scale_ticket_id, token, created_by) VALUES (?, ?, ?)'
      ).bind(id, token, c.get('userId')).run()
    }

    const origin = new URL(c.req.url).origin
    return c.json({ token, url: `${origin}/t/${token}` })
  } catch (err: any) {
    console.error('scale-tickets error:', err)
    // Until migration 0015 is applied the table simply isn't there; say so
    // instead of a bare 500, so whoever clicks knows what to fix.
    if (String(err?.message || '').includes('no such table')) {
      return c.json({ error: 'Sharing is not set up yet - apply migration 0015_ticket_shares to the production database.' }, 503)
    }
    return c.json({ error: 'Server error' }, 500)
  }
})

// Kill a share link without touching the ticket.
scaleTicketRoutes.post('/:id/unshare', async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare(
      "UPDATE ticket_shares SET revoked_at = datetime('now') WHERE scale_ticket_id = ? AND revoked_at IS NULL"
    ).bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    console.error('scale-tickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

scaleTicketRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.*, c.company_name, c.contact_name, c.address, c.city,
              e.first_name || ' ' || e.last_name as employee_name,
              COALESCE(NULLIF(st.driver_name, ''), dr.first_name || ' ' || dr.last_name) as driver_display_name,
              COALESCE(NULLIF(st.driver_phone, ''), dr.phone) as driver_display_phone
       FROM scale_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN employees e ON st.employee_id = e.id
       LEFT JOIN route_stops rs ON st.route_stop_id = rs.id
       LEFT JOIN routes r ON rs.route_id = r.id
       LEFT JOIN pickup_requests pr ON st.pickup_request_id = pr.id
       LEFT JOIN employees dr ON dr.id = COALESCE(r.assigned_employee_id, pr.assigned_employee_id)
       WHERE st.id = ?`
    ).bind(id).first()

    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    // A driver gets only their own loads, with no money and an audit trail
    // reduced to what happened and when (the details carry prices).
    if (c.get('isDriver')) {
      const me = c.get('userId')
      const mine = await c.env.DB.prepare(
        `SELECT 1 FROM scale_tickets st
         LEFT JOIN route_stops rs ON st.route_stop_id = rs.id
         LEFT JOIN routes r ON rs.route_id = r.id
         LEFT JOIN pickup_requests pr ON st.pickup_request_id = pr.id
         WHERE st.id = ? AND ${DRIVER_TICKET_SQL}`
      ).bind(id, me, me, me).first()
      if (!mine) return c.json({ error: 'Ticket not found' }, 404)
      const { results: trail } = await c.env.DB.prepare(
        `SELECT sal.action, sal.created_at FROM scale_audit_log sal WHERE sal.scale_ticket_id = ? ORDER BY sal.created_at ASC`
      ).bind(id).all()
      return c.json({ ticket: forDriver(ticket), audit_trail: trail })
    }

    // Get audit trail
    const { results: auditTrail } = await c.env.DB.prepare(
      `SELECT sal.*, e.first_name || ' ' || e.last_name as employee_name
       FROM scale_audit_log sal
       LEFT JOIN employees e ON sal.employee_id = e.id
       WHERE sal.scale_ticket_id = ?
       ORDER BY sal.created_at ASC`
    ).bind(id).all()

    return c.json({ ticket, audit_trail: auditTrail })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// CREATE TICKETS
// ═══════════════════════════════════════

// Create new scale ticket (from office/yard)
scaleTicketRoutes.post('/', async (c) => {
  try {
    const { customer_id, tire_type, notes, vehicle_plate, vehicle_id, driver_name, driver_phone, ticket_type } = await c.req.json()
    const employeeId = c.get('userId')

    if (!customer_id) {
      return c.json({ error: 'Customer is required' }, 400)
    }
    const type = ticketTypeOf(ticket_type)
    if (type === 'pickup' && (await pickupRate(c.env.DB, tire_type || 'mixed')) === null) {
      return c.json({ error: `No pickup price is set for ${tire_type || 'mixed'}. Set one under Pickup Prices in Scale House first.` }, 400)
    }

    const { ticketNumber, ticketId } = await insertTicketWithRetry(c.env.DB, (tn) => ({
      sql: `INSERT INTO scale_tickets (ticket_number, customer_id, employee_id, tire_type, notes, vehicle_plate, vehicle_id, driver_name, driver_phone, ticket_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'field_pending')`,
      params: [tn, customer_id, employeeId, tire_type || 'mixed', notes || null, vehicle_plate || null,
               vehicle_id || null, driver_name || null, driver_phone || null, type],
    }))

    await auditLog(c.env.DB, ticketId, 'created', employeeId, { source: 'office', customer_id, tire_type, ticket_type: type })

    return c.json({ success: true, id: ticketId, ticket_number: ticketNumber })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Create ticket from field form (iPad)
scaleTicketRoutes.post('/field', async (c) => {
  try {
    const {
      pickup_request_id,
      field_store_name,
      field_employee_name,
      field_estimated_tires,
      field_signature_data,
      field_cage_photo_url
    } = await c.req.json()

    const employeeId = c.get('userId')

    if (!field_store_name || !field_employee_name || !field_estimated_tires) {
      return c.json({ error: 'Store name, employee name, and tire count are required' }, 400)
    }

    let customerId = null
    if (pickup_request_id) {
      // A driver may only file a field form against a pickup that is theirs.
      const me = c.get('userId')
      const pickup = await c.env.DB.prepare(
        `SELECT pr.customer_id, (pr.assigned_employee_id = ? OR r.assigned_employee_id = ?) AS mine
         FROM pickup_requests pr LEFT JOIN routes r ON r.id = pr.assigned_route_id WHERE pr.id = ?`
      ).bind(me, me, pickup_request_id).first<any>()
      if (!pickup || (c.get('isDriver') && !pickup.mine)) return c.json({ error: 'Pickup not found' }, 404)
      customerId = pickup.customer_id
    }

    if (!customerId) {
      const customer = await c.env.DB.prepare(
        'SELECT id FROM customers WHERE company_name LIKE ? AND is_active = 1 LIMIT 1'
      ).bind('%' + field_store_name + '%').first()
      // If no real customer matches the store name, fall back to the Walk-In
      // sentinel — never to id=1, which is a real customer (Kal Tire in seed).
      customerId = customer?.id || (await getWalkInCustomerId(c.env.DB))
    }

    const now = new Date().toISOString()

    const { ticketNumber, ticketId } = await insertTicketWithRetry(c.env.DB, (tn) => ({
      sql: `INSERT INTO scale_tickets (
              ticket_number, pickup_request_id, customer_id, employee_id,
              field_store_name, field_employee_name, field_estimated_tires,
              field_signature_data, field_cage_photo_url, field_completed_at,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'field_complete')`,
      params: [
        tn, pickup_request_id || null, customerId, employeeId,
        field_store_name, field_employee_name, field_estimated_tires,
        field_signature_data || null, field_cage_photo_url || null, now,
      ],
    }))

    await auditLog(c.env.DB, ticketId, 'created', employeeId, { source: 'field', store: field_store_name })

    if (pickup_request_id) {
      await c.env.DB.prepare(
        // Only moves a job that has not started yet: a field form must never
        // reopen a completed or cancelled pickup.
        "UPDATE pickup_requests SET status = 'in_progress', updated_at = datetime('now') WHERE id = ? AND status IN ('confirmed', 'scheduled')"
      ).bind(pickup_request_id).run()
    }

    return c.json({ success: true, id: ticketId, ticket_number: ticketNumber })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// PRINT TRIGGER & WEIGH
// ═══════════════════════════════════════

// Quick-create ticket from scale PRINT trigger (weight-in only, no customer yet)
scaleTicketRoutes.post('/print-trigger', async (c) => {
  try {
    const { weight, photo, material, source, plate, plate_confidence, appearance, test_offset_kg, ticket_type, job_number, allow_repeat } = await c.req.json()
    if (!weight || weight <= 0) return c.json({ error: 'Valid weight required' }, 400)

    // A job number from the pickup the driver just completed. Resolved before
    // anything is written so a bad number fails cleanly instead of leaving a
    // half-made ticket. A job load is our own truck bringing tires IN, which is
    // a drop-off -- never the billed "Pickup" ticket type, whatever was asked.
    let job: any = null
    if (job_number !== undefined && job_number !== null && String(job_number).trim() !== '') {
      const r = await resolveJob(c.env.DB, job_number, !!allow_repeat)
      if ('error' in r) return c.json({ error: r.error, code: r.code, job: r.job }, r.status as any)
      job = r.job
    }

    // Drop-off unless the operator says otherwise: the agent never knows, and
    // a drop-off is never billed, so the default can't charge anybody.
    const type = job ? 'dropoff' : ticketTypeOf(ticket_type)

    // Simulated load, for proving the loop end to end when there is no real
    // load to drop. This writes a weight the scale never reported, so it is
    // bounded, and recorded BOTH in the ticket's own notes and in the audit
    // log. A fabricated weight that cannot later be told apart from a real
    // one is the single thing this must never become.
    const offsetRaw = Number(test_offset_kg)
    const offset = Number.isFinite(offsetRaw) && offsetRaw !== 0
      ? Math.max(-5000, Math.min(5000, offsetRaw))
      : 0
    const actualWeight = Number(weight)
    const recordedWeight = actualWeight + offset
    if (recordedWeight <= 0) return c.json({ error: 'Test offset would make the weight zero or negative' }, 400)
    const testNote = offset
      ? `TEST TICKET — ${offset > 0 ? '+' : ''}${offset.toFixed(1)} kg simulated load added at weigh-in. The scale actually read ${actualWeight.toFixed(1)} kg. Not a real load.`
      : null
    // Plate as read off the weigh-in frame. Stored on vehicle_plate — the same
    // column the manual New Ticket form writes — so plate matching works for
    // operator-typed plates too, not only camera reads.
    const normPlate = String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    // Coarse attributes the camera CAN read when the plate is too small to
    // resolve — body style, colour, painted lettering. This is what lets the
    // agent tell two open tickets apart on a yard whose plates do not read.
    const lookIn = appearanceJson(appearance)
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const employeeId = c.get('userId')
    const walkInId = await getWalkInCustomerId(c.env.DB)
    const now = new Date().toISOString()

    // Material is optional and defaults to the historical 'mixed'. The scale
    // agent passes its configured tire material so the automated path never
    // has to ask; the manual capture path sends nothing and is unaffected.
    // Validated against the pricing table so a bad value can't produce a
    // ticket that later prices at the 0.14 fallback without anyone noticing.
    let tireType = 'mixed'
    if (typeof material === 'string' && material.trim()) {
      const known = await c.env.DB.prepare(
        'SELECT material_type FROM pricing WHERE material_type = ? AND is_active = 1'
      ).bind(material.trim()).first()
      if (!known) return c.json({ error: `Unknown or inactive material: ${material}` }, 400)
      tireType = material.trim()
    }
    // The job knows what tires were collected; that beats the station default.
    if (job) tireType = (await jobMaterial(c.env.DB, job.tire_type)) || tireType
    if (type === 'pickup' && (await pickupRate(c.env.DB, tireType)) === null) {
      return c.json({ error: `No pickup price is set for ${tireType}. Set one under Pickup Prices first.` }, 400)
    }

    const { ticketNumber, ticketId } = await insertTicketWithRetry(c.env.DB, (tn) => ({
      sql: `INSERT INTO scale_tickets (ticket_number, customer_id, employee_id, tire_type, weight_in, weight_in_at, photo_in, photo_in_at, vehicle_plate, plate_in_confidence, plate_source, appearance_in, notes, ticket_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'weighed_in')`,
      params: [tn, walkInId, employeeId, tireType, recordedWeight, now, photo || null, photo ? now : null,
               normPlate || null, normPlate ? (Number(plate_confidence) || null) : null, normPlate ? 'vision' : null,
               lookIn, testNote, type],
    }))

    await auditLog(c.env.DB, ticketId, 'weighed_in', employeeId, {
      weight: recordedWeight, has_photo: !!photo, material: tireType, ticket_type: type,
      source: source === 'agent' ? 'agent' : 'operator',
      ...(offset ? { test_offset_kg: offset, actual_scale_weight: actualWeight } : {}),
      ...(job ? { job_number: job.job_number } : {}),
    })
    if (job) await applyJobToTicket(c.env.DB, ticketId, job, employeeId, source === 'agent' ? 'agent' : 'operator')

    return c.json({
      success: true,
      id: ticketId,
      ticket_number: ticketNumber,
      weight_in: recordedWeight,
      weight_in_at: now,
      job: job ? jobPreview(job) : null,
    })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Quick-create a walk-in customer from the scale-house Assign modal. Any
// employee can do this (including yard_operator) — the scale operator needs
// to capture a customer mid-ticket without leaving the screen. We auto-fill
// the auth fields (email/password) since walk-ins don't log in.
scaleTicketRoutes.post('/quick-customer', async (c) => {
  try {
    const { company_name, contact_name, phone } = await c.req.json()
    if (!company_name || !company_name.trim()) {
      return c.json({ error: 'Company name is required' }, 400)
    }

    const company = company_name.trim().slice(0, 200)
    const contact = (contact_name || '').trim().slice(0, 200) || company
    const phoneClean = (phone || '').trim().slice(0, 50) || null

    // Synthesize a unique placeholder login — walk-ins never authenticate, but
    // the customers table requires email UNIQUE NOT NULL + password_hash NOT NULL.
    const suffix = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
    const email = `walkin-${suffix}@reusecanada.local`
    const randomPassword = crypto.randomUUID() + crypto.randomUUID()
    const passwordHash = await hashPassword(randomPassword)

    const result = await c.env.DB.prepare(
      `INSERT INTO customers (email, password_hash, company_name, contact_name, phone, province, is_active)
       VALUES (?, ?, ?, ?, ?, 'AB', 1)`
    ).bind(email, passwordHash, company, contact, phoneClean).run()

    const id = result.meta.last_row_id as number
    return c.json({ id, company_name: company, contact_name: contact, phone: phoneClean })
  } catch (err: any) {
    console.error('scaleTickets quick-customer error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Record weight (in or out) — manual entry
scaleTicketRoutes.post('/:id/weight', async (c) => {
  const id = c.req.param('id')
  try {
    const { type, weight, photo } = await c.req.json()
    const employeeId = c.get('userId')

    if (!type || !weight || weight <= 0) {
      return c.json({ error: 'Valid weight type and value required' }, 400)
    }
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM scale_tickets WHERE id = ?'
    ).bind(id).first()

    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    // State machine: a voided/completed ticket is terminal — no more weights.
    if (ticket.status === 'voided' || ticket.status === 'completed') {
      return c.json({ error: `Cannot record weight on a ${ticket.status} ticket` }, 409)
    }

    const now = new Date().toISOString()

    if (type === 'in') {
      await c.env.DB.prepare(
        `UPDATE scale_tickets SET weight_in = ?, weight_in_at = ?, photo_in = COALESCE(?, photo_in), photo_in_at = COALESCE(?, photo_in_at), status = 'weighed_in', updated_at = datetime('now') WHERE id = ?`
      ).bind(weight, now, photo || null, photo ? now : null, id).run()
      await auditLog(c.env.DB, parseInt(id), 'weighed_in', employeeId, { weight })
    } else if (type === 'out') {
      if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)
      // Priced here like every other weigh-out. This path used to record the
      // weight and nothing else, which was harmless while drop-offs carried
      // the bill -- a pickup closed from Ticket History would leave at $0.
      const m = await priceTicket(c.env.DB, ticket.ticket_type, ticket.tire_type as string, ticket.weight_in as number, weight)
      const netWeight = m.net_weight
      const closed = await c.env.DB.prepare(
        `UPDATE scale_tickets SET weight_out = ?, weight_out_at = ?, net_weight = ?, photo_out = COALESCE(?, photo_out), photo_out_at = COALESCE(?, photo_out_at),
                price_per_kg = ?, total_amount = ?, tax_rate = ?, tax_amount = ?, grand_total = ?,
                completed_by = ?, status = 'completed', updated_at = datetime('now') WHERE id = ? AND status NOT IN ('completed', 'voided')`
      ).bind(weight, now, netWeight, photo || null, photo ? now : null,
             m.price_per_kg, m.subtotal, GST_RATE, m.tax_amount, m.grand_total, employeeId, id).run()
      // Conditional so two weigh-outs racing (Auto mode + an operator, or a remote
      // command + a local close) cannot both close it and overwrite the bill.
      if (!closed.meta.changes) return c.json({ error: 'This ticket was just closed by another weigh-out.', code: 'already_closed' }, 409)
      await auditLog(c.env.DB, parseInt(id), 'weighed_out', employeeId, {
        weight, net_weight: netWeight, ticket_type: ticketTypeOf(ticket.ticket_type), grand_total: m.grand_total,
        ...(m.priced ? {} : { unpriced: 'no pickup price set for this material' }),
      })
      await detectAnomalies(c.env.DB, parseInt(id), ticket.weight_in as number, weight, netWeight, ticket.ticket_type)

      if (ticket.pickup_request_id) {
        await c.env.DB.prepare(
          "UPDATE pickup_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
        ).bind(ticket.pickup_request_id).run()
      }
    } else {
      return c.json({ error: 'Type must be "in" or "out"' }, 400)
    }

    return c.json({ success: true })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Merge weigh-out with an existing open ticket
// ─── POST /:id/vehicle ───
// Attach the camera's description of the truck to a ticket that was written
// before the read came back. The agent opens an arrival the moment the scale
// settles -- with nothing else in the yard the camera cannot change that
// answer -- and sends the read here when it lands, a few seconds later. Only
// EMPTY fields are filled: a plate typed by the operator or read at weigh-in
// is never overwritten by a later read.
scaleTicketRoutes.post('/:id/vehicle', async (c) => {
  const id = c.req.param('id')
  if (!/^\d+$/.test(id)) return c.json({ error: 'Bad id' }, 400)
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const normPlate = String(body?.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    const conf = Number(body?.plate_confidence)
    const lookIn = appearanceJson(body?.appearance)
    if (!normPlate && !lookIn) return c.json({ error: 'Nothing to attach' }, 400)

    const t = await c.env.DB.prepare(
      'SELECT id, status, vehicle_plate, appearance_in FROM scale_tickets WHERE id = ?'
    ).bind(id).first<any>()
    if (!t) return c.json({ error: 'Ticket not found' }, 404)
    if (t.status === 'voided') return c.json({ error: 'Ticket is voided' }, 409)

    const setPlate = !!normPlate && !String(t.vehicle_plate || '').trim()
    const setLook = !!lookIn && !String(t.appearance_in || '').trim()
    const sets: string[] = []
    const vals: any[] = []
    if (setPlate) {
      sets.push('vehicle_plate = ?', 'plate_in_confidence = ?', "plate_source = 'vision'")
      vals.push(normPlate, Number.isFinite(conf) ? conf : null)
    }
    if (setLook) { sets.push('appearance_in = ?'); vals.push(lookIn) }
    if (sets.length) {
      await c.env.DB.prepare(`UPDATE scale_tickets SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, id).run()
    }

    // The decision that opened this ticket was recorded before the read
    // existed; fill it in so the audit log shows what the camera saw.
    const decisionId = Number(body?.decision_id)
    if (Number.isFinite(decisionId) && decisionId > 0) {
      await c.env.DB.prepare(
        `UPDATE scale_agent_decisions
         SET plate = COALESCE(plate, ?), plate_confidence = COALESCE(plate_confidence, ?),
             appearance = COALESCE(appearance, ?), vision_used = 1,
             ticket_id = COALESCE(ticket_id, ?)
         WHERE id = ? AND (ticket_id = ? OR ticket_id IS NULL)`
      ).bind(normPlate || null, Number.isFinite(conf) ? conf : null, lookIn, id, decisionId, id).run()
    }
    return c.json({ success: true, plate_set: setPlate, appearance_set: setLook })
  } catch (err: any) {
    console.error('vehicle attach error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

scaleTicketRoutes.post('/:id/merge-out', async (c) => {
  const id = c.req.param('id')
  try {
    const { weight, photo, plate, plate_confidence, appearance } = await c.req.json()
    const employeeId = c.get('userId')
    if (!weight || weight <= 0) return c.json({ error: 'Valid weight required' }, 400)
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)
    // Kept separate from vehicle_plate: that is the plate this ticket belongs
    // to, this is what the camera actually read on the way out. Storing both
    // means a mismatch is visible after the fact instead of overwritten.
    const outPlate = String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    const lookOut = appearanceJson(appearance)

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM scale_tickets WHERE id = ?'
    ).bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)
    if (ticket.status === 'voided' || ticket.status === 'completed') {
      return c.json({ error: `Cannot merge weight-out into a ${ticket.status} ticket` }, 409)
    }

    // Don't Math.abs the net weight — a negative net (a drop-off leaving
    // heavier, a pickup leaving lighter) is a real anomaly and should reach
    // detectAnomalies, not be silently squashed to a positive number that
    // prices a swapped weigh-in/out exactly as if it were correct. Which way
    // the weight runs, and whether it is billed at all, is the ticket type's.
    const m = await priceTicket(c.env.DB, ticket.ticket_type, ticket.tire_type as string, ticket.weight_in as number, weight)
    const netWeight = m.net_weight
    const now = new Date().toISOString()
    const pricePerKg = m.price_per_kg
    const subtotal = m.subtotal
    const tax = m.tax_amount
    const grandTotal = m.grand_total

    const closed = await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        weight_out = ?, weight_out_at = ?, net_weight = ?,
        photo_out = ?, photo_out_at = ?,
        plate_out = ?, plate_out_confidence = ?,
        vehicle_plate = COALESCE(vehicle_plate, ?),
        appearance_out = ?,
        price_per_kg = ?, total_amount = ?, tax_rate = ?, tax_amount = ?, grand_total = ?,
        completed_by = ?, status = 'completed', updated_at = datetime('now')
       WHERE id = ? AND status NOT IN ('completed', 'voided')`
    ).bind(weight, now, netWeight, photo || null, photo ? now : null,
           outPlate || null, outPlate ? (Number(plate_confidence) || null) : null,
           outPlate || null, lookOut,
           pricePerKg, subtotal, GST_RATE, tax, grandTotal, employeeId, id).run()
    // Conditional so two weigh-outs racing (Auto mode + an operator, or a remote
    // command + a local close) cannot both close it and overwrite the bill.
    if (!closed.meta.changes) return c.json({ error: 'This ticket was just closed by another weigh-out.', code: 'already_closed' }, 409)

    await auditLog(c.env.DB, parseInt(id), 'weighed_out', employeeId, {
      weight_out: weight, net_weight: netWeight, price_per_kg: pricePerKg, grand_total: grandTotal,
      has_photo: !!photo, plate_out: outPlate || null, ticket_type: ticketTypeOf(ticket.ticket_type),
      ...(m.priced ? {} : { unpriced: 'no pickup price set for this material' }),
    })

    // Fraud detection
    await detectAnomalies(c.env.DB, parseInt(id), ticket.weight_in as number, weight, netWeight, ticket.ticket_type)

    if (ticket.pickup_request_id) {
      await c.env.DB.prepare(
        "UPDATE pickup_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
      ).bind(ticket.pickup_request_id).run()
    }

    return c.json({
      success: true,
      ticket_type: ticketTypeOf(ticket.ticket_type),
      net_weight: netWeight,
      price_per_kg: pricePerKg,
      subtotal, tax, grand_total: grandTotal,
      unpriced: !m.priced,
    })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Single-weigh using stored vehicle tare
scaleTicketRoutes.post('/:id/stored-tare', async (c) => {
  const id = c.req.param('id')
  try {
    const { vehicle_id } = await c.req.json()
    const employeeId = c.get('userId')

    const ticket = await c.env.DB.prepare('SELECT * FROM scale_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)
    if (ticket.status === 'voided' || ticket.status === 'completed') {
      return c.json({ error: `Cannot apply stored tare to a ${ticket.status} ticket` }, 409)
    }
    // A stored tare is the EMPTY truck, which is the weigh-out of a drop-off
    // but the weigh-in of a pickup. A pickup's weigh-in already IS its empty
    // weight, so a stored tare has nothing to add there.
    if (ticketTypeOf(ticket.ticket_type) === 'pickup') {
      return c.json({ error: 'A pickup leaves loaded, so it has to be weighed out on the scale -- a stored empty weight cannot stand in for it.' }, 409)
    }

    const vehicle = await c.env.DB.prepare('SELECT * FROM vehicles WHERE id = ? AND is_active = 1').bind(vehicle_id).first()
    if (!vehicle || !vehicle.stored_tare_weight) return c.json({ error: 'Vehicle has no stored tare weight' }, 400)

    const tareWeight = vehicle.stored_tare_weight as number
    // No Math.abs — let detectAnomalies see a negative net if the truck's
    // stored tare exceeds the gross-in (e.g. wrong vehicle picked).
    const m = await priceTicket(c.env.DB, ticket.ticket_type, ticket.tire_type as string, ticket.weight_in as number, tareWeight)
    const netWeight = m.net_weight
    const now = new Date().toISOString()
    const pricePerKg = m.price_per_kg
    const subtotal = m.subtotal
    const tax = m.tax_amount
    const grandTotal = m.grand_total

    const closed = await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        weight_out = ?, weight_out_at = ?, net_weight = ?,
        vehicle_id = ?, vehicle_tare_used = 1,
        price_per_kg = ?, total_amount = ?, tax_rate = ?, tax_amount = ?, grand_total = ?,
        completed_by = ?, status = 'completed', updated_at = datetime('now')
       WHERE id = ? AND status NOT IN ('completed', 'voided')`
    ).bind(tareWeight, now, netWeight, vehicle_id, pricePerKg, subtotal, GST_RATE, tax, grandTotal, employeeId, id).run()
    // Conditional so two weigh-outs racing (Auto mode + an operator, or a remote
    // command + a local close) cannot both close it and overwrite the bill.
    if (!closed.meta.changes) return c.json({ error: 'This ticket was just closed by another weigh-out.', code: 'already_closed' }, 409)

    await auditLog(c.env.DB, parseInt(id), 'weighed_out', employeeId, {
      method: 'stored_tare', vehicle_id, tare_weight: tareWeight, net_weight: netWeight, grand_total: grandTotal
    })

    await detectAnomalies(c.env.DB, parseInt(id), ticket.weight_in as number, tareWeight, netWeight, ticket.ticket_type)

    if (ticket.pickup_request_id) {
      await c.env.DB.prepare(
        "UPDATE pickup_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
      ).bind(ticket.pickup_request_id).run()
    }

    return c.json({
      success: true,
      net_weight: netWeight, tare_weight: tareWeight,
      price_per_kg: pricePerKg, subtotal, tax, grand_total: grandTotal,
      vehicle_name: vehicle.name
    })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// ASSIGN, VOID, FINALIZE
// ═══════════════════════════════════════

// Finalize ticket with pricing
scaleTicketRoutes.post('/:id/finalize', async (c) => {
  const id = c.req.param('id')
  try {
    const { price_per_kg, total_amount, tax_amount, grand_total } = await c.req.json()
    const employeeId = c.get('userId')

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        price_per_kg = ?, total_amount = ?, tax_rate = ?,
        tax_amount = ?, grand_total = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(cents(price_per_kg), cents(total_amount), GST_RATE, cents(tax_amount), cents(grand_total), id).run()

    await auditLog(c.env.DB, parseInt(id), 'finalized', employeeId, { grand_total: cents(grand_total) })

    return c.json({ success: true })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Update ticket customer/material (used after print-trigger creates a blank ticket)
// Put a job on a ticket that was opened without one (the driver forgot to
// say it, or Auto mode weighed the truck in first).
scaleTicketRoutes.post('/:id/job', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const { job_number, allow_repeat } = await c.req.json()
    const t = await c.env.DB.prepare('SELECT id, status, ticket_type, job_number FROM scale_tickets WHERE id = ?').bind(id).first<any>()
    if (!t) return c.json({ error: 'Ticket not found' }, 404)
    if (t.status === 'voided') return c.json({ error: 'This ticket is voided.' }, 409)
    if (ticketTypeOf(t.ticket_type) === 'pickup') {
      return c.json({ error: 'This ticket is marked Pickup (a customer buying material). Switch it to Drop-off before adding a job.' }, 409)
    }
    const r = await resolveJob(c.env.DB, job_number, !!allow_repeat, id)
    if ('error' in r) return c.json({ error: r.error, code: r.code, job: r.job }, r.status as any)
    const employeeId = c.get('userId')
    if (t.status === 'weighed_in') {
      const m = await jobMaterial(c.env.DB, r.job.tire_type)
      if (m) await c.env.DB.prepare('UPDATE scale_tickets SET tire_type = ? WHERE id = ?').bind(m, id).run()
    }
    await applyJobToTicket(c.env.DB, id, r.job, employeeId, t.job_number ? 'replaced ' + formatJobNumber(t.job_number) : 'attached later')
    return c.json({ success: true, job: jobPreview(r.job) })
  } catch (err: any) {
    console.error('scaleTickets job attach error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

scaleTicketRoutes.post('/:id/assign', async (c) => {
  const id = c.req.param('id')
  try {
    const { customer_id, tire_type, notes, vehicle_id, driver_name, driver_phone } = await c.req.json()
    const employeeId = c.get('userId')

    // Snapshot the row before mutation — customer reassignment is a likely
    // fraud surface ("did somebody re-attribute this ticket later?").
    const prev = await c.env.DB.prepare(
      'SELECT customer_id, tire_type, vehicle_id, ticket_type, status, payment_status FROM scale_tickets WHERE id = ?'
    ).bind(id).first()
    if (!prev) return c.json({ error: 'Ticket not found' }, 404)

    // A pickup is billed by its material, so it may only move to a material
    // that has a pickup price -- and not at all once the customer has paid or
    // a card payment is in flight, since that would change a settled amount.
    if (tire_type && tire_type !== prev.tire_type && ticketTypeOf(prev.ticket_type) === 'pickup') {
      if (prev.status === 'completed' && (prev.payment_status === 'paid' || prev.payment_status === 'pending')) {
        return c.json({ error: 'This pickup has already been paid, so its material cannot change.' }, 409)
      }
      if ((await pickupRate(c.env.DB, tire_type)) === null) {
        return c.json({ error: `No pickup price is set for ${tire_type}. Set one under Pickup Prices first.` }, 400)
      }
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        customer_id = COALESCE(?, customer_id),
        tire_type = COALESCE(?, tire_type),
        notes = COALESCE(?, notes),
        vehicle_id = COALESCE(?, vehicle_id),
        driver_name = COALESCE(?, driver_name),
        driver_phone = COALESCE(?, driver_phone),
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(customer_id || null, tire_type || null, notes || null, vehicle_id || null,
           driver_name || null, driver_phone || null, id).run()

    await auditLog(c.env.DB, parseInt(id), 'assigned', employeeId, {
      customer_id, tire_type, vehicle_id,
      prev_customer_id: prev?.customer_id,
      prev_tire_type: prev?.tire_type,
      prev_vehicle_id: prev?.vehicle_id,
    })

    // Assignment normally happens while a ticket is still open, so pricing is
    // decided later at weigh-out. The scale agent can assign AFTER the ticket
    // is completed, and then the money was already computed from the material
    // the ticket had at the time -- changing it here would leave the price,
    // GST and total describing a material the ticket no longer has. Re-price.
    let repriced: any = null
    if (prev.status === 'completed' && tire_type && tire_type !== prev.tire_type) {
      repriced = await repriceCompleted(c.env.DB, parseInt(id), employeeId, {
        reason: 'material changed after completion', from: prev.tire_type, to: tire_type,
      })
    }

    return c.json({ success: true, repriced })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Re-price a COMPLETED ticket from its stored weights, type and material. The
// one place that rewrites money after weigh-out, so a material change and a
// drop-off/pickup switch cannot price the same ticket two different ways.
async function repriceCompleted(db: D1Database, id: number, employeeId: number, why: Record<string, any>) {
  const t = await db.prepare(
    'SELECT ticket_type, tire_type, weight_in, weight_out FROM scale_tickets WHERE id = ?'
  ).bind(id).first<any>()
  if (!t || !Number.isFinite(Number(t.weight_in)) || !Number.isFinite(Number(t.weight_out))) return null
  const m = await priceTicket(db, t.ticket_type, t.tire_type, Number(t.weight_in), Number(t.weight_out))
  await db.prepare(
    `UPDATE scale_tickets SET net_weight = ?, price_per_kg = ?, total_amount = ?, tax_rate = ?,
                              tax_amount = ?, grand_total = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(m.net_weight, m.price_per_kg, m.subtotal, GST_RATE, m.tax_amount, m.grand_total, id).run()
  await auditLog(db, id, 'repriced', employeeId, {
    ...why, ticket_type: ticketTypeOf(t.ticket_type), net_weight: m.net_weight,
    price_per_kg: m.price_per_kg, grand_total: m.grand_total,
  })
  return { net_weight: m.net_weight, price_per_kg: m.price_per_kg, subtotal: m.subtotal, tax_amount: m.tax_amount, grand_total: m.grand_total }
}

// ─── POST /:id/type ───
// Body: { ticket_type: 'dropoff' | 'pickup' }
// The operator's Drop-off / Pickup switch. Usable while the truck is in the
// yard (decides which way the weigh-out is measured and whether it is billed)
// and after an automatic close (the agent closes everything as a drop-off, so
// this is how a pickup it closed gets its bill). Refused once money has moved.
scaleTicketRoutes.post('/:id/type', async (c) => {
  const id = c.req.param('id')
  try {
    const { ticket_type } = await c.req.json()
    const type = parseTicketType(ticket_type)
    if (!type) return c.json({ error: 'ticket_type must be "dropoff" or "pickup"' }, 400)
    const employeeId = c.get('userId')

    const t = await c.env.DB.prepare(
      'SELECT id, status, ticket_type, tire_type, payment_status FROM scale_tickets WHERE id = ?'
    ).bind(id).first<any>()
    if (!t) return c.json({ error: 'Ticket not found' }, 404)
    if (t.status === 'voided') return c.json({ error: 'This ticket is voided' }, 409)
    const prevType = ticketTypeOf(t.ticket_type)
    if (prevType === type) return c.json({ success: true, ticket_type: type, changed: false })

    if (t.status === 'completed' && (t.payment_status === 'paid' || t.payment_status === 'pending')) {
      return c.json({ error: t.payment_status === 'paid'
        ? 'This ticket has already been paid, so it cannot be switched.'
        : 'A card payment is in progress on the Square Terminal for this ticket. Finish or cancel it first.' }, 409)
    }
    if (type === 'pickup' && (await pickupRate(c.env.DB, t.tire_type)) === null) {
      return c.json({ error: `No pickup price is set for ${t.tire_type || 'mixed'}. Set one under Pickup Prices, then mark it a pickup.`, needs_price: t.tire_type || 'mixed' }, 400)
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET ticket_type = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(type, id).run()
    await auditLog(c.env.DB, parseInt(id), 'type_changed', employeeId, { from: prevType, to: type, status: t.status })

    const repriced = t.status === 'completed'
      ? await repriceCompleted(c.env.DB, parseInt(id), employeeId, { reason: 'switched ' + prevType + ' to ' + type + ' after completion' })
      : null
    return c.json({ success: true, ticket_type: type, changed: true, status: t.status, repriced })
  } catch (err: any) {
    console.error('scaleTickets type error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Void a ticket (requires reason)
scaleTicketRoutes.post('/:id/void', async (c) => {
  const id = c.req.param('id')
  try {
    const { reason } = await c.req.json()
    const employeeId = c.get('userId')

    if (!reason || !reason.trim()) {
      return c.json({ error: 'A reason is required to void a ticket' }, 400)
    }

    // Capture the before-snapshot so the audit row can answer "what did
    // this ticket look like before it was voided?" — useful when an admin
    // later disputes the void or wants to un-void.
    const existing = await c.env.DB.prepare(
      'SELECT status, weight_in, weight_out, net_weight, grand_total, payment_status FROM scale_tickets WHERE id = ?'
    ).bind(id).first()
    if (!existing) return c.json({ error: 'Ticket not found' }, 404)
    if (existing.status === 'voided') return c.json({ error: 'Ticket is already voided' }, 409)
    // A card checkout is live on the Terminal: voiding now would leave a
    // charge that lands on a ticket that no longer counts.
    if (existing.payment_status === 'pending') {
      return c.json({ error: 'A card payment is waiting on the Square Terminal for this ticket. Cancel it there first, then void.' }, 409)
    }

    await c.env.DB.prepare(
      "UPDATE scale_tickets SET status = 'voided', voided_by = ?, void_reason = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(employeeId, reason.trim(), id).run()

    await auditLog(c.env.DB, parseInt(id), 'voided', employeeId, {
      reason: reason.trim(),
      prev_status: existing.status,
      prev_weight_in: existing.weight_in,
      prev_weight_out: existing.weight_out,
      prev_net_weight: existing.net_weight,
      prev_grand_total: existing.grand_total,
      prev_payment_status: existing.payment_status,
    })

    return c.json({ success: true })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════

// Update payment status. Idempotent on square_payment_id: a retried Square
// callback that re-posts the same payment_id won't duplicate the payment_log row.
scaleTicketRoutes.post('/:id/payment', async (c) => {
  const id = c.req.param('id')
  try {
    const { payment_status, payment_method, square_payment_id, square_checkout_id } = await c.req.json()
    const employeeId = c.get('userId')

    // Capture the previous payment shape so the audit row can show whether
    // a card payment overwrote a cash one (or vice versa) — important when
    // a customer disputes a charge later.
    const prev = await c.env.DB.prepare(
      'SELECT payment_status, payment_method, square_payment_id, status FROM scale_tickets WHERE id = ?'
    ).bind(id).first<any>()
    if (!prev) return c.json({ error: 'Ticket not found' }, 404)
    if (prev.status === 'voided') return c.json({ error: 'This ticket is voided; it cannot take a payment.' }, 409)

    // Once paid, a ticket stays paid. A Terminal checkout that times out or is
    // cancelled AFTER cash was recorded used to post 'unpaid' here and wipe the
    // cash payment; a second card payment used to overwrite the first.
    if (prev.payment_status === 'paid') {
      const incoming = payment_status || 'paid'
      if (incoming === 'paid' && square_payment_id && square_payment_id === prev.square_payment_id) {
        return c.json({ success: true, already_recorded: true })
      }
      if (incoming === 'paid') {
        await auditLog(c.env.DB, Number(id), 'second_payment_refused', employeeId, {
          already: { method: prev.payment_method, square_payment_id: prev.square_payment_id },
          attempted: { method: payment_method || 'card', square_payment_id: square_payment_id || null },
        })
        return c.json({ error: 'This ticket was already paid by ' + (prev.payment_method || 'another method') + '. If the customer was charged again, refund it in Square.', code: 'already_paid' }, 409)
      }
      return c.json({ success: true, unchanged: true, payment_status: 'paid' })
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        payment_status = ?, payment_method = ?,
        square_payment_id = ?, square_checkout_id = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      payment_status || 'paid',
      payment_method || 'card',
      square_payment_id || null,
      square_checkout_id || null,
      id
    ).run()

    const ticket = await c.env.DB.prepare('SELECT grand_total FROM scale_tickets WHERE id = ?').bind(id).first()

    // Idempotency: skip the payment_log insert when this square_payment_id has
    // already been recorded. Backed by the partial UNIQUE index in 0009.
    // Only money actually received goes in payment_log. 'pending' (a card
    // checkout sitting on the Terminal) and 'unpaid' (one that was cancelled)
    // used to write a 'completed' row too, so every card payment was logged
    // twice -- once when it was sent and again when it was tapped.
    const isPaid = (payment_status || 'paid') === 'paid'
    let already = !isPaid
    if (isPaid && square_payment_id) {
      const dup = await c.env.DB.prepare(
        'SELECT id FROM payment_log WHERE square_payment_id = ? LIMIT 1'
      ).bind(square_payment_id).first()
      if (dup) already = true
    }

    if (!already) {
      try {
        await c.env.DB.prepare(
          `INSERT INTO payment_log (scale_ticket_id, amount, payment_method, square_payment_id, square_checkout_id, status)
           VALUES (?, ?, ?, ?, ?, 'completed')`
        ).bind(id, ticket?.grand_total || 0, payment_method || 'card', square_payment_id || null, square_checkout_id || null).run()
      } catch (e: any) {
        // The UNIQUE index will fire if a concurrent retry got there first.
        const msg = String(e?.message || e)
        if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw e
        already = true
      }
    }

    await auditLog(c.env.DB, parseInt(id), 'payment', employeeId, {
      method: payment_method || 'card',
      amount: ticket?.grand_total,
      status: payment_status || 'paid',
      idempotent_skip: isPaid && already,
      prev_payment_status: prev?.payment_status,
      prev_payment_method: prev?.payment_method,
      prev_square_payment_id: prev?.square_payment_id,
    })

    return c.json({ success: true, already_recorded: already })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// PHOTO & RECEIPT
// ═══════════════════════════════════════

// Attach photo to ticket
scaleTicketRoutes.post('/:id/photo', async (c) => {
  const id = c.req.param('id')
  try {
    const { type, photo } = await c.req.json()
    if (!photo || !type) return c.json({ error: 'Photo data and type (in/out) required' }, 400)
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const now = new Date().toISOString()
    if (type === 'in') {
      await c.env.DB.prepare(
        'UPDATE scale_tickets SET photo_in = ?, photo_in_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(photo, now, id).run()
    } else {
      await c.env.DB.prepare(
        'UPDATE scale_tickets SET photo_out = ?, photo_out_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(photo, now, id).run()
    }

    return c.json({ success: true })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Get receipt data for thermal printer
scaleTicketRoutes.get('/:id/receipt', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.*, c.company_name, c.contact_name, c.address, c.city, c.phone as customer_phone
       FROM scale_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.id = ?`
    ).bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    return c.json({
      receipt: {
        company: (await getBranding(c.env.DB)).business_name.toUpperCase(),
        tagline: 'Waste-to-Value Recycling',
        location: 'Alberta, Canada',
        ticket_number: ticket.ticket_number,
        date: ticket.created_at,
        // A job ticket prints the origin frozen at weigh-in, not whatever the
        // customer profile says today -- the receipt is the load's record.
        customer: ticket.origin_company || ticket.company_name || 'Walk-in',
        contact: ticket.origin_contact || ticket.contact_name,
        address: ticket.job_number ? ticket.origin_address : ticket.address,
        city: ticket.job_number ? [ticket.origin_city, ticket.origin_province, ticket.origin_postal_code].filter(Boolean).join(' ') : ticket.city,
        job_number: ticket.job_number ? formatJobNumber(ticket.job_number as number) : null,
        origin_zone: ticket.origin_zone,
        origin_tire_count: ticket.origin_tire_count,
        origin_tire_count_estimated: !!ticket.origin_tire_count_estimated,
        origin_driver: ticket.origin_driver,
        material: ticket.tire_type,
        ticket_type: ticketTypeOf(ticket.ticket_type),
        weight_in: ticket.weight_in,
        weight_in_at: ticket.weight_in_at,
        weight_out: ticket.weight_out,
        weight_out_at: ticket.weight_out_at,
        net_weight: ticket.net_weight,
        price_per_kg: ticket.price_per_kg,
        subtotal: ticket.total_amount,
        tax_rate: ticket.tax_rate,
        tax_amount: ticket.tax_amount,
        grand_total: ticket.grand_total,
        payment_method: ticket.payment_method,
        payment_status: ticket.payment_status,
        vehicle_tare_used: ticket.vehicle_tare_used,
        driver_name: ticket.driver_name,
        // What the camera saw. On the receipt this is the customer's own
        // record of which vehicle was weighed -- the thing a disputed ticket
        // actually turns on -- so it is printed as text AND as the frames.
        vehicle_plate: ticket.vehicle_plate,
        appearance_in: ticket.appearance_in,
        appearance_out: ticket.appearance_out,
        verify_status: ticket.verify_status,
        photo_in: ticket.photo_in,
        photo_out: ticket.photo_out,
      }
    })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Mark receipt as printed
scaleTicketRoutes.post('/:id/receipt-printed', async (c) => {
  const id = c.req.param('id')
  try {
    const employeeId = c.get('userId')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE scale_tickets SET receipt_printed = 1, receipt_printed_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(now, id).run()

    await auditLog(c.env.DB, parseInt(id), 'receipt_printed', employeeId)

    return c.json({ success: true })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// VEHICLES / TARE
// ═══════════════════════════════════════

// List vehicles with stored tare weights
scaleTicketRoutes.get('/vehicles/tare', roleRequired('admin', 'manager', 'yard_operator'), async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, plate_number, vehicle_type, tare_weight, stored_tare_weight FROM vehicles WHERE is_active = 1 ORDER BY name'
    ).all()
    return c.json({ vehicles: results })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// WEIGHT EDITING (admin/manager only)
// ═══════════════════════════════════════

scaleTicketRoutes.patch('/:id/weight', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { field, new_value, reason } = await c.req.json()
    const employeeId = c.get('userId')

    if (!field || !['weight_in', 'weight_out'].includes(field)) {
      return c.json({ error: 'Field must be weight_in or weight_out' }, 400)
    }
    if (!new_value || new_value <= 0) return c.json({ error: 'Valid weight required' }, 400)
    if (!reason || !reason.trim()) return c.json({ error: 'Reason required for weight edit' }, 400)

    const ticket = await c.env.DB.prepare('SELECT * FROM scale_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    // Editing a weight re-prices the ticket. Once money has moved (or is on
    // the Terminal) that would leave grand_total disagreeing with what was
    // actually collected and with the settled batch.
    if (ticket.payment_status === 'paid' || ticket.payment_status === 'pending') {
      return c.json({ error: 'This ticket has been paid (or a payment is in progress), so its weights can no longer be edited.' }, 409)
    }
    if (ticket.status === 'voided') return c.json({ error: 'This ticket is voided.' }, 409)

    const oldValue = ticket[field] as number
    if (!oldValue) return c.json({ error: 'No existing weight to edit for this field' }, 400)

    // Record the edit
    await c.env.DB.prepare(
      'INSERT INTO scale_weight_edits (scale_ticket_id, field, old_value, new_value, reason, editor_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(parseInt(id), field, oldValue, new_value, reason.trim(), employeeId).run()

    // Update the weight. Always recompute net_weight from the (possibly
    // updated) pair: if only one side exists, net is undefined; if both
    // exist, net = in - out (signed — Math.abs would mask a swapped weigh-in).
    const weightIn = field === 'weight_in' ? new_value : (ticket.weight_in as number | null)
    const weightOut = field === 'weight_out' ? new_value : (ticket.weight_out as number | null)
    const netWeight = (weightIn && weightOut) ? ticketNet(ticket.ticket_type, weightIn, weightOut) : null

    let pricePerKg = ticket.price_per_kg as number
    let subtotal = ticket.total_amount as number
    let tax = ticket.tax_amount as number
    let grandTotal = ticket.grand_total as number

    // Re-priced at the rate the ticket was closed at, not today's: an edit
    // corrects a weight, it does not re-open the price.
    if (netWeight !== ticket.net_weight && ticket.status === 'completed' && pricePerKg > 0 && netWeight) {
      subtotal = cents(billableKg(netWeight) * pricePerKg)
      tax = cents(subtotal * GST_RATE)
      grandTotal = cents(subtotal + tax)
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET ${field} = ?, net_weight = ?, total_amount = ?, tax_amount = ?, grand_total = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(new_value, netWeight, subtotal, tax, grandTotal, id).run()

    await auditLog(c.env.DB, parseInt(id), 'weight_edited', employeeId, {
      field, old_value: oldValue, new_value, reason: reason.trim(), net_weight: netWeight, grand_total: grandTotal
    })

    // Check for anomalies on new values
    await detectAnomalies(c.env.DB, parseInt(id), weightIn, weightOut, netWeight, ticket.ticket_type)

    return c.json({ success: true, net_weight: netWeight, grand_total: grandTotal })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// FRAUD DETECTION / ANOMALIES
// ═══════════════════════════════════════

// Anomaly detection helper
async function detectAnomalies(db: D1Database, ticketId: number, weightIn: number, weightOut: number, netWeight: number, ticketType?: unknown) {
  const anomalies: { type: string, severity: string, description: string }[] = []

  if (netWeight < 0) {
    anomalies.push({ type: 'negative_net', severity: 'high', description: 'Net weight is negative (' + netWeight.toFixed(1) + ' kg). ' + (ticketTypeOf(ticketType) === 'pickup'
      ? 'This pickup left lighter than it arrived.'
      : 'Weight out exceeds weight in.') })
  }
  if (netWeight >= 0 && netWeight < 10) {
    anomalies.push({ type: 'zero_net', severity: 'medium', description: 'Net weight is near zero (' + netWeight.toFixed(1) + ' kg). Possible empty load.' })
  }
  if (weightIn > 50000) {
    anomalies.push({ type: 'extreme_value', severity: 'high', description: 'Gross weight exceeds 50,000 kg (' + weightIn.toFixed(1) + ' kg). Verify scale reading.' })
  }
  if (weightOut > 50000) {
    anomalies.push({ type: 'extreme_value', severity: 'high', description: 'Tare weight exceeds 50,000 kg (' + weightOut.toFixed(1) + ' kg). Verify scale reading.' })
  }

  // Check for rapid repeat (same ticket within 10 minutes of another from same customer)
  try {
    const ticket = await db.prepare('SELECT customer_id, tire_type, created_at FROM scale_tickets WHERE id = ?').bind(ticketId).first()
    if (ticket && ticket.customer_id) {
      const recent = await db.prepare(
        "SELECT COUNT(*) as cnt FROM scale_tickets WHERE customer_id = ? AND tire_type = ? AND id != ? AND created_at > datetime(?, '-10 minutes') AND status != 'voided'"
      ).bind(ticket.customer_id, ticket.tire_type, ticketId, ticket.created_at).first()
      if (recent && (recent.cnt as number) > 0) {
        anomalies.push({ type: 'rapid_repeat', severity: 'medium', description: 'Another ticket for same customer/material within 10 minutes.' })
      }
    }
  } catch (e) { /* non-critical */ }

  // Insert anomalies
  for (const a of anomalies) {
    try {
      await db.prepare(
        'INSERT INTO weight_anomalies (scale_ticket_id, anomaly_type, severity, description) VALUES (?, ?, ?, ?)'
      ).bind(ticketId, a.type, a.severity, a.description).run()
    } catch (e) { /* non-critical */ }
  }

  return anomalies
}

// List anomalies
scaleTicketRoutes.get('/anomalies/list', async (c) => {
  try {
    const resolved = c.req.query('resolved')
    let sql = `SELECT wa.*, st.ticket_number, c.company_name, e.first_name || ' ' || e.last_name as resolved_by_name
               FROM weight_anomalies wa
               LEFT JOIN scale_tickets st ON wa.scale_ticket_id = st.id
               LEFT JOIN customers c ON st.customer_id = c.id
               LEFT JOIN employees e ON wa.resolved_by = e.id
               WHERE 1=1`
    const params: any[] = []
    if (resolved === '0' || resolved === 'false') { sql += ' AND wa.resolved = 0' }
    else if (resolved === '1' || resolved === 'true') { sql += ' AND wa.resolved = 1' }
    sql += ' ORDER BY wa.created_at DESC LIMIT 100'

    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)
    const { results } = await stmt.all()
    return c.json({ anomalies: results })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Resolve an anomaly
scaleTicketRoutes.post('/anomalies/:id/resolve', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { note } = await c.req.json()
    const employeeId = c.get('userId')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE weight_anomalies SET resolved = 1, resolved_by = ?, resolved_at = ?, description = description || ? WHERE id = ?'
    ).bind(employeeId, now, note ? ' | Resolved: ' + note.trim() : '', id).run()

    return c.json({ success: true })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// DAILY SETTLEMENT
// ═══════════════════════════════════════

// Get daily settlement summary
scaleTicketRoutes.get('/settlement/daily', async (c) => {
  try {
    // "Today" must be Edmonton-local — the worker runs in UTC and
    // toISOString() flips the date at 5pm/6pm local otherwise.
    const date = c.req.query('date') || todayEdmonton()
    if (!YMD.test(date)) return c.json({ error: 'Date must be YYYY-MM-DD' }, 400)

    const { results: tickets } = await c.env.DB.prepare(
      `SELECT st.id, st.ticket_number, st.grand_total, st.payment_status, st.payment_method, c.company_name
       FROM scale_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.created_at >= ? AND st.created_at < ? AND st.status = 'completed'
       ORDER BY st.created_at ASC`
    ).bind(...edmontonDayRangeUtc(date)).all()

    const summary = {
      date,
      total_tickets: tickets.length,
      paid_card: { count: 0, amount: 0 },
      paid_cash: { count: 0, amount: 0 },
      unpaid: { count: 0, amount: 0 },
      total_revenue: 0,
    }

    for (const t of tickets) {
      const amount = (t.grand_total as number) || 0
      summary.total_revenue += amount
      if (t.payment_status === 'paid') {
        if (t.payment_method === 'cash') { summary.paid_cash.count++; summary.paid_cash.amount += amount }
        else { summary.paid_card.count++; summary.paid_card.amount += amount }
      } else {
        summary.unpaid.count++; summary.unpaid.amount += amount
      }
    }

    // Check if batch already exists for this date
    const batch = await c.env.DB.prepare(
      'SELECT * FROM payment_batches WHERE batch_date = ?'
    ).bind(date).first()

    return c.json({ summary, tickets, batch })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Settle a daily batch
scaleTicketRoutes.post('/settlement/batch', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { date } = await c.req.json()
    const employeeId = c.get('userId')
    if (!date || !YMD.test(date)) return c.json({ error: 'Date required (YYYY-MM-DD)' }, 400)

    // Sum only paid tickets — unpaid receivables don't belong in a settled
    // cash batch. Backed by the UNIQUE(batch_date) index added in 0010, the
    // INSERT below also fails atomically if two admins race.
    const { results: tickets } = await c.env.DB.prepare(
      "SELECT id, grand_total FROM scale_tickets WHERE created_at >= ? AND created_at < ? AND status = 'completed' AND payment_status = 'paid'"
    ).bind(...edmontonDayRangeUtc(date)).all()

    const totalAmount = tickets.reduce((s: number, t: any) => s + ((t.grand_total as number) || 0), 0)
    const now = new Date().toISOString()

    try {
      await c.env.DB.prepare(
        'INSERT INTO payment_batches (batch_date, ticket_count, total_amount, status, settled_by, settled_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(date, tickets.length, totalAmount, 'settled', employeeId, now).run()
    } catch (e: any) {
      const msg = String(e?.message || e)
      if (msg.includes('UNIQUE') || msg.includes('constraint')) {
        return c.json({ error: 'Batch already settled for this date' }, 409)
      }
      throw e
    }

    return c.json({ success: true, ticket_count: tickets.length, total_amount: totalAmount })
  } catch (err: any) {
    console.error('scaleTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
