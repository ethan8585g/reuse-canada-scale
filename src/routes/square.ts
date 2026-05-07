import { Hono } from 'hono'
import { authMiddleware, employeeOnly } from '../middleware/auth'

type Bindings = {
  DB: D1Database
  SQUARE_ACCESS_TOKEN: string
  SQUARE_APP_ID: string
}

export const squareRoutes = new Hono<{ Bindings: Bindings }>()

squareRoutes.use('*', authMiddleware, employeeOnly)

const SQUARE_BASE = 'https://connect.squareup.com/v2'

// Create a terminal checkout (sends payment to Square Terminal reader)
squareRoutes.post('/terminal-checkout', async (c) => {
  try {
    const { amount_cents, ticket_number, customer_name, note, device_id } = await c.req.json()
    
    if (!amount_cents || amount_cents <= 0) {
      return c.json({ error: 'Valid amount is required' }, 400)
    }

    const idempotencyKey = crypto.randomUUID()
    
    const body: any = {
      idempotency_key: idempotencyKey,
      checkout: {
        amount_money: {
          amount: Math.round(amount_cents),
          currency: 'CAD'
        },
        reference_id: ticket_number || '',
        note: note || `Scale Ticket ${ticket_number} - ${customer_name || 'Walk-in'}`,
        device_options: {
          skip_receipt_screen: false,
          collect_signature: false,
          show_itemized_cart: false
        },
        payment_type: 'CARD_PRESENT'
      }
    }

    // If a device_id is specified, target that specific terminal
    if (device_id) {
      body.checkout.device_options.device_id = device_id
    }

    const res = await fetch(`${SQUARE_BASE}/terminals/checkouts`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-12-18',
        'Authorization': `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await res.json() as any
    
    if (!res.ok) {
      console.error('Square terminal checkout error:', JSON.stringify(data))
      return c.json({ 
        error: data.errors?.[0]?.detail || 'Failed to create terminal checkout',
        errors: data.errors 
      }, res.status)
    }

    return c.json({
      success: true,
      checkout_id: data.checkout?.id,
      status: data.checkout?.status,
      checkout: data.checkout
    })
  } catch (err: any) {
    console.error('Square terminal error:', err)
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Check terminal checkout status
squareRoutes.get('/terminal-checkout/:id', async (c) => {
  const checkoutId = c.req.param('id')
  try {
    const res = await fetch(`${SQUARE_BASE}/terminals/checkouts/${checkoutId}`, {
      headers: {
        'Square-Version': '2024-12-18',
        'Authorization': `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
      }
    })
    const data = await res.json() as any
    if (!res.ok) {
      return c.json({ error: data.errors?.[0]?.detail || 'Failed to get checkout status' }, res.status)
    }
    return c.json({
      checkout_id: data.checkout?.id,
      status: data.checkout?.status,
      payment_ids: data.checkout?.payment_ids,
      checkout: data.checkout
    })
  } catch (err: any) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Cancel a terminal checkout
squareRoutes.post('/terminal-checkout/:id/cancel', async (c) => {
  const checkoutId = c.req.param('id')
  try {
    const res = await fetch(`${SQUARE_BASE}/terminals/checkouts/${checkoutId}/cancel`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-12-18',
        'Authorization': `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    })
    const data = await res.json() as any
    return c.json({ success: res.ok, checkout: data.checkout, errors: data.errors })
  } catch (err: any) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Create a direct payment (for when you have a payment source like a nonce)
squareRoutes.post('/payment', async (c) => {
  try {
    const { amount_cents, source_id, ticket_number, customer_name, note } = await c.req.json()

    const res = await fetch(`${SQUARE_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-12-18',
        'Authorization': `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        source_id: source_id || 'CASH',
        amount_money: {
          amount: Math.round(amount_cents),
          currency: 'CAD'
        },
        reference_id: ticket_number || '',
        note: note || `Scale Ticket ${ticket_number}`
      })
    })

    const data = await res.json() as any
    if (!res.ok) {
      return c.json({ error: data.errors?.[0]?.detail || 'Payment failed', errors: data.errors }, res.status)
    }

    return c.json({
      success: true,
      payment_id: data.payment?.id,
      status: data.payment?.status,
      payment: data.payment
    })
  } catch (err: any) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// List Square Terminal devices
squareRoutes.get('/devices', async (c) => {
  try {
    const res = await fetch(`${SQUARE_BASE}/devices`, {
      headers: {
        'Square-Version': '2024-12-18',
        'Authorization': `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
      }
    })
    const data = await res.json() as any
    return c.json({ devices: data.devices || [] })
  } catch (err: any) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Record cash payment in our system (no Square call needed)
squareRoutes.post('/cash-payment', async (c) => {
  try {
    const { scale_ticket_id, amount } = await c.req.json()

    // Validate inputs — without these, "amount = -50" or
    // "scale_ticket_id = 'DROP TABLE'" both flow straight into the UPDATE.
    if (!Number.isInteger(scale_ticket_id) || scale_ticket_id <= 0) {
      return c.json({ error: 'Valid scale_ticket_id required' }, 400)
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return c.json({ error: 'Valid positive amount required' }, 400)
    }

    // Verify the ticket exists; otherwise the payment_log row points at nothing.
    const ticket = await c.env.DB.prepare('SELECT id, grand_total FROM scale_tickets WHERE id = ?').bind(scale_ticket_id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    // Idempotency: a ticket already marked paid in cash should not log again.
    const existing = await c.env.DB.prepare(
      "SELECT id FROM payment_log WHERE scale_ticket_id = ? AND payment_method = 'cash' AND status = 'completed' LIMIT 1"
    ).bind(scale_ticket_id).first()
    if (existing) {
      return c.json({ success: true, already_recorded: true })
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET payment_status = 'paid', payment_method = 'cash', grand_total = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(amount, scale_ticket_id).run()

    await c.env.DB.prepare(
      `INSERT INTO payment_log (scale_ticket_id, amount, payment_method, status) VALUES (?, ?, 'cash', 'completed')`
    ).bind(scale_ticket_id, amount).run()

    return c.json({ success: true })
  } catch (err: any) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
