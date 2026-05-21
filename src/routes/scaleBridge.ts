import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

// The web scale-bridge: the scale-house terminal POSTs its live reading here
// so other clients (phones, the scale-tickets weight modal, the office) can
// pull the same value without needing their own Web Bluetooth pairing.
//
// Distinct from `scale-bridge.js`, which is a local USB-Serial → localhost
// helper that runs on the scale-house PC. This route is the network-side
// fan-out.

export const scaleBridgeRoutes = new Hono<{ Bindings: Bindings }>()

scaleBridgeRoutes.use('*', authMiddleware, employeeOnly)

// Scale-house terminal publishes the current reading. Gated to the roles
// that actually operate the scale so a compromised driver session can't
// poison the value every other client trusts.
scaleBridgeRoutes.post('/publish',
  roleRequired('admin', 'manager', 'yard_operator'),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({})) as any
      const weight = Number(body?.weight)
      const stable = body?.stable ? 1 : 0
      const modeRaw = typeof body?.connection_mode === 'string' ? body.connection_mode : null
      const mode = modeRaw ? modeRaw.slice(0, 16) : null

      if (!Number.isFinite(weight)) {
        return c.json({ error: 'weight must be a finite number' }, 400)
      }
      // Reject obvious junk readings — the APX is rated ~30 t, anything past
      // 200 t is wrong and should not be propagated to other clients.
      if (Math.abs(weight) > 200000) {
        return c.json({ error: 'weight out of range' }, 400)
      }

      const employeeId = c.get('userId')
      await c.env.DB.prepare(
        `UPDATE scale_bridge_state
         SET weight_kg = ?, is_stable = ?, connection_mode = ?,
             publisher_employee_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`
      ).bind(weight, stable, mode, employeeId).run()

      return c.json({ ok: true })
    } catch (err: any) {
      return c.json({ error: err?.message || 'publish failed' }, 500)
    }
  }
)

// Any logged-in employee can read the most-recent published weight.
// Returns staleness so the caller can refuse to use an old reading.
scaleBridgeRoutes.get('/current', async (c) => {
  try {
    const row = await c.env.DB.prepare(
      `SELECT s.weight_kg, s.is_stable, s.connection_mode, s.updated_at,
              s.publisher_employee_id,
              e.first_name || ' ' || e.last_name AS publisher_name,
              CAST((julianday('now') - julianday(s.updated_at)) * 86400 AS INTEGER) AS age_seconds
       FROM scale_bridge_state s
       LEFT JOIN employees e ON s.publisher_employee_id = e.id
       WHERE s.id = 1`
    ).first<any>()

    if (!row) {
      return c.json({
        weight_kg: 0,
        is_stable: false,
        connection_mode: null,
        updated_at: null,
        age_seconds: null,
        publisher_name: null,
        fresh: false,
      })
    }

    const age = row.age_seconds
    // A reading older than 15s is treated as stale to match the scale-house
    // STALE_AFTER_MS guard — keeps both sides agreeing on "is the scale live".
    const fresh = typeof age === 'number' && age >= 0 && age < 15 && !!row.connection_mode

    return c.json({
      weight_kg: row.weight_kg,
      is_stable: !!row.is_stable,
      connection_mode: row.connection_mode,
      updated_at: row.updated_at,
      age_seconds: age,
      publisher_name: row.publisher_name || null,
      fresh,
    })
  } catch (err: any) {
    return c.json({ error: err?.message || 'read failed' }, 500)
  }
})
