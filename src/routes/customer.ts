import { Hono } from 'hono'
import { authMiddleware, customerOnly } from '../middleware/auth'

type Bindings = { DB: D1Database }

export const customerRoutes = new Hono<{ Bindings: Bindings }>()

customerRoutes.use('*', authMiddleware, customerOnly)

const TIRE_TYPES = ['passenger', 'light_truck', 'medium_truck', 'heavy_truck', 'truck', 'otr', 'mixed', 'off-road']
const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'anytime']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Get customer's pickup requests
customerRoutes.get('/pickups', async (c) => {
  const customerId = c.get('userId')
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM pickup_requests WHERE customer_id = ? ORDER BY created_at DESC LIMIT 200'
    ).bind(customerId).all()
    return c.json({ pickups: results })
  } catch (err: any) {
    console.error('customer /pickups GET error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Submit new pickup request — strict server-side validation. The customer
// controls every field on this body and downstream code (date filters,
// reports, anomaly detection) assumes well-formed values.
customerRoutes.post('/pickups', async (c) => {
  const customerId = c.get('userId')
  try {
    const body = await c.req.json()
    const { estimated_tire_count, tire_type, preferred_date, preferred_time_slot, notes } = body

    if (!Number.isInteger(estimated_tire_count) || estimated_tire_count <= 0 || estimated_tire_count > 10000) {
      return c.json({ error: 'Tire count must be a positive integer up to 10,000' }, 400)
    }
    if (typeof tire_type !== 'string' || !TIRE_TYPES.includes(tire_type)) {
      return c.json({ error: `Tire type must be one of: ${TIRE_TYPES.join(', ')}` }, 400)
    }
    if (preferred_date !== undefined && preferred_date !== null && preferred_date !== '') {
      if (typeof preferred_date !== 'string' || !DATE_RE.test(preferred_date)) {
        return c.json({ error: 'preferred_date must be YYYY-MM-DD' }, 400)
      }
    }
    const slot = preferred_time_slot || 'anytime'
    if (typeof slot !== 'string' || !TIME_SLOTS.includes(slot)) {
      return c.json({ error: `preferred_time_slot must be one of: ${TIME_SLOTS.join(', ')}` }, 400)
    }
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') return c.json({ error: 'notes must be a string' }, 400)
      if (notes.length > 2000) return c.json({ error: 'notes too long (max 2000 chars)' }, 400)
    }

    const result = await c.env.DB.prepare(
      'INSERT INTO pickup_requests (customer_id, estimated_tire_count, tire_type, preferred_date, preferred_time_slot, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(customerId, estimated_tire_count, tire_type, preferred_date || null, slot, notes || null).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (err: any) {
    console.error('customer /pickups POST error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Get single pickup request
customerRoutes.get('/pickups/:id', async (c) => {
  const customerId = c.get('userId')
  const pickupId = c.req.param('id')
  try {
    const pickup = await c.env.DB.prepare(
      'SELECT * FROM pickup_requests WHERE id = ? AND customer_id = ?'
    ).bind(pickupId, customerId).first()
    if (!pickup) return c.json({ error: 'Not found' }, 404)
    return c.json({ pickup })
  } catch (err: any) {
    console.error('customer /pickups/:id GET error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})
