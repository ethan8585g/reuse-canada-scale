// Drop-off vs pickup. The one place that knows which way a ticket's weight
// runs and what it costs, so merge-out, stored tare, the weight edit, the
// assign re-price and the agent's banner preview cannot disagree.
//
//   dropoff : arrives loaded, leaves light. net = in - out. Never billed.
//   pickup  : arrives empty, leaves loaded. net = out - in. Billed at the
//             material's pickup_price_per_kg and sent to Square.
import { GST_RATE, cents, billableKg } from './money'

export type TicketType = 'dropoff' | 'pickup'

export function parseTicketType(v: unknown): TicketType | null {
  return v === 'dropoff' || v === 'pickup' ? v : null
}

export function ticketTypeOf(v: unknown): TicketType {
  return parseTicketType(v) ?? 'dropoff'
}

// Signed, deliberately: a negative net is a real anomaly (a drop-off that left
// heavier, a pickup that left lighter) and must reach detectAnomalies.
export function ticketNet(type: unknown, weightIn: number, weightOut: number): number {
  return ticketTypeOf(type) === 'pickup' ? weightOut - weightIn : weightIn - weightOut
}

// The pickup rate for a material, or null when none has been set.
export async function pickupRate(db: D1Database, material: string | null | undefined): Promise<number | null> {
  const row = await db.prepare(
    'SELECT pickup_price_per_kg FROM pricing WHERE material_type = ? AND is_active = 1'
  ).bind(material || 'mixed').first<any>()
  const v = row ? Number(row.pickup_price_per_kg) : NaN
  return row && row.pickup_price_per_kg !== null && Number.isFinite(v) && v >= 0 ? v : null
}

export interface TicketMoney {
  net_weight: number
  price_per_kg: number
  subtotal: number
  tax_amount: number
  grand_total: number
  // false only for a pickup whose material has no pickup price. The routes
  // refuse to create that state; this exists for the race where a price is
  // removed between marking a ticket and weighing it out.
  priced: boolean
}

export async function priceTicket(
  db: D1Database, type: unknown, material: string | null | undefined, weightIn: number, weightOut: number
): Promise<TicketMoney> {
  const net = ticketNet(type, weightIn, weightOut)
  if (ticketTypeOf(type) === 'dropoff') {
    return { net_weight: net, price_per_kg: 0, subtotal: 0, tax_amount: 0, grand_total: 0, priced: true }
  }
  const rate = await pickupRate(db, material)
  const ppk = rate ?? 0
  const subtotal = cents(billableKg(net) * ppk)
  const tax = cents(subtotal * GST_RATE)
  return { net_weight: net, price_per_kg: ppk, subtotal, tax_amount: tax, grand_total: cents(subtotal + tax), priced: rate !== null }
}
