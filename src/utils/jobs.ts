// Pickup job numbers (pickup_requests.job_number, = 1000 + id, set by a
// trigger in migration 0029) and the origin snapshot a job puts on a scale
// ticket. Shared by the scale-ticket routes so every way a ticket gets a job —
// operator capture, Auto mode, remote capture, attaching one afterwards —
// writes exactly the same fields.

// "J-1042", "j1042", "#1042", " 1042 " -> 1042. Anything else -> null.
export function parseJobNumber(input: unknown): number | null {
  const m = String(input ?? '').trim().toUpperCase().match(/^(?:JOB\s*)?#?\s*J?\s*-?\s*(\d{1,9})$/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export function formatJobNumber(n: number | null | undefined): string {
  return n ? 'J-' + n : ''
}

// Pickup tire type -> the scale's material (pricing.material_type). PLTT goes
// to "passenger", medium/heavy truck to "truck", OTR to "off-road". Only used
// when that material is actually active; otherwise the caller keeps its own.
const TIRE_TO_MATERIAL: Record<string, string> = {
  passenger: 'passenger', light_truck: 'passenger',
  medium_truck: 'truck', heavy_truck: 'truck', truck: 'truck',
  otr: 'off-road', 'off-road': 'off-road', mixed: 'mixed',
}

export async function jobMaterial(db: D1Database, tireType: string | null): Promise<string | null> {
  const m = tireType ? TIRE_TO_MATERIAL[tireType] : null
  if (!m) return null
  const ok = await db.prepare('SELECT 1 FROM pricing WHERE material_type = ? AND is_active = 1').bind(m).first()
  return ok ? m : null
}

export async function loadJob(db: D1Database, jobNumber: number) {
  const job = await db.prepare(
    `SELECT pr.id, pr.job_number, pr.status, pr.customer_id, pr.tire_type, pr.estimated_tire_count, pr.actual_tire_count,
            pr.preferred_date, pr.completed_at, pr.updated_at, pr.notes,
            c.company_name, c.contact_name, c.phone, c.address, c.city, c.province, c.postal_code,
            c.zone, c.region, c.tire_types AS customer_tire_types, c.is_active AS customer_active,
            COALESCE(rd.first_name || ' ' || rd.last_name, ad.first_name || ' ' || ad.last_name) AS driver_name,
            COALESCE(rd.phone, ad.phone) AS driver_phone,
            r.vehicle AS route_vehicle
     FROM pickup_requests pr
     JOIN customers c ON c.id = pr.customer_id
     LEFT JOIN routes r ON r.id = pr.assigned_route_id
     LEFT JOIN employees rd ON rd.id = r.assigned_employee_id
     LEFT JOIN employees ad ON ad.id = pr.assigned_employee_id
     WHERE pr.job_number = ?`
  ).bind(jobNumber).first<any>()
  if (!job) return null
  const { results } = await db.prepare(
    `SELECT id, ticket_number, status, weight_in_at FROM scale_tickets
     WHERE pickup_request_id = ? AND status != 'voided' ORDER BY id`
  ).bind(job.id).all()
  return { ...job, tickets: results as any[] }
}

// Why a job can't (or shouldn't) go on a ticket.
//   blocking: refuse outright.
//   repeat:   already on another live ticket — allowed only when the operator
//             confirms (allow_repeat), since one job is one load.
//   warning:  shown to the operator, never blocks the scale.
export function jobProblems(job: any, ignoreTicketId?: number) {
  const others = (job.tickets || []).filter((t: any) => t.id !== ignoreTicketId)
  return {
    blocking: job.status === 'cancelled' ? 'Job ' + formatJobNumber(job.job_number) + ' was cancelled.' : null,
    repeat: others.length ? 'Job ' + formatJobNumber(job.job_number) + ' is already on ticket ' + others.map((t: any) => t.ticket_number).join(', ') + '.' : null,
    warning: job.status === 'completed' ? null
      : 'The driver has not marked job ' + formatJobNumber(job.job_number) + ' complete yet (it is ' + String(job.status).replace('_', ' ') + ').',
  }
}

// Column -> value for the origin snapshot. The count is the driver's actual
// count when they gave one, else the customer's estimate, flagged as such.
export function jobSnapshot(job: any): Record<string, any> {
  const actual = job.actual_tire_count != null
  return {
    pickup_request_id: job.id,
    job_number: job.job_number,
    customer_id: job.customer_id,
    origin_company: job.company_name || null,
    origin_contact: job.contact_name || null,
    origin_phone: job.phone || null,
    origin_address: job.address || null,
    origin_city: job.city || null,
    origin_province: job.province || null,
    origin_postal_code: job.postal_code || null,
    origin_zone: job.zone || null,
    origin_region: job.region || null,
    origin_tire_type: job.tire_type || null,
    origin_tire_count: actual ? job.actual_tire_count : (job.estimated_tire_count ?? null),
    origin_tire_count_estimated: actual ? 0 : 1,
    origin_collected_at: job.completed_at || null,
    origin_driver: job.driver_name || null,
  }
}

// What the scale-house preview shows.
export function jobPreview(job: any) {
  const p = jobProblems(job)
  return {
    id: job.id,
    job_number: job.job_number,
    label: formatJobNumber(job.job_number),
    status: job.status,
    customer_id: job.customer_id,
    company_name: job.company_name,
    contact_name: job.contact_name,
    phone: job.phone,
    address: [job.address, job.city, job.province, job.postal_code].filter(Boolean).join(', '),
    zone: job.zone,
    region: job.region,
    tire_type: job.tire_type,
    tire_count: job.actual_tire_count ?? job.estimated_tire_count,
    tire_count_estimated: job.actual_tire_count == null,
    driver_name: job.driver_name,
    vehicle: job.route_vehicle,
    completed_at: job.completed_at,
    tickets: job.tickets,
    blocking: p.blocking,
    repeat: p.repeat,
    warning: p.warning,
  }
}
