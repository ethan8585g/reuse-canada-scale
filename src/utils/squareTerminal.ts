// Square Terminal: put the amount owed on a closed scale ticket in front of
// the driver ("$14.56 -- tap, insert or swipe") and record the result.
//
// Three rules hold everything here together:
//   1. The SERVER decides the amount -- grand_total from D1, never a number
//      sent by the browser.
//   2. A row in square_checkouts is written BEFORE Square is called. The
//      partial UNIQUE index in 0023 allows one live checkout per ticket, so
//      two closes racing cannot put two charges on the Terminal.
//   3. A COMPLETED payment always wins. Money has been taken from a card, so
//      the ticket is marked paid with the amount actually charged, whatever
//      else was going on (a cancel in flight, a re-price, cash recorded).

export type SquareEnv = {
  DB: D1Database
  SQUARE_ACCESS_TOKEN?: string
  SQUARE_ENV?: string                    // 'sandbox' to use Square's sandbox
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string
  SQUARE_WEBHOOK_URL?: string            // must equal the URL registered with Square
}

const SQUARE_VERSION = '2024-12-18'
const LIVE = ['PENDING', 'IN_PROGRESS', 'CANCEL_REQUESTED']

export function squareBase(env: SquareEnv): string {
  return env.SQUARE_ENV === 'sandbox'
    ? 'https://connect.squareupsandbox.com/v2'
    : 'https://connect.squareup.com/v2'
}

export async function squareFetch(env: SquareEnv, method: string, path: string, body?: any) {
  const res = await fetch(squareBase(env) + path, {
    method,
    headers: {
      'Square-Version': SQUARE_VERSION,
      'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({})) as any
  return { ok: res.ok, status: res.status, data, error: data?.errors?.[0]?.detail || data?.errors?.[0]?.code || null }
}

export async function getSquareSettings(db: D1Database) {
  const row = await db.prepare('SELECT * FROM square_settings WHERE id = 1').first<any>()
  return row || { auto_charge: 0, device_id: null, device_name: null, min_charge_cents: 500 }
}

async function audit(db: D1Database, ticketId: number, action: string, employeeId: number | null, details: Record<string, any>) {
  try {
    await db.prepare(
      'INSERT INTO scale_audit_log (scale_ticket_id, action, employee_id, details) VALUES (?, ?, ?, ?)'
    ).bind(ticketId, action, employeeId, JSON.stringify(details)).run()
  } catch (e) { /* non-critical */ }
}

export async function liveCheckout(db: D1Database, ticketId: number) {
  return db.prepare(
    `SELECT * FROM square_checkouts WHERE scale_ticket_id = ? AND status IN ('PENDING','IN_PROGRESS','CANCEL_REQUESTED')
     ORDER BY id DESC LIMIT 1`
  ).bind(ticketId).first<any>()
}

async function rowById(db: D1Database, id: number) {
  return db.prepare('SELECT * FROM square_checkouts WHERE id = ?').bind(id).first<any>()
}

function amountCents(grandTotal: any): number {
  return Math.round((Number(grandTotal) || 0) * 100)
}

function checkoutBody(row: any, ticketNumber: string) {
  return {
    idempotency_key: row.idempotency_key,
    checkout: {
      amount_money: { amount: row.amount_cents, currency: 'CAD' },
      reference_id: String(ticketNumber || '').slice(0, 40),
      note: `Scale ticket ${ticketNumber}`,
      payment_type: 'CARD_PRESENT',
      // Square's maximum. A driver who walks away leaves the Terminal free
      // again after five minutes instead of holding it indefinitely.
      deadline_duration: 'PT5M',
      device_options: {
        device_id: row.device_id,
        skip_receipt_screen: false,
        collect_signature: false,
        show_itemized_cart: false,
        tip_settings: { allow_tipping: false },
      },
    },
  }
}

// Mark the ticket paid from a COMPLETED checkout. Idempotent: the webhook and
// the page's status check can both arrive here for the same payment.
async function markPaid(env: SquareEnv, row: any, paymentId: string | null) {
  const db = env.DB
  const ticket = await db.prepare(
    'SELECT id, grand_total, payment_status, payment_method, square_payment_id FROM scale_tickets WHERE id = ?'
  ).bind(row.scale_ticket_id).first<any>()
  if (!ticket) return
  const amount = row.amount_cents / 100

  if (ticket.payment_status === 'paid' && ticket.square_payment_id && ticket.square_payment_id === paymentId) return

  // Paid twice -- cash recorded, then the card went through anyway. The card
  // money is real, so it is recorded, but the audit row says so loudly.
  const doublePaid = ticket.payment_status === 'paid'

  await db.prepare(
    `UPDATE scale_tickets SET payment_status = 'paid', payment_method = 'card',
       square_payment_id = ?, square_checkout_id = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(paymentId, row.checkout_id, row.scale_ticket_id).run()

  try {
    await db.prepare(
      `INSERT INTO payment_log (scale_ticket_id, amount, payment_method, square_payment_id, square_checkout_id, status)
       VALUES (?, ?, 'card', ?, ?, 'completed')`
    ).bind(row.scale_ticket_id, amount, paymentId, row.checkout_id).run()
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw e
  }

  await audit(db, row.scale_ticket_id, 'payment', row.created_by ?? null, {
    method: 'card', source: 'square_terminal', amount,
    checkout_id: row.checkout_id, square_payment_id: paymentId,
    grand_total: ticket.grand_total,
    amount_mismatch: amountCents(ticket.grand_total) !== row.amount_cents || undefined,
    double_payment: doublePaid ? { prev_method: ticket.payment_method } : undefined,
  })

  // Anything else still on the Terminal for this ticket is now a second
  // charge waiting to happen.
  const others = await db.prepare(
    `SELECT * FROM square_checkouts WHERE scale_ticket_id = ? AND id != ? AND status IN ('PENDING','IN_PROGRESS','CANCEL_REQUESTED')`
  ).bind(row.scale_ticket_id, row.id).all<any>()
  for (const o of others.results || []) await cancelRow(env, o, 'ticket already paid')
}

// Apply a checkout object from Square (webhook or GET) to our row.
export async function applyCheckout(env: SquareEnv, row: any, checkout: any) {
  const db = env.DB
  const status = String(checkout?.status || '')
  if (!status || row.status === 'COMPLETED') return rowById(db, row.id)

  // A row we already gave up on locally (superseded by a re-priced charge)
  // stays CANCELED -- unless the driver tapped it before the cancel landed.
  if (row.status === 'CANCELED' && status !== 'COMPLETED') return row

  const paymentId = (checkout.payment_ids && checkout.payment_ids[0]) || null
  await db.prepare(
    `UPDATE square_checkouts SET status = ?, payment_id = COALESCE(?, payment_id),
       cancel_reason = COALESCE(?, cancel_reason), updated_at = datetime('now') WHERE id = ?`
  ).bind(status, paymentId, checkout.cancel_reason || null, row.id).run()

  if (status === 'COMPLETED') {
    await markPaid(env, { ...row, status }, paymentId)
  } else if (status === 'CANCELED') {
    await revertPendingIfIdle(db, row.scale_ticket_id)
    await audit(db, row.scale_ticket_id, 'square_canceled', null, {
      checkout_id: row.checkout_id, amount: row.amount_cents / 100, reason: checkout.cancel_reason || null,
    })
  }
  return rowById(db, row.id)
}

async function revertPendingIfIdle(db: D1Database, ticketId: number) {
  const live = await liveCheckout(db, ticketId)
  if (!live) {
    await db.prepare(
      `UPDATE scale_tickets SET payment_status = 'unpaid', updated_at = datetime('now')
       WHERE id = ? AND payment_status = 'pending'`
    ).bind(ticketId).run()
  }
}

// Bring a live row up to date with Square. Also recovers a claim whose
// create call never answered (worker died, network cut): re-sending with the
// SAME idempotency key returns the checkout Square already made, if any,
// instead of making a second one.
export async function syncRow(env: SquareEnv, row: any) {
  if (!row || !LIVE.includes(row.status)) return row
  if (!row.checkout_id) {
    const ageSec = await env.DB.prepare(
      "SELECT (julianday('now') - julianday(created_at)) * 86400 AS s FROM square_checkouts WHERE id = ?"
    ).bind(row.id).first<any>()
    if ((ageSec?.s ?? 0) < 15) return row
    const t = await env.DB.prepare('SELECT ticket_number FROM scale_tickets WHERE id = ?').bind(row.scale_ticket_id).first<any>()
    const r = await squareFetch(env, 'POST', '/terminals/checkouts', checkoutBody(row, t?.ticket_number || ''))
    if (!r.ok) {
      await env.DB.prepare(
        "UPDATE square_checkouts SET status = 'FAILED', error = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(r.error || ('HTTP ' + r.status), row.id).run()
      await revertPendingIfIdle(env.DB, row.scale_ticket_id)
      return rowById(env.DB, row.id)
    }
    await env.DB.prepare('UPDATE square_checkouts SET checkout_id = ? WHERE id = ?').bind(r.data.checkout.id, row.id).run()
    return applyCheckout(env, { ...row, checkout_id: r.data.checkout.id }, r.data.checkout)
  }
  const r = await squareFetch(env, 'GET', `/terminals/checkouts/${encodeURIComponent(row.checkout_id)}`)
  if (!r.ok) return row
  return applyCheckout(env, row, r.data.checkout)
}

async function cancelRow(env: SquareEnv, row: any, reason: string) {
  if (!row.checkout_id) {
    // Never reached Square (or we cannot tell yet). Recover first so we
    // cancel the real checkout rather than forgetting it exists.
    row = await syncRow(env, row)
    if (!row?.checkout_id || !LIVE.includes(row.status)) {
      if (row && LIVE.includes(row.status)) {
        await env.DB.prepare(
          "UPDATE square_checkouts SET status = 'CANCELED', cancel_reason = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(reason, row.id).run()
      }
      return row ? rowById(env.DB, row.id) : row
    }
  }
  const r = await squareFetch(env, 'POST', `/terminals/checkouts/${encodeURIComponent(row.checkout_id)}/cancel`)
  if (r.ok && r.data.checkout) {
    const after = await applyCheckout(env, row, r.data.checkout)
    if (after && after.status === 'CANCEL_REQUESTED') {
      // Square has asked the Terminal to drop it. Release the ticket now so a
      // corrected charge can go out; if the driver's tap beats the cancel,
      // applyCheckout still upgrades this row to COMPLETED and records it.
      await env.DB.prepare(
        "UPDATE square_checkouts SET status = 'CANCELED', cancel_reason = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(reason, row.id).run()
      return rowById(env.DB, row.id)
    }
    return after
  }
  // Cancel refused -- usually because it already completed. Find out.
  return syncRow(env, row)
}

export async function cancelTicketCharge(env: SquareEnv, ticketId: number, reason: string) {
  let row = await liveCheckout(env.DB, ticketId)
  if (!row) return null
  row = await cancelRow(env, row, reason)
  await revertPendingIfIdle(env.DB, ticketId)
  return row
}

export type ChargeResult =
  | { ok: true; checkout: any; reused?: boolean }
  | { ok: false; reason: string; message: string; status?: number; checkout?: any }

// Put the ticket's grand_total on the Terminal.
export async function chargeTicket(env: SquareEnv, ticketId: number, opts: { source: string; employeeId: number | null }): Promise<ChargeResult> {
  const db = env.DB
  const t = await db.prepare(
    'SELECT id, ticket_number, status, grand_total, payment_status, invoice_id FROM scale_tickets WHERE id = ?'
  ).bind(ticketId).first<any>()
  if (!t) return { ok: false, reason: 'not_found', message: 'Ticket not found', status: 404 }
  if (t.status !== 'completed') return { ok: false, reason: 'not_completed', message: 'Only a closed ticket can be charged' }
  if (t.payment_status === 'paid') return { ok: false, reason: 'already_paid', message: `${t.ticket_number} is already paid` }
  if (t.invoice_id) return { ok: false, reason: 'invoiced', message: `${t.ticket_number} is on an invoice — it is billed there, not at the Terminal` }

  const settings = await getSquareSettings(db)
  const amount = amountCents(t.grand_total)
  const min = Number(settings.min_charge_cents) || 0
  if (amount < min) {
    // Nothing is sent, and anything already on the Terminal for a bigger
    // amount (before a re-price) comes off.
    await cancelTicketCharge(env, ticketId, 'below minimum after re-price')
    return { ok: false, reason: 'below_minimum', message: `$${(amount / 100).toFixed(2)} is under the $${(min / 100).toFixed(2)} card minimum — take cash` }
  }
  if (!env.SQUARE_ACCESS_TOKEN) return { ok: false, reason: 'not_configured', message: 'SQUARE_ACCESS_TOKEN is not set on this Pages project' }
  if (!settings.device_id) return { ok: false, reason: 'no_device', message: 'No Square Terminal is selected in the Scale House sidebar' }

  // Something already on the Terminal for this ticket?
  let live = await liveCheckout(db, ticketId)
  if (live) live = await syncRow(env, live)
  if (live && live.status === 'COMPLETED') return { ok: false, reason: 'already_paid', message: `${t.ticket_number} was just paid`, checkout: live }
  if (live && LIVE.includes(live.status)) {
    if (live.amount_cents === amount && live.device_id === settings.device_id) return { ok: true, checkout: live, reused: true }
    const after = await cancelRow(env, live, 'superseded by a corrected amount')
    if (after && after.status === 'COMPLETED') return { ok: false, reason: 'already_paid', message: `${t.ticket_number} was paid at the old amount`, checkout: after }
  }

  // Claim the ticket before calling Square.
  const key = `rc-${ticketId}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  let claimId: number
  try {
    const ins = await db.prepare(
      `INSERT INTO square_checkouts (scale_ticket_id, idempotency_key, amount_cents, device_id, status, source, created_by)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`
    ).bind(ticketId, key, amount, settings.device_id, opts.source, opts.employeeId).run()
    claimId = Number(ins.meta.last_row_id)
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw e
    // Lost a race to another close of the same ticket -- theirs is the charge.
    const other = await liveCheckout(db, ticketId)
    if (other) return { ok: true, checkout: other, reused: true }
    return { ok: false, reason: 'busy', message: 'Another charge for this ticket is being sent' }
  }

  const claim = await rowById(db, claimId)
  const r = await squareFetch(env, 'POST', '/terminals/checkouts', checkoutBody(claim, t.ticket_number))
  if (!r.ok) {
    const err = r.error || ('HTTP ' + r.status)
    await db.prepare(
      "UPDATE square_checkouts SET status = 'FAILED', error = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(err, claimId).run()
    await revertPendingIfIdle(db, ticketId)
    return { ok: false, reason: 'square_error', message: 'Square refused the charge: ' + err, checkout: await rowById(db, claimId) }
  }

  const co = r.data.checkout
  await db.prepare(
    "UPDATE square_checkouts SET checkout_id = ?, status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(co.id, co.status || 'PENDING', claimId).run()
  await db.prepare(
    `UPDATE scale_tickets SET payment_status = 'pending', payment_method = 'card', square_checkout_id = ?,
       updated_at = datetime('now') WHERE id = ? AND payment_status != 'paid'`
  ).bind(co.id, ticketId).run()
  await audit(db, ticketId, 'square_sent', opts.employeeId, {
    checkout_id: co.id, amount: amount / 100, device_id: settings.device_id, source: opts.source,
  })
  return { ok: true, checkout: await rowById(db, claimId) }
}

// Called after anything that can change grand_total on a closed ticket
// (material re-assigned, weight corrected, finalized by hand). If a charge
// is already on the Terminal for the old amount, swap it for the new one.
export async function resyncTicketCharge(env: SquareEnv, ticketId: number, employeeId: number | null) {
  try {
    const live = await liveCheckout(env.DB, ticketId)
    if (!live) return null
    const t = await env.DB.prepare('SELECT grand_total FROM scale_tickets WHERE id = ?').bind(ticketId).first<any>()
    if (!t || amountCents(t.grand_total) === live.amount_cents) return null
    return await chargeTicket(env, ticketId, { source: 'reprice', employeeId })
  } catch (e) {
    console.error('square resync failed:', e)
    return null
  }
}

// Square signs webhooks with HMAC-SHA256 over (notification URL + raw body),
// base64-encoded, in x-square-hmacsha256-signature.
export async function verifySquareSignature(signatureKey: string, url: string, rawBody: string, signature: string | undefined | null) {
  if (!signatureKey || !signature) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(signatureKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(url + rawBody)))
  let bin = ''
  for (const b of mac) bin += String.fromCharCode(b)
  const expected = btoa(bin)
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}
