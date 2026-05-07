// Date helpers that pin everything to America/Edmonton.
//
// The Workers runtime is UTC. `new Date().toISOString().split('T')[0]` was
// being compared to `DATE(created_at)` filters and used to default settlement
// dates — both of which we want as "today in Alberta", not "today in UTC".
// Without this, the daily roll-up flipped at 5pm/6pm local instead of midnight.

const TZ = 'America/Edmonton'

const DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const MONTH_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
})

// "YYYY-MM-DD" in Edmonton time.
export function todayEdmonton(d: Date = new Date()): string {
  return DATE_FMT.format(d)
}

// "YYYY-MM" in Edmonton time.
export function thisMonthEdmonton(d: Date = new Date()): string {
  return MONTH_FMT.format(d)
}

// Locale string with the Edmonton timezone fixed in. For receipts and dashboard
// stamps so an admin in another timezone sees the same wall-clock time the
// scale-house operator did.
export function formatEdmonton(d: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, ...opts }).format(date)
}
