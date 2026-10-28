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

// ── Geocoding ────────────────────────────────────────────────────────────
// Nothing else in the app turns a customer's address into lat/lng, so without
// this a customer created through the UI never appears on the route map.
// OpenStreetMap Nominatim: no key, but its usage policy is max 1 request/sec
// with an identifying User-Agent — hence the small batch and the sleep.
// Misses are remembered against the exact query, so an unfindable address is
// not re-sent on every page load, but editing the address retries it.
const GEOCODE_UA = 'ReuseCanadaScale-Routing/1.0 (www.reusecanadascale.com)'
const GEOCODE_BATCH = 5

async function ensureGeocodeMisses(db: D1Database) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS customer_geocode_misses (
       customer_id INTEGER PRIMARY KEY,
       query TEXT NOT NULL,
       tried_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`
  ).run()
}

function geocodeQuery(cust: any): string {
  return [cust.address, cust.city, [cust.province || 'AB', cust.postal_code].filter(Boolean).join(' '), 'Canada']
    .filter((p) => p && String(p).trim()).join(', ')
}

async function nominatim(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ca`
    const res = await fetch(url, { headers: { 'User-Agent': GEOCODE_UA } })
    if (!res.ok) return null
    const data = await res.json() as any[]
    if (!data?.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// Fill in coordinates for customers that have an address but no location.
// Customers with open pickups go first, since those are the ones a planner
// is about to put on a map. Deliberately does not fall back to a city-only
// match: a pin in the middle of Edmonton looks precise and would mislead the
// stop order.
routeRoutes.post('/geocode-missing', roleRequired('admin', 'manager'), async (c) => {
  try {
    await ensureGeocodeMisses(c.env.DB)
    const { results } = await c.env.DB.prepare(
      `SELECT c.id, c.address, c.city, c.province, c.postal_code, m.query AS missed_query,
              EXISTS (SELECT 1 FROM pickup_requests pr WHERE pr.customer_id = c.id
                      AND pr.status IN ('pending','confirmed','scheduled','in_progress')) AS has_open
       FROM customers c
       LEFT JOIN customer_geocode_misses m ON m.customer_id = c.id
       WHERE c.is_active = 1 AND (c.lat IS NULL OR c.lng IS NULL)
         AND c.address IS NOT NULL AND TRIM(c.address) != ''
       ORDER BY has_open DESC, c.id`
    ).all()

    const todo = (results as any[]).filter((r) => r.missed_query !== geocodeQuery(r))
    const batch = todo.slice(0, GEOCODE_BATCH)
    let found = 0
    for (let i = 0; i < batch.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 1100))
      const cust = batch[i]
      const q = geocodeQuery(cust)
      const hit = await nominatim(q) || await nominatim([cust.address, cust.city, 'Alberta, Canada'].filter(Boolean).join(', '))
      if (hit) {
        await c.env.DB.prepare(
          `UPDATE customers SET lat = ?, lng = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(hit.lat, hit.lng, cust.id).run()
        await c.env.DB.prepare('DELETE FROM customer_geocode_misses WHERE customer_id = ?').bind(cust.id).run()
        found++
      } else {
        await c.env.DB.prepare(
          `INSERT INTO customer_geocode_misses (customer_id, query) VALUES (?, ?)
           ON CONFLICT(customer_id) DO UPDATE SET query = excluded.query, tried_at = datetime('now')`
        ).bind(cust.id, q).run()
      }
    }
    return c.json({ checked: batch.length, found, remaining: todo.length - batch.length })
  } catch (err: any) {
    console.error('routing geocode error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

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
              pr.estimated_tire_count, pr.tire_type, pr.job_number
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

// ── Editing an existing route (admin/manager) ────────────────────────────
// Before these existed a route could only be built in one go from the Create
// modal; a forgotten pickup meant deleting nothing and starting over.

async function editableRoute(c: any, id: string) {
  const route = await c.env.DB.prepare('SELECT id, status, assigned_employee_id FROM routes WHERE id = ?').bind(id).first()
  if (!route) return { error: c.json({ error: 'Route not found' }, 404) }
  if (route.status === 'completed') return { error: c.json({ error: 'This route is completed and can no longer be changed' }, 409) }
  return { route }
}

// Append pickups to the end of a route. Pickups already on a route are
// skipped rather than moved, so two planners can't silently steal stops.
routeRoutes.post('/:id/stops', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { route, error } = await editableRoute(c, id)
    if (error) return error
    const { pickup_ids } = await c.req.json()
    if (!Array.isArray(pickup_ids) || pickup_ids.length === 0) return c.json({ error: 'No pickups selected' }, 400)

    const last = await c.env.DB.prepare('SELECT COALESCE(MAX(stop_order), 0) AS n FROM route_stops WHERE route_id = ?').bind(id).first()
    let order = (last?.n as number) || 0
    let added = 0, skipped = 0
    for (const pickupId of pickup_ids) {
      const pickup = await c.env.DB.prepare(
        `SELECT customer_id, assigned_route_id, status FROM pickup_requests WHERE id = ?`
      ).bind(pickupId).first()
      if (!pickup || pickup.assigned_route_id || !['pending', 'confirmed', 'scheduled'].includes(pickup.status as string)) {
        skipped++
        continue
      }
      order++
      await c.env.DB.prepare(
        `INSERT INTO route_stops (route_id, pickup_request_id, customer_id, stop_order) VALUES (?, ?, ?, ?)`
      ).bind(id, pickupId, pickup.customer_id, order).run()
      await c.env.DB.prepare(
        `UPDATE pickup_requests SET status = 'scheduled', assigned_employee_id = ?, assigned_route_id = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(route.assigned_employee_id, id, pickupId).run()
      added++
    }
    // The stored distance described the old stop list.
    if (added) await c.env.DB.prepare(`UPDATE routes SET total_distance_km = NULL, total_duration_minutes = NULL, updated_at = datetime('now') WHERE id = ?`).bind(id).run()
    return c.json({ success: true, added, skipped })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Take a stop off a route and hand its pickup back to the unassigned pool.
// A stop the driver has already reached is history, not a plan — refused.
routeRoutes.delete('/:id/stops/:stopId', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  const stopId = c.req.param('stopId')
  try {
    const { error } = await editableRoute(c, id)
    if (error) return error
    const stop = await c.env.DB.prepare(
      'SELECT id, status, pickup_request_id FROM route_stops WHERE id = ? AND route_id = ?'
    ).bind(stopId, id).first()
    if (!stop) return c.json({ error: 'Stop not found' }, 404)
    if (stop.status === 'arrived' || stop.status === 'completed') {
      return c.json({ error: 'The driver has already reached this stop' }, 409)
    }

    await c.env.DB.prepare('DELETE FROM route_stops WHERE id = ?').bind(stopId).run()
    if (stop.pickup_request_id) {
      await c.env.DB.prepare(
        `UPDATE pickup_requests SET status = 'confirmed', assigned_employee_id = NULL, assigned_route_id = NULL, updated_at = datetime('now')
         WHERE id = ? AND status = 'scheduled'`
      ).bind(stop.pickup_request_id).run()
    }
    await c.env.DB.prepare(`UPDATE routes SET total_distance_km = NULL, total_duration_minutes = NULL, updated_at = datetime('now') WHERE id = ?`).bind(id).run()
    // Close the gap so stop numbers on the driver's sheet stay 1..n.
    const { results } = await c.env.DB.prepare('SELECT id FROM route_stops WHERE route_id = ? ORDER BY stop_order').bind(id).all()
    for (let i = 0; i < results.length; i++) {
      await c.env.DB.prepare('UPDATE route_stops SET stop_order = ? WHERE id = ?').bind(i + 1, (results[i] as any).id).run()
    }
    return c.json({ success: true })
  } catch (err: any) {
    console.error('routing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Set the stop order (manual up/down or "Optimize order"). The list must be
// exactly this route's stops, so a stale page can't drop or duplicate one.
routeRoutes.post('/:id/reorder', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { error } = await editableRoute(c, id)
    if (error) return error
    const { stop_ids, total_distance_km, total_duration_minutes } = await c.req.json()
    const { results } = await c.env.DB.prepare('SELECT id FROM route_stops WHERE route_id = ?').bind(id).all()
    const current = new Set((results as any[]).map((r) => Number(r.id)))
    const wanted = Array.isArray(stop_ids) ? stop_ids.map(Number) : []
    if (wanted.length !== current.size || new Set(wanted).size !== wanted.length || !wanted.every((s) => current.has(s))) {
      return c.json({ error: 'The route changed since you loaded it — refresh and try again' }, 409)
    }
    for (let i = 0; i < wanted.length; i++) {
      await c.env.DB.prepare('UPDATE route_stops SET stop_order = ? WHERE id = ?').bind(i + 1, wanted[i]).run()
    }
    // A new order without a measured distance makes the stored one wrong, so clear it.
    const km = Number.isFinite(total_distance_km) ? total_distance_km : null
    const min = Number.isFinite(total_duration_minutes) ? Math.round(total_duration_minutes) : null
    await c.env.DB.prepare(
      `UPDATE routes SET total_distance_km = ?, total_duration_minutes = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(km, min, id).run()
    return c.json({ success: true })
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
