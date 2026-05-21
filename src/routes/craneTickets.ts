import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'
import { photoOversize } from '../utils/photo'
import { GST_RATE, cents } from '../utils/money'
import { todayEdmonton } from '../utils/date'
import { hashPassword } from '../utils/passwords'

type Bindings = { DB: D1Database }

export const craneTicketRoutes = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware
craneTicketRoutes.use('*', authMiddleware, employeeOnly)

// Generate crane ticket number: RC-CR-YYYY-NNNNN. The "-CR-" infix keeps the
// crane series visibly distinct from the scale-house RC-YYYY-NNNNN series on
// receipts and ledger exports.
async function generateTicketNumber(db: D1Database, attempt = 0): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RC-CR-${year}-`
  const last = await db.prepare(
    "SELECT ticket_number FROM crane_tickets WHERE ticket_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).bind(prefix + '%').first()

  let nextNum = 1
  if (last && last.ticket_number) {
    const parts = (last.ticket_number as string).split('-')
    // RC-CR-YYYY-NNNNN → parts = ['RC','CR','YYYY','NNNNN']
    nextNum = parseInt(parts[3]) + 1
  }
  nextNum += attempt
  return `${prefix}${String(nextNum).padStart(5, '0')}`
}

// Insert a crane ticket with automatic retry on ticket-number UNIQUE conflict.
async function insertTicketWithRetry(
  db: D1Database,
  buildSqlAndParams: (ticketNumber: string) => { sql: string, params: any[] }
): Promise<{ ticketNumber: string, ticketId: number }> {
  const MAX_ATTEMPTS = 5
  let lastErr: any = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ticketNumber = await generateTicketNumber(db, attempt)
    try {
      const { sql, params } = buildSqlAndParams(ticketNumber)
      const result = await db.prepare(sql).bind(...params).run()
      return { ticketNumber, ticketId: result.meta.last_row_id as number }
    } catch (err: any) {
      lastErr = err
      const msg = String(err?.message || err)
      if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw err
      // Otherwise loop and try the next number.
    }
  }
  throw lastErr || new Error('Could not allocate ticket number after retries')
}

// Resolve the sentinel "Walk-In" customer's id. The print-trigger flow needs
// to create a ticket BEFORE the operator knows which customer it belongs to;
// the FK on crane_tickets.customer_id forces a placeholder, which we keep at
// is_active=0 so it never appears in pickers. Provisioned by migration 0007.
async function getWalkInCustomerId(db: D1Database): Promise<number> {
  const row = await db.prepare(
    "SELECT id FROM customers WHERE email = 'walk-in@reuse-canada.local' LIMIT 1"
  ).first<{ id: number }>()
  if (!row?.id) throw new Error('Walk-In sentinel customer missing — run migration 0007')
  return row.id
}

// Audit log helper
async function auditLog(db: D1Database, ticketId: number, action: string, employeeId: number | null, details?: Record<string, any>) {
  try {
    await db.prepare(
      'INSERT INTO crane_audit_log (crane_ticket_id, action, employee_id, details) VALUES (?, ?, ?, ?)'
    ).bind(ticketId, action, employeeId, details ? JSON.stringify(details) : null).run()
  } catch (e) { /* non-critical */ }
}

// ═══════════════════════════════════════
// LIST & DETAIL
// ═══════════════════════════════════════

// List all scale tickets with filters
craneTicketRoutes.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const date = c.req.query('date')
    const dateFrom = c.req.query('date_from')
    const dateTo = c.req.query('date_to')
    const search = c.req.query('search')

    let sql = `SELECT st.*, c.company_name, e.first_name || ' ' || e.last_name as employee_name
               FROM crane_tickets st
               LEFT JOIN customers c ON st.customer_id = c.id
               LEFT JOIN employees e ON st.employee_id = e.id
               WHERE 1=1`
    const params: any[] = []

    if (status) {
      const allStatus = c.req.queries('status') || [status]
      const statuses = allStatus.flatMap(s => s.split(','))
      sql += ` AND st.status IN (${statuses.map(() => '?').join(',')})`
      params.push(...statuses)
    }
    if (date) {
      sql += ' AND DATE(st.created_at) = ?'
      params.push(date)
    }
    if (dateFrom) {
      sql += ' AND DATE(st.created_at) >= ?'
      params.push(dateFrom)
    }
    if (dateTo) {
      sql += ' AND DATE(st.created_at) <= ?'
      params.push(dateTo)
    }
    if (search) {
      sql += ' AND (st.ticket_number LIKE ? OR c.company_name LIKE ?)'
      params.push('%' + search + '%', '%' + search + '%')
    }

    sql += ' ORDER BY st.created_at DESC LIMIT 100'

    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)

    const { results } = await stmt.all()
    return c.json({ tickets: results })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Get single ticket detail (includes audit log)
craneTicketRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.*, c.company_name, c.contact_name, c.address, c.city,
              e.first_name || ' ' || e.last_name as employee_name
       FROM crane_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN employees e ON st.employee_id = e.id
       WHERE st.id = ?`
    ).bind(id).first()

    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    // Get audit trail
    const { results: auditTrail } = await c.env.DB.prepare(
      `SELECT sal.*, e.first_name || ' ' || e.last_name as employee_name
       FROM crane_audit_log sal
       LEFT JOIN employees e ON sal.employee_id = e.id
       WHERE sal.crane_ticket_id = ?
       ORDER BY sal.created_at ASC`
    ).bind(id).all()

    return c.json({ ticket, audit_trail: auditTrail })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// CREATE TICKETS
// ═══════════════════════════════════════

// Create new scale ticket (from office/yard)
craneTicketRoutes.post('/', async (c) => {
  try {
    const { customer_id, material_type, notes, vehicle_plate } = await c.req.json()
    const employeeId = c.get('userId')

    if (!customer_id) {
      return c.json({ error: 'Customer is required' }, 400)
    }

    const { ticketNumber, ticketId } = await insertTicketWithRetry(c.env.DB, (tn) => ({
      sql: `INSERT INTO crane_tickets (ticket_number, customer_id, employee_id, material_type, notes, vehicle_plate, status)
            VALUES (?, ?, ?, ?, ?, ?, 'field_pending')`,
      params: [tn, customer_id, employeeId, material_type || 'mixed', notes || null, vehicle_plate || null],
    }))

    await auditLog(c.env.DB, ticketId, 'created', employeeId, { source: 'office', customer_id, material_type })

    return c.json({ success: true, id: ticketId, ticket_number: ticketNumber })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Create ticket from field form (iPad)
craneTicketRoutes.post('/field', async (c) => {
  try {
    const {
      pickup_request_id,
      field_store_name,
      field_employee_name,
      field_estimated_tires,
      field_signature_data,
      field_cage_photo_url
    } = await c.req.json()

    const employeeId = c.get('userId')

    if (!field_store_name || !field_employee_name || !field_estimated_tires) {
      return c.json({ error: 'Store name, employee name, and tire count are required' }, 400)
    }

    let customerId = null
    if (pickup_request_id) {
      const pickup = await c.env.DB.prepare(
        'SELECT customer_id FROM pickup_requests WHERE id = ?'
      ).bind(pickup_request_id).first()
      customerId = pickup?.customer_id
    }

    if (!customerId) {
      const customer = await c.env.DB.prepare(
        'SELECT id FROM customers WHERE company_name LIKE ? AND is_active = 1 LIMIT 1'
      ).bind('%' + field_store_name + '%').first()
      // If no real customer matches the store name, fall back to the Walk-In
      // sentinel — never to id=1, which is a real customer (Kal Tire in seed).
      customerId = customer?.id || (await getWalkInCustomerId(c.env.DB))
    }

    const now = new Date().toISOString()

    const { ticketNumber, ticketId } = await insertTicketWithRetry(c.env.DB, (tn) => ({
      sql: `INSERT INTO crane_tickets (
              ticket_number, pickup_request_id, customer_id, employee_id,
              field_store_name, field_employee_name, field_estimated_tires,
              field_signature_data, field_cage_photo_url, field_completed_at,
              status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'field_complete')`,
      params: [
        tn, pickup_request_id || null, customerId, employeeId,
        field_store_name, field_employee_name, field_estimated_tires,
        field_signature_data || null, field_cage_photo_url || null, now,
      ],
    }))

    await auditLog(c.env.DB, ticketId, 'created', employeeId, { source: 'field', store: field_store_name })

    if (pickup_request_id) {
      await c.env.DB.prepare(
        "UPDATE pickup_requests SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?"
      ).bind(pickup_request_id).run()
    }

    return c.json({ success: true, id: ticketId, ticket_number: ticketNumber })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// PRINT TRIGGER & WEIGH
// ═══════════════════════════════════════

// Quick-create ticket from scale PRINT trigger (weight-in only, no customer yet)
craneTicketRoutes.post('/print-trigger', async (c) => {
  try {
    const { weight, photo } = await c.req.json()
    if (!weight || weight <= 0) return c.json({ error: 'Valid weight required' }, 400)
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const employeeId = c.get('userId')
    const walkInId = await getWalkInCustomerId(c.env.DB)
    const now = new Date().toISOString()

    const { ticketNumber, ticketId } = await insertTicketWithRetry(c.env.DB, (tn) => ({
      sql: `INSERT INTO crane_tickets (ticket_number, customer_id, employee_id, material_type, weight_in, weight_in_at, photo_in, photo_in_at, status)
            VALUES (?, ?, ?, 'mixed', ?, ?, ?, ?, 'weighed_in')`,
      params: [tn, walkInId, employeeId, weight, now, photo || null, photo ? now : null],
    }))

    await auditLog(c.env.DB, ticketId, 'weighed_in', employeeId, { weight, has_photo: !!photo })

    return c.json({
      success: true,
      id: ticketId,
      ticket_number: ticketNumber,
      weight_in: weight,
      weight_in_at: now
    })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Quick-create a walk-in customer from the scale-house Assign modal. Any
// employee can do this (including yard_operator) — the scale operator needs
// to capture a customer mid-ticket without leaving the screen. We auto-fill
// the auth fields (email/password) since walk-ins don't log in.
craneTicketRoutes.post('/quick-customer', async (c) => {
  try {
    const { company_name, contact_name, phone } = await c.req.json()
    if (!company_name || !company_name.trim()) {
      return c.json({ error: 'Company name is required' }, 400)
    }

    const company = company_name.trim().slice(0, 200)
    const contact = (contact_name || '').trim().slice(0, 200) || company
    const phoneClean = (phone || '').trim().slice(0, 50) || null

    // Synthesize a unique placeholder login — walk-ins never authenticate, but
    // the customers table requires email UNIQUE NOT NULL + password_hash NOT NULL.
    const suffix = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
    const email = `walkin-${suffix}@reusecanada.local`
    const randomPassword = crypto.randomUUID() + crypto.randomUUID()
    const passwordHash = await hashPassword(randomPassword)

    const result = await c.env.DB.prepare(
      `INSERT INTO customers (email, password_hash, company_name, contact_name, phone, province, is_active)
       VALUES (?, ?, ?, ?, ?, 'AB', 1)`
    ).bind(email, passwordHash, company, contact, phoneClean).run()

    const id = result.meta.last_row_id as number
    return c.json({ id, company_name: company, contact_name: contact, phone: phoneClean })
  } catch (err: any) {
    console.error('craneTickets quick-customer error:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// Record weight (in or out) — manual entry
craneTicketRoutes.post('/:id/weight', async (c) => {
  const id = c.req.param('id')
  try {
    const { type, weight, photo } = await c.req.json()
    const employeeId = c.get('userId')

    if (!type || !weight || weight <= 0) {
      return c.json({ error: 'Valid weight type and value required' }, 400)
    }
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM crane_tickets WHERE id = ?'
    ).bind(id).first()

    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    // State machine: a voided/completed ticket is terminal — no more weights.
    if (ticket.status === 'voided' || ticket.status === 'completed') {
      return c.json({ error: `Cannot record weight on a ${ticket.status} ticket` }, 409)
    }

    const now = new Date().toISOString()

    if (type === 'in') {
      await c.env.DB.prepare(
        `UPDATE crane_tickets SET weight_in = ?, weight_in_at = ?, photo_in = COALESCE(?, photo_in), photo_in_at = COALESCE(?, photo_in_at), status = 'weighed_in', updated_at = datetime('now') WHERE id = ?`
      ).bind(weight, now, photo || null, photo ? now : null, id).run()
      await auditLog(c.env.DB, parseInt(id), 'weighed_in', employeeId, { weight })
    } else if (type === 'out') {
      const netWeight = (ticket.weight_in as number) - weight
      await c.env.DB.prepare(
        `UPDATE crane_tickets SET weight_out = ?, weight_out_at = ?, net_weight = ?, photo_out = COALESCE(?, photo_out), photo_out_at = COALESCE(?, photo_out_at), completed_by = ?, status = 'completed', updated_at = datetime('now') WHERE id = ?`
      ).bind(weight, now, netWeight, photo || null, photo ? now : null, employeeId, id).run()
      await auditLog(c.env.DB, parseInt(id), 'weighed_out', employeeId, { weight, net_weight: netWeight })

      if (ticket.pickup_request_id) {
        await c.env.DB.prepare(
          "UPDATE pickup_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
        ).bind(ticket.pickup_request_id).run()
      }
    } else {
      return c.json({ error: 'Type must be "in" or "out"' }, 400)
    }

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Merge weigh-out with an existing open ticket
craneTicketRoutes.post('/:id/merge-out', async (c) => {
  const id = c.req.param('id')
  try {
    const { weight, photo } = await c.req.json()
    const employeeId = c.get('userId')
    if (!weight || weight <= 0) return c.json({ error: 'Valid weight required' }, 400)
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM crane_tickets WHERE id = ?'
    ).bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)
    if (ticket.status === 'voided' || ticket.status === 'completed') {
      return c.json({ error: `Cannot merge weight-out into a ${ticket.status} ticket` }, 409)
    }

    // Don't Math.abs the net weight — a negative net (weight_out > weight_in)
    // is a real anomaly and should reach detectAnomalies, not be silently
    // squashed to a positive number that prices a swapped weigh-in/out
    // exactly as if it were correct.
    const netWeight = (ticket.weight_in as number) - weight
    const now = new Date().toISOString()

    // Get pricing for this material
    const pricing = await c.env.DB.prepare(
      'SELECT price_per_kg FROM crane_pricing WHERE material_type = ? AND is_active = 1'
    ).bind(ticket.material_type || 'mixed').first()
    const pricePerKg = pricing ? (pricing.price_per_kg as number) : 0.14
    const subtotal = cents(netWeight * pricePerKg)
    const tax = cents(subtotal * GST_RATE)
    const grandTotal = cents(subtotal + tax)

    await c.env.DB.prepare(
      `UPDATE crane_tickets SET
        weight_out = ?, weight_out_at = ?, net_weight = ?,
        photo_out = ?, photo_out_at = ?,
        price_per_kg = ?, total_amount = ?, tax_rate = ?, tax_amount = ?, grand_total = ?,
        completed_by = ?, status = 'completed', updated_at = datetime('now')
       WHERE id = ?`
    ).bind(weight, now, netWeight, photo || null, photo ? now : null, pricePerKg, subtotal, GST_RATE, tax, grandTotal, employeeId, id).run()

    await auditLog(c.env.DB, parseInt(id), 'weighed_out', employeeId, {
      weight_out: weight, net_weight: netWeight, price_per_kg: pricePerKg, grand_total: grandTotal, has_photo: !!photo
    })

    // Fraud detection
    await detectAnomalies(c.env.DB, parseInt(id), ticket.weight_in as number, weight, netWeight)

    if (ticket.pickup_request_id) {
      await c.env.DB.prepare(
        "UPDATE pickup_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
      ).bind(ticket.pickup_request_id).run()
    }

    return c.json({
      success: true,
      net_weight: netWeight,
      price_per_kg: pricePerKg,
      subtotal, tax, grand_total: grandTotal
    })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Single-weigh using stored vehicle tare
craneTicketRoutes.post('/:id/stored-tare', async (c) => {
  const id = c.req.param('id')
  try {
    const { vehicle_id } = await c.req.json()
    const employeeId = c.get('userId')

    const ticket = await c.env.DB.prepare('SELECT * FROM crane_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)
    if (ticket.status === 'voided' || ticket.status === 'completed') {
      return c.json({ error: `Cannot apply stored tare to a ${ticket.status} ticket` }, 409)
    }

    const vehicle = await c.env.DB.prepare('SELECT * FROM vehicles WHERE id = ? AND is_active = 1').bind(vehicle_id).first()
    if (!vehicle || !vehicle.stored_tare_weight) return c.json({ error: 'Vehicle has no stored tare weight' }, 400)

    const tareWeight = vehicle.stored_tare_weight as number
    // No Math.abs — let detectAnomalies see a negative net if the truck's
    // stored tare exceeds the gross-in (e.g. wrong vehicle picked).
    const netWeight = (ticket.weight_in as number) - tareWeight
    const now = new Date().toISOString()

    const pricing = await c.env.DB.prepare(
      'SELECT price_per_kg FROM crane_pricing WHERE material_type = ? AND is_active = 1'
    ).bind(ticket.material_type || 'mixed').first()
    const pricePerKg = pricing ? (pricing.price_per_kg as number) : 0.14
    const subtotal = cents(netWeight * pricePerKg)
    const tax = cents(subtotal * GST_RATE)
    const grandTotal = cents(subtotal + tax)

    await c.env.DB.prepare(
      `UPDATE crane_tickets SET
        weight_out = ?, weight_out_at = ?, net_weight = ?,
        vehicle_id = ?, vehicle_tare_used = 1,
        price_per_kg = ?, total_amount = ?, tax_rate = ?, tax_amount = ?, grand_total = ?,
        completed_by = ?, status = 'completed', updated_at = datetime('now')
       WHERE id = ?`
    ).bind(tareWeight, now, netWeight, vehicle_id, pricePerKg, subtotal, GST_RATE, tax, grandTotal, employeeId, id).run()

    await auditLog(c.env.DB, parseInt(id), 'weighed_out', employeeId, {
      method: 'stored_tare', vehicle_id, tare_weight: tareWeight, net_weight: netWeight, grand_total: grandTotal
    })

    await detectAnomalies(c.env.DB, parseInt(id), ticket.weight_in as number, tareWeight, netWeight)

    if (ticket.pickup_request_id) {
      await c.env.DB.prepare(
        "UPDATE pickup_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
      ).bind(ticket.pickup_request_id).run()
    }

    return c.json({
      success: true,
      net_weight: netWeight, tare_weight: tareWeight,
      price_per_kg: pricePerKg, subtotal, tax, grand_total: grandTotal,
      vehicle_name: vehicle.name
    })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// ASSIGN, VOID, FINALIZE
// ═══════════════════════════════════════

// Finalize ticket with pricing
craneTicketRoutes.post('/:id/finalize', async (c) => {
  const id = c.req.param('id')
  try {
    const { price_per_kg, total_amount, tax_amount, grand_total } = await c.req.json()
    const employeeId = c.get('userId')

    await c.env.DB.prepare(
      `UPDATE crane_tickets SET
        price_per_kg = ?, total_amount = ?, tax_rate = ?,
        tax_amount = ?, grand_total = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(cents(price_per_kg), cents(total_amount), GST_RATE, cents(tax_amount), cents(grand_total), id).run()

    await auditLog(c.env.DB, parseInt(id), 'finalized', employeeId, { grand_total: cents(grand_total) })

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Update ticket customer/material (used after print-trigger creates a blank ticket)
craneTicketRoutes.post('/:id/assign', async (c) => {
  const id = c.req.param('id')
  try {
    const { customer_id, material_type, notes, vehicle_id } = await c.req.json()
    const employeeId = c.get('userId')

    // Snapshot the row before mutation — customer reassignment is a likely
    // fraud surface ("did somebody re-attribute this ticket later?").
    const prev = await c.env.DB.prepare(
      'SELECT customer_id, material_type, vehicle_id FROM crane_tickets WHERE id = ?'
    ).bind(id).first()

    await c.env.DB.prepare(
      `UPDATE crane_tickets SET
        customer_id = COALESCE(?, customer_id),
        material_type = COALESCE(?, material_type),
        notes = COALESCE(?, notes),
        vehicle_id = COALESCE(?, vehicle_id),
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(customer_id || null, material_type || null, notes || null, vehicle_id || null, id).run()

    await auditLog(c.env.DB, parseInt(id), 'assigned', employeeId, {
      customer_id, material_type, vehicle_id,
      prev_customer_id: prev?.customer_id,
      prev_material_type: prev?.material_type,
      prev_vehicle_id: prev?.vehicle_id,
    })

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Void a ticket (requires reason)
craneTicketRoutes.post('/:id/void', async (c) => {
  const id = c.req.param('id')
  try {
    const { reason } = await c.req.json()
    const employeeId = c.get('userId')

    if (!reason || !reason.trim()) {
      return c.json({ error: 'A reason is required to void a ticket' }, 400)
    }

    // Capture the before-snapshot so the audit row can answer "what did
    // this ticket look like before it was voided?" — useful when an admin
    // later disputes the void or wants to un-void.
    const existing = await c.env.DB.prepare(
      'SELECT status, weight_in, weight_out, net_weight, grand_total, payment_status FROM crane_tickets WHERE id = ?'
    ).bind(id).first()
    if (!existing) return c.json({ error: 'Ticket not found' }, 404)
    if (existing.status === 'voided') return c.json({ error: 'Ticket is already voided' }, 409)

    await c.env.DB.prepare(
      "UPDATE crane_tickets SET status = 'voided', voided_by = ?, void_reason = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(employeeId, reason.trim(), id).run()

    await auditLog(c.env.DB, parseInt(id), 'voided', employeeId, {
      reason: reason.trim(),
      prev_status: existing.status,
      prev_weight_in: existing.weight_in,
      prev_weight_out: existing.weight_out,
      prev_net_weight: existing.net_weight,
      prev_grand_total: existing.grand_total,
      prev_payment_status: existing.payment_status,
    })

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════

// Update payment status. Idempotent on square_payment_id: a retried Square
// callback that re-posts the same payment_id won't duplicate the payment_log row.
craneTicketRoutes.post('/:id/payment', async (c) => {
  const id = c.req.param('id')
  try {
    const { payment_status, payment_method, square_payment_id, square_checkout_id } = await c.req.json()
    const employeeId = c.get('userId')

    // Capture the previous payment shape so the audit row can show whether
    // a card payment overwrote a cash one (or vice versa) — important when
    // a customer disputes a charge later.
    const prev = await c.env.DB.prepare(
      'SELECT payment_status, payment_method, square_payment_id FROM crane_tickets WHERE id = ?'
    ).bind(id).first()

    await c.env.DB.prepare(
      `UPDATE crane_tickets SET
        payment_status = ?, payment_method = ?,
        square_payment_id = ?, square_checkout_id = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      payment_status || 'paid',
      payment_method || 'card',
      square_payment_id || null,
      square_checkout_id || null,
      id
    ).run()

    const ticket = await c.env.DB.prepare('SELECT grand_total FROM crane_tickets WHERE id = ?').bind(id).first()

    // Idempotency: skip the crane_payment_log insert when this square_payment_id
    // has already been recorded. Backed by the partial UNIQUE index in 0013.
    let already = false
    if (square_payment_id) {
      const dup = await c.env.DB.prepare(
        'SELECT id FROM crane_payment_log WHERE square_payment_id = ? LIMIT 1'
      ).bind(square_payment_id).first()
      if (dup) already = true
    }

    if (!already) {
      try {
        await c.env.DB.prepare(
          `INSERT INTO crane_payment_log (crane_ticket_id, amount, payment_method, square_payment_id, square_checkout_id, status)
           VALUES (?, ?, ?, ?, ?, 'completed')`
        ).bind(id, ticket?.grand_total || 0, payment_method || 'card', square_payment_id || null, square_checkout_id || null).run()
      } catch (e: any) {
        // The UNIQUE index will fire if a concurrent retry got there first.
        const msg = String(e?.message || e)
        if (!msg.includes('UNIQUE') && !msg.includes('constraint')) throw e
        already = true
      }
    }

    await auditLog(c.env.DB, parseInt(id), 'payment', employeeId, {
      method: payment_method || 'card',
      amount: ticket?.grand_total,
      idempotent_skip: already,
      prev_payment_status: prev?.payment_status,
      prev_payment_method: prev?.payment_method,
      prev_square_payment_id: prev?.square_payment_id,
    })

    return c.json({ success: true, already_recorded: already })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// PHOTO & RECEIPT
// ═══════════════════════════════════════

// Attach photo to ticket
craneTicketRoutes.post('/:id/photo', async (c) => {
  const id = c.req.param('id')
  try {
    const { type, photo } = await c.req.json()
    if (!photo || !type) return c.json({ error: 'Photo data and type (in/out) required' }, 400)
    if (photoOversize(photo)) return c.json({ error: 'Photo is too large' }, 413)

    const now = new Date().toISOString()
    if (type === 'in') {
      await c.env.DB.prepare(
        'UPDATE crane_tickets SET photo_in = ?, photo_in_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(photo, now, id).run()
    } else {
      await c.env.DB.prepare(
        'UPDATE crane_tickets SET photo_out = ?, photo_out_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(photo, now, id).run()
    }

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Get receipt data for thermal printer
craneTicketRoutes.get('/:id/receipt', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.*, c.company_name, c.contact_name, c.address, c.city, c.phone as customer_phone
       FROM crane_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE st.id = ?`
    ).bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    return c.json({
      receipt: {
        company: 'REUSE CANADA',
        tagline: 'Waste-to-Value Recycling',
        location: 'Alberta, Canada',
        ticket_number: ticket.ticket_number,
        date: ticket.created_at,
        customer: ticket.company_name || 'Walk-in',
        contact: ticket.contact_name,
        address: ticket.address,
        city: ticket.city,
        material: ticket.material_type,
        weight_in: ticket.weight_in,
        weight_in_at: ticket.weight_in_at,
        weight_out: ticket.weight_out,
        weight_out_at: ticket.weight_out_at,
        net_weight: ticket.net_weight,
        price_per_kg: ticket.price_per_kg,
        subtotal: ticket.total_amount,
        tax_rate: ticket.tax_rate,
        tax_amount: ticket.tax_amount,
        grand_total: ticket.grand_total,
        payment_method: ticket.payment_method,
        payment_status: ticket.payment_status,
        vehicle_tare_used: ticket.vehicle_tare_used,
      }
    })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Mark receipt as printed
craneTicketRoutes.post('/:id/receipt-printed', async (c) => {
  const id = c.req.param('id')
  try {
    const employeeId = c.get('userId')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE crane_tickets SET receipt_printed = 1, receipt_printed_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(now, id).run()

    await auditLog(c.env.DB, parseInt(id), 'receipt_printed', employeeId)

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// VEHICLES / TARE
// ═══════════════════════════════════════

// List vehicles with stored tare weights
craneTicketRoutes.get('/vehicles/tare', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, plate_number, vehicle_type, tare_weight, stored_tare_weight FROM vehicles WHERE is_active = 1 ORDER BY name'
    ).all()
    return c.json({ vehicles: results })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// WEIGHT EDITING (admin/manager only)
// ═══════════════════════════════════════

craneTicketRoutes.patch('/:id/weight', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { field, new_value, reason } = await c.req.json()
    const employeeId = c.get('userId')

    if (!field || !['weight_in', 'weight_out'].includes(field)) {
      return c.json({ error: 'Field must be weight_in or weight_out' }, 400)
    }
    if (!new_value || new_value <= 0) return c.json({ error: 'Valid weight required' }, 400)
    if (!reason || !reason.trim()) return c.json({ error: 'Reason required for weight edit' }, 400)

    const ticket = await c.env.DB.prepare('SELECT * FROM crane_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    const oldValue = ticket[field] as number
    if (!oldValue) return c.json({ error: 'No existing weight to edit for this field' }, 400)

    // Record the edit
    await c.env.DB.prepare(
      'INSERT INTO crane_weight_edits (crane_ticket_id, field, old_value, new_value, reason, editor_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(parseInt(id), field, oldValue, new_value, reason.trim(), employeeId).run()

    // Update the weight. Always recompute net_weight from the (possibly
    // updated) pair: if only one side exists, net is undefined; if both
    // exist, net = in - out (signed — Math.abs would mask a swapped weigh-in).
    const weightIn = field === 'weight_in' ? new_value : (ticket.weight_in as number | null)
    const weightOut = field === 'weight_out' ? new_value : (ticket.weight_out as number | null)
    const netWeight = (weightIn && weightOut) ? (weightIn - weightOut) : null

    let pricePerKg = ticket.price_per_kg as number
    let subtotal = ticket.total_amount as number
    let tax = ticket.tax_amount as number
    let grandTotal = ticket.grand_total as number

    if (netWeight !== ticket.net_weight && ticket.status === 'completed' && pricePerKg > 0 && netWeight) {
      subtotal = cents(netWeight * pricePerKg)
      tax = cents(subtotal * GST_RATE)
      grandTotal = cents(subtotal + tax)
    }

    await c.env.DB.prepare(
      `UPDATE crane_tickets SET ${field} = ?, net_weight = ?, total_amount = ?, tax_amount = ?, grand_total = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(new_value, netWeight, subtotal, tax, grandTotal, id).run()

    await auditLog(c.env.DB, parseInt(id), 'weight_edited', employeeId, {
      field, old_value: oldValue, new_value, reason: reason.trim(), net_weight: netWeight, grand_total: grandTotal
    })

    // Check for anomalies on new values
    await detectAnomalies(c.env.DB, parseInt(id), weightIn, weightOut, netWeight)

    return c.json({ success: true, net_weight: netWeight, grand_total: grandTotal })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// FRAUD DETECTION / ANOMALIES
// ═══════════════════════════════════════

// Anomaly detection helper
async function detectAnomalies(db: D1Database, ticketId: number, weightIn: number, weightOut: number, netWeight: number) {
  const anomalies: { type: string, severity: string, description: string }[] = []

  if (netWeight < 0) {
    anomalies.push({ type: 'negative_net', severity: 'high', description: 'Net weight is negative (' + netWeight.toFixed(1) + ' kg). Weight out exceeds weight in.' })
  }
  if (netWeight >= 0 && netWeight < 10) {
    anomalies.push({ type: 'zero_net', severity: 'medium', description: 'Net weight is near zero (' + netWeight.toFixed(1) + ' kg). Possible empty load.' })
  }
  if (weightIn > 50000) {
    anomalies.push({ type: 'extreme_value', severity: 'high', description: 'Gross weight exceeds 50,000 kg (' + weightIn.toFixed(1) + ' kg). Verify scale reading.' })
  }
  if (weightOut > 50000) {
    anomalies.push({ type: 'extreme_value', severity: 'high', description: 'Tare weight exceeds 50,000 kg (' + weightOut.toFixed(1) + ' kg). Verify scale reading.' })
  }

  // Check for rapid repeat (same ticket within 10 minutes of another from same customer)
  try {
    const ticket = await db.prepare('SELECT customer_id, material_type, created_at FROM crane_tickets WHERE id = ?').bind(ticketId).first()
    if (ticket && ticket.customer_id) {
      const recent = await db.prepare(
        "SELECT COUNT(*) as cnt FROM crane_tickets WHERE customer_id = ? AND material_type = ? AND id != ? AND created_at > datetime(?, '-10 minutes') AND status != 'voided'"
      ).bind(ticket.customer_id, ticket.material_type, ticketId, ticket.created_at).first()
      if (recent && (recent.cnt as number) > 0) {
        anomalies.push({ type: 'rapid_repeat', severity: 'medium', description: 'Another ticket for same customer/material within 10 minutes.' })
      }
    }
  } catch (e) { /* non-critical */ }

  // Insert anomalies
  for (const a of anomalies) {
    try {
      await db.prepare(
        'INSERT INTO crane_anomalies (crane_ticket_id, anomaly_type, severity, description) VALUES (?, ?, ?, ?)'
      ).bind(ticketId, a.type, a.severity, a.description).run()
    } catch (e) { /* non-critical */ }
  }

  return anomalies
}

// List anomalies
craneTicketRoutes.get('/anomalies/list', async (c) => {
  try {
    const resolved = c.req.query('resolved')
    let sql = `SELECT wa.*, st.ticket_number, c.company_name, e.first_name || ' ' || e.last_name as resolved_by_name
               FROM crane_anomalies wa
               LEFT JOIN crane_tickets st ON wa.crane_ticket_id = st.id
               LEFT JOIN customers c ON st.customer_id = c.id
               LEFT JOIN employees e ON wa.resolved_by = e.id
               WHERE 1=1`
    const params: any[] = []
    if (resolved === '0' || resolved === 'false') { sql += ' AND wa.resolved = 0' }
    else if (resolved === '1' || resolved === 'true') { sql += ' AND wa.resolved = 1' }
    sql += ' ORDER BY wa.created_at DESC LIMIT 100'

    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) stmt = stmt.bind(...params)
    const { results } = await stmt.all()
    return c.json({ anomalies: results })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Resolve an anomaly
craneTicketRoutes.post('/anomalies/:id/resolve', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { note } = await c.req.json()
    const employeeId = c.get('userId')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE crane_anomalies SET resolved = 1, resolved_by = ?, resolved_at = ?, description = description || ? WHERE id = ?'
    ).bind(employeeId, now, note ? ' | Resolved: ' + note.trim() : '', id).run()

    return c.json({ success: true })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// ═══════════════════════════════════════
// DAILY SETTLEMENT
// ═══════════════════════════════════════

// Get daily settlement summary
craneTicketRoutes.get('/settlement/daily', async (c) => {
  try {
    // "Today" must be Edmonton-local — the worker runs in UTC and
    // toISOString() flips the date at 5pm/6pm local otherwise.
    const date = c.req.query('date') || todayEdmonton()

    const { results: tickets } = await c.env.DB.prepare(
      `SELECT st.id, st.ticket_number, st.grand_total, st.payment_status, st.payment_method, c.company_name
       FROM crane_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       WHERE DATE(st.created_at) = ? AND st.status = 'completed'
       ORDER BY st.created_at ASC`
    ).bind(date).all()

    const summary = {
      date,
      total_tickets: tickets.length,
      paid_card: { count: 0, amount: 0 },
      paid_cash: { count: 0, amount: 0 },
      unpaid: { count: 0, amount: 0 },
      total_revenue: 0,
    }

    for (const t of tickets) {
      const amount = (t.grand_total as number) || 0
      summary.total_revenue += amount
      if (t.payment_status === 'paid') {
        if (t.payment_method === 'cash') { summary.paid_cash.count++; summary.paid_cash.amount += amount }
        else { summary.paid_card.count++; summary.paid_card.amount += amount }
      } else {
        summary.unpaid.count++; summary.unpaid.amount += amount
      }
    }

    // Check if batch already exists for this date
    const batch = await c.env.DB.prepare(
      'SELECT * FROM crane_payment_batches WHERE batch_date = ?'
    ).bind(date).first()

    return c.json({ summary, tickets, batch })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})

// Settle a daily batch
craneTicketRoutes.post('/settlement/batch', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { date } = await c.req.json()
    const employeeId = c.get('userId')
    if (!date) return c.json({ error: 'Date required' }, 400)

    // Sum only paid tickets — unpaid receivables don't belong in a settled
    // cash batch. Backed by the UNIQUE(batch_date) index added in 0010, the
    // INSERT below also fails atomically if two admins race.
    const { results: tickets } = await c.env.DB.prepare(
      "SELECT id, grand_total FROM crane_tickets WHERE DATE(created_at) = ? AND status = 'completed' AND payment_status = 'paid'"
    ).bind(date).all()

    const totalAmount = tickets.reduce((s: number, t: any) => s + ((t.grand_total as number) || 0), 0)
    const now = new Date().toISOString()

    try {
      await c.env.DB.prepare(
        'INSERT INTO crane_payment_batches (batch_date, ticket_count, total_amount, status, settled_by, settled_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(date, tickets.length, totalAmount, 'settled', employeeId, now).run()
    } catch (e: any) {
      const msg = String(e?.message || e)
      if (msg.includes('UNIQUE') || msg.includes('constraint')) {
        return c.json({ error: 'Batch already settled for this date' }, 409)
      }
      throw e
    }

    return c.json({ success: true, ticket_count: tickets.length, total_amount: totalAmount })
  } catch (err: any) {
    console.error('craneTickets error:', err); return c.json({ error: 'Server error' }, 500)
  }
})
