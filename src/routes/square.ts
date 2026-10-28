import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = {
  DB: D1Database
  SQUARE_ACCESS_TOKEN: string
  SQUARE_APP_ID: string
}

export const squareRoutes = new Hono<{ Bindings: Bindings }>()

squareRoutes.use('*', authMiddleware, employeeOnly)
// Taking money is a scale-house / office job. Drivers have no business here.
squareRoutes.use('*', roleRequired('admin', 'manager', 'yard_operator'))

// Square ids are [A-Za-z0-9_-]. Checked before one goes into a Square URL so
// an encoded "../" in :id can't steer the call at another Square endpoint.
const SQUARE_ID = /^[A-Za-z0-9_-]{1,64}$/

const SQUARE_BASE = 'https://connect.squareup.com/v2'

// The device_id of the first PAIRED Square Terminal, or null.
async function pairedTerminalId(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${SQUARE_BASE}/devices/codes?status=PAIRED&product_type=TERMINAL_API`, {
      headers: { 'Square-Version': '2024-12-18', 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json() as any
    const code = (data.device_codes || []).filter((d: any) => d.device_id)
      .sort((a: any, b: any) => String(b.paired_at || '').localeCompare(String(a.paired_at || '')))[0]
    return code ? String(code.device_id) : null
  } catch {
    return null
  }
}

// ─── Pickup billing on the Square Terminal, with the receipt printed there ───
// The Terminal can print only Square's own receipt for a payment Square
// recorded (Terminal action RECEIPT). So a pickup is billed as a Square order
// (material, weight, GST as lines) and, once paid -- by card on the Terminal
// or cash recorded through the Payments API -- its receipt is printed on the
// Terminal. Drop-offs have no payment and keep printing on the yard printer.

const SQ_VERSION = '2024-12-18'
function sqHeaders(token: string) {
  return { 'Square-Version': SQ_VERSION, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// The first PAIRED Terminal and the location it belongs to.
async function pairedTerminal(token: string): Promise<{ device_id: string, location_id: string | null } | null> {
  try {
    const res = await fetch(`${SQUARE_BASE}/devices/codes?status=PAIRED&product_type=TERMINAL_API`, { headers: sqHeaders(token) })
    if (!res.ok) return null
    const data = await res.json() as any
    // Newest pairing wins: re-pairing leaves the older code PAIRED too.
    const code = (data.device_codes || []).filter((d: any) => d.device_id)
      .sort((a: any, b: any) => String(b.paired_at || '').localeCompare(String(a.paired_at || '')))[0]
    return code ? { device_id: String(code.device_id), location_id: code.location_id ? String(code.location_id) : null } : null
  } catch {
    return null
  }
}

async function loadPickupTicket(db: D1Database, id: number) {
  return db.prepare(
    `SELECT st.id, st.ticket_number, st.ticket_type, st.status, st.payment_status, st.weight_in, st.weight_out,
            st.net_weight, st.price_per_kg, st.total_amount, st.tax_amount, st.grand_total, st.vehicle_plate,
            st.tire_type, COALESCE(p.description, st.tire_type) AS material_name, c.company_name
       FROM scale_tickets st
       LEFT JOIN pricing p ON p.material_type = st.tire_type
       LEFT JOIN customers c ON c.id = st.customer_id
      WHERE st.id = ?`
  ).bind(id).first<any>()
}

// A Square order for the pickup. Lines are priced from the ticket so the
// order total is exactly the ticket's grand total, to the cent. Returns null
// if Square will not take an order here; the caller then bills the amount.
async function createPickupOrder(token: string, locationId: string, t: any): Promise<string | null> {
  const totalCents = Math.round(Number(t.grand_total) * 100)
  const subCents = Math.round(Number(t.total_amount) * 100)
  const taxCents = totalCents - subCents
  if (!(totalCents > 0) || subCents < 0 || taxCents < 0) return null
  const kg = Math.round(Math.abs(Number(t.net_weight) || 0)).toLocaleString('en-CA')
  const rate = Number(t.price_per_kg || 0).toFixed(2)
  const lines: any[] = [{
    name: `${t.material_name} pickup`,
    quantity: '1',
    note: `${t.ticket_number} · ${kg} kg @ $${rate}/kg · in ${Math.round(t.weight_in || 0)} kg, out ${Math.round(t.weight_out || 0)} kg${t.vehicle_plate ? ' · ' + t.vehicle_plate : ''}`.slice(0, 500),
    base_price_money: { amount: subCents, currency: 'CAD' },
  }]
  if (taxCents > 0) lines.push({ name: 'GST (5%)', quantity: '1', base_price_money: { amount: taxCents, currency: 'CAD' } })
  try {
    const res = await fetch(`${SQUARE_BASE}/orders`, {
      method: 'POST', headers: sqHeaders(token),
      body: JSON.stringify({ idempotency_key: crypto.randomUUID(), order: { location_id: locationId, reference_id: String(t.ticket_number).slice(0, 40), line_items: lines } }),
    })
    const data = await res.json() as any
    if (!res.ok) { console.error('square order error:', JSON.stringify(data.errors || data)); return null }
    const got = Number(data.order?.total_money?.amount)
    if (got !== totalCents) { console.error('square order total mismatch', got, totalCents); return null }
    return data.order?.id || null
  } catch (e) {
    console.error('square order error:', e); return null
  }
}

// Print Square's receipt for a payment on the Terminal, with no screen to tap.
async function printOnTerminal(token: string, deviceId: string, paymentId: string, duplicate = false): Promise<{ ok: boolean, error?: string, action_id?: string }> {
  try {
    const res = await fetch(`${SQUARE_BASE}/terminals/actions`, {
      method: 'POST', headers: sqHeaders(token),
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        action: { device_id: deviceId, type: 'RECEIPT', receipt_options: { payment_id: paymentId, print_only: true, is_duplicate: duplicate } },
      }),
    })
    const data = await res.json() as any
    if (!res.ok) return { ok: false, error: data.errors?.[0]?.detail || 'Square would not print the receipt' }
    return { ok: true, action_id: data.action?.id }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Square could not be reached' }
  }
}

// ─── Connecting the Terminal ───
// Is the Square account reachable, which location, and is a Terminal paired
// for the API. Shown in Equipment & settings > Square Terminal.
squareRoutes.get('/terminal-status', async (c) => {
  const token = c.env.SQUARE_ACCESS_TOKEN
  if (!token) return c.json({ account_ok: false, error: 'No Square access token is set on the server.' })
  try {
    const lr = await fetch(`${SQUARE_BASE}/locations`, { headers: sqHeaders(token) })
    const ld = await lr.json() as any
    if (!lr.ok) return c.json({ account_ok: false, error: ld.errors?.[0]?.detail || 'Square refused the access token.' })
    const locations = (ld.locations || []).filter((l: any) => l.status === 'ACTIVE').map((l: any) => ({ id: l.id, name: l.name, country: l.country, currency: l.currency }))
    const dr = await fetch(`${SQUARE_BASE}/devices/codes?product_type=TERMINAL_API`, { headers: sqHeaders(token) })
    const dd = await dr.json() as any
    const codes = (dd.device_codes || []).map((d: any) => ({ id: d.id, code: d.code, name: d.name, status: d.status, device_id: d.device_id || null, location_id: d.location_id, pair_by: d.pair_by, paired_at: d.paired_at }))
    const paired = codes.filter((d: any) => d.status === 'PAIRED' && d.device_id)
      .sort((a: any, b: any) => String(b.paired_at || '').localeCompare(String(a.paired_at || '')))
    return c.json({ account_ok: true, locations, paired, pending: codes.filter((d: any) => d.status === 'UNPAIRED') })
  } catch (e: any) {
    return c.json({ account_ok: false, error: e?.message || 'Square could not be reached.' })
  }
})

// Make a one-time code to sign the Terminal in for the API. Codes expire
// after a few minutes; the Terminal shows "Sign in with device code".
squareRoutes.post('/pair', roleRequired('admin', 'manager'), async (c) => {
  const token = c.env.SQUARE_ACCESS_TOKEN
  try {
    const body = await c.req.json().catch(() => ({})) as any
    let locationId = typeof body?.location_id === 'string' ? body.location_id : ''
    if (!locationId) {
      const lr = await fetch(`${SQUARE_BASE}/locations`, { headers: sqHeaders(token) })
      const ld = await lr.json() as any
      if (!lr.ok) return c.json({ error: ld.errors?.[0]?.detail || 'Square refused the access token.' }, 502)
      const loc = (ld.locations || []).find((l: any) => l.status === 'ACTIVE')
      if (!loc) return c.json({ error: 'This Square account has no active location.' }, 409)
      locationId = loc.id
    }
    const res = await fetch(`${SQUARE_BASE}/devices/codes`, {
      method: 'POST', headers: sqHeaders(token),
      body: JSON.stringify({ idempotency_key: crypto.randomUUID(), device_code: { product_type: 'TERMINAL_API', location_id: locationId, name: 'Scale House' } }),
    })
    const data = await res.json() as any
    if (!res.ok) return c.json({ error: data.errors?.[0]?.detail || 'Square would not create a pairing code.' }, 502)
    return c.json({ code: data.device_code?.code, pair_by: data.device_code?.pair_by, id: data.device_code?.id })
  } catch (e: any) {
    return c.json({ error: e?.message || 'Square could not be reached.' }, 500)
  }
})

// Bill a closed pickup on the Terminal. The amount comes from the ticket in
// the database, never from the page.
squareRoutes.post('/ticket-checkout', async (c) => {
  try {
    const { scale_ticket_id } = await c.req.json()
    const id = Number(scale_ticket_id)
    if (!Number.isInteger(id) || id <= 0) return c.json({ error: 'Valid scale_ticket_id required' }, 400)
    const t = await loadPickupTicket(c.env.DB, id)
    if (!t) return c.json({ error: 'Ticket not found' }, 404)
    if (t.ticket_type !== 'pickup' || t.status !== 'completed') return c.json({ error: 'Only a closed pickup is billed on the Terminal.' }, 409)
    if (t.payment_status === 'paid') return c.json({ error: 'This pickup is already paid.' }, 409)
    const totalCents = Math.round(Number(t.grand_total) * 100)
    if (!(totalCents > 0)) return c.json({ error: 'This pickup came to $0.00, so there is nothing to charge.' }, 409)

    const term = await pairedTerminal(c.env.SQUARE_ACCESS_TOKEN)
    if (!term) return c.json({ error: 'No paired Square Terminal was found on this Square account. Pair the Terminal in the Square app, then try again.' }, 409)
    const orderId = term.location_id ? await createPickupOrder(c.env.SQUARE_ACCESS_TOKEN, term.location_id, t) : null

    const send = async (withOrder: boolean) => {
      const checkout: any = {
        amount_money: { amount: totalCents, currency: 'CAD' },
        reference_id: String(t.ticket_number).slice(0, 40),
        note: `Pickup ${t.ticket_number} · ${t.material_name} · ${Math.round(Math.abs(Number(t.net_weight) || 0))} kg`.slice(0, 250),
        payment_type: 'CARD_PRESENT',
        // The receipt is printed by us once the payment lands (RECEIPT
        // action), so the customer is not asked to choose one.
        device_options: { device_id: term.device_id, skip_receipt_screen: true, collect_signature: false, show_itemized_cart: withOrder },
      }
      if (withOrder) checkout.order_id = orderId
      const res = await fetch(`${SQUARE_BASE}/terminals/checkouts`, {
        method: 'POST', headers: sqHeaders(c.env.SQUARE_ACCESS_TOKEN),
        body: JSON.stringify({ idempotency_key: crypto.randomUUID(), checkout }),
      })
      return { res, data: await res.json() as any }
    }
    let r = await send(!!orderId)
    let itemized = !!orderId
    if (!r.res.ok && orderId) {
      // Square may not accept an order on a Terminal checkout in this region:
      // bill the same amount without the itemized order.
      console.error('square itemized checkout refused, retrying plain:', JSON.stringify(r.data.errors || r.data))
      r = await send(false); itemized = false
    }
    if (!r.res.ok) return c.json({ error: r.data.errors?.[0]?.detail || 'Failed to create terminal checkout', errors: r.data.errors }, r.res.status as any)
    return c.json({ success: true, checkout_id: r.data.checkout?.id, status: r.data.checkout?.status, itemized, order_id: itemized ? orderId : null })
  } catch (err: any) {
    console.error('square ticket-checkout error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Print the receipt for a paid pickup on the Terminal.
squareRoutes.post('/print-receipt', async (c) => {
  try {
    const { payment_id, duplicate } = await c.req.json()
    if (typeof payment_id !== 'string' || !/^[A-Za-z0-9_-]{6,80}$/.test(payment_id)) return c.json({ error: 'Valid payment_id required' }, 400)
    const term = await pairedTerminal(c.env.SQUARE_ACCESS_TOKEN)
    if (!term) return c.json({ error: 'No paired Square Terminal was found.' }, 409)
    const r = await printOnTerminal(c.env.SQUARE_ACCESS_TOKEN, term.device_id, payment_id, !!duplicate)
    if (!r.ok) return c.json({ error: r.error }, 502)
    return c.json({ success: true, action_id: r.action_id })
  } catch (err: any) {
    console.error('square print-receipt error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

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

    // Square requires the target terminal on every checkout. Nothing on the
    // page ever chose one, so when the caller does not name a device, use the
    // terminal paired to this account (Square's documented source for a
    // checkout's device_id is DeviceCode.device_id on a PAIRED code).
    const targetDevice = device_id || await pairedTerminalId(c.env.SQUARE_ACCESS_TOKEN)
    if (!targetDevice) {
      return c.json({ error: 'No paired Square Terminal was found on this Square account. Pair the Terminal in the Square app, then try again.' }, 409)
    }
    body.checkout.device_options.device_id = targetDevice

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
  if (!SQUARE_ID.test(checkoutId)) return c.json({ error: 'Invalid checkout id' }, 400)
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
  if (!SQUARE_ID.test(checkoutId)) return c.json({ error: 'Invalid checkout id' }, 400)
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
    const { scale_ticket_id, amount, print_on_terminal } = await c.req.json()

    // Validate inputs — without these, "amount = -50" or
    // "scale_ticket_id = 'DROP TABLE'" both flow straight into the UPDATE.
    if (!Number.isInteger(scale_ticket_id) || scale_ticket_id <= 0) {
      return c.json({ error: 'Valid scale_ticket_id required' }, 400)
    }
    // The amount is the ticket's own total, never the client's number: this
    // used to write whatever 'amount' was sent over grand_total, so a request
    // could mark any bill paid at any price.
    const ticket = await c.env.DB.prepare(
      'SELECT id, grand_total, status, payment_status, payment_method FROM scale_tickets WHERE id = ?'
    ).bind(scale_ticket_id).first<any>()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (ticket.status !== 'completed') return c.json({ error: 'Only a completed ticket can be paid' }, 409)
    if (ticket.payment_status === 'paid' && ticket.payment_method !== 'cash') {
      return c.json({ error: 'This ticket is already paid by ' + (ticket.payment_method || 'card') + '.' }, 409)
    }
    // A card checkout is live on the Terminal: recording cash now would let
    // the customer pay twice, or be wiped back to unpaid when it times out.
    if (ticket.payment_status === 'pending') {
      return c.json({ error: 'A card payment is waiting on the Square Terminal. Cancel it there first, then record the cash.' }, 409)
    }
    const total = Number(ticket.grand_total)
    if (!(total > 0)) return c.json({ error: 'This ticket has nothing to pay' }, 409)
    if (typeof amount === 'number' && Number.isFinite(amount) && Math.abs(amount - total) > 0.005) {
      return c.json({ error: 'The amount does not match the ticket total of $' + total.toFixed(2) + '. Refresh and try again.' }, 409)
    }

    // Idempotency: a ticket already marked paid in cash should not log again.
    const existing = await c.env.DB.prepare(
      "SELECT id FROM payment_log WHERE scale_ticket_id = ? AND payment_method = 'cash' AND status = 'completed' LIMIT 1"
    ).bind(scale_ticket_id).first()
    if (existing) {
      return c.json({ success: true, already_recorded: true })
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET payment_status = 'paid', payment_method = 'cash', updated_at = datetime('now') WHERE id = ?`
    ).bind(scale_ticket_id).run()

    await c.env.DB.prepare(
      `INSERT INTO payment_log (scale_ticket_id, amount, payment_method, status) VALUES (?, ?, 'cash', 'completed')`
    ).bind(scale_ticket_id, total).run()

    // Optionally also record the cash in Square, so the Terminal can print
    // Square's receipt for it. The cash is already recorded above; a Square
    // failure is reported, never turned into an unpaid ticket.
    let terminal_receipt: { ok: boolean, error?: string } | null = null
    if (print_on_terminal) {
      terminal_receipt = { ok: false, error: 'not attempted' }
      try {
        const t = await loadPickupTicket(c.env.DB, scale_ticket_id)
        const term = await pairedTerminal(c.env.SQUARE_ACCESS_TOKEN)
        if (!t || t.ticket_type !== 'pickup') terminal_receipt = { ok: false, error: 'Only pickups print on the Terminal.' }
        else if (!term || !term.location_id) terminal_receipt = { ok: false, error: 'No paired Square Terminal was found.' }
        else {
          const cents = Math.round(total * 100)
          const orderId = await createPickupOrder(c.env.SQUARE_ACCESS_TOKEN, term.location_id, { ...t, grand_total: total })
          const pay: any = {
            idempotency_key: `cash-${scale_ticket_id}-${cents}`,
            source_id: 'CASH', location_id: term.location_id,
            amount_money: { amount: cents, currency: 'CAD' },
            cash_details: { buyer_supplied_money: { amount: cents, currency: 'CAD' } },
            reference_id: String(t.ticket_number).slice(0, 40),
            note: `Pickup ${t.ticket_number} · cash`,
          }
          if (orderId) pay.order_id = orderId
          const res = await fetch(`${SQUARE_BASE}/payments`, { method: 'POST', headers: sqHeaders(c.env.SQUARE_ACCESS_TOKEN), body: JSON.stringify(pay) })
          const data = await res.json() as any
          if (!res.ok || !data.payment?.id) terminal_receipt = { ok: false, error: data.errors?.[0]?.detail || 'Square did not record the cash payment' }
          else {
            await c.env.DB.prepare(`UPDATE scale_tickets SET square_payment_id = ? WHERE id = ?`).bind(data.payment.id, scale_ticket_id).run().catch(() => {})
            terminal_receipt = await printOnTerminal(c.env.SQUARE_ACCESS_TOKEN, term.device_id, data.payment.id)
          }
        }
      } catch (e: any) {
        terminal_receipt = { ok: false, error: e?.message || 'Square could not be reached' }
      }
    }

    return c.json({ success: true, terminal_receipt })
  } catch (err: any) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
