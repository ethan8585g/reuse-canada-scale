import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { GST_RATE, cents } from '../utils/money'

type Bindings = { DB: D1Database }

// ══════════════════════════════════════════════════════════════════════
// SCALE HOUSE AI AGENT — decision side
// ══════════════════════════════════════════════════════════════════════
// The agent LOOP lives in the scale-house browser (see src/pages/scaleHouse.ts):
// the weight only exists there (Web Bluetooth / Web Serial / localhost bridge)
// and the USB Epson is only reachable through window.print(). This router is
// the part that has to be server-side:
//
//   * the authoritative open-ticket set (the browser's copy is up to 15s stale)
//   * the audit record of every decision
//   * later, the Claude vision call — the API key must never reach the browser
//
// It deliberately performs NO ticket mutations. Acting reuses the existing,
// already-audited /print-trigger and /:id/merge-out routes so the money math,
// the audit log and detectAnomalies() are inherited rather than duplicated.

export const scaleAgentRoutes = new Hono<{ Bindings: Bindings }>()

scaleAgentRoutes.use('*', authMiddleware, employeeOnly)

const DEFAULTS = {
  mode: 'dry_run',
  wake_threshold_kg: 100,
  vehicle_floor_kg: 100,
  settle_seconds: 3,
  cancel_seconds: 5,
  min_net_kg: 10,
  max_net_kg: 30000,
  material: 'mixed',
  single_truck_mode: 1,
  max_open_age_hours: 12,
  customer_prompt: 'on_close',
  vision_enabled: 0,
  vision_model: 'claude-sonnet-5',
}

// Statuses that mean "this truck is in the yard with an unfinished ticket".
// Mirrors the scale-house sidebar query so the agent and the operator are
// always looking at the same set.
const OPEN_STATUSES = ['weighed_in', 'field_pending', 'field_complete']

async function getSettings(db: D1Database): Promise<any> {
  try {
    const row = await db.prepare('SELECT * FROM scale_agent_settings WHERE id = 1').first<any>()
    if (row) return row
  } catch (e) { /* table may not exist yet on a stale deploy */ }
  return { id: 1, ...DEFAULTS }
}

interface OpenTicket {
  id: number
  ticket_number: string
  weight_in: number
  weight_in_at: string | null
  tire_type: string | null
  customer_id: number | null
  company_name: string | null
  photo_in_present: boolean
  age_hours: number
}

export interface Decision {
  action: 'new' | 'close' | 'defer'
  ticket: OpenTicket | null
  confidence: number
  rule: string
  reason: string
  candidates: OpenTicket[]
}

// ─────────────────────────────────────────────────────────────────────
// The rules.
//
// Everything rests on one physical invariant: a truck arrives LOADED with
// tires and leaves LIGHTER. So a weigh-out is always less than its own
// weigh-in. That single fact resolves the overwhelming majority of real
// events with no AI at all.
//
// Two distinct notions of "could this be closing that ticket":
//   possible  — arithmetically (weight_in - weight > 0)
//   plausible — and the resulting load size is sane (min_net..max_net)
// The difference matters. If nothing is even POSSIBLE the truck must be
// arriving, and we can say so confidently. But if something is possible and
// merely implausible, that is a suspicious reading, not a new arrival —
// defer to the operator rather than quietly opening a second ticket for a
// truck that is already in the yard.
// ─────────────────────────────────────────────────────────────────────
export function decide(weight: number, open: OpenTicket[], s: any): Decision {
  const minNet = Number(s.min_net_kg ?? DEFAULTS.min_net_kg)
  const maxNet = Number(s.max_net_kg ?? DEFAULTS.max_net_kg)
  const singleTruck = Number(s.single_truck_mode ?? DEFAULTS.single_truck_mode) ? true : false
  const maxAge = Number(s.max_open_age_hours ?? DEFAULTS.max_open_age_hours)
  const none: OpenTicket[] = []

  // The indicator drifts below zero in wind. A negative or zero reading is
  // never a truck, and must never open or close anything.
  if (!Number.isFinite(weight) || weight <= 0) {
    return {
      action: 'defer', ticket: null, confidence: 0, rule: 'non_positive_weight',
      reason: `Ignoring a ${Number.isFinite(weight) ? weight.toFixed(1) : 'non-numeric'} kg reading. The scale drifts below zero in wind and a negative is never a truck.`,
      candidates: none,
    }
  }

  if (open.length === 0) {
    return {
      action: 'new', ticket: null, confidence: 1, rule: 'no_open_tickets',
      reason: 'Nothing is open in the yard, so this can only be a truck arriving.',
      candidates: none,
    }
  }

  const possible = open.filter(t => Number.isFinite(t.weight_in) && (t.weight_in - weight) > 0)

  if (possible.length === 0) {
    // Heavier than every open weigh-in. With more than one truck in play that
    // is simply a second truck arriving. But while the yard runs one truck at
    // a time it cannot be -- opening a second ticket here would quietly break
    // the one-open-ticket invariant the whole no-camera scheme depends on, and
    // the next truck to leave would then match two candidates and stall.
    if (singleTruck) {
      return {
        action: 'defer', ticket: null, confidence: 0, rule: 'single_truck_unexpected_arrival',
        reason: `${open[0].ticket_number} is still open and ${weight.toFixed(1)} kg is heavier than its weigh-in, so this is not that truck leaving. With one truck at a time that should not happen — sending it to the operator rather than opening a second ticket.`,
        candidates: open,
      }
    }
    return {
      action: 'new', ticket: null, confidence: 0.95, rule: 'heavier_than_all_open',
      reason: `At ${weight.toFixed(1)} kg this is heavier than every open weigh-in, so it cannot be any of them weighing out.`,
      candidates: none,
    }
  }

  const plausible = possible.filter(t => {
    const net = t.weight_in - weight
    return net >= minNet && net <= maxNet
  })

  if (plausible.length === 0) {
    return {
      action: 'defer', ticket: null, confidence: 0, rule: 'implausible_net',
      reason: `This could be weighing out, but every candidate gives a load outside ${minNet}-${maxNet} kg. Sending it to the operator.`,
      candidates: possible,
    }
  }

  // Staleness is the sharpest edge of the no-camera design. A truck that
  // weighs in and never weighs out -- drove off without recrossing the scale,
  // or an operator slip -- leaves a ticket open forever. Every later truck is
  // lighter than it, so without this guard the agent would close a stranger's
  // ticket and bill the wrong customer.
  const fresh = plausible.filter(t => !Number.isFinite(t.age_hours) || t.age_hours <= maxAge)
  if (fresh.length === 0) {
    const oldest = plausible[0]
    return {
      action: 'defer', ticket: null, confidence: 0, rule: 'stale_open_ticket',
      reason: `${oldest.ticket_number} has been open ${oldest.age_hours.toFixed(1)} h, past the ${maxAge} h limit. It is probably an abandoned ticket rather than this truck, so it will not be closed automatically.`,
      candidates: plausible,
    }
  }

  if (fresh.length === 1) {
    const t = fresh[0]
    const net = t.weight_in - weight
    const onlyOne = open.length === 1
    return {
      action: 'close', ticket: t,
      confidence: onlyOne ? 0.95 : 0.85,
      rule: onlyOne ? 'single_open_ticket' : 'only_plausible_candidate',
      reason: onlyOne
        ? `${t.ticket_number} is the only open ticket and ${weight.toFixed(1)} kg out of ${t.weight_in.toFixed(1)} kg in gives a ${net.toFixed(1)} kg load.`
        : `Of ${open.length} open tickets only ${t.ticket_number} gives a sensible load (${net.toFixed(1)} kg).`,
      candidates: fresh,
    }
  }

  return {
    action: 'defer', ticket: null, confidence: 0, rule: 'ambiguous_multiple_candidates',
    reason: `${fresh.length} open tickets could each be this truck weighing out. Needs the camera or the operator to tell them apart.`,
    candidates: fresh,
  }
}

// ─── GET /settings ───
scaleAgentRoutes.get('/settings', async (c) => {
  try {
    return c.json({ settings: await getSettings(c.env.DB) })
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to read settings' }, 500)
  }
})

// ─── PUT /settings ───
// Changing the mode arms or disarms an automation that closes tickets and
// attaches money, so it is not something a driver session should be able to do.
scaleAgentRoutes.put('/settings', roleRequired('admin', 'manager'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const cur = await getSettings(c.env.DB)

    const mode = typeof body.mode === 'string' ? body.mode : cur.mode
    if (!['off', 'dry_run', 'live'].includes(mode)) {
      return c.json({ error: 'mode must be off, dry_run or live' }, 400)
    }

    const num = (v: any, fallback: number, lo: number, hi: number) => {
      const n = Number(v)
      if (!Number.isFinite(n) || n < lo || n > hi) return fallback
      return n
    }

    const next = {
      mode,
      wake_threshold_kg: num(body.wake_threshold_kg, cur.wake_threshold_kg, 1, 5000),
      vehicle_floor_kg: num(body.vehicle_floor_kg, cur.vehicle_floor_kg, 1, 50000),
      settle_seconds: Math.round(num(body.settle_seconds, cur.settle_seconds, 1, 60)),
      cancel_seconds: Math.round(num(body.cancel_seconds, cur.cancel_seconds, 0, 60)),
      min_net_kg: num(body.min_net_kg, cur.min_net_kg, 0, 10000),
      max_net_kg: num(body.max_net_kg, cur.max_net_kg, 100, 200000),
      material: typeof body.material === 'string' && body.material ? body.material.slice(0, 40) : cur.material,
      single_truck_mode: body.single_truck_mode === undefined ? cur.single_truck_mode : (body.single_truck_mode ? 1 : 0),
      max_open_age_hours: num(body.max_open_age_hours, cur.max_open_age_hours, 0.25, 720),
      customer_prompt: ['on_close', 'off'].includes(body.customer_prompt) ? body.customer_prompt : cur.customer_prompt,
      vision_enabled: body.vision_enabled === undefined ? cur.vision_enabled : (body.vision_enabled ? 1 : 0),
      vision_model: typeof body.vision_model === 'string' && body.vision_model ? body.vision_model.slice(0, 60) : cur.vision_model,
    }

    if (next.min_net_kg >= next.max_net_kg) {
      return c.json({ error: 'min_net_kg must be below max_net_kg' }, 400)
    }
    // The floor may equal the wake threshold -- that is the normal setup, one
    // number for "this is a truck". It may be raised above it if small stable
    // loads on the deck ever start producing tickets, but never dropped below,
    // which would let the agent act on a reading it never woke for.
    if (next.vehicle_floor_kg < next.wake_threshold_kg) {
      return c.json({ error: 'vehicle_floor_kg cannot be below wake_threshold_kg' }, 400)
    }

    await c.env.DB.prepare(
      `UPDATE scale_agent_settings SET
         mode = ?, wake_threshold_kg = ?, vehicle_floor_kg = ?, settle_seconds = ?,
         cancel_seconds = ?, min_net_kg = ?, max_net_kg = ?, material = ?,
         single_truck_mode = ?, max_open_age_hours = ?, customer_prompt = ?,
         vision_enabled = ?, vision_model = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    ).bind(
      next.mode, next.wake_threshold_kg, next.vehicle_floor_kg, next.settle_seconds,
      next.cancel_seconds, next.min_net_kg, next.max_net_kg, next.material,
      next.single_truck_mode, next.max_open_age_hours, next.customer_prompt,
      next.vision_enabled, next.vision_model
    ).run()

    return c.json({ success: true, settings: await getSettings(c.env.DB) })
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to save settings' }, 500)
  }
})

// ─── POST /decide ───
// Body: { weight }
// Returns the decision plus everything the cancel banner needs to render.
scaleAgentRoutes.post('/decide', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const weight = Number(body?.weight)

    const s = await getSettings(c.env.DB)
    if (s.mode === 'off') {
      return c.json({ mode: 'off', action: 'defer', rule: 'agent_off', reason: 'Agent is switched off.' })
    }

    // A wind-drift negative is expected traffic on this scale, not a client
    // error, so answer with a decision the loop can log rather than a 400.
    if (!Number.isFinite(weight) || weight <= 0) {
      return c.json({
        mode: s.mode, action: 'defer', rule: 'non_positive_weight',
        reason: 'Negative or zero readings are never a truck and are ignored.',
        settings: s,
      })
    }

    // Below the vehicle floor this is a person, a bird, debris or weather --
    // not a truck. Wake, but never ticket.
    if (weight < Number(s.vehicle_floor_kg)) {
      return c.json({
        mode: s.mode, action: 'defer', rule: 'below_vehicle_floor',
        reason: `${weight.toFixed(1)} kg is under the ${Number(s.vehicle_floor_kg).toFixed(0)} kg vehicle floor.`,
        settings: s,
      })
    }

    const { results } = await c.env.DB.prepare(
      `SELECT st.id, st.ticket_number, st.weight_in, st.weight_in_at, st.tire_type,
              st.customer_id, c.company_name,
              CASE WHEN st.photo_in IS NULL OR st.photo_in = '' THEN 0 ELSE 1 END AS has_photo_in,
              -- Computed in SQLite rather than JS: D1 returns datetimes as
              -- 'YYYY-MM-DD HH:MM:SS' with no zone, which JS Date parses
              -- inconsistently across engines.
              CAST((julianday('now') - julianday(COALESCE(st.weight_in_at, st.created_at))) * 24 AS REAL) AS age_hours
       FROM scale_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.status IN (${OPEN_STATUSES.map(() => '?').join(',')})
         AND st.weight_in IS NOT NULL
         AND st.weight_out IS NULL
       ORDER BY st.weight_in_at ASC`
    ).bind(...OPEN_STATUSES).all<any>()

    const open: OpenTicket[] = (results || []).map(r => ({
      id: r.id,
      ticket_number: r.ticket_number,
      weight_in: Number(r.weight_in),
      weight_in_at: r.weight_in_at,
      tire_type: r.tire_type,
      customer_id: r.customer_id,
      company_name: r.company_name,
      photo_in_present: !!r.has_photo_in,
      age_hours: Number(r.age_hours),
    }))

    const d = decide(weight, open, s)

    // Pricing preview for the banner only. merge-out remains the authority on
    // what actually gets written -- this is deliberately the same formula so
    // the number the operator sees is the number they get.
    let preview: any = null
    if (d.action === 'close' && d.ticket) {
      const net = d.ticket.weight_in - weight
      const pricing = await c.env.DB.prepare(
        'SELECT price_per_kg FROM pricing WHERE material_type = ? AND is_active = 1'
      ).bind(d.ticket.tire_type || s.material || 'mixed').first<any>()
      const ppk = pricing ? Number(pricing.price_per_kg) : 0.14
      const subtotal = cents(net * ppk)
      const tax = cents(subtotal * GST_RATE)
      preview = {
        weight_in: d.ticket.weight_in,
        weight_out: weight,
        net_weight: net,
        price_per_kg: ppk,
        subtotal,
        tax_amount: tax,
        grand_total: cents(subtotal + tax),
      }
    }

    // Record the decision now, outcome pending. The browser reports back what
    // actually happened via /decisions/:id/outcome. Logging up front means a
    // decision still leaves a trace even if the browser dies mid-act.
    const outcome = s.mode === 'dry_run' ? 'dry_run' : (d.action === 'defer' ? 'deferred' : 'pending')
    let decisionId: number | null = null
    try {
      const ins = await c.env.DB.prepare(
        `INSERT INTO scale_agent_decisions
           (weight_kg, action, ticket_id, confidence, rule_fired, reason,
            open_ticket_count, vision_used, outcome, employee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).bind(
        weight, d.action, d.ticket?.id ?? null, d.confidence, d.rule, d.reason,
        open.length, outcome, c.get('userId')
      ).run()
      decisionId = (ins.meta as any)?.last_row_id ?? null
    } catch (e) { /* logging must never block the loop */ }

    return c.json({
      decision_id: decisionId,
      mode: s.mode,
      action: d.action,
      rule: d.rule,
      reason: d.reason,
      confidence: d.confidence,
      ticket: d.ticket,
      candidates: d.candidates,
      open_ticket_count: open.length,
      preview,
      settings: s,
    })
  } catch (err: any) {
    console.error('scaleAgent decide error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// ─── POST /decisions/:id/outcome ───
// The browser reports what actually happened: acted, cancelled, or failed.
scaleAgentRoutes.post('/decisions/:id/outcome', async (c) => {
  const id = c.req.param('id')
  if (!/^\d+$/.test(id)) return c.json({ error: 'Bad id' }, 400)
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const outcome = body?.outcome
    if (!['acted', 'cancelled', 'failed', 'deferred'].includes(outcome)) {
      return c.json({ error: 'outcome must be acted, cancelled, failed or deferred' }, 400)
    }
    const ticketId = Number.isFinite(Number(body?.ticket_id)) ? Number(body.ticket_id) : null
    await c.env.DB.prepare(
      `UPDATE scale_agent_decisions
       SET outcome = ?, ticket_id = COALESCE(?, ticket_id)
       WHERE id = ?`
    ).bind(outcome, ticketId, id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// ─── GET /log ───
scaleAgentRoutes.get('/log', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10) || 50, 200)
    const { results } = await c.env.DB.prepare(
      `SELECT d.*, st.ticket_number
       FROM scale_agent_decisions d
       LEFT JOIN scale_tickets st ON d.ticket_id = st.id
       ORDER BY d.created_at DESC, d.id DESC
       LIMIT ?`
    ).bind(limit).all()
    return c.json({ decisions: results })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})
