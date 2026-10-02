// Monetary helpers. We store money as REAL in D1 to avoid a schema migration,
// but every multiply/sum has to round to cents at write time so totals
// reconcile (subtotal + tax === grand_total) and existing dashboards don't
// drift by float-precision amounts.

export const GST_RATE = 0.05

export function cents(v: number | null | undefined): number {
  const n = Number(v) || 0
  return Math.round(n * 100) / 100
}

// A negative net (weight_out > weight_in) is RECORDED as-is so detectAnomalies
// can see it, but it is never billed: a customer who left a few kilos heavier
// than they arrived -- the driver back in the cab, a top-up of fuel -- owes
// nothing, not a refund. Without this, closing a zero-net visit could print a
// receipt for -$0.44.
export function billableKg(net: number): number {
  return Number.isFinite(net) && net > 0 ? net : 0
}
