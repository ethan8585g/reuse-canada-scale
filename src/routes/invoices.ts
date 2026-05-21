import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { cents } from '../utils/money'

type Bindings = { DB: D1Database }

export const invoiceRoutes = new Hono<{ Bindings: Bindings }>()

invoiceRoutes.use('*', authMiddleware, employeeOnly)

// Generate invoice number INV-YYYY-NNNNN. Same retry-on-conflict pattern as
// scale ticket numbers (see generateTicketNumber): two concurrent inserts can
// race past the SELECT, so on UNIQUE failure we bump and try again.
async function generateInvoiceNumber(db: D1Database, attempt = 0): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const last = await db.prepare(
    'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1'
  ).bind(prefix + '%').first<{ invoice_number: string }>()

  let nextNum = 1
  if (last?.invoice_number) {
    const parts = last.invoice_number.split('-')
    nextNum = parseInt(parts[2]) + 1
  }
  nextNum += attempt
  return `${prefix}${String(nextNum).padStart(5, '0')}`
}

async function auditLog(db: D1Database, invoiceId: number, action: string, employeeId: number | null, details?: Record<string, any>) {
  try {
    await db.prepare(
      'INSERT INTO invoice_audit_log (invoice_id, action, employee_id, details) VALUES (?, ?, ?, ?)'
    ).bind(invoiceId, action, employeeId, details ? JSON.stringify(details) : null).run()
  } catch (e) { /* non-critical */ }
}

// The print-trigger flow stores walk-in tickets against this sentinel customer.
// Anything billed to the sentinel is a bug — block it at every write path.
async function getWalkInCustomerId(db: D1Database): Promise<number | null> {
  const row = await db.prepare(
    "SELECT id FROM customers WHERE email = 'walk-in@reuse-canada.local' LIMIT 1"
  ).first<{ id: number }>()
  return row?.id ?? null
}

// ═══════════════════════════════════════
// LIST & DETAIL
// ═══════════════════════════════════════

invoiceRoutes.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const customerId = c.req.query('customer_id')
    const dateFrom = c.req.query('date_from')
    const dateTo = c.req.query('date_to')

    let sql = `SELECT i.*, c.company_name, c.contact_name,
                      e.first_name || ' ' || e.last_name as created_by_name
               FROM invoices i
               LEFT JOIN customers c ON i.customer_id = c.id
               LEFT JOIN employees e ON i.created_by = e.id
               WHERE 1=1`
    const params: any[] = []

    if (status) { sql += ' AND i.status = ?'; params.push(status) }
    if (customerId) { sql += ' AND i.customer_id = ?'; params.push(customerId) }
    if (dateFrom) { sql += ` AND DATE(COALESCE(i.issued_at, i.created_at)) >= ?`; params.push(dateFrom) }
    if (dateTo)   { sql += ` AND DATE(COALESCE(i.issued_at, i.created_at)) <= ?`; params.push(dateTo) }

    sql += ' ORDER BY i.id DESC LIMIT 500'

    const { results } = await c.env.DB.prepare(sql).bind(...params).all()
    return c.json({ invoices: results })
  } catch (err: any) {
    console.error('invoices list error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

invoiceRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const invoice = await c.env.DB.prepare(
      `SELECT i.*, c.company_name, c.contact_name, c.email as customer_email,
              c.address, c.city, c.province, c.postal_code, c.phone,
              e.first_name || ' ' || e.last_name as created_by_name,
              v.first_name || ' ' || v.last_name as voided_by_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN employees e ON i.created_by = e.id
       LEFT JOIN employees v ON i.voided_by = v.id
       WHERE i.id = ?`
    ).bind(id).first()
    if (!invoice) return c.json({ error: 'Invoice not found' }, 404)

    const { results: lines } = await c.env.DB.prepare(
      `SELECT li.*, st.ticket_number, st.weight_in_at, st.weight_out_at, st.material_grade,
              st.net_weight as current_net_weight, st.tire_type
       FROM invoice_line_items li
       LEFT JOIN scale_tickets st ON li.scale_ticket_id = st.id
       WHERE li.invoice_id = ?
       ORDER BY li.id ASC`
    ).bind(id).all()

    return c.json({ invoice, line_items: lines })
  } catch (err: any) {
    console.error('invoice detail error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Tickets that are completed, priced, and not yet on an invoice. Used by the
// invoice builder UI to populate the "select tickets" list. Walk-in sentinel
// is always excluded — those are walk-up cash customers, not billable.
invoiceRoutes.get('/uninvoiced-tickets/list', async (c) => {
  try {
    const customerId = c.req.query('customer_id')
    if (!customerId) return c.json({ error: 'customer_id is required' }, 400)

    const walkIn = await getWalkInCustomerId(c.env.DB)
    if (walkIn !== null && Number(customerId) === walkIn) {
      return c.json({ tickets: [] })
    }

    const { results } = await c.env.DB.prepare(
      `SELECT st.id, st.ticket_number, st.weight_in_at, st.weight_out_at,
              st.net_weight, st.tire_type, st.material_grade,
              st.price_per_kg, st.total_amount, st.tax_amount, st.grand_total,
              st.payment_status, st.payment_method,
              p.description as material_description
       FROM scale_tickets st
       LEFT JOIN pricing p ON p.material_type = st.tire_type
       WHERE st.customer_id = ?
         AND st.status = 'completed'
         AND st.invoice_id IS NULL
         AND COALESCE(st.grand_total, 0) > 0
       ORDER BY st.weight_out_at DESC, st.id DESC
       LIMIT 500`
    ).bind(customerId).all()

    return c.json({ tickets: results })
  } catch (err: any) {
    console.error('uninvoiced tickets error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// CREATE
// ═══════════════════════════════════════

// Create an invoice from one or more scale tickets. All tickets must:
//   - belong to the given customer
//   - be status = 'completed'
//   - have grand_total > 0
//   - not already be on another invoice
// Pricing/tax is snapshotted per-line from the ticket so later edits to
// `pricing` or to the ticket itself don't drift the issued invoice.
invoiceRoutes.post('/', roleRequired('admin', 'manager'), async (c) => {
  const employeeId = c.get('userId') as number
  try {
    const body = await c.req.json<{
      customer_id: number
      ticket_ids: number[]
      due_date?: string | null
      notes?: string | null
    }>()

    const customerId = Number(body.customer_id)
    const ticketIds = Array.isArray(body.ticket_ids) ? body.ticket_ids.map(Number).filter(Number.isFinite) : []
    const dueDate = typeof body.due_date === 'string' && body.due_date.trim() ? body.due_date.trim().slice(0, 10) : null
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) : null

    if (!Number.isFinite(customerId) || customerId <= 0) {
      return c.json({ error: 'customer_id is required' }, 400)
    }
    if (ticketIds.length === 0) {
      return c.json({ error: 'At least one ticket is required' }, 400)
    }
    if (ticketIds.length > 500) {
      return c.json({ error: 'Too many tickets in one invoice (max 500)' }, 400)
    }

    const walkIn = await getWalkInCustomerId(c.env.DB)
    if (walkIn !== null && customerId === walkIn) {
      return c.json({ error: 'Walk-in tickets cannot be invoiced' }, 400)
    }

    const customer = await c.env.DB.prepare(
      'SELECT id, company_name FROM customers WHERE id = ? AND is_active = 1'
    ).bind(customerId).first<{ id: number, company_name: string }>()
    if (!customer) return c.json({ error: 'Customer not found or inactive' }, 404)

    // Load all candidate tickets in one shot so we can validate them as a set.
    const placeholders = ticketIds.map(() => '?').join(',')
    const { results: tickets } = await c.env.DB.prepare(
      `SELECT id, ticket_number, customer_id, status, invoice_id, net_weight,
              tire_type, material_grade, price_per_kg, total_amount, tax_amount, grand_total
       FROM scale_tickets WHERE id IN (${placeholders})`
    ).bind(...ticketIds).all<any>()

    if (tickets.length !== ticketIds.length) {
      const found = new Set(tickets.map(t => t.id))
      const missing = ticketIds.filter(id => !found.has(id))
      return c.json({ error: `Tickets not found: ${missing.join(', ')}` }, 404)
    }

    const problems: string[] = []
    for (const t of tickets) {
      if (t.customer_id !== customerId) problems.push(`Ticket ${t.ticket_number} belongs to a different customer`)
      if (t.status !== 'completed') problems.push(`Ticket ${t.ticket_number} is not completed (status=${t.status})`)
      if (t.invoice_id) problems.push(`Ticket ${t.ticket_number} is already on invoice ${t.invoice_id}`)
      if (!(Number(t.grand_total) > 0)) problems.push(`Ticket ${t.ticket_number} has no billable amount`)
    }
    if (problems.length) return c.json({ error: problems.join('; ') }, 400)

    let subtotal = 0, taxAmount = 0, total = 0
    for (const t of tickets) {
      subtotal += Number(t.total_amount) || 0
      taxAmount += Number(t.tax_amount) || 0
      total += Number(t.grand_total) || 0
    }
    subtotal = cents(subtotal); taxAmount = cents(taxAmount); total = cents(total)

    // Allocate the invoice number with retry-on-conflict, identical pattern to
    // scale ticket numbers. We do the insert + line items in a D1 batch so the
    // ticket back-references are atomic with the invoice row.
    const MAX_ATTEMPTS = 5
    let invoiceId: number | null = null
    let invoiceNumber: string | null = null
    let lastErr: any = null

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidate = await generateInvoiceNumber(c.env.DB, attempt)
      try {
        const insertResult = await c.env.DB.prepare(
          `INSERT INTO invoices (invoice_number, customer_id, status, due_date, subtotal, tax_amount, total, notes, created_by)
           VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
        ).bind(candidate, customerId, dueDate, subtotal, taxAmount, total, notes, employeeId).run()
        invoiceId = insertResult.meta.last_row_id as number
        invoiceNumber = candidate
        break
      } catch (err: any) {
        lastErr = err
        const msg = String(err?.message || err)
        if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw err
      }
    }
    if (invoiceId === null || invoiceNumber === null) {
      throw lastErr || new Error('Could not allocate invoice number after retries')
    }

    // Line items + ticket back-references in a single batch. If any statement
    // fails the whole batch rolls back, so we never leave a half-billed ticket.
    const batch: D1PreparedStatement[] = []
    for (const t of tickets) {
      const qty = Number(t.net_weight) || 0
      const unitPrice = Number(t.price_per_kg) || 0
      const lineSubtotal = cents(Number(t.total_amount) || 0)
      const lineTax = cents(Number(t.tax_amount) || 0)
      const lineTotal = cents(Number(t.grand_total) || 0)
      const materialLabel = t.material_grade ? `${t.tire_type} (grade ${t.material_grade})` : t.tire_type
      const description = `${t.ticket_number} — ${materialLabel}`

      batch.push(
        c.env.DB.prepare(
          `INSERT INTO invoice_line_items
             (invoice_id, scale_ticket_id, description, quantity, unit, unit_price, line_subtotal, line_tax, line_total)
           VALUES (?, ?, ?, ?, 'kg', ?, ?, ?, ?)`
        ).bind(invoiceId, t.id, description, qty, unitPrice, lineSubtotal, lineTax, lineTotal)
      )
      batch.push(
        c.env.DB.prepare(
          `UPDATE scale_tickets SET invoice_id = ? WHERE id = ? AND invoice_id IS NULL`
        ).bind(invoiceId, t.id)
      )
    }
    const results = await c.env.DB.batch(batch)

    // Defence against a race where another invoice grabbed the same ticket
    // between our SELECT and the batch UPDATE. If any UPDATE changed 0 rows
    // we void this invoice and reject — the unique index on
    // invoice_line_items.scale_ticket_id is the primary guard, but this
    // catches concurrent draft-on-different-invoice cases earlier.
    const updateResults = results.filter((_, idx) => idx % 2 === 1)
    const anyMiss = updateResults.some(r => (r.meta?.changes ?? 0) === 0)
    if (anyMiss) {
      // Roll back: clear back-refs and delete this invoice.
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE scale_tickets SET invoice_id = NULL WHERE invoice_id = ?').bind(invoiceId),
        c.env.DB.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(invoiceId),
        c.env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(invoiceId),
      ])
      return c.json({ error: 'One or more tickets were billed concurrently. Refresh and try again.' }, 409)
    }

    await auditLog(c.env.DB, invoiceId, 'created', employeeId, {
      ticket_count: tickets.length,
      total,
      ticket_ids: tickets.map(t => t.id),
    })

    return c.json({ id: invoiceId, invoice_number: invoiceNumber, subtotal, tax_amount: taxAmount, total })
  } catch (err: any) {
    console.error('invoice create error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// ISSUE / VOID
// ═══════════════════════════════════════

// Move a draft invoice to issued. After this the invoice is the customer's
// bill of record — to take a ticket off it you must void the whole invoice.
invoiceRoutes.post('/:id/issue', roleRequired('admin', 'manager'), async (c) => {
  const id = Number(c.req.param('id'))
  const employeeId = c.get('userId') as number
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  try {
    const inv = await c.env.DB.prepare('SELECT id, status FROM invoices WHERE id = ?').bind(id).first<{ id: number, status: string }>()
    if (!inv) return c.json({ error: 'Invoice not found' }, 404)
    if (inv.status === 'issued') return c.json({ error: 'Invoice is already issued' }, 400)
    if (inv.status === 'void')   return c.json({ error: 'Invoice is voided' }, 400)

    await c.env.DB.prepare(
      `UPDATE invoices SET status = 'issued', issued_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    ).bind(id).run()

    await auditLog(c.env.DB, id, 'issued', employeeId)
    return c.json({ success: true })
  } catch (err: any) {
    console.error('invoice issue error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Void an invoice. Clears scale_tickets.invoice_id on every line item's ticket
// so those tickets become billable again. The line items + invoice row stay
// in place for audit; status flips to 'void'.
invoiceRoutes.post('/:id/void', roleRequired('admin', 'manager'), async (c) => {
  const id = Number(c.req.param('id'))
  const employeeId = c.get('userId') as number
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  try {
    const body = await c.req.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : null
    if (!reason) return c.json({ error: 'Void reason is required' }, 400)

    const inv = await c.env.DB.prepare('SELECT id, status FROM invoices WHERE id = ?').bind(id).first<{ id: number, status: string }>()
    if (!inv) return c.json({ error: 'Invoice not found' }, 404)
    if (inv.status === 'void') return c.json({ error: 'Invoice is already void' }, 400)

    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE scale_tickets SET invoice_id = NULL WHERE invoice_id = ?').bind(id),
      c.env.DB.prepare(
        `UPDATE invoices SET status = 'void', voided_by = ?, voided_at = datetime('now'), void_reason = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(employeeId, reason, id),
    ])

    await auditLog(c.env.DB, id, 'voided', employeeId, { reason })
    return c.json({ success: true })
  } catch (err: any) {
    console.error('invoice void error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})
