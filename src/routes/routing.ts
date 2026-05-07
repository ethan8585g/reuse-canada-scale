import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

export const routeRoutes = new Hono<{ Bindings: Bindings }>()

routeRoutes.use('*', authMiddleware, employeeOnly)

// Look up the caller's role. Used to scope list/read endpoints so a driver
// only sees their own routes — the page-level filter that used to do this
// was client-side only and bypassable in devtools.
async function callerRole(c: any): Promise<string> {
  const userId = c.get('userId')
  const row = await c.env.DB.prepare('SELECT role FROM employees WHERE id = ?').bind(userId).first()
  return (row?.role as string) || ''
}

// List routes with filters. Drivers see only routes assigned to them.
routeRoutes.get('/', async (c) => {
  try {
    const date = c.req.query('date')
    const employeeId = c.req.query('employee_id')
    const role = await callerRole(c)
    const userId = c.get('userId')

    let sql = `SELECT r.*, e.first_name || ' ' || e.last_name as driver_name,
               (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id) as stop_count
               FROM routes r
               LEFT JOIN employees e ON r.assigned_employee_id = e.id
               WHERE 1=1`
    const params: any[] = []

    if (role === 'driver') {
      sql += ' AND r.assigned_employee_id = ?'
      params.push(userId)
    } else if (employeeId) {
      sql += ' AND r.assigned_employee_id = ?'
      params.push(employeeId)
    }

    if (date) {
      sql += ' AND r.date = ?'
      params.push(date)
    }

    sql += ' ORDER BY r.date DESC, r.created_at DESC LIMIT 50'

    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)

    const { results } = await stmt.all()
    return c.json({ routes: results })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Get single route with stops. Drivers can only read their own routes.
routeRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const route = await c.env.DB.prepare(
      `SELECT r.*, e.first_name || ' ' || e.last_name as driver_name
       FROM routes r
       LEFT JOIN employees e ON r.assigned_employee_id = e.id
       WHERE r.id = ?`
    ).bind(id).first()

    if (!route) return c.json({ error: 'Route not found' }, 404)

    const role = await callerRole(c)
    const userId = c.get('userId')
    if (role === 'driver' && (route.assigned_employee_id as number) !== userId) {
      return c.json({ error: 'Route not found' }, 404)
    }

    const { results: stops } = await c.env.DB.prepare(
      `SELECT rs.*, c.company_name, c.contact_name, c.phone, c.address, c.city, c.lat, c.lng,
              pr.estimated_tire_count, pr.tire_type
       FROM route_stops rs
       LEFT JOIN customers c ON rs.customer_id = c.id
       LEFT JOIN pickup_requests pr ON rs.pickup_request_id = pr.id
       WHERE rs.route_id = ?
       ORDER BY rs.stop_order`
    ).bind(id).all()

    return c.json({ route, stops })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Create new route — admin/manager only. Drivers don't plan their own.
routeRoutes.post('/', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { name, date, assigned_employee_id, vehicle, pickup_ids, notes } = await c.req.json()

    if (!name || !date || !assigned_employee_id) {
      return c.json({ error: 'Name, date, and driver are required' }, 400)
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO routes (name, date, assigned_employee_id, vehicle, notes) VALUES (?, ?, ?, ?, ?)`
    ).bind(name, date, assigned_employee_id, vehicle || null, notes || null).run()

    const routeId = result.meta.last_row_id

    if (pickup_ids && pickup_ids.length > 0) {
      for (let i = 0; i < pickup_ids.length; i++) {
        const pickupId = pickup_ids[i]

        const pickup = await c.env.DB.prepare(
          'SELECT customer_id FROM pickup_requests WHERE id = ?'
        ).bind(pickupId).first()

        if (pickup) {
          await c.env.DB.prepare(
            `INSERT INTO route_stops (route_id, pickup_request_id, customer_id, stop_order) VALUES (?, ?, ?, ?)`
          ).bind(routeId, pickupId, pickup.customer_id, i + 1).run()

          await c.env.DB.prepare(
            `UPDATE pickup_requests SET status = 'scheduled', assigned_employee_id = ?, assigned_route_id = ?, updated_at = datetime('now') WHERE id = ?`
          ).bind(assigned_employee_id, routeId, pickupId).run()
        }
      }
    }

    return c.json({ success: true, id: routeId })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Update route status. Drivers can only progress their own routes.
routeRoutes.post('/:id/status', async (c) => {
  const id = c.req.param('id')
  try {
    const { status } = await c.req.json()
    const validStatuses = ['planned', 'in_progress', 'completed']

    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    const role = await callerRole(c)
    const userId = c.get('userId')
    if (role === 'driver') {
      const owned = await c.env.DB.prepare('SELECT assigned_employee_id FROM routes WHERE id = ?').bind(id).first()
      if (!owned) return c.json({ error: 'Route not found' }, 404)
      if ((owned.assigned_employee_id as number) !== userId) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    }

    let sql = "UPDATE routes SET status = ?, updated_at = datetime('now')"
    const params: any[] = [status]

    if (status === 'in_progress') {
      sql += ", started_at = datetime('now')"
    } else if (status === 'completed') {
      sql += ", completed_at = datetime('now')"
    }

    sql += ' WHERE id = ?'
    params.push(id)

    await c.env.DB.prepare(sql).bind(...params).run()
    return c.json({ success: true })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Update route stop status. Drivers can only update stops on their own routes,
// AND only stops that actually belong to the URL's :routeId — prevents
// cross-route mutation by ID guessing.
routeRoutes.post('/:routeId/stops/:stopId/status', async (c) => {
  const routeId = c.req.param('routeId')
  const stopId = c.req.param('stopId')
  try {
    const { status } = await c.req.json()
    const validStatuses = ['pending', 'arrived', 'completed', 'skipped']

    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    const stop = await c.env.DB.prepare(
      `SELECT rs.id, r.assigned_employee_id
       FROM route_stops rs
       LEFT JOIN routes r ON rs.route_id = r.id
       WHERE rs.id = ? AND rs.route_id = ?`
    ).bind(stopId, routeId).first()
    if (!stop) return c.json({ error: 'Stop not found' }, 404)

    const role = await callerRole(c)
    const userId = c.get('userId')
    if (role === 'driver' && (stop.assigned_employee_id as number) !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const now = new Date().toISOString()
    let sql = 'UPDATE route_stops SET status = ?'
    const params: any[] = [status]

    if (status === 'arrived') {
      sql += ', arrived_at = ?'
      params.push(now)
    } else if (status === 'completed') {
      sql += ', departed_at = ?'
      params.push(now)
    }

    sql += ' WHERE id = ?'
    params.push(stopId)

    await c.env.DB.prepare(sql).bind(...params).run()
    return c.json({ success: true })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
