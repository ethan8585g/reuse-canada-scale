import { Hono } from 'hono'
import Anthropic from '@anthropic-ai/sdk'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { GST_RATE, cents } from '../utils/money'

// ANTHROPIC_API_KEY is a Cloudflare secret and is read only here. The frame it
// describes is captured in the browser, but the key must never go there.
type Bindings = { DB: D1Database; ANTHROPIC_API_KEY?: string }

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
  vision_model: 'claude-opus-5',
  plate_matching: 1,
  plate_min_confidence: 0.6,
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

// ─────────────────────────────────────────────────────────────────────
// Plate comparison.
//
// Every plate font confuses the same handful of glyph pairs, so the same truck
// can read "8J4 2ZY" on the way in and "BJ4 22Y" on the way out. Folding only
// those classic pairs keeps the comparison robust without becoming a loose
// fuzzy match -- and loose is dangerous here, because a false match closes
// another customer's ticket and bills them for this load.
const PLATE_FOLD: Record<string, string> = {
  O: '0', I: '1', Z: '2', S: '5', G: '6', B: '8',
}

export function normalizePlate(raw: unknown): string {
  const v = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  // Shorter than 4 is not a plate, it is a fragment of one -- and a fragment
  // matches far too many things to be allowed to close a ticket.
  if (v.length < 4 || v.length > 10) return ''
  return v
}

function foldPlate(v: string): string {
  let out = ''
  for (const ch of v) out += PLATE_FOLD[ch] ?? ch
  return out
}

// Levenshtein, capped: we only care whether two plates are within one edit of
// each other, not how far apart they are.
export function plateDistance(a: unknown, b: unknown): number {
  const x = foldPlate(normalizePlate(a))
  const y = foldPlate(normalizePlate(b))
  if (!x || !y) return -1
  if (Math.abs(x.length - y.length) > 1) return 2
  let prev = Array.from({ length: y.length + 1 }, (_, i) => i)
  for (let i = 1; i <= x.length; i++) {
    const cur = [i]
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[y.length]
}

export function platesMatch(a: unknown, b: unknown): boolean {
  const x = foldPlate(normalizePlate(a))
  const y = foldPlate(normalizePlate(b))
  return !!x && x === y
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
  plate: string | null
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
export function decide(weight: number, open: OpenTicket[], s: any, plate?: unknown): Decision {
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

  // ── Identity, when the camera can read one ──────────────────────────
  // Weight says what is on the deck; a plate says WHO. That changes the
  // question from "could this be one of them leaving" -- unanswerable with
  // several trucks on site, which is why single_truck_mode had to exist -- to
  // "is this truck already in the yard", which is answerable no matter how
  // many are. Everything below this block is the weight-only fallback for
  // when no plate could be read, and is unchanged.
  const usePlates = Number(s.plate_matching ?? DEFAULTS.plate_matching) ? true : false
  const plateNorm = usePlates ? normalizePlate(plate) : ''

  if (plateNorm) {
    const matches = open.filter(t => platesMatch(t.plate, plateNorm))

    if (matches.length > 1) {
      return {
        action: 'defer', ticket: null, confidence: 0, rule: 'plate_match_ambiguous',
        reason: `Plate ${plateNorm} matches ${matches.length} open tickets, which should be impossible. Sending it to the operator rather than guessing which one is leaving.`,
        candidates: matches,
      }
    }

    if (matches.length === 1) {
      const t = matches[0]
      const net = t.weight_in - weight

      // The plate names the truck, but physics keeps its veto: nothing weighs
      // out heavier than it weighed in, and a load outside the sane range is a
      // bad reading rather than a finished job. Knowing WHO this is does not
      // mean we know WHAT happened to it.
      if (net <= 0) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'plate_match_not_lighter',
          reason: `Plate ${plateNorm} is ${t.ticket_number}, open at ${t.weight_in.toFixed(1)} kg, but this reading is ${weight.toFixed(1)} kg — the same truck cannot leave heavier than it arrived. Sending it to the operator.`,
          candidates: matches,
        }
      }
      if (net < minNet || net > maxNet) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'plate_match_implausible_net',
          reason: `Plate ${plateNorm} is ${t.ticket_number}, but that gives a ${net.toFixed(1)} kg load, outside ${minNet}-${maxNet} kg. Sending it to the operator.`,
          candidates: matches,
        }
      }

      // Deliberately not subject to the stale-ticket guard. That guard exists
      // because weight alone cannot tell an abandoned ticket from this truck;
      // a plate can, so an old ticket belonging to THIS plate is exactly the
      // one to close.
      return {
        action: 'close', ticket: t, confidence: 0.97, rule: 'plate_match',
        reason: `Plate ${plateNorm} is ${t.ticket_number}, open at ${t.weight_in.toFixed(1)} kg. Weighing out at ${weight.toFixed(1)} kg gives a ${net.toFixed(1)} kg load.`
          + (t.age_hours > Number(s.max_open_age_hours ?? DEFAULTS.max_open_age_hours)
              ? ` That ticket is ${t.age_hours.toFixed(1)} h old, but the plate identifies it, so age is not a reason to doubt it.`
              : ''),
        candidates: matches,
      }
    }

    // A plate matching nothing is normally an arrival -- but it is also exactly
    // what one misread character looks like, and opening a second ticket for a
    // truck already in the yard is the expensive mistake: it strands the real
    // ticket and counts the truck twice. So when the read is within one edit of
    // a truck that could plausibly be weighing out right now, that is far more
    // likely a misread than a new arrival, and it goes to the operator.
    const nearMiss = open.filter(t => {
      const dist = plateDistance(t.plate, plateNorm)
      if (dist < 0 || dist > 1) return false
      const net = t.weight_in - weight
      return net > 0 && net >= minNet && net <= maxNet
    })
    if (nearMiss.length > 0) {
      const t = nearMiss[0]
      return {
        action: 'defer', ticket: null, confidence: 0, rule: 'plate_near_miss',
        reason: `Read plate ${plateNorm}, which is one character from ${t.plate} on ${t.ticket_number} — and that ticket would give a sensible ${(t.weight_in - weight).toFixed(1)} kg load. That is more likely a misread than a new truck, so it needs the operator.`,
        candidates: nearMiss,
      }
    }

    // Belongs to no open ticket and is not a near miss of one: a truck arriving.
    // This holds with any number of trucks already in the yard, which is the
    // entire reason plate matching exists.
    return {
      action: 'new', ticket: null, confidence: 0.95, rule: 'plate_no_match',
      reason: `Plate ${plateNorm} does not match any of the ${open.length} open ticket${open.length === 1 ? '' : 's'}, so this is a different truck arriving.`,
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
        reason: `${open[0].ticket_number} is still open and ${weight.toFixed(1)} kg is heavier than its weigh-in, so this is not that truck leaving. No plate could be read, and with one truck at a time this should not happen — sending it to the operator rather than opening a second ticket. Turn off single-truck mode once the camera reads plates reliably.`,
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
    reason: `${fresh.length} open tickets could each be this truck weighing out, and no plate could be read from the camera to tell them apart. Sending it to the operator.`,
    candidates: fresh,
  }
}

// ─── GET /settings ───
scaleAgentRoutes.get('/settings', async (c) => {
  try {
    return c.json({
      settings: await getSettings(c.env.DB),
      // Whether a plate read is even possible here. The page cannot see the
      // secret, and "plate matching on" with no key would silently never match.
      vision_ready: !!c.env.ANTHROPIC_API_KEY,
    })
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
      plate_matching: body.plate_matching === undefined ? cur.plate_matching : (body.plate_matching ? 1 : 0),
      plate_min_confidence: body.plate_min_confidence === undefined ? cur.plate_min_confidence
        : Math.min(1, Math.max(0, Number(body.plate_min_confidence) || 0)),
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
         vision_enabled = ?, vision_model = ?,
         plate_matching = ?, plate_min_confidence = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    ).bind(
      next.mode, next.wake_threshold_kg, next.vehicle_floor_kg, next.settle_seconds,
      next.cancel_seconds, next.min_net_kg, next.max_net_kg, next.material,
      next.single_truck_mode, next.max_open_age_hours, next.customer_prompt,
      next.vision_enabled, next.vision_model, next.plate_matching, next.plate_min_confidence
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
    // The browser reads the plate (it owns the camera) and reports it here.
    // A low-confidence read is treated as no read at all: falling back to the
    // weight rules is always safe, acting on a guessed plate is not.
    const rawPlate = typeof body?.plate === 'string' ? body.plate : ''
    const plateConf = Number(body?.plate_confidence)

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
              st.customer_id, c.company_name, st.vehicle_plate,
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
      plate: r.vehicle_plate,
    }))

    const minConf = Number(s.plate_min_confidence ?? DEFAULTS.plate_min_confidence)
    const plateUsable = normalizePlate(rawPlate) && (!Number.isFinite(plateConf) || plateConf >= minConf)
    const d = decide(weight, open, s, plateUsable ? rawPlate : '')

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
            open_ticket_count, vision_used, outcome, employee_id, plate, plate_confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        weight, d.action, d.ticket?.id ?? null, d.confidence, d.rule, d.reason,
        open.length, plateUsable ? 1 : 0, outcome, c.get('userId'),
        plateUsable ? normalizePlate(rawPlate) : null,
        Number.isFinite(plateConf) ? plateConf : null
      ).run()
      decisionId = (ins.meta as any)?.last_row_id ?? null
    } catch (e) { /* logging must never block the loop */ }

    return c.json({
      decision_id: decisionId,
      mode: s.mode,
      plate: plateUsable ? normalizePlate(rawPlate) : null,
      plate_confidence: Number.isFinite(plateConf) ? plateConf : null,
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

// ─── POST /vision ───
// Read the licence plate off one camera frame.
//
// Server-side for one reason: ANTHROPIC_API_KEY is a Cloudflare secret, and a
// key shipped to the scale-house browser would be public. The frame itself can
// only come FROM the browser — the camera lives there — so it is posted in.
//
// This endpoint never fails the caller. A missing key, a refusal, a timeout or
// an unreadable frame all answer 200 with ok:false, because the agent's correct
// response to "no plate" is to fall back to the weight rules, not to stall.
const PLATE_TOOL = {
  name: 'report_plate',
  description: 'Report the licence plate of the truck on the weighbridge.',
  strict: true,
  input_schema: {
    type: 'object' as const,
    properties: {
      plate: {
        type: 'string',
        description: 'The plate characters, letters and digits only, no spaces or dashes. Empty string if no plate can be read with confidence.',
      },
      confidence: {
        type: 'number',
        description: '0 to 1. How sure you are that every character is correct. Below 0.6 the reading will be discarded.',
      },
      vehicle: {
        type: 'string',
        description: 'Short description of the vehicle, e.g. "white tandem dump truck". Empty string if unclear.',
      },
    },
    required: ['plate', 'confidence', 'vehicle'],
    additionalProperties: false,
  },
}

const PLATE_PROMPT = [
  'This is a frame from a fixed camera watching a truck scale at a tire recycling yard in Alberta, Canada.',
  'Read the licence plate of the vehicle on the scale.',
  '',
  'Rules:',
  '- Report only characters you can actually see. Never infer or complete a plate from a partial view.',
  '- If the plate is cut off, blurred, obscured, or no vehicle is present, return an empty plate and confidence 0.',
  '- A wrong plate closes another customer\'s ticket and bills them for this load, so a low confidence is far better than a confident guess.',
  '- Alberta plates are usually 7 characters. Do not pad or trim to fit that.',
  '- Ignore any text that is not a licence plate: company signage, unit numbers, DOT numbers, and the camera\'s own timestamp overlay.',
].join('\n')

scaleAgentRoutes.post('/vision', async (c) => {
  const started = Date.now()
  try {
    const s = await getSettings(c.env.DB)
    const body = await c.req.json().catch(() => ({})) as any
    const photo = typeof body?.photo === 'string' ? body.photo : ''

    const key = c.env.ANTHROPIC_API_KEY
    if (!key) {
      return c.json({ ok: false, reason: 'no_api_key', error: 'ANTHROPIC_API_KEY is not set on this Pages project, so plates cannot be read.' })
    }

    const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/.exec(photo)
    if (!m) {
      return c.json({ ok: false, reason: 'bad_photo', error: 'Expected a base64 image data URL.' })
    }
    const mediaType = (m[1] === 'image/jpg' ? 'image/jpeg' : m[1]) as 'image/jpeg' | 'image/png' | 'image/webp'

    const client = new Anthropic({ apiKey: key })
    const res = await client.messages.create({
      model: s.vision_model || DEFAULTS.vision_model,
      max_tokens: 1024,
      // Reading characters off a plate is a simple extraction, and this call
      // sits inside the few seconds between a truck settling and the ticket
      // being written — low effort is the right trade here, not a cost saving.
      output_config: { effort: 'low' },
      tools: [PLATE_TOOL],
      tool_choice: { type: 'tool', name: 'report_plate' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: m[2] } },
          { type: 'text', text: PLATE_PROMPT },
        ],
      }],
    })

    const block = res.content.find(b => b.type === 'tool_use')
    if (!block || block.type !== 'tool_use') {
      return c.json({ ok: false, reason: 'no_tool_use', error: 'The model did not return a plate.' })
    }
    // Never string-match a serialized tool input; it is already parsed here.
    const out = block.input as { plate?: string; confidence?: number; vehicle?: string }
    const plate = normalizePlate(out?.plate)
    const confidence = Number(out?.confidence)

    return c.json({
      ok: !!plate,
      plate: plate || null,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      vehicle: (out?.vehicle || '').slice(0, 120) || null,
      model: res.model,
      ms: Date.now() - started,
      reason: plate ? 'read' : 'unreadable',
    })
  } catch (err: any) {
    // Includes rate limits, timeouts and refusals. The loop treats every one of
    // them as "no plate" and carries on with the weight rules.
    return c.json({
      ok: false,
      reason: 'error',
      error: err?.message || 'Plate read failed',
      ms: Date.now() - started,
    })
  }
})
