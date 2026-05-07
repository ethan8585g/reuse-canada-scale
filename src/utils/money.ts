// Monetary helpers. We store money as REAL in D1 to avoid a schema migration,
// but every multiply/sum has to round to cents at write time so totals
// reconcile (subtotal + tax === grand_total) and existing dashboards don't
// drift by float-precision amounts.

export const GST_RATE = 0.05

export function cents(v: number | null | undefined): number {
  const n = Number(v) || 0
  return Math.round(n * 100) / 100
}
