import { Hono } from 'hono'
import { authMiddleware, employeeOnly } from '../middleware/auth'

type Bindings = { DB: D1Database }

export const pickupRoutes = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware
pickupRoutes.use('*', authMiddleware, employeeOnly)

// List pickup requests with filters (including region)
pickupRoutes.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const date = c.req.query('date')
    const region = c.req.query('region')
    
    let sql = `SELECT pr.*, c.company_name, c.contact_name, c.phone, c.address, c.city, c.lat, c.lng, c.region,
               e.first_name || ' ' || e.last_name as assigned_employee_name
               FROM pickup_requests pr 
               LEFT JOIN customers c ON pr.customer_id = c.id 
               LEFT JOIN employees e ON pr.assigned_employee_id = e.id
               WHERE 1=1`
    const params: any[] = []
    
    if (status) {
      // Support multiple statuses via repeated param or comma-separated
      const statuses = status.split(',')
      sql += ` AND pr.status IN (${statuses.map(() => '?').join(',')})`
      params.push(...statuses)
    }
    if (date) {
      sql += ' AND pr.preferred_date = ?'
      params.push(date)
    }
    if (region) {
      sql += ' AND c.region = ?'
      params.push(region)
    }
    
    sql += ' ORDER BY pr.created_at DESC LIMIT 100'
    
    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)
    
    const { results } = await stmt.all()
    return c.json({ pickups: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get single pickup
pickupRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const pickup = await c.env.DB.prepare(
      `SELECT pr.*, c.company_name, c.contact_name, c.phone, c.address, c.city, c.lat, c.lng, c.region
       FROM pickup_requests pr
       LEFT JOIN customers c ON pr.customer_id = c.id
       WHERE pr.id = ?`
    ).bind(id).first()
    
    if (!pickup) return c.json({ error: 'Not found' }, 404)
    return c.json({ pickup })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Allowed pickup_request status transitions. Anything not listed here
// (e.g. completed -> pending, cancelled -> in_progress) is rejected so
// finished work can't be silently re-opened or re-billed.
const PICKUP_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'scheduled', 'cancelled'],
  confirmed: ['scheduled', 'in_progress', 'cancelled'],
  scheduled: ['confirmed', 'in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

// Update pickup status
pickupRoutes.post('/:id/status', async (c) => {
  const id = c.req.param('id')
  try {
    const { status } = await c.req.json()
    const validStatuses = ['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled']

    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    const current = await c.env.DB.prepare('SELECT status FROM pickup_requests WHERE id = ?').bind(id).first()
    if (!current) return c.json({ error: 'Pickup not found' }, 404)
    const currentStatus = current.status as string
    if (currentStatus !== status) {
      const allowed = PICKUP_TRANSITIONS[currentStatus] || []
      if (!allowed.includes(status)) {
        return c.json({ error: `Cannot transition from ${currentStatus} to ${status}` }, 409)
      }
    }

    await c.env.DB.prepare(
      "UPDATE pickup_requests SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(status, id).run()

    // If status changed to 'scheduled' or 'confirmed' and notify is enabled, log notification
    if (status === 'scheduled' || status === 'confirmed') {
      const pickup = await c.env.DB.prepare(
        `SELECT pr.notify_customer, pr.preferred_date, pr.preferred_time_slot, 
                c.company_name, c.contact_name, c.phone
         FROM pickup_requests pr
         LEFT JOIN customers c ON pr.customer_id = c.id
         WHERE pr.id = ?`
      ).bind(id).first() as any

      if (pickup?.notify_customer && pickup?.phone) {
        const dateStr = pickup.preferred_date || 'your scheduled date'
        const timeStr = pickup.preferred_time_slot || 'your requested time'
        const message = `Reuse Canada is scheduled for your pickup on ${dateStr} at ${timeStr}. Thank you for choosing Reuse Canada!`
        await c.env.DB.prepare(
          `INSERT INTO notification_log (type, recipient, recipient_name, message, pickup_request_id, status)
           VALUES ('sms_schedule', ?, ?, ?, ?, 'sent')`
        ).bind(pickup.phone, pickup.contact_name || pickup.company_name, message, id).run()
      }
    }

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Toggle notify customer
pickupRoutes.post('/:id/notify', async (c) => {
  const id = c.req.param('id')
  try {
    const { notify_customer } = await c.req.json()
    await c.env.DB.prepare(
      "UPDATE pickup_requests SET notify_customer = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(notify_customer ? 1 : 0, id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Assign pickup to employee and schedule
pickupRoutes.post('/:id/assign', async (c) => {
  const id = c.req.param('id')
  try {
    const { employee_id, scheduled_date, notify_customer } = await c.req.json()
    
    if (!employee_id) {
      return c.json({ error: 'Employee ID is required' }, 400)
    }

    const notifyVal = notify_customer !== undefined ? (notify_customer ? 1 : 0) : null

    let sql = `UPDATE pickup_requests 
       SET assigned_employee_id = ?, preferred_date = COALESCE(?, preferred_date), 
           status = 'scheduled', updated_at = datetime('now')`
    const params: any[] = [employee_id, scheduled_date || null]

    if (notifyVal !== null) {
      sql += `, notify_customer = ?`
      params.push(notifyVal)
    }

    sql += ` WHERE id = ?`
    params.push(id)

    await c.env.DB.prepare(sql).bind(...params).run()

    // Send notification if enabled
    if (notify_customer) {
      const pickup = await c.env.DB.prepare(
        `SELECT pr.preferred_date, pr.preferred_time_slot,
                c.company_name, c.contact_name, c.phone
         FROM pickup_requests pr
         LEFT JOIN customers c ON pr.customer_id = c.id
         WHERE pr.id = ?`
      ).bind(id).first() as any

      if (pickup?.phone) {
        const dateStr = scheduled_date || pickup.preferred_date || 'your scheduled date'
        const timeStr = pickup.preferred_time_slot || 'your requested time'
        const message = `Reuse Canada is scheduled for your pickup on ${dateStr} at ${timeStr}. Thank you for choosing Reuse Canada!`
        await c.env.DB.prepare(
          `INSERT INTO notification_log (type, recipient, recipient_name, message, pickup_request_id, status)
           VALUES ('sms_schedule', ?, ?, ?, ?, 'sent')`
        ).bind(pickup.phone, pickup.contact_name || pickup.company_name, message, id).run()
      }
    }

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
