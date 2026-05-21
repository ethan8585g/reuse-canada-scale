import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

// Crane materials pricing. Parallel to /api/pricing but reads/writes the
// crane_pricing table so the crane operator's material list is independent of
// the Scale House's tire categories.

export const cranePricingRoutes = new Hono<{ Bindings: Bindings }>()

cranePricingRoutes.use('*', authMiddleware, employeeOnly)

cranePricingRoutes.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM crane_pricing WHERE is_active = 1 ORDER BY material_type'
    ).all()
    return c.json({ pricing: results })
  } catch (err: any) {
    console.error('cranePricing error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

cranePricingRoutes.post('/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { price_per_kg, price_per_tire, description } = await c.req.json()

    if (typeof price_per_kg !== 'number' || !Number.isFinite(price_per_kg) || price_per_kg < 0 || price_per_kg > 1000) {
      return c.json({ error: 'price_per_kg must be a non-negative finite number' }, 400)
    }
    const perTire = price_per_tire ?? 0
    if (typeof perTire !== 'number' || !Number.isFinite(perTire) || perTire < 0 || perTire > 1000) {
      return c.json({ error: 'price_per_tire must be a non-negative finite number' }, 400)
    }

    const desc = typeof description === 'string' ? description.trim().slice(0, 200) : null

    const result = await c.env.DB.prepare(
      `UPDATE crane_pricing SET price_per_kg = ?, price_per_tire = ?, description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?`
    ).bind(price_per_kg, perTire, desc, id).run()
    if ((result.meta?.changes ?? 0) === 0) return c.json({ error: 'Pricing row not found' }, 404)
    return c.json({ success: true })
  } catch (err: any) {
    console.error('cranePricing POST error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

cranePricingRoutes.post('/', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { material_type, description, price_per_kg, price_per_tire } = await c.req.json()

    if (typeof material_type !== 'string' || !material_type.trim()) {
      return c.json({ error: 'material_type slug is required' }, 400)
    }
    const slug = material_type.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 50)
    if (!slug) return c.json({ error: 'material_type slug is invalid' }, 400)

    if (typeof description !== 'string' || !description.trim()) {
      return c.json({ error: 'description (display name) is required' }, 400)
    }
    const desc = description.trim().slice(0, 200)

    if (typeof price_per_kg !== 'number' || !Number.isFinite(price_per_kg) || price_per_kg < 0 || price_per_kg > 1000) {
      return c.json({ error: 'price_per_kg must be a non-negative finite number' }, 400)
    }
    const perTire = price_per_tire ?? 0
    if (typeof perTire !== 'number' || !Number.isFinite(perTire) || perTire < 0 || perTire > 1000) {
      return c.json({ error: 'price_per_tire must be a non-negative finite number' }, 400)
    }

    const existing = await c.env.DB.prepare(
      'SELECT id, is_active FROM crane_pricing WHERE material_type = ?'
    ).bind(slug).first<{ id: number, is_active: number }>()
    if (existing) {
      if (existing.is_active === 1) return c.json({ error: 'A material with this slug already exists' }, 409)
      await c.env.DB.prepare(
        `UPDATE crane_pricing SET description = ?, price_per_kg = ?, price_per_tire = ?, is_active = 1, updated_at = datetime('now') WHERE id = ?`
      ).bind(desc, price_per_kg, perTire, existing.id).run()
      return c.json({ id: existing.id, material_type: slug, reactivated: true })
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO crane_pricing (material_type, description, price_per_kg, price_per_tire, is_active) VALUES (?, ?, ?, ?, 1)`
    ).bind(slug, desc, price_per_kg, perTire).run()
    return c.json({ id: result.meta.last_row_id, material_type: slug })
  } catch (err: any) {
    console.error('cranePricing CREATE error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

cranePricingRoutes.delete('/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const result = await c.env.DB.prepare(
      `UPDATE crane_pricing SET is_active = 0, updated_at = datetime('now') WHERE id = ?`
    ).bind(id).run()
    if ((result.meta?.changes ?? 0) === 0) return c.json({ error: 'Pricing row not found' }, 404)
    return c.json({ success: true })
  } catch (err: any) {
    console.error('cranePricing DELETE error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})
