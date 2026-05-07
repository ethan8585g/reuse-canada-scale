import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { hashPassword } from '../utils/passwords'
import { photoOversize } from '../utils/photo'

type Bindings = { DB: D1Database }

export const employeeRoutes = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware
employeeRoutes.use('*', authMiddleware, employeeOnly)

// ══════════════════════════════════════════
// DASHBOARD DATA (with performance stats)
// ══════════════════════════════════════════
employeeRoutes.get('/dashboard', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const [pendingPickups, todaysRoutes, openTickets, completedToday, recentPickups, recentTickets] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM pickup_requests WHERE status IN ('pending', 'confirmed')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM routes WHERE date = ?").bind(today).first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM scale_tickets WHERE status NOT IN ('completed', 'voided')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM scale_tickets WHERE status = 'completed' AND DATE(updated_at) = ?").bind(today).first(),
      c.env.DB.prepare(
        "SELECT pr.*, c.company_name, c.contact_name FROM pickup_requests pr LEFT JOIN customers c ON pr.customer_id = c.id ORDER BY pr.created_at DESC LIMIT 5"
      ).all(),
      c.env.DB.prepare(
        "SELECT st.*, c.company_name, e.first_name || ' ' || e.last_name as employee_name FROM scale_tickets st LEFT JOIN customers c ON st.customer_id = c.id LEFT JOIN employees e ON st.employee_id = e.id ORDER BY st.created_at DESC LIMIT 5"
      ).all(),
    ])

    // Performance data for today
    let performance = { completed_pickups: 0, total_tires: 0, total_weight: 0 }
    try {
      const perfData = await c.env.DB.prepare(
        `SELECT 
          COUNT(*) as completed_pickups,
          COALESCE(SUM(pr.estimated_tire_count), 0) as total_tires
         FROM pickup_requests pr 
         WHERE pr.status = 'completed' AND DATE(pr.updated_at) = ?`
      ).bind(today).first() as any
      const weightData = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(net_weight), 0) as total_weight 
         FROM scale_tickets 
         WHERE status = 'completed' AND DATE(updated_at) = ?`
      ).bind(today).first() as any
      performance = {
        completed_pickups: perfData?.completed_pickups || 0,
        total_tires: perfData?.total_tires || 0,
        total_weight: weightData?.total_weight || 0,
      }
    } catch (e) { /* ignore performance data errors */ }

    // Daily stats for last 7 days (for micro-graph)
    let dailyStats: any[] = []
    try {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
      }
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      for (const day of days) {
        const result = await c.env.DB.prepare(
          "SELECT COUNT(*) as count FROM scale_tickets WHERE status = 'completed' AND DATE(updated_at) = ?"
        ).bind(day).first() as any
        const dt = new Date(day + 'T12:00:00')
        dailyStats.push({
          date: day,
          label: dayNames[dt.getDay()],
          count: result?.count || 0,
          is_today: day === today
        })
      }
    } catch (e) { /* ignore */ }

    return c.json({
      pending_pickups: (pendingPickups as any)?.count || 0,
      todays_routes: (todaysRoutes as any)?.count || 0,
      open_tickets: (openTickets as any)?.count || 0,
      completed_today: (completedToday as any)?.count || 0,
      recent_pickups: recentPickups.results || [],
      recent_tickets: recentTickets.results || [],
      performance,
      daily_stats: dailyStats,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ══════════════════════════════════════════
// DRIVER STATUS SUMMARY (for sidebar widget)
// ══════════════════════════════════════════
employeeRoutes.get('/driver-status-summary', async (c) => {
  try {
    const onRoad = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM driver_status WHERE status = 'on_road'"
    ).first() as any
    const idle = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM driver_status WHERE status = 'idle'"
    ).first() as any
    // Also count drivers without a status entry (assume idle)
    const noStatus = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM employees WHERE role = 'driver' AND is_active = 1 AND id NOT IN (SELECT employee_id FROM driver_status)"
    ).first() as any
    return c.json({
      on_road: (onRoad as any)?.count || 0,
      idle: ((idle as any)?.count || 0) + ((noStatus as any)?.count || 0),
    })
  } catch (err: any) {
    return c.json({ on_road: 0, idle: 0 })
  }
})

// Update driver status. The employee_id comes from the authenticated
// session, NOT the request body — otherwise driver A could post location
// updates impersonating driver B (or the dispatcher).
employeeRoutes.post('/driver-status', async (c) => {
  try {
    const { status, lat, lng, route_id } = await c.req.json()
    const employeeId = c.get('userId')
    if (!status) return c.json({ error: 'status required' }, 400)
    const validStatuses = ['idle', 'on_road', 'at_pickup', 'returning']
    if (!validStatuses.includes(status)) return c.json({ error: 'Invalid status' }, 400)

    await c.env.DB.prepare(
      `INSERT INTO driver_status (employee_id, status, current_route_id, last_lat, last_lng, last_updated)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(employee_id) DO UPDATE SET status = ?, current_route_id = ?, last_lat = ?, last_lng = ?, last_updated = datetime('now')`
    ).bind(
      employeeId, status, route_id || null, lat || null, lng || null,
      status, route_id || null, lat || null, lng || null
    ).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ══════════════════════════════════════════
// TODAY'S PICKUPS MAP DATA (for dashboard mini-map)
// ══════════════════════════════════════════
employeeRoutes.get('/todays-pickups-map', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { results } = await c.env.DB.prepare(
      `SELECT pr.id, pr.status, pr.estimated_tire_count, pr.preferred_date,
              c.company_name, c.address, c.city, c.lat, c.lng, c.region,
              e.first_name || ' ' || e.last_name as driver_name
       FROM pickup_requests pr
       LEFT JOIN customers c ON pr.customer_id = c.id
       LEFT JOIN employees e ON pr.assigned_employee_id = e.id
       WHERE pr.status IN ('scheduled', 'confirmed', 'in_progress', 'pending')
         AND (pr.preferred_date = ? OR pr.preferred_date IS NULL)
       ORDER BY pr.status, pr.preferred_date`
    ).bind(today).all()
    return c.json({ pickups: results })
  } catch (err: any) {
    return c.json({ pickups: [] })
  }
})

// ══════════════════════════════════════════
// PICKUP PROOF OF WORK (photo + GPS)
// ══════════════════════════════════════════
employeeRoutes.post('/pickup-proof', async (c) => {
  try {
    const { pickup_request_id, photo_data, latitude, longitude, notes } = await c.req.json()
    if (!pickup_request_id) return c.json({ error: 'pickup_request_id required' }, 400)
    if (photoOversize(photo_data)) {
      return c.json({ error: 'Photo is too large. Re-capture at lower quality and try again.' }, 413)
    }

    const userId = (c as any).get('userId')

    // Drivers can only file proof for pickups assigned to them. Without this
    // a driver could POST any pickup_request_id and stamp themselves on it.
    const me = await c.env.DB.prepare('SELECT role FROM employees WHERE id = ?').bind(userId).first()
    if ((me?.role as string) === 'driver') {
      const owned = await c.env.DB.prepare(
        'SELECT id FROM pickup_requests WHERE id = ? AND assigned_employee_id = ?'
      ).bind(pickup_request_id, userId).first()
      if (!owned) return c.json({ error: 'Pickup not assigned to you' }, 403)
    }

    // Insert proof record
    const result = await c.env.DB.prepare(
      `INSERT INTO pickup_proof (pickup_request_id, employee_id, photo_data, latitude, longitude, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(pickup_request_id, userId, photo_data || null, latitude || null, longitude || null, notes || null).run()

    // Get pickup + customer info for notification
    const pickup = await c.env.DB.prepare(
      `SELECT pr.*, c.company_name, c.contact_name, c.phone, c.email
       FROM pickup_requests pr
       LEFT JOIN customers c ON pr.customer_id = c.id
       WHERE pr.id = ?`
    ).bind(pickup_request_id).first() as any

    // Log notification (simulated SMS/email)
    if (pickup && pickup.contact_name) {
      const message = `Cage/Bin was swapped/picked up at ${pickup.company_name}. Thanks for your business! - Reuse Canada`
      await c.env.DB.prepare(
        `INSERT INTO notification_log (type, recipient, recipient_name, message, pickup_request_id, status)
         VALUES ('pickup_proof', ?, ?, ?, ?, 'sent')`
      ).bind(pickup.phone || pickup.email || 'N/A', pickup.contact_name, message, pickup_request_id).run()

      // Mark proof as notification sent
      await c.env.DB.prepare(
        "UPDATE pickup_proof SET notification_sent = 1 WHERE id = ?"
      ).bind(result.meta.last_row_id).run()
    }

    return c.json({
      success: true,
      id: result.meta.last_row_id,
      notification_sent: !!pickup?.contact_name,
      message: pickup?.contact_name ? 
        `Notification sent to ${pickup.contact_name}: "Cage/Bin was swapped/picked up. Thanks for your business!"` :
        'Proof recorded (no customer contact found for notification)'
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get proof records for a pickup
employeeRoutes.get('/pickup-proof/:pickupId', async (c) => {
  const pickupId = c.req.param('pickupId')
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT pp.*, e.first_name || ' ' || e.last_name as driver_name
       FROM pickup_proof pp
       LEFT JOIN employees e ON pp.employee_id = e.id
       WHERE pp.pickup_request_id = ?
       ORDER BY pp.timestamp DESC`
    ).bind(pickupId).all()
    return c.json({ proofs: results })
  } catch (err: any) {
    return c.json({ proofs: [] })
  }
})

// ══════════════════════════════════════════
// NOTIFICATION ENDPOINTS
// ══════════════════════════════════════════
employeeRoutes.get('/notifications', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM notification_log ORDER BY created_at DESC LIMIT 50'
    ).all()
    return c.json({ notifications: results })
  } catch (err: any) {
    return c.json({ notifications: [] })
  }
})

// ══════════════════════════════════════════
// CUSTOMER & DRIVER DROPDOWN DATA
// ══════════════════════════════════════════
employeeRoutes.get('/customers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, company_name, contact_name, phone, address, city, province, postal_code, lat, lng, region FROM customers WHERE is_active = 1 ORDER BY company_name'
    ).all()
    return c.json({ customers: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.get('/drivers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, first_name, last_name, phone, role FROM employees WHERE is_active = 1 AND role IN ('driver', 'admin', 'manager') ORDER BY first_name"
    ).all()
    return c.json({ drivers: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get all vehicles
employeeRoutes.get('/vehicles', async (c) => {
  try {
    const showAll = c.req.query('all')
    const sql = showAll ? 'SELECT * FROM vehicles ORDER BY name' : 'SELECT * FROM vehicles WHERE is_active = 1 ORDER BY name'
    const { results } = await c.env.DB.prepare(sql).all()
    return c.json({ vehicles: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ══════════════════════════════════════════
// CUSTOMER ONBOARDING (CRUD)
// ══════════════════════════════════════════
employeeRoutes.get('/customers/all', async (c) => {
  try {
    const status = c.req.query('status')
    let sql = `SELECT c.id, c.email, c.company_name, c.contact_name, c.phone, c.address, c.city, c.province, c.postal_code, c.lat, c.lng, c.region, c.notes, c.is_active, c.created_at, c.updated_at,
               (SELECT COUNT(*) FROM pickup_requests pr WHERE pr.customer_id = c.id AND pr.status IN ('pending','confirmed')) as pending_pickups
               FROM customers c`
    if (status === 'active') { sql += ' WHERE c.is_active = 1'; }
    else if (status === 'inactive') { sql += ' WHERE c.is_active = 0'; }
    sql += ' ORDER BY c.company_name'
    const { results } = await c.env.DB.prepare(sql).all()
    return c.json({ customers: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.post('/customers', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { email, password, company_name, contact_name, phone, address, city, province, postal_code, lat, lng, region, notes } = await c.req.json()
    if (!email || !password || !company_name || !contact_name) {
      return c.json({ error: 'Username, password, company name, and contact name are required' }, 400)
    }
    const existing = await c.env.DB.prepare('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)').bind(email.trim()).first()
    if (existing) {
      return c.json({ error: 'A customer with this username already exists' }, 409)
    }
    const passwordHash = await hashPassword(password)
    const result = await c.env.DB.prepare(
      `INSERT INTO customers (email, password_hash, company_name, contact_name, phone, address, city, province, postal_code, lat, lng, region, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      email.trim(), passwordHash, company_name, contact_name,
      phone || null, address || null, city || null, province || 'AB',
      postal_code || null, lat || null, lng || null, region || 'north', notes || null
    ).run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.put('/customers/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const body = await c.req.json()
    const fields: string[] = []
    const params: any[] = []
    const allowed = ['email','company_name','contact_name','phone','address','city','province','postal_code','lat','lng','region','notes','is_active']
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); params.push(body[key]); }
    }
    if (body.password) { fields.push('password_hash = ?'); params.push(await hashPassword(body.password)); }
    if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
    fields.push("updated_at = datetime('now')")
    params.push(id)
    await c.env.DB.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.post('/customers/:id/toggle', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare(
      "UPDATE customers SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ══════════════════════════════════════════
// DRIVER / EMPLOYEE MANAGEMENT (CRUD)
// ══════════════════════════════════════════
employeeRoutes.get('/staff', async (c) => {
  try {
    const role = c.req.query('role')
    let sql = 'SELECT id, email, first_name, last_name, phone, role, is_active, created_at, updated_at FROM employees'
    const params: any[] = []
    if (role) { sql += ' WHERE role = ?'; params.push(role); }
    sql += ' ORDER BY first_name'
    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)
    const { results } = await stmt.all()
    return c.json({ employees: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.post('/staff', roleRequired('admin'), async (c) => {
  try {
    const { email, password, first_name, last_name, phone, role } = await c.req.json()
    if (!email || !password || !first_name || !last_name || !role) {
      return c.json({ error: 'Email, password, first name, last name, and role are required' }, 400)
    }
    const validRoles = ['admin','manager','driver','yard_operator']
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role. Must be: ' + validRoles.join(', ') }, 400)
    }
    const existing = await c.env.DB.prepare('SELECT id FROM employees WHERE LOWER(email) = LOWER(?)').bind(email.trim()).first()
    if (existing) {
      return c.json({ error: 'An employee with this email already exists' }, 409)
    }
    const passwordHash = await hashPassword(password)
    const result = await c.env.DB.prepare(
      'INSERT INTO employees (email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(email.trim(), passwordHash, first_name, last_name, phone || null, role).run()

    // Auto-create driver_status entry for new drivers
    if (role === 'driver') {
      await c.env.DB.prepare(
        'INSERT OR IGNORE INTO driver_status (employee_id, status) VALUES (?, ?)'
      ).bind(result.meta.last_row_id, 'idle').run()
    }

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.put('/staff/:id', roleRequired('admin'), async (c) => {
  const id = c.req.param('id')
  try {
    const body = await c.req.json()
    const fields: string[] = []
    const params: any[] = []
    const allowed = ['email','first_name','last_name','phone','role','is_active']
    for (const key of allowed) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); params.push(body[key]); }
    }
    if (body.password) { fields.push('password_hash = ?'); params.push(await hashPassword(body.password)); }
    if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
    fields.push("updated_at = datetime('now')")
    params.push(id)
    await c.env.DB.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.post('/staff/:id/toggle', roleRequired('admin'), async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare(
      "UPDATE employees SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ══════════════════════════════════════════
// VEHICLE MANAGEMENT (CRUD)
// ══════════════════════════════════════════
employeeRoutes.post('/vehicles', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { name, plate_number, vehicle_type, tare_weight } = await c.req.json()
    if (!name || !plate_number || !vehicle_type) {
      return c.json({ error: 'Name, plate number, and vehicle type are required' }, 400)
    }
    const existing = await c.env.DB.prepare('SELECT id FROM vehicles WHERE LOWER(plate_number) = LOWER(?)').bind(plate_number.trim()).first()
    if (existing) {
      return c.json({ error: 'A vehicle with this plate number already exists' }, 409)
    }
    const result = await c.env.DB.prepare(
      'INSERT INTO vehicles (name, plate_number, vehicle_type, tare_weight) VALUES (?, ?, ?, ?)'
    ).bind(name, plate_number.trim().toUpperCase(), vehicle_type, tare_weight || 0).run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.put('/vehicles/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const body = await c.req.json()
    const fields: string[] = []
    const params: any[] = []
    const allowed = ['name', 'plate_number', 'vehicle_type', 'tare_weight', 'is_active']
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`)
        params.push(key === 'plate_number' ? String(body[key]).trim().toUpperCase() : body[key])
      }
    }
    if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
    fields.push("updated_at = datetime('now')")
    params.push(id)
    await c.env.DB.prepare(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

employeeRoutes.post('/vehicles/:id/toggle', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare(
      "UPDATE vehicles SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
