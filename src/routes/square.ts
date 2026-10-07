import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import {
  SquareEnv, squareFetch, getSquareSettings, chargeTicket, cancelTicketCharge,
  liveCheckout, syncRow, applyCheckout, verifySquareSignature,
} from '../utils/squareTerminal'

type Bindings = SquareEnv & { SQUARE_APP_ID: string }

export const squareRoutes = new Hono<{ Bindings: Bindings }>()

// ═══════════════════════════════════════
// WEBHOOK -- public, authenticated by Square's signature instead of a session.
// Registered BEFORE the auth middleware below so a Square POST is never asked
// for a login. index.tsx mounts this router at /api/square.
// ═══════════════════════════════════════
squareRoutes.post('/webhook', async (c) => {
  const raw = await c.req.text()
  const key = c.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!key) return c.json({ error: 'Webhook not configured' }, 503)
  // The URL Square signed is the one registered in the Square dashboard. Behind
  // Cloudflare c.req.url is that URL, but an explicit setting wins.
  const url = c.env.SQUARE_WEBHOOK_URL || c.req.url
  const ok = await verifySquareSignature(key, url, raw, c.req.header('x-square-hmacsha256-signature'))
  if (!ok) return c.json({ error: 'Bad signature' }, 401)

  let evt: any
  try { evt = JSON.parse(raw) } catch { return c.json({ error: 'Bad JSON' }, 400) }
  if (evt?.type !== 'terminal.checkout.updated') return c.json({ ignored: true })

  const checkout = evt?.data?.object?.checkout
  if (!checkout?.id) return c.json({ ignored: true })
  try {
    const row = await c.env.DB.prepare('SELECT * FROM square_checkouts WHERE checkout_id = ?').bind(checkout.id).first<any>()
    // A checkout this system did not create (rung up on the Terminal by hand,
    // another app on the same account) is none of our business.
    if (!row) return c.json({ ignored: true })
    await applyCheckout(c.env, row, checkout)
    return c.json({ ok: true })
  } catch (err) {
    console.error('square webhook error:', err)
    // 500 makes Square retry, which is what we want for a transient D1 error.
    return c.json({ error: 'Server error' }, 500)
  }
})

squareRoutes.use('*', authMiddleware, employeeOnly)

function sanitizeRow(r: any) {
  if (!r) return null
  return {
    id: r.id, scale_ticket_id: r.scale_ticket_id, checkout_id: r.checkout_id,
    amount: r.amount_cents / 100, status: r.status, payment_id: r.payment_id,
    cancel_reason: r.cancel_reason, error: r.error, source: r.source,
    created_at: r.created_at, updated_at: r.updated_at,
  }
}

// ═══════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════
squareRoutes.get('/settings', async (c) => {
  const s = await getSquareSettings(c.env.DB)
  return c.json({
    settings: {
      auto_charge: Number(s.auto_charge) || 0,
      device_id: s.device_id || null,
      device_name: s.device_name || null,
      min_charge_cents: Number(s.min_charge_cents) || 0,
    },
    token_ready: !!c.env.SQUARE_ACCESS_TOKEN,
    webhook_ready: !!c.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    environment: c.env.SQUARE_ENV === 'sandbox' ? 'sandbox' : 'production',
  })
})

squareRoutes.put('/settings', roleRequired('admin', 'manager'), async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  const s = await getSquareSettings(c.env.DB)
  const autoCharge = body.auto_charge === undefined ? Number(s.auto_charge) : (body.auto_charge ? 1 : 0)
  const deviceId = body.device_id === undefined ? s.device_id : (body.device_id ? String(body.device_id).slice(0, 100) : null)
  const deviceName = body.device_name === undefined ? s.device_name : (body.device_name ? String(body.device_name).slice(0, 100) : null)
  let minCents = Number(s.min_charge_cents)
  if (body.min_charge_cents !== undefined) {
    minCents = Number(body.min_charge_cents)
    if (!Number.isInteger(minCents) || minCents < 100 || minCents > 100000) {
      return c.json({ error: 'Minimum must be between $1.00 and $1,000.00' }, 400)
    }
  }
  if (autoCharge && !deviceId) return c.json({ error: 'Choose a Square Terminal before turning auto-charge on' }, 400)
  await c.env.DB.prepare(
    `UPDATE square_settings SET auto_charge = ?, device_id = ?, device_name = ?, min_charge_cents = ?,
       updated_by = ?, updated_at = datetime('now') WHERE id = 1`
  ).bind(autoCharge, deviceId, deviceName, minCents, c.get('userId')).run()
  const after = await getSquareSettings(c.env.DB)
  return c.json({ settings: {
    auto_charge: Number(after.auto_charge) || 0, device_id: after.device_id, device_name: after.device_name,
    min_charge_cents: Number(after.min_charge_cents) || 0,
  } })
})

// Which Square account the token belongs to. Shown in the sidebar so the
// operator can see at a glance that charges go to Reuse Canada's account.
squareRoutes.get('/account', async (c) => {
  if (!c.env.SQUARE_ACCESS_TOKEN) return c.json({ error: 'SQUARE_ACCESS_TOKEN is not set' }, 503)
  try {
    const [m, l] = await Promise.all([
      squareFetch(c.env, 'GET', '/merchants/me'),
      squareFetch(c.env, 'GET', '/locations'),
    ])
    if (!m.ok) return c.json({ error: m.error || 'Square rejected the access token' }, 502)
    return c.json({
      business_name: m.data.merchant?.business_name || null,
      country: m.data.merchant?.country || null,
      currency: m.data.merchant?.currency || null,
      locations: (l.data.locations || []).map((x: any) => ({ id: x.id, name: x.name, status: x.status })),
    })
  } catch (err) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Terminals paired for the Terminal API. A Terminal is paired by signing in on
// the device with a code from POST /device-code (or the Square Dashboard);
// once paired, the code carries the device_id that checkouts are sent to.
squareRoutes.get('/devices', async (c) => {
  if (!c.env.SQUARE_ACCESS_TOKEN) return c.json({ error: 'SQUARE_ACCESS_TOKEN is not set' }, 503)
  try {
    const r = await squareFetch(c.env, 'GET', '/devices/codes?product_type=TERMINAL_API')
    if (!r.ok) return c.json({ error: r.error || 'Failed to list Terminals' }, 502)
    const codes = r.data.device_codes || []
    return c.json({
      devices: codes.filter((d: any) => d.status === 'PAIRED' && d.device_id)
        .map((d: any) => ({ device_id: d.device_id, name: d.name || 'Square Terminal', location_id: d.location_id, paired_at: d.pair_by || d.status_changed_at })),
      unpaired: codes.filter((d: any) => d.status === 'UNPAIRED')
        .map((d: any) => ({ code: d.code, name: d.name, pair_by: d.pair_by })),
    })
  } catch (err) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

squareRoutes.post('/device-code', roleRequired('admin', 'manager'), async (c) => {
  if (!c.env.SQUARE_ACCESS_TOKEN) return c.json({ error: 'SQUARE_ACCESS_TOKEN is not set' }, 503)
  const { name, location_id } = await c.req.json().catch(() => ({})) as any
  const r = await squareFetch(c.env, 'POST', '/devices/codes', {
    idempotency_key: crypto.randomUUID(),
    device_code: {
      product_type: 'TERMINAL_API',
      name: String(name || 'Scale House Terminal').slice(0, 100),
      ...(location_id ? { location_id: String(location_id) } : {}),
    },
  })
  if (!r.ok) return c.json({ error: r.error || 'Square refused to create a pairing code' }, 502)
  return c.json({ code: r.data.device_code?.code, pair_by: r.data.device_code?.pair_by })
})

// ═══════════════════════════════════════
// CHARGES -- amount always comes from the ticket in D1
// ═══════════════════════════════════════
squareRoutes.post('/charge/:ticketId', async (c) => {
  const ticketId = Number(c.req.param('ticketId'))
  if (!Number.isInteger(ticketId) || ticketId <= 0) return c.json({ error: 'Bad ticket id' }, 400)
  const { source } = await c.req.json().catch(() => ({})) as any
  const src = source === 'auto' ? 'auto' : 'manual'
  try {
    // The automatic path honours the on/off switch; a hand-pressed Square
    // button always works, so a station with auto-charge off can still use
    // the Terminal one ticket at a time.
    if (src === 'auto') {
      const s = await getSquareSettings(c.env.DB)
      if (!Number(s.auto_charge)) return c.json({ ok: false, reason: 'auto_off', message: 'Auto-charge is off' })
    }
    const r = await chargeTicket(c.env, ticketId, { source: src, employeeId: c.get('userId') })
    if (r.ok) return c.json({ ok: true, reused: !!r.reused, checkout: sanitizeRow(r.checkout) })
    // Skips (below minimum, already paid) are answers, not errors -- 200 so the
    // page can tell the operator why nothing appeared on the Terminal.
    return c.json({ ok: false, reason: r.reason, message: r.message, checkout: sanitizeRow(r.checkout) }, (r.status as any) || 200)
  } catch (err) {
    console.error('square charge error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

squareRoutes.get('/charge/:ticketId', async (c) => {
  const ticketId = Number(c.req.param('ticketId'))
  try {
    let row = await liveCheckout(c.env.DB, ticketId)
    if (row) row = await syncRow(c.env, row)
    if (!row) row = await c.env.DB.prepare(
      'SELECT * FROM square_checkouts WHERE scale_ticket_id = ? ORDER BY id DESC LIMIT 1'
    ).bind(ticketId).first<any>()
    return c.json({ checkout: sanitizeRow(row) })
  } catch (err) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

squareRoutes.post('/charge/:ticketId/cancel', async (c) => {
  const ticketId = Number(c.req.param('ticketId'))
  try {
    const row = await cancelTicketCharge(c.env, ticketId, 'cancelled by operator')
    return c.json({ checkout: sanitizeRow(row) })
  } catch (err) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Live charges plus anything that finished in the last 10 minutes, for the
// payment card on the Scale House page. Live rows are refreshed from Square
// when the webhook has been quiet for a few seconds, so the card stays right
// even before the webhook is set up.
squareRoutes.get('/charges/recent', async (c) => {
  try {
    const rows = await c.env.DB.prepare(
      `SELECT sc.*, st.ticket_number, cu.company_name
         FROM square_checkouts sc
         JOIN scale_tickets st ON st.id = sc.scale_ticket_id
         LEFT JOIN customers cu ON cu.id = st.customer_id
        WHERE sc.status IN ('PENDING','IN_PROGRESS','CANCEL_REQUESTED')
           OR sc.updated_at > datetime('now', '-10 minutes')
        ORDER BY sc.id DESC LIMIT 10`
    ).all<any>()
    const out: any[] = []
    for (let r of rows.results || []) {
      if (['PENDING', 'IN_PROGRESS', 'CANCEL_REQUESTED'].includes(r.status)) {
        const age = await c.env.DB.prepare(
          "SELECT (julianday('now') - julianday(updated_at)) * 86400 AS s FROM square_checkouts WHERE id = ?"
        ).bind(r.id).first<any>()
        if ((age?.s ?? 0) > 4) {
          const synced = await syncRow(c.env, r)
          r = { ...r, ...synced }
        }
      }
      out.push({ ...sanitizeRow(r), ticket_number: r.ticket_number, company_name: r.company_name })
    }
    // Several rows can exist for one ticket (re-priced, re-sent); the card
    // shows the newest per ticket.
    const seen = new Set<number>()
    return c.json({ charges: out.filter(r => !seen.has(r.scale_ticket_id) && seen.add(r.scale_ticket_id)) })
  } catch (err) {
    console.error('square error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// CASH -- recorded here, no Square call
// ═══════════════════════════════════════
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
    const ticket = await c.env.DB.prepare('SELECT id, grand_total, payment_status, payment_method FROM scale_tickets WHERE id = ?').bind(scale_ticket_id).first<any>()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (ticket.payment_status === 'paid' && ticket.payment_method === 'card') {
      return c.json({ error: 'This ticket was already paid by card' }, 409)
    }

    // Paying cash while the amount is still up on the Terminal: take it off
    // first. If the driver had already tapped, the card payment stands.
    const after = await cancelTicketCharge(c.env, scale_ticket_id, 'paid in cash')
    if (after && after.status === 'COMPLETED') {
      return c.json({ error: 'The card payment on the Square Terminal already went through' }, 409)
    }

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
