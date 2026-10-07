import { Hono } from 'hono'
import Anthropic from '@anthropic-ai/sdk'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { GST_RATE, cents, billableKg } from '../utils/money'

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
  appearance_matching: 1,
  appearance_min_score: 0.6,
  verify_enabled: 1,
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

// ─────────────────────────────────────────────────────────────────────
// Appearance comparison.
//
// The camera cannot reliably read this yard's plates -- wide-angle lens, low
// side mount, ~70px of plate -- but it reads coarse attributes perfectly well.
// Measured across three frames of the same stationary car: body type was
// identical every time, colour moved white/white/silver, and make+model moved
// Altima/Sentra/Sentra. So body is a hard signal, colour is soft and confusable
// within a family, and make+model is not asked for at all -- a descriptor that
// renames the car between frames cannot identify anything.
//
// Appearance is deliberately much weaker than a plate and is given only two
// powers, both of which make the agent MORE cautious, never less:
//   * veto a close that weight alone would have made
//   * break a tie that weight alone has to defer on
// It can never conclude "new truck arriving" -- see decide().

export const BODY_TYPES = [
  'sedan', 'suv', 'pickup', 'van', 'box_truck', 'flatbed',
  'dump_truck', 'semi_tractor', 'trailer', 'other',
] as const

export const COLORS = [
  'white', 'silver', 'gray', 'black', 'red', 'blue',
  'green', 'yellow', 'orange', 'brown', 'other',
] as const

// Colours a camera genuinely confuses on the same vehicle, as opposed to
// colours that merely sound similar. Exposure and low sun move a car around
// inside the neutral family all day; they do not turn it red. Keeping these
// groups tight is the safe direction: an unlisted pair counts as a conflict,
// and a conflict only ever sends the decision to the operator.
const COLOR_FAMILIES: string[][] = [
  ['white', 'silver', 'gray'],
  ['gray', 'black'],
]

// Body types that can be mistaken for one another from behind at this angle.
// These do not score points, they merely avoid being treated as a conflict --
// a sedan and a dump truck are never confused, so that pair still vetoes.
const BODY_NEAR: string[][] = [
  ['suv', 'van'],
  ['suv', 'pickup'],
  ['pickup', 'flatbed'],
  ['van', 'box_truck'],
  ['flatbed', 'semi_tractor'],
  ['flatbed', 'dump_truck'],
  ['semi_tractor', 'trailer'],
]

function inSameGroup(groups: string[][], a: string, b: string): boolean {
  return groups.some(g => g.includes(a) && g.includes(b))
}

export interface Appearance {
  body: string
  color: string
  markings: string
  // The manufacturer, for the receipt and the ticket -- something an operator
  // or a customer can recognise. It is deliberately NOT part of matching:
  // measured across three frames of the same stationary car the model came
  // back Altima, Sentra, Sentra, so deciding anything on it would mis-identify
  // trucks. appearanceMatch() ignores this field entirely.
  make: string
  confidence: number
}

// Words that appear on half the trucks that come through a tire recycling yard
// and therefore identify nobody. Without this list "KAL TIRE" and "FOUNTAIN
// TIRE" share a token and match each other -- which is the single worst false
// positive available here, since both are real customers.
const GENERIC_MARKINGS = new Set([
  'TIRE', 'TIRES', 'TYRE', 'TYRES', 'RECYCLING', 'RECYCLE', 'SCRAP', 'RUBBER',
  'TRANSPORT', 'TRANSPORTATION', 'TRUCKING', 'HAULING', 'CARTAGE', 'LOGISTICS',
  'DISPOSAL', 'SERVICE', 'SERVICES', 'LTD', 'INC', 'LLC', 'CORP', 'CO',
  'THE', 'AND', 'CANADA', 'ALBERTA', 'LIMITED', 'ENTERPRISES', 'GROUP',
])

// Company lettering and unit numbers are by far the strongest attribute when
// they exist -- they are an order of magnitude larger than plate characters and
// painted for legibility. Tokens under 3 characters are dropped: "A", "OF" and
// stray OCR fragments match far too many things.
function markingTokens(raw: unknown): string[] {
  const s = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ')
  return s.split(' ').filter(t => t.length >= 3 && !GENERIC_MARKINGS.has(t))
}

export function normalizeAppearance(raw: any): Appearance | null {
  if (!raw || typeof raw !== 'object') return null
  const body = String(raw.body ?? '').toLowerCase().trim()
  const color = String(raw.color ?? '').toLowerCase().trim()
  const markings = String(raw.markings ?? '').trim().slice(0, 80)
  const make = String(raw.make ?? '').trim().slice(0, 30)
  const confidence = Number(raw.confidence)
  const okBody = (BODY_TYPES as readonly string[]).includes(body) && body !== 'other' ? body : ''
  const okColor = (COLORS as readonly string[]).includes(color) && color !== 'other' ? color : ''
  // Nothing identifying at all is the same as no reading. 'other' is explicitly
  // not identifying -- it is the model saying it could not tell. The make is
  // not counted here: it is descriptive, not identifying, so a frame that
  // yielded only a brand name is still "nothing read".
  if (!okBody && !okColor && !markings) return null
  return {
    body: okBody,
    color: okColor,
    markings,
    make,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
  }
}

export function parseAppearance(stored: unknown): Appearance | null {
  if (!stored) return null
  if (typeof stored === 'object') return normalizeAppearance(stored)
  try { return normalizeAppearance(JSON.parse(String(stored))) } catch { return null }
}

// One short human-readable line for the agent log, the banner and the ticket
// detail. Built from the enumerated fields rather than asking the model for a
// sentence, so what the operator reads is exactly what the matcher compared.
export function describeAppearance(a: Appearance | null): string {
  if (!a) return ''
  const parts = [a.color, a.make, a.body.replace('_', ' ')].filter(Boolean)
  const base = parts.join(' ') || 'vehicle'
  return a.markings ? `${base} — "${a.markings}"` : base
}

export interface AppearanceMatch {
  score: number
  conflict: boolean
  why: string
}

// Compare the vehicle on the scale now against the one recorded on a ticket.
//
// score 0..1, and `conflict` meaning "these are positively different vehicles"
// rather than merely "not enough evidence". The distinction matters: unknown
// must never veto anything, because most tickets predate this column.
export function appearanceMatch(a: Appearance | null, b: Appearance | null): AppearanceMatch {
  if (!a || !b) return { score: 0, conflict: false, why: 'no appearance recorded' }

  // Weights are set so that an exact body AND colour match (0.75) still clears
  // the 0.6 default after the confidence discount below, while body plus a
  // merely same-family colour (0.58) does not. A white car reading silver is
  // the measured failure mode, so on its own it must not be enough to pick one
  // ticket over another -- only enough to avoid being called a conflict.
  let score = 0
  const notes: string[] = []

  if (a.body && b.body) {
    if (a.body === b.body) {
      score += 0.40
      notes.push(`both ${a.body.replace('_', ' ')}`)
    } else if (inSameGroup(BODY_NEAR, a.body, b.body)) {
      notes.push(`${a.body.replace('_', ' ')} vs ${b.body.replace('_', ' ')}, similar shapes`)
    } else {
      return {
        score: 0, conflict: true,
        why: `a ${a.body.replace('_', ' ')} weighed in and this is a ${b.body.replace('_', ' ')}`,
      }
    }
  }

  if (a.color && b.color) {
    if (a.color === b.color) {
      score += 0.35
      notes.push(`both ${a.color}`)
    } else if (inSameGroup(COLOR_FAMILIES, a.color, b.color)) {
      // The measured failure mode: the same white car reads silver when the sun
      // moves. Worth something, but not worth as much as an exact match.
      score += 0.18
      notes.push(`${a.color} vs ${b.color}, same colour family`)
    } else {
      return { score: 0, conflict: true, why: `a ${a.color} vehicle weighed in and this one is ${b.color}` }
    }
  }

  const ta = markingTokens(a.markings)
  const tb = markingTokens(b.markings)
  if (ta.length && tb.length) {
    const shared = ta.filter(t => tb.includes(t))
    if (shared.length) {
      score += 0.45
      notes.push(`lettering "${shared.join(' ')}" on both`)
    } else {
      return { score: 0, conflict: true, why: `lettering reads "${a.markings}" on the ticket and "${b.markings}" now` }
    }
  }

  // A confident description of a vague vehicle is still vague. Scale by the
  // weaker of the two readings so a guess cannot out-vote a clear look.
  const conf = Math.min(a.confidence || 0, b.confidence || 0)
  return { score: Math.min(1, score) * (conf > 0 ? conf : 1), conflict: false, why: notes.join(', ') || 'nothing distinguishing' }
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
  appearance: Appearance | null
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
export function decide(weight: number, open: OpenTicket[], s: any, plate?: unknown, appearance?: unknown): Decision {
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

  // What the camera can see about the vehicle even when it cannot read the
  // plate. Weaker evidence than a plate, so it is only ever used to stop a
  // close or to break a tie -- never to declare an arrival. See the block
  // comment above appearanceMatch().
  const useAppearance = Number(s.appearance_matching ?? DEFAULTS.appearance_matching) ? true : false
  const minScore = Number(s.appearance_min_score ?? DEFAULTS.appearance_min_score)
  const nowLook = useAppearance ? normalizeAppearance(appearance) : null

  // A positive contradiction between the truck on the deck and the truck
  // recorded on a ticket. Unknown is never a contradiction -- most tickets
  // predate this -- so this can only ever fire on real evidence.
  const looksWrong = (t: OpenTicket): AppearanceMatch | null => {
    if (!nowLook) return null
    const m = appearanceMatch(t.appearance, nowLook)
    return m.conflict ? m : null
  }

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
      // "Heavier" means MEANINGFULLY heavier. A truck that comes back at the
      // weight it arrived at -- give or take the driver climbing out or a
      // tank of fuel -- dropped nothing, and that is a finished visit with a
      // zero load, not an impossibility. The same minimum that defines a real
      // load defines the tolerance here; it used to be a strict > 0, which
      // sent every empty return to the operator.
      if (net < -minNet) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'plate_match_not_lighter',
          reason: `Plate ${plateNorm} is ${t.ticket_number}, open at ${t.weight_in.toFixed(1)} kg, but this reading is ${weight.toFixed(1)} kg — the same truck cannot leave heavier than it arrived. Sending it to the operator.`,
          candidates: matches,
        }
      }
      if (net > maxNet) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'plate_match_implausible_net',
          reason: `Plate ${plateNorm} is ${t.ticket_number}, but that gives a ${net.toFixed(1)} kg load, over the ${maxNet} kg maximum. Sending it to the operator.`,
          candidates: matches,
        }
      }

      // A plate is strong evidence, but if the camera also says this is a
      // different SHAPE of vehicle than the one that weighed in, the two
      // readings contradict each other and the operator should see that.
      const clash = looksWrong(t)
      if (clash) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'plate_match_appearance_conflict',
          reason: `Plate ${plateNorm} matches ${t.ticket_number}, but ${clash.why}. The plate and the camera disagree about what is on the scale, so this needs the operator.`,
          candidates: matches,
        }
      }

      if (net < minNet) {
        return {
          action: 'close', ticket: t, confidence: 0.95, rule: 'plate_match_zero_net',
          reason: `Plate ${plateNorm} is ${t.ticket_number}, open at ${t.weight_in.toFixed(1)} kg, and it is leaving at ${weight.toFixed(1)} kg — the weight it arrived at, so nothing was dropped. Closing it with a 0 kg load.`,
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
    // One character out on a plate is what this camera does on a good day, so a
    // near miss goes to the operator. It used to also require the net to be
    // plausible before it would defer, which was backwards: if the plate nearly
    // matches, that is evidence about WHICH truck this is, and a strange weight
    // is a reason for more caution, not less. Without that fix a misread plate
    // on a truck with an odd net fell through and opened a duplicate.
    const nearMiss = open.filter(t => {
      const dist = plateDistance(t.plate, plateNorm)
      if (dist < 0 || dist > 1) return false
      // The one thing that still rules a near miss out is physics: a vehicle
      // meaningfully HEAVIER than that ticket's weigh-in cannot be that truck
      // leaving, so a similar plate there really is a different vehicle.
      // "Meaningfully" matters -- a few kg over is the driver getting out or a
      // tank of fuel, not a different truck -- so the same minimum that defines
      // a real load defines the tolerance here.
      return (t.weight_in - weight) >= -minNet
    })
    if (nearMiss.length > 0) {
      const t = nearMiss[0]
      const net = t.weight_in - weight
      return {
        action: 'defer', ticket: null, confidence: 0, rule: 'plate_near_miss',
        reason: `Read plate ${plateNorm}, which is one character from ${t.plate} on ${t.ticket_number}`
          + (net > 0 && net >= minNet && net <= maxNet
              ? ` — and that ticket would give a sensible ${net.toFixed(1)} kg load.`
              : `, though the weight does not line up with that ticket.`)
          + ` That is more likely a misread than a new truck, so it needs the operator.`,
        candidates: nearMiss,
      }
    }

    // A plate can only rule OUT a ticket that has a plate to compare against.
    //
    // This is what used to open a duplicate on every second pass: the camera
    // often cannot read a plate at weigh-in, so the ticket is stored with none;
    // on the way out it reads one, finds it "matches nothing", and concluded a
    // different truck had arrived. Comparing a plate against NULL is not a
    // mismatch, it is an absence of evidence -- and absence of evidence must
    // never become evidence of a different truck, because the result is a
    // duplicate ticket that strands the real one and counts the load twice.
    //
    // So this only declares an arrival when every open ticket actually carries
    // a plate and none of them matched. Otherwise the plate has told us nothing
    // useful and we fall through to the weight and appearance rules below,
    // which know how to handle "I am not sure".
    const platelessOpen = open.filter(t => !normalizePlate(t.plate))
    if (platelessOpen.length === 0) {
      return {
        action: 'new', ticket: null, confidence: 0.95, rule: 'plate_no_match',
        reason: `Plate ${plateNorm} does not match any of the ${open.length} open ticket${open.length === 1 ? '' : 's'}, all of which have a plate on file, so this is a different truck arriving.`,
        candidates: none,
      }
    }
    // Fall through: at least one open ticket has no plate recorded, so this
    // read cannot rule it out.
  }

  // ── Nothing dropped ────────────────────────────────────────────────
  // With one truck on site and one ticket open, a reading at that ticket's
  // weigh-in weight is that truck leaving empty -- turned away, picked up
  // nothing, or a yard test. This used to fall through to the "possible"
  // filter below, which demands a strictly positive net, and from there to
  // single_truck_unexpected_arrival: every empty return was reported as
  // "heavier than its weigh-in" and parked on the manual card. A zero load is
  // a legitimate outcome of a visit (merge-out already records it and
  // detectAnomalies flags it), so it closes like any other weigh-out, with the
  // same two guards: the ticket must be fresh, and the camera must not say
  // this is a different vehicle. Tolerance is the minimum real load, both
  // ways -- a few kg over is the driver back in the cab, not a second truck.
  if (singleTruck && open.length === 1 && Number.isFinite(open[0].weight_in)) {
    const t = open[0]
    const net = t.weight_in - weight
    if (net >= -minNet && net < minNet) {
      if (Number.isFinite(t.age_hours) && t.age_hours > maxAge) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'stale_open_ticket',
          reason: `${t.ticket_number} has been open ${t.age_hours.toFixed(1)} h, past the ${maxAge} h limit. It is probably an abandoned ticket rather than this truck, so it will not be closed automatically.`,
          candidates: open,
        }
      }
      const clash = looksWrong(t)
      if (clash) {
        return {
          action: 'defer', ticket: null, confidence: 0, rule: 'appearance_conflict',
          reason: `${weight.toFixed(1)} kg is ${t.ticket_number}'s weigh-in weight, but ${clash.why}. That is not the same vehicle, so it needs the operator.`,
          candidates: open,
        }
      }
      return {
        action: 'close', ticket: t, confidence: 0.85, rule: 'single_truck_zero_net',
        reason: `${t.ticket_number} is the only open ticket and ${weight.toFixed(1)} kg is the weight it arrived at (${t.weight_in.toFixed(1)} kg in), so nothing was dropped. Closing it with a 0 kg load rather than treating the same truck as a new arrival.`,
        candidates: open,
      }
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

    // The weight-only path is where the agent is most exposed: with one ticket
    // open, ANY plausible lighter reading closes it. That is how a pallet left
    // on the deck could close a truck's ticket -- the hole flagged when
    // single_truck_mode shipped. The camera can see that what is on the scale
    // is not the vehicle that weighed in, which weight by itself never could.
    const clash = looksWrong(t)
    if (clash) {
      return {
        action: 'defer', ticket: null, confidence: 0, rule: 'appearance_conflict',
        reason: `${weight.toFixed(1)} kg would close ${t.ticket_number}, but ${clash.why}. That is not the same vehicle leaving, so it needs the operator.`,
        candidates: fresh,
      }
    }

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

  // Several trucks could each be the one leaving and no plate settled it. This
  // is the case appearance was added for: a white sedan and a red dump truck
  // are trivially distinguishable even when their weights are not.
  if (nowLook) {
    const scored = fresh
      .map(t => ({ t, m: appearanceMatch(t.appearance, nowLook) }))
      .filter(x => !x.m.conflict)
      .sort((a, b) => b.m.score - a.m.score)

    // A win must be clear on both counts: good enough on its own, and clearly
    // better than the runner-up. Two white sedans score the same and must stay
    // ambiguous -- picking one of them is how the wrong customer gets billed.
    const best = scored[0]
    const runnerUp = scored[1]
    if (best && best.m.score >= minScore && (!runnerUp || best.m.score - runnerUp.m.score >= 0.2)) {
      const net = best.t.weight_in - weight
      return {
        action: 'close', ticket: best.t,
        // Below a plate match (0.97) on purpose. Appearance narrows the field;
        // it does not name the truck.
        confidence: 0.80, rule: 'appearance_match',
        reason: `${fresh.length} tickets could be this truck by weight, and the camera matches ${best.t.ticket_number} (${best.m.why}). Weighing out at ${weight.toFixed(1)} kg gives a ${net.toFixed(1)} kg load.`,
        candidates: fresh,
      }
    }
  }

  return {
    action: 'defer', ticket: null, confidence: 0, rule: 'ambiguous_multiple_candidates',
    reason: `${fresh.length} open tickets could each be this truck weighing out, and neither a plate nor the vehicle's appearance could tell them apart. Sending it to the operator.`,
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

    // A material that is not an active price would make every agent ticket
    // fail at print-trigger, which validates against the same table.
    if (typeof body.material === 'string' && body.material.trim()) {
      const known = await c.env.DB.prepare(
        'SELECT material_type FROM pricing WHERE material_type = ? AND is_active = 1'
      ).bind(body.material.trim()).first()
      if (!known) return c.json({ error: `Unknown or inactive material: ${body.material}` }, 400)
      cur.material = body.material.trim()
    }

    const next = {
      mode,
      wake_threshold_kg: num(body.wake_threshold_kg, cur.wake_threshold_kg, 1, 5000),
      vehicle_floor_kg: num(body.vehicle_floor_kg, cur.vehicle_floor_kg, 1, 50000),
      settle_seconds: Math.round(num(body.settle_seconds, cur.settle_seconds, 1, 60)),
      cancel_seconds: Math.round(num(body.cancel_seconds, cur.cancel_seconds, 0, 60)),
      min_net_kg: num(body.min_net_kg, cur.min_net_kg, 0, 10000),
      max_net_kg: num(body.max_net_kg, cur.max_net_kg, 100, 200000),
      material: cur.material,
      single_truck_mode: body.single_truck_mode === undefined ? cur.single_truck_mode : (body.single_truck_mode ? 1 : 0),
      max_open_age_hours: num(body.max_open_age_hours, cur.max_open_age_hours, 0.25, 720),
      customer_prompt: ['on_close', 'off'].includes(body.customer_prompt) ? body.customer_prompt : cur.customer_prompt,
      vision_enabled: body.vision_enabled === undefined ? cur.vision_enabled : (body.vision_enabled ? 1 : 0),
      plate_matching: body.plate_matching === undefined ? cur.plate_matching : (body.plate_matching ? 1 : 0),
      plate_min_confidence: body.plate_min_confidence === undefined ? cur.plate_min_confidence
        : Math.min(1, Math.max(0, Number(body.plate_min_confidence) || 0)),
      appearance_matching: body.appearance_matching === undefined ? cur.appearance_matching : (body.appearance_matching ? 1 : 0),
      appearance_min_score: body.appearance_min_score === undefined ? cur.appearance_min_score
        : Math.min(1, Math.max(0, Number(body.appearance_min_score) || 0)),
      verify_enabled: body.verify_enabled === undefined ? cur.verify_enabled : (body.verify_enabled ? 1 : 0),
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
         plate_matching = ?, plate_min_confidence = ?,
         appearance_matching = ?, appearance_min_score = ?, verify_enabled = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    ).bind(
      next.mode, next.wake_threshold_kg, next.vehicle_floor_kg, next.settle_seconds,
      next.cancel_seconds, next.min_net_kg, next.max_net_kg, next.material,
      next.single_truck_mode, next.max_open_age_hours, next.customer_prompt,
      next.vision_enabled, next.vision_model, next.plate_matching, next.plate_min_confidence,
      next.appearance_matching, next.appearance_min_score, next.verify_enabled
    ).run()

    return c.json({ success: true, settings: await getSettings(c.env.DB) })
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to save settings' }, 500)
  }
})

// ─── PUT /material ───
// The material the yard is taking right now. Every new ticket -- opened by the
// agent or by the manual capture button -- is written with it, so switching
// from tires to scrap metal for an afternoon is one tap rather than a re-assign
// on every ticket. Open to yard operators (unlike the rest of the settings)
// because they are the ones standing at the scale when the load type changes.
// apply_to_open also moves trucks already weighed in; they are not priced
// until they weigh out, so nothing has to be re-priced.
scaleAgentRoutes.put('/material', roleRequired('admin', 'manager', 'yard_operator'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as any
    const material = typeof body.material === 'string' ? body.material.trim() : ''
    if (!material) return c.json({ error: 'material is required' }, 400)
    const known = await c.env.DB.prepare(
      'SELECT material_type FROM pricing WHERE material_type = ? AND is_active = 1'
    ).bind(material).first()
    if (!known) return c.json({ error: `Unknown or inactive material: ${material}` }, 400)

    const cur = await getSettings(c.env.DB)
    await c.env.DB.prepare('UPDATE scale_agent_settings SET material = ? WHERE id = 1').bind(material).run()

    let updatedOpen = 0
    if (body.apply_to_open) {
      const open = await c.env.DB.prepare(
        `SELECT id, tire_type FROM scale_tickets
          WHERE status = 'weighed_in' AND weight_out IS NULL AND COALESCE(tire_type, 'mixed') != ?`
      ).bind(material).all<any>()
      for (const t of open.results || []) {
        await c.env.DB.prepare(
          "UPDATE scale_tickets SET tire_type = ?, updated_at = datetime('now') WHERE id = ? AND status = 'weighed_in'"
        ).bind(material, t.id).run()
        try {
          await c.env.DB.prepare(
            'INSERT INTO scale_audit_log (scale_ticket_id, action, employee_id, details) VALUES (?, ?, ?, ?)'
          ).bind(t.id, 'assigned', c.get('userId'), JSON.stringify({
            tire_type: material, prev_tire_type: t.tire_type, reason: 'yard material changed',
          })).run()
        } catch (e) { /* non-critical */ }
        updatedOpen++
      }
    }

    return c.json({ success: true, settings: await getSettings(c.env.DB), prev_material: cur.material, updated_open: updatedOpen })
  } catch (err: any) {
    console.error('scale agent material error:', err)
    return c.json({ error: 'Failed to change the yard material' }, 500)
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
    const nowLook = normalizeAppearance(body?.appearance)

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
              st.customer_id, c.company_name, st.vehicle_plate, st.appearance_in,
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
      appearance: parseAppearance(r.appearance_in),
    }))

    // The browser may ask before its camera read is back. With nothing open
    // the answer cannot depend on the camera -- it is an arrival -- so it is
    // given now and the read is attached to the ticket afterwards (see
    // POST /api/scale-tickets/:id/vehicle). With anything open it can, so the
    // browser is told to come back with the read, and nothing is recorded for
    // this round.
    if (body?.vision_pending && open.length > 0) {
      return c.json({
        mode: s.mode, action: 'wait', rule: 'needs_camera',
        reason: `${open.length} ticket${open.length === 1 ? ' is' : 's are'} open, so the camera read is needed before deciding.`,
        open_ticket_count: open.length, settings: s,
      })
    }

    const minConf = Number(s.plate_min_confidence ?? DEFAULTS.plate_min_confidence)
    const plateUsable = normalizePlate(rawPlate) && (!Number.isFinite(plateConf) || plateConf >= minConf)
    const d = decide(weight, open, s, plateUsable ? rawPlate : '', nowLook)

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
      const subtotal = cents(billableKg(net) * ppk)
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
            open_ticket_count, vision_used, outcome, employee_id, plate, plate_confidence,
            appearance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        weight, d.action, d.ticket?.id ?? null, d.confidence, d.rule, d.reason,
        open.length, (plateUsable || nowLook) ? 1 : 0, outcome, c.get('userId'),
        plateUsable ? normalizePlate(rawPlate) : null,
        Number.isFinite(plateConf) ? plateConf : null,
        nowLook ? JSON.stringify(nowLook) : null
      ).run()
      decisionId = (ins.meta as any)?.last_row_id ?? null
    } catch (e) { /* logging must never block the loop */ }

    return c.json({
      decision_id: decisionId,
      mode: s.mode,
      plate: plateUsable ? normalizePlate(rawPlate) : null,
      plate_confidence: Number.isFinite(plateConf) ? plateConf : null,
      appearance: nowLook,
      appearance_text: describeAppearance(nowLook),
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
  name: 'report_vehicle',
  description: 'Report the licence plate and the identifying appearance of the vehicle on the weighbridge.',
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
        description: '0 to 1. How sure you are that every character of the plate is correct. Below 0.6 the reading will be discarded.',
      },
      body: {
        type: 'string',
        enum: [...BODY_TYPES],
        description: 'The body style of the vehicle. Use "other" if it is not clearly one of these or no vehicle is present.',
      },
      color: {
        type: 'string',
        enum: [...COLORS],
        description: 'The dominant body colour. Use "other" if it cannot be told, for example at night or against glare.',
      },
      markings: {
        type: 'string',
        description: 'Company name, lettering, or unit/fleet number painted on the vehicle, exactly as written. Empty string if the vehicle carries none or none can be read.',
      },
      make: {
        type: 'string',
        description: 'The manufacturer only, e.g. "Nissan", "Freightliner", "Ford". Not the model. Empty string if you cannot tell from the badge or grille.',
      },
      appearance_confidence: {
        type: 'number',
        description: '0 to 1. How sure you are of the body, colour and markings. This is separate from the plate confidence and is usually higher.',
      },
    },
    required: ['plate', 'confidence', 'body', 'color', 'markings', 'make', 'appearance_confidence'],
    additionalProperties: false,
  },
}

// Two jobs in one call, because the frame is already uploaded and a second
// round trip would cost another second with a truck sitting on the scale.
//
// The appearance half exists because this yard's camera is wide-angle, mounted
// low and to the side, so a plate lands on roughly 70x35 pixels and comes back
// one character short. Coarse attributes survive that easily. Make and model
// are deliberately NOT asked for: measured across three frames of the same
// stationary car they came back Altima, Sentra, Sentra, and an attribute that
// changes between frames cannot identify anything.
const PLATE_PROMPT = [
  'This is a frame from a fixed camera watching a truck scale at a tire recycling yard in Alberta, Canada.',
  'Report the licence plate and the identifying appearance of the vehicle on the scale.',
  '',
  'Plate:',
  '- Report only characters you can actually see. Never infer or complete a plate from a partial view.',
  '- If the plate is cut off, blurred, obscured, or no vehicle is present, return an empty plate and confidence 0.',
  '- A wrong plate closes another customer\'s ticket and bills them for this load, so a low confidence is far better than a confident guess.',
  '- Alberta plates are usually 7 characters. Do not pad or trim to fit that.',
  '- Ignore any text that is not a licence plate: company signage, unit numbers, DOT numbers, and the camera\'s own timestamp overlay.',
  '',
  'Appearance:',
  '- These attributes identify the truck when the plate cannot be read, so judge them on what is actually visible rather than what is likely.',
  '- body: pick the closest listed body style. A tractor unit with no trailer is semi_tractor.',
  '- color: the dominant body colour only. Ignore the colour of the load, the trailer tarp, and anything in the background.',
  '- markings: company lettering or a unit/fleet number painted on the vehicle. This is the single most useful field when it exists, so read it carefully and copy it exactly. Return an empty string rather than guessing at blurred text.',
  '- markings must NOT include the manufacturer\'s own badging -- the make, the model name, or a brand logo. Every vehicle of that model carries the same badge, so it identifies a model rather than a truck, and treating it as identifying would match two different vehicles to each other.',
  '- make: the manufacturer only, read off the badge or grille -- "Nissan", "Freightliner", "Ford". NEVER the model name. This one is printed on the customer\'s receipt so a person can recognise the vehicle; it is not used to decide which ticket this is, because model guesses are not stable between frames. Return an empty string rather than guessing.',
  '- If no vehicle is on the scale, return body "other", color "other", empty markings and appearance_confidence 0.',
].join('\n')

const VISION_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001']

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

    // An explicit model is accepted only from a short allow-list. It exists so
    // the live read can be timed and compared across models on real frames
    // without changing the station's setting under a working agent.
    const override = typeof body?.model === 'string' && VISION_MODELS.includes(body.model) ? body.model : null

    const client = new Anthropic({ apiKey: key })
    const res = await client.messages.create({
      model: override || s.vision_model || DEFAULTS.vision_model,
      max_tokens: 1024,
      // Reading characters off a plate is a simple extraction, and this call
      // sits inside the few seconds between a truck settling and the ticket
      // being written — low effort is the right trade here, not a cost saving.
      output_config: { effort: 'low' },
      tools: [PLATE_TOOL],
      tool_choice: { type: 'tool', name: 'report_vehicle' },
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
      return c.json({ ok: false, reason: 'no_tool_use', error: 'The model did not describe the vehicle.' })
    }
    // Never string-match a serialized tool input; it is already parsed here.
    const out = block.input as {
      plate?: string; confidence?: number
      body?: string; color?: string; markings?: string; appearance_confidence?: number
    }
    const plate = normalizePlate(out?.plate)
    const confidence = Number(out?.confidence)
    const look = normalizeAppearance({
      body: out?.body, color: out?.color, markings: out?.markings, make: out?.make,
      confidence: out?.appearance_confidence,
    })

    // ok means "something usable came back". A frame with no readable plate but
    // a clear white sedan is a useful answer, not a failure -- that is the whole
    // point of adding appearance.
    return c.json({
      ok: !!plate || !!look,
      plate: plate || null,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      appearance: look,
      vehicle: look ? describeAppearance(look) : null,
      model: res.model,
      ms: Date.now() - started,
      reason: plate ? 'read' : (look ? 'appearance_only' : 'unreadable'),
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

// ══════════════════════════════════════════════════════════════════════
// SECOND PASS — the verifier
// ══════════════════════════════════════════════════════════════════════
// The live agent is structurally half-blind: when it decides, only ONE of the
// ticket's two photos exists. At weigh-in there is no weigh-out frame to
// compare against, and at weigh-out it is comparing a frame against a plate
// string and a handful of attributes, not against the actual arrival photo.
//
// Once a ticket is closed both frames exist, and they can be put side by side.
// That answers the question that actually decides whether the right customer
// was billed -- "is the truck leaving the same truck that arrived?" -- which no
// single frame ever can.
//
// Being off the critical path changes what is affordable here. Nothing is
// waiting on it, so it reads both images properly instead of at low effort, and
// it is allowed to be slow. It never changes money: its only outputs are a
// verdict, a note, and -- when two independent frames agree on a plate the live
// read missed -- the plate itself, which makes the NEXT visit matchable.

const VERIFY_TOOL = {
  name: 'report_comparison',
  description: 'Compare the weigh-in and weigh-out photos of one scale ticket.',
  strict: true,
  input_schema: {
    type: 'object' as const,
    properties: {
      same_vehicle: {
        type: 'string',
        enum: ['yes', 'no', 'unsure'],
        description: 'Is the vehicle in the second photo the same individual vehicle as in the first? Answer "unsure" whenever the view, lighting or framing does not let you tell -- that is a normal and useful answer.',
      },
      plate_in: { type: 'string', description: 'Plate read from the FIRST photo, letters and digits only. Empty string if unreadable.' },
      plate_out: { type: 'string', description: 'Plate read from the SECOND photo, letters and digits only. Empty string if unreadable.' },
      plate_confidence: { type: 'number', description: '0 to 1. Confidence that both plate readings above are character-for-character correct.' },
      body: { type: 'string', enum: [...BODY_TYPES], description: 'Body style of the vehicle, judged across both photos.' },
      color: { type: 'string', enum: [...COLORS], description: 'Dominant body colour, judged across both photos.' },
      markings: { type: 'string', description: 'Company lettering or unit number visible on the vehicle in either photo, copied exactly. Empty string if none.' },
      make: { type: 'string', description: 'The manufacturer only, e.g. "Nissan", "Freightliner". Not the model. Empty string if you cannot tell.' },
      load_change: {
        type: 'string',
        enum: ['unloaded_between', 'loaded_between', 'no_visible_change', 'cannot_tell'],
        description: 'What happened to the vehicle\'s load between the two photos. "unloaded_between" means it arrived carrying something and left empty or emptier.',
      },
      note: { type: 'string', description: 'One sentence an operator can act on, naming what you actually saw. Empty string if everything is consistent.' },
    },
    required: ['same_vehicle', 'plate_in', 'plate_out', 'plate_confidence', 'body', 'color', 'markings', 'make', 'load_change', 'note'],
    additionalProperties: false,
  },
}

interface VerifyOutcome { status: 'ok' | 'mismatch' | 'unverifiable'; note: string }

// The verdict is decided here, not by the model. The model reports what it saw;
// which observations are serious enough to flag a ticket for a human is a
// policy question about billing, and policy belongs in code where it can be
// read and tested.
export function verifyVerdict(
  out: { same_vehicle?: string; plate_in?: string; plate_out?: string; plate_confidence?: number; load_change?: string; note?: string },
  ticket: { weight_in: number; weight_out: number; plate: string | null }
): VerifyOutcome {
  const note = String(out?.note ?? '').trim().slice(0, 300)
  const net = ticket.weight_in - ticket.weight_out
  const flags: string[] = []

  if (out?.same_vehicle === 'no') {
    flags.push('the vehicle that weighed out is not the one that weighed in')
  }

  // Two plate reads from two different frames disagreeing by more than the one
  // character every plate font loses is a far stronger signal than either read
  // on its own -- which is exactly why it is worth doing this pass at all.
  const pin = normalizePlate(out?.plate_in)
  const pout = normalizePlate(out?.plate_out)
  const pconf = Number(out?.plate_confidence)
  if (pin && pout && Number.isFinite(pconf) && pconf >= 0.6) {
    const dist = plateDistance(pin, pout)
    if (dist > 1) flags.push(`the plate reads ${pin} going in and ${pout} coming out`)
  }

  // A tire load leaves the yard, so the truck must end up lighter and visibly
  // emptier. "Loaded between" with a positive net means the photos and the
  // scale are telling different stories.
  if (net > 0 && out?.load_change === 'loaded_between') {
    flags.push(`the scale says ${net.toFixed(0)} kg came off, but the truck looks more loaded leaving than arriving`)
  }

  if (flags.length) {
    return { status: 'mismatch', note: (flags.join('; ') + (note ? `. ${note}` : '')).slice(0, 400) }
  }
  if (out?.same_vehicle === 'unsure') {
    return { status: 'unverifiable', note: note || 'Could not tell from these two frames whether it is the same vehicle.' }
  }
  return { status: 'ok', note: note || 'Weigh-in and weigh-out photos show the same vehicle.' }
}

const VERIFY_PROMPT = [
  'These are the two photos from one scale ticket at a tire recycling yard: the FIRST was taken as the truck weighed in, the SECOND as it weighed out. Both come from the same fixed wide-angle camera, so the framing is similar but the vehicle may sit differently on the deck.',
  '',
  'Decide whether they show the same individual vehicle, and report what you can read from them.',
  '',
  '- "unsure" is a genuinely useful answer and is far better than a guess. A ticket marked unverifiable costs nothing; a wrong "yes" means a mis-billed customer is never caught, and a wrong "no" sends an operator chasing a problem that does not exist.',
  '- Judge identity on things that do not change between the two frames: body style, colour, wheels, trim, damage, roof fittings, company lettering. Do not judge it on the load, the time of day, or how far up the deck the truck is parked.',
  '- Read the plate separately in each photo and report each one as you actually read it, even if they differ. Do NOT reconcile them, and do not copy one across to the other -- a disagreement between the two is exactly what this check is looking for.',
  '- markings means company lettering or a unit/fleet number painted on the vehicle. It must NOT include the manufacturer\'s badging -- the make, the model name, or a brand logo -- because every vehicle of that model carries the same badge and it would match two different trucks to each other.',
  '- The burned-in timestamp and weight along the top and bottom edges are added by this system. Ignore them.',
  '- Keep the note to one sentence, and leave it empty when nothing is worth an operator\'s time.',
].join('\n')

async function verifyOne(env: Bindings, ticketId: number): Promise<any> {
  const t = await env.DB.prepare(
    `SELECT id, ticket_number, weight_in, weight_out, vehicle_plate, photo_in, photo_out
       FROM scale_tickets WHERE id = ?`
  ).bind(ticketId).first<any>()

  if (!t) return { ticket_id: ticketId, status: 'error', note: 'Ticket not found.' }

  const parse = (p: unknown) => {
    const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/.exec(String(p ?? ''))
    if (!m) return null
    return { mediaType: (m[1] === 'image/jpg' ? 'image/jpeg' : m[1]) as 'image/jpeg' | 'image/png' | 'image/webp', data: m[2] }
  }
  const imgIn = parse(t.photo_in)
  const imgOut = parse(t.photo_out)
  if (!imgIn || !imgOut) {
    // Not an error: tickets written before the camera existed simply cannot be
    // verified. Recording that stops the sweep retrying them every cycle.
    const note = 'Only one of the two photos exists, so the vehicle cannot be compared.'
    await env.DB.prepare(
      `UPDATE scale_tickets SET verify_status = 'unverifiable', verify_note = ?, verify_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(note, ticketId).run()
    return { ticket_id: ticketId, ticket_number: t.ticket_number, status: 'unverifiable', note }
  }

  const s = await getSettings(env.DB)
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! })
  const res = await client.messages.create({
    model: s.vision_model || DEFAULTS.vision_model,
    max_tokens: 2048,
    // Deliberately NOT effort 'low'. The live plate read is low effort because
    // a truck is idling on the scale waiting for it; nothing waits on this.
    tools: [VERIFY_TOOL],
    tool_choice: { type: 'tool', name: 'report_comparison' },
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'FIRST photo — weighing in:' },
        { type: 'image', source: { type: 'base64', media_type: imgIn.mediaType, data: imgIn.data } },
        { type: 'text', text: 'SECOND photo — weighing out:' },
        { type: 'image', source: { type: 'base64', media_type: imgOut.mediaType, data: imgOut.data } },
        { type: 'text', text: VERIFY_PROMPT },
      ],
    }],
  })

  const block = res.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') {
    return { ticket_id: ticketId, ticket_number: t.ticket_number, status: 'error', note: 'The model did not return a comparison.' }
  }
  const out = block.input as any

  const verdict = verifyVerdict(out, {
    weight_in: Number(t.weight_in), weight_out: Number(t.weight_out), plate: t.vehicle_plate,
  })

  // Two frames agreeing on a plate the live single-frame read could not get is
  // real corroboration, and it is the only thing that makes this truck
  // matchable next visit. Only ever fills an EMPTY plate -- never overwrites
  // what an operator typed or what the live agent matched on.
  const pin = normalizePlate(out?.plate_in)
  const pout = normalizePlate(out?.plate_out)
  let plateLearned: string | null = null
  if (!normalizePlate(t.vehicle_plate) && pin && platesMatch(pin, pout) && Number(out?.plate_confidence) >= 0.75) {
    plateLearned = pin
  }

  const look = normalizeAppearance({ body: out?.body, color: out?.color, markings: out?.markings, make: out?.make, confidence: 0.9 })

  await env.DB.prepare(
    `UPDATE scale_tickets
        SET verify_status = ?, verify_note = ?, verify_at = CURRENT_TIMESTAMP,
            appearance_out = COALESCE(appearance_out, ?),
            vehicle_plate = COALESCE(NULLIF(vehicle_plate, ''), ?),
            plate_source  = CASE WHEN NULLIF(vehicle_plate,'') IS NULL AND ? IS NOT NULL THEN 'verifier' ELSE plate_source END
      WHERE id = ?`
  ).bind(
    verdict.status, verdict.note,
    look ? JSON.stringify(look) : null,
    plateLearned, plateLearned, ticketId
  ).run()

  return {
    ticket_id: ticketId,
    ticket_number: t.ticket_number,
    status: verdict.status,
    note: verdict.note,
    same_vehicle: out?.same_vehicle,
    plate_in: pin || null,
    plate_out: pout || null,
    plate_learned: plateLearned,
    appearance: look,
    model: res.model,
  }
}

// ─── POST /verify ───
// Body: { ticket_id }. Re-checks one closed ticket against its own two photos.
scaleAgentRoutes.post('/verify', async (c) => {
  try {
    if (!c.env.ANTHROPIC_API_KEY) {
      return c.json({ ok: false, reason: 'no_api_key', error: 'ANTHROPIC_API_KEY is not set on this Pages project, so tickets cannot be verified.' })
    }
    const body = await c.req.json().catch(() => ({})) as any
    const id = Number(body?.ticket_id)
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'ticket_id is required' }, 400)
    const r = await verifyOne(c.env, id)
    return c.json({ ok: r.status !== 'error', ...r })
  } catch (err: any) {
    return c.json({ ok: false, reason: 'error', error: err?.message || 'Verification failed' })
  }
})

// ─── POST /verify-sweep ───
// The standing background check. Cloudflare PAGES projects cannot have Cron
// Triggers -- that is a Workers feature and this is a Pages project -- so the
// sweep is pulled rather than pushed: the scale-house page, which is open all
// shift anyway, calls this on a long timer. Same effect, no second deployment,
// and it stops by itself when the yard goes home.
//
// Sequential on purpose. D1 is a single writer and this is background work;
// finishing five tickets slowly beats rate-limiting the live plate read that a
// truck on the scale is waiting for.
scaleAgentRoutes.post('/verify-sweep', async (c) => {
  const started = Date.now()
  try {
    const s = await getSettings(c.env.DB)
    if (!Number(s.verify_enabled ?? DEFAULTS.verify_enabled)) {
      return c.json({ ok: true, skipped: 'verify_enabled is off', checked: 0, results: [] })
    }
    if (!c.env.ANTHROPIC_API_KEY) {
      return c.json({ ok: false, reason: 'no_api_key', checked: 0, results: [], error: 'ANTHROPIC_API_KEY is not set on this Pages project.' })
    }

    const body = await c.req.json().catch(() => ({})) as any
    const limit = Math.min(20, Math.max(1, Number(body?.limit) || 5))

    const { results } = await c.env.DB.prepare(
      `SELECT id FROM scale_tickets
        WHERE status = 'completed'
          AND verify_status IS NULL
          AND photo_in IS NOT NULL AND photo_in <> ''
          AND photo_out IS NOT NULL AND photo_out <> ''
        ORDER BY id DESC LIMIT ?`
    ).bind(limit).all<any>()

    const out: any[] = []
    for (const row of results || []) {
      try {
        out.push(await verifyOne(c.env, Number(row.id)))
      } catch (e: any) {
        // One bad ticket must not abandon the rest of the sweep.
        out.push({ ticket_id: Number(row.id), status: 'error', note: e?.message || 'Verification failed' })
      }
    }

    return c.json({
      ok: true,
      checked: out.length,
      flagged: out.filter(r => r.status === 'mismatch').length,
      results: out,
      ms: Date.now() - started,
    })
  } catch (err: any) {
    return c.json({ ok: false, reason: 'error', error: err?.message || 'Sweep failed', checked: 0, results: [] })
  }
})
