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
    return c.json({ error: err.message }, 500)
  }
})

// Update pricing — admin/manager only. Money rates change billing for every
// scale ticket, so drivers and yard operators must not be able to write here.
pricingRoutes.post('/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { price_per_kg, price_per_tire } = await c.req.json()
    await c.env.DB.prepare(
      `UPDATE pricing SET price_per_kg = ?, price_per_tire = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(price_per_kg, price_per_tire || 0, id).run()
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
