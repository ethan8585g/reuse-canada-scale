import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { todayEdmonton } from '../utils/date'

type Bindings = { DB: D1Database }

export const fleetRoutes = new Hono<{ Bindings: Bindings }>()

fleetRoutes.use('*', authMiddleware, employeeOnly)

// Whole numbers of days between today (Edmonton) and an ISO date. Negative
// means expired. Null dates return null so the UI can show "not on file"
// rather than a misleading "expired".
function daysUntil(dateStr: string | null | undefined, today: string): number | null {
  if (!dateStr) return null
  const a = Date.parse(dateStr + 'T00:00:00Z')
  const b = Date.parse(today + 'T00:00:00Z')
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.round((a - b) / 86400000)
}

// Health is derived, never stored: a stored score would drift the moment a
// document expired or an odometer moved. Same function feeds the vehicle
// badge, the fleet-health tile and the drawer ring so they cannot disagree.
function healthFor(v: any, openRepairs: number, today: string) {
  let score = 100
  const reasons: string[] = []
  const hit = (n: number, why: string) => { score -= n; reasons.push(why) }

  const cvip = daysUntil(v.cvip_expiry, today)
  if (cvip !== null) {
    if (cvip < 0) hit(30, 'CVIP expired ' + Math.abs(cvip) + ' days ago')
    else if (cvip < 30) hit(10, 'CVIP due in ' + cvip + ' days')
  }
  const ins = daysUntil(v.insurance_expiry, today)
  if (ins !== null) {
    if (ins < 0) hit(20, 'Insurance expired')
    else if (ins < 30) hit(8, 'Insurance renews in ' + ins + ' days')
  }
  const reg = daysUntil(v.registration_expiry, today)
  if (reg !== null) {
    if (reg < 0) hit(15, 'Registration expired')
    else if (reg < 30) hit(6, 'Registration renews in ' + reg + ' days')
  }
  if (v.service_interval > 0) {
    const due = (v.service_last || 0) + v.service_interval
    const remaining = due - (v.odometer || 0)
    if (remaining < 0) hit(20, 'Service overdue by ' + Math.round(Math.abs(remaining)))
    else if (remaining < v.service_interval * 0.15) hit(8, 'Service due soon')
  }
  if (v.tire_interval > 0) {
    const remaining = (v.tire_last || 0) + v.tire_interval - (v.odometer || 0)
    if (remaining < 0) hit(10, 'Tire rotation overdue')
    else if (remaining < 2000) hit(4, 'Tire rotation due soon')
  }
  if (openRepairs > 0) hit(Math.min(20, openRepairs * 10), openRepairs + ' open repair' + (openRepairs === 1 ? '' : 's'))

  return { health: Math.max(0, Math.min(100, score)), reasons }
}

function decorate(v: any, openRepairs: number, today: string) {
  const { health, reasons } = healthFor(v, openRepairs, today)
  const tracked = !!(v.insurance_expiry || v.registration_expiry || v.cvip_expiry || v.service_interval > 0)
  const unit = v.is_hours ? 'h' : 'km'
  let nextService: string | null = null
  if (v.service_interval > 0) {
    const remaining = (v.service_last || 0) + v.service_interval - (v.odometer || 0)
    nextService = remaining < 0
      ? 'Service overdue by ' + Math.round(Math.abs(remaining)) + ' ' + unit
      : 'Service in ' + Math.round(remaining) + ' ' + unit
  }
  return {
    ...v,
    health,
    health_reasons: reasons,
    unit,
    next_service: nextService,
    open_repairs: openRepairs,
    insurance_days: daysUntil(v.insurance_expiry, today),
    registration_days: daysUntil(v.registration_expiry, today),
    cvip_days: daysUntil(v.cvip_expiry, today),
    tracked,
    // A vehicle with no dates and no intervals scores 100 only because nothing
    // is known to be wrong. Saying "Road ready" there would overstate it.
    status_label: !tracked ? 'Not tracked yet'
      : health >= 80 ? 'Road ready' : health >= 65 ? 'Needs attention' : 'Do not dispatch',
  }
}

// ── Vehicles ─────────────────────────────────────────────────────────────
fleetRoutes.get('/vehicles', async (c) => {
  try {
    const today = todayEdmonton()
    const [{ results: vehicles }, { results: repairs }] = await Promise.all([
      c.env.DB.prepare('SELECT * FROM vehicles ORDER BY name').all(),
      c.env.DB.prepare(
        "SELECT vehicle_id, COUNT(*) as n FROM work_orders WHERE status != 'completed' AND work_type = 'repair' GROUP BY vehicle_id"
      ).all(),
    ])
    const repairMap: Record<string, number> = {}
    for (const r of repairs as any[]) repairMap[String(r.vehicle_id)] = r.n as number
    return c.json({ vehicles: (vehicles as any[]).map(v => decorate(v, repairMap[String(v.id)] || 0, today)) })
  } catch (err: any) {
    console.error('fleet vehicles error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

const VEHICLE_FIELDS = [
  'name', 'plate_number', 'vehicle_type', 'model', 'vin', 'icon', 'photo',
  'tare_weight', 'odometer', 'is_hours', 'insurance_expiry', 'registration_expiry',
  'cvip_expiry', 'service_interval', 'service_last', 'tire_interval', 'tire_last',
]

fleetRoutes.post('/vehicles', roleRequired('admin', 'manager'), async (c) => {
  try {
    const body = await c.req.json()
    if (!body.name || !String(body.name).trim()) return c.json({ error: 'Name is required' }, 400)
    const cols = VEHICLE_FIELDS.filter(f => body[f] !== undefined)
    const sql = `INSERT INTO vehicles (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    const res = await c.env.DB.prepare(sql).bind(...cols.map(f => body[f] ?? null)).run()
    return c.json({ id: res.meta.last_row_id })
  } catch (err: any) {
    console.error('fleet vehicle create error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.put('/vehicles/:id', roleRequired('admin', 'manager'), async (c) => {
  try {
    const body = await c.req.json()
    const cols = VEHICLE_FIELDS.filter(f => body[f] !== undefined)
    if (!cols.length) return c.json({ error: 'Nothing to update' }, 400)
    const sql = `UPDATE vehicles SET ${cols.map(f => f + ' = ?').join(', ')} WHERE id = ?`
    await c.env.DB.prepare(sql).bind(...cols.map(f => body[f] ?? null), c.req.param('id')).run()
    return c.json({ success: true })
  } catch (err: any) {
    console.error('fleet vehicle update error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Fuel ─────────────────────────────────────────────────────────────────
fleetRoutes.get('/fuel', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT f.*, v.name as vehicle_name, v.is_hours,
              e.first_name || ' ' || e.last_name as driver_name
       FROM fuel_logs f
       LEFT JOIN vehicles v ON f.vehicle_id = v.id
       LEFT JOIN employees e ON f.employee_id = e.id
       ORDER BY f.filled_at DESC LIMIT 200`
    ).all()
    return c.json({ fuel: results })
  } catch (err: any) {
    console.error('fleet fuel error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.post('/fuel', async (c) => {
  try {
    const b = await c.req.json()
    if (!b.vehicle_id) return c.json({ error: 'Vehicle is required' }, 400)
    const litres = Number(b.litres) || 0
    const price = Number(b.price_per_litre) || 0
    const total = b.total != null ? Number(b.total) : litres * price
    await c.env.DB.prepare(
      `INSERT INTO fuel_logs (vehicle_id, employee_id, filled_at, station, odometer, litres, price_per_litre, total, receipt_photo, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      b.vehicle_id, c.get('userId'), b.filled_at || new Date().toISOString(),
      b.station || null, b.odometer ?? null, litres || null, price || null,
      total || null, b.receipt_photo || null, b.notes || null
    ).run()
    // A fill-up is the most reliable odometer reading the yard produces, so it
    // moves the vehicle forward -- but never backwards on a mis-typed entry.
    if (b.odometer) {
      await c.env.DB.prepare(
        'UPDATE vehicles SET odometer = ? WHERE id = ? AND ? > COALESCE(odometer, 0)'
      ).bind(b.odometer, b.vehicle_id, b.odometer).run()
    }
    return c.json({ success: true })
  } catch (err: any) {
    console.error('fleet fuel create error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Work orders ──────────────────────────────────────────────────────────
fleetRoutes.get('/work-orders', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT w.*, v.name as vehicle_name FROM work_orders w
       LEFT JOIN vehicles v ON w.vehicle_id = v.id
       ORDER BY CASE w.status WHEN 'open' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END,
                COALESCE(w.scheduled_date, w.completed_date) DESC LIMIT 300`
    ).all()
    return c.json({ work_orders: results })
  } catch (err: any) {
    console.error('fleet wo error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.post('/work-orders', async (c) => {
  try {
    const b = await c.req.json()
    if (!b.vehicle_id || !b.title) return c.json({ error: 'Vehicle and title are required' }, 400)
    const res = await c.env.DB.prepare(
      `INSERT INTO work_orders (vehicle_id, title, work_type, shop, status, scheduled_date, completed_date, odometer, cost, parts, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      b.vehicle_id, String(b.title).slice(0, 200), b.work_type || 'maintenance',
      b.shop || null, b.status || 'open', b.scheduled_date || null, b.completed_date || null,
      b.odometer ?? null, b.cost ?? null, b.parts || null, b.notes || null, c.get('userId')
    ).run()
    return c.json({ id: res.meta.last_row_id })
  } catch (err: any) {
    console.error('fleet wo create error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.put('/work-orders/:id', async (c) => {
  try {
    const b = await c.req.json()
    const fields = ['title', 'work_type', 'shop', 'status', 'scheduled_date', 'completed_date', 'odometer', 'cost', 'parts', 'notes']
    const cols = fields.filter(f => b[f] !== undefined)
    if (!cols.length) return c.json({ error: 'Nothing to update' }, 400)
    await c.env.DB.prepare(
      `UPDATE work_orders SET ${cols.map(f => f + ' = ?').join(', ')}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...cols.map(f => b[f] ?? null), c.req.param('id')).run()
    // Completing a service resets the interval clock off the recorded odometer.
    if (b.status === 'completed' && b.odometer) {
      const wo = await c.env.DB.prepare('SELECT vehicle_id, work_type FROM work_orders WHERE id = ?')
        .bind(c.req.param('id')).first<{ vehicle_id: number, work_type: string }>()
      if (wo && wo.work_type === 'maintenance') {
        await c.env.DB.prepare('UPDATE vehicles SET service_last = ? WHERE id = ?').bind(b.odometer, wo.vehicle_id).run()
      }
    }
    return c.json({ success: true })
  } catch (err: any) {
    console.error('fleet wo update error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Compliance documents ─────────────────────────────────────────────────
fleetRoutes.get('/compliance', async (c) => {
  try {
    const today = todayEdmonton()
    const { results } = await c.env.DB.prepare(
      `SELECT d.*, v.name as vehicle_name FROM compliance_docs d
       LEFT JOIN vehicles v ON d.vehicle_id = v.id
       ORDER BY d.expires_on ASC`
    ).all()
    return c.json({ docs: (results as any[]).map(d => ({ ...d, days: daysUntil(d.expires_on, today) })) })
  } catch (err: any) {
    console.error('fleet compliance error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.post('/compliance', roleRequired('admin', 'manager'), async (c) => {
  try {
    const b = await c.req.json()
    if (!b.vehicle_id || !b.kind) return c.json({ error: 'Vehicle and document type are required' }, 400)
    await c.env.DB.prepare(
      `INSERT INTO compliance_docs (vehicle_id, kind, provider, doc_number, expires_on, annual_cost, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(b.vehicle_id, b.kind, b.provider || null, b.doc_number || null, b.expires_on || null, b.annual_cost ?? null, b.notes || null).run()
    // Mirror onto the vehicle so health and the expiry chips stay in one place.
    const col = { 'Insurance': 'insurance_expiry', 'Registration': 'registration_expiry', 'CVIP Inspection': 'cvip_expiry' }[b.kind as string]
    if (col && b.expires_on) {
      await c.env.DB.prepare(`UPDATE vehicles SET ${col} = ? WHERE id = ?`).bind(b.expires_on, b.vehicle_id).run()
    }
    return c.json({ success: true })
  } catch (err: any) {
    console.error('fleet compliance create error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Notes ────────────────────────────────────────────────────────────────
fleetRoutes.get('/notes/:vehicleId', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT n.*, e.first_name || ' ' || e.last_name as author FROM vehicle_notes n
       LEFT JOIN employees e ON n.employee_id = e.id
       WHERE n.vehicle_id = ? ORDER BY n.created_at DESC`
    ).bind(c.req.param('vehicleId')).all()
    return c.json({ notes: results })
  } catch (err: any) {
    console.error('fleet notes error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.post('/notes', async (c) => {
  try {
    const b = await c.req.json()
    if (!b.vehicle_id || !b.text) return c.json({ error: 'Vehicle and text are required' }, 400)
    await c.env.DB.prepare(
      'INSERT INTO vehicle_notes (vehicle_id, employee_id, pin, text) VALUES (?, ?, ?, ?)'
    ).bind(b.vehicle_id, c.get('userId'), b.pin || 'general', String(b.text).slice(0, 2000)).run()
    return c.json({ success: true })
  } catch (err: any) {
    console.error('fleet note create error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Today's drivers ──────────────────────────────────────────────────────
fleetRoutes.get('/assignments', async (c) => {
  try {
    const date = c.req.query('date') || todayEdmonton()
    const { results } = await c.env.DB.prepare(
      `SELECT a.*, e.first_name || ' ' || e.last_name as driver_name, e.phone
       FROM vehicle_assignments a
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.assigned_date = ?`
    ).bind(date).all()
    return c.json({ assignments: results, date })
  } catch (err: any) {
    console.error('fleet assignments error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

fleetRoutes.post('/assignments', async (c) => {
  try {
    const b = await c.req.json()
    const date = b.assigned_date || todayEdmonton()
    if (!b.vehicle_id) return c.json({ error: 'Vehicle is required' }, 400)
    // One driver per vehicle per day: clear then insert, so re-assigning does
    // not leave two drivers holding the same truck.
    await c.env.DB.prepare('DELETE FROM vehicle_assignments WHERE vehicle_id = ? AND assigned_date = ?')
      .bind(b.vehicle_id, date).run()
    if (b.employee_id) {
      await c.env.DB.prepare(
        'INSERT INTO vehicle_assignments (vehicle_id, employee_id, assigned_date) VALUES (?, ?, ?)'
      ).bind(b.vehicle_id, b.employee_id, date).run()
    }
    return c.json({ success: true })
  } catch (err: any) {
    console.error('fleet assign error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ── Cost roll-up ─────────────────────────────────────────────────────────
fleetRoutes.get('/costs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT v.id, v.name, v.odometer, v.is_hours,
              COALESCE((SELECT SUM(total) FROM fuel_logs f WHERE f.vehicle_id = v.id), 0) as fuel,
              COALESCE((SELECT SUM(cost) FROM work_orders w WHERE w.vehicle_id = v.id AND w.work_type = 'maintenance'), 0) as service,
              COALESCE((SELECT SUM(cost) FROM work_orders w WHERE w.vehicle_id = v.id AND w.work_type != 'maintenance'), 0) as repairs,
              COALESCE((SELECT SUM(annual_cost) FROM compliance_docs d WHERE d.vehicle_id = v.id), 0) as compliance
       FROM vehicles v WHERE v.is_active = 1 ORDER BY v.name`
    ).all()
    return c.json({ costs: results })
  } catch (err: any) {
    console.error('fleet costs error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
