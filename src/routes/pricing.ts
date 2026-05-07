import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

export const pricingRoutes = new Hono<{ Bindings: Bindings }>()

pricingRoutes.use('*', authMiddleware, employeeOnly)

// Get all pricing
pricingRoutes.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM pricing WHERE is_active = 1 ORDER BY material_type'
    ).all()
    return c.json({ pricing: results })
  } catch (err: any) {
    console.error('pricing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Update pricing — admin/manager only. Money rates change billing for every
// scale ticket, so drivers and yard operators must not be able to write here.
pricingRoutes.post('/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { price_per_kg, price_per_tire } = await c.req.json()

    // Negative or NaN prices silently corrupt every ticket priced after the
    // update — validate before binding.
    if (typeof price_per_kg !== 'number' || !Number.isFinite(price_per_kg) || price_per_kg < 0 || price_per_kg > 1000) {
      return c.json({ error: 'price_per_kg must be a non-negative finite number' }, 400)
    }
    const perTire = price_per_tire ?? 0
    if (typeof perTire !== 'number' || !Number.isFinite(perTire) || perTire < 0 || perTire > 1000) {
      return c.json({ error: 'price_per_tire must be a non-negative finite number' }, 400)
    }

    const result = await c.env.DB.prepare(
      `UPDATE pricing SET price_per_kg = ?, price_per_tire = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(price_per_kg, perTire, id).run()
    if ((result.meta?.changes ?? 0) === 0) return c.json({ error: 'Pricing row not found' }, 404)
    return c.json({ success: true })
  } catch (err: any) {
    console.error('pricing POST error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})
