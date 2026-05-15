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
    const { price_per_kg, price_per_tire, description } = await c.req.json()

    // Negative or NaN prices silently corrupt every ticket priced after the
    // update — validate before binding.
    if (typeof price_per_kg !== 'number' || !Number.isFinite(price_per_kg) || price_per_kg < 0 || price_per_kg > 1000) {
      return c.json({ error: 'price_per_kg must be a non-negative finite number' }, 400)
    }
    const perTire = price_per_tire ?? 0
    if (typeof perTire !== 'number' || !Number.isFinite(perTire) || perTire < 0 || perTire > 1000) {
      return c.json({ error: 'price_per_tire must be a non-negative finite number' }, 400)
    }

    const desc = typeof description === 'string' ? description.trim().slice(0, 200) : null

    const result = await c.env.DB.prepare(
      `UPDATE pricing SET price_per_kg = ?, price_per_tire = ?, description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?`
    ).bind(price_per_kg, perTire, desc, id).run()
    if ((result.meta?.changes ?? 0) === 0) return c.json({ error: 'Pricing row not found' }, 404)
    return c.json({ success: true })
  } catch (err: any) {
    console.error('pricing POST error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Create a new material+price. material_type is the slug used by scale_tickets;
// it must be unique and is immutable once tickets reference it. admin/manager only.
pricingRoutes.post('/', roleRequired('admin', 'manager'), async (c) => {
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

    // Reactivate a previously soft-deleted row with this slug rather than
    // creating a duplicate that violates the UNIQUE constraint.
    const existing = await c.env.DB.prepare(
      'SELECT id, is_active FROM pricing WHERE material_type = ?'
    ).bind(slug).first<{ id: number, is_active: number }>()
    if (existing) {
      if (existing.is_active === 1) return c.json({ error: 'A material with this slug already exists' }, 409)
      await c.env.DB.prepare(
        `UPDATE pricing SET description = ?, price_per_kg = ?, price_per_tire = ?, is_active = 1, updated_at = datetime('now') WHERE id = ?`
      ).bind(desc, price_per_kg, perTire, existing.id).run()
      return c.json({ id: existing.id, material_type: slug, reactivated: true })
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO pricing (material_type, description, price_per_kg, price_per_tire, is_active) VALUES (?, ?, ?, ?, 1)`
    ).bind(slug, desc, price_per_kg, perTire).run()
    return c.json({ id: result.meta.last_row_id, material_type: slug })
  } catch (err: any) {
    console.error('pricing CREATE error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Soft-delete a material — keeps the row so historical tickets still resolve
// their material name via JOIN, but the slug stops appearing in pickers.
pricingRoutes.delete('/:id', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const result = await c.env.DB.prepare(
      `UPDATE pricing SET is_active = 0, updated_at = datetime('now') WHERE id = ?`
    ).bind(id).run()
    if ((result.meta?.changes ?? 0) === 0) return c.json({ error: 'Pricing row not found' }, 404)
    return c.json({ success: true })
  } catch (err: any) {
    console.error('pricing DELETE error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})
