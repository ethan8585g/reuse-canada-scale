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

// Timestamps from D1's CURRENT_TIMESTAMP are UTC ("YYYY-MM-DD HH:MM:SS"), so
// filtering by DATE(created_at) put every load after 6pm (5pm in winter) on
// the next day: gone from "Today", the daily settlement and its batch. These
// give the UTC bounds of an Edmonton calendar day in that same format, so a
// filter is `created_at >= start AND created_at < end`.
const WALL_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
})

function edmontonOffsetMs(utcMs: number): number {
  const p: Record<string, string> = {}
  for (const part of WALL_FMT.formatToParts(new Date(utcMs))) p[part.type] = part.value
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return wall - utcMs
}

function sqliteUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
}

// Midnight starting the Edmonton day `ymd`, as a UTC D1 timestamp.
export function edmontonDayStartUtc(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  // Twice, so a guess on the far side of a DST switch settles on the right offset.
  let utc = guess - edmontonOffsetMs(guess)
  utc = guess - edmontonOffsetMs(utc)
  return sqliteUtc(utc)
}

// [start, end) of the Edmonton day `ymd` in UTC D1 timestamps.
export function edmontonDayRangeUtc(ymd: string): [string, string] {
  const [y, m, d] = ymd.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  return [edmontonDayStartUtc(ymd), edmontonDayStartUtc(next)]
}

export const YMD = /^\d{4}-\d{2}-\d{2}$/
