import { Hono } from 'hono'
import { authMiddleware, employeeOnly, roleRequired } from '../middleware/auth'

type Bindings = { DB: D1Database }

export const scaleTicketRoutes = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware
scaleTicketRoutes.use('*', authMiddleware, employeeOnly)

// Generate ticket number: RC-YYYY-NNNNN
async function generateTicketNumber(db: D1Database): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RC-${year}-`
  const last = await db.prepare(
    "SELECT ticket_number FROM scale_tickets WHERE ticket_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).bind(prefix + '%').first()

  let nextNum = 1
  if (last && last.ticket_number) {
    const parts = (last.ticket_number as string).split('-')
    nextNum = parseInt(parts[2]) + 1
  }
  return `${prefix}${String(nextNum).padStart(5, '0')}`
}

// Audit log helper
async function auditLog(db: D1Database, ticketId: number, action: string, employeeId: number | null, details?: Record<string, any>) {
  try {
    await db.prepare(
      'INSERT INTO scale_audit_log (scale_ticket_id, action, employee_id, details) VALUES (?, ?, ?, ?)'
    ).bind(ticketId, action, employeeId, details ? JSON.stringify(details) : null).run()
  } catch (e) { /* non-critical */ }
}

// ═══════════════════════════════════════
// LIST & DETAIL
// ═══════════════════════════════════════

// List all scale tickets with filters
scaleTicketRoutes.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const date = c.req.query('date')
    const dateFrom = c.req.query('date_from')
    const dateTo = c.req.query('date_to')
    const search = c.req.query('search')

    let sql = `SELECT st.*, c.company_name, e.first_name || ' ' || e.last_name as employee_name
               FROM scale_tickets st
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
    return c.json({ error: err.message }, 500)
  }
})

// Get single ticket detail (includes audit log)
scaleTicketRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.*, c.company_name, c.contact_name, c.address, c.city,
              e.first_name || ' ' || e.last_name as employee_name
       FROM scale_tickets st
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN employees e ON st.employee_id = e.id
       WHERE st.id = ?`
    ).bind(id).first()

    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    // Get audit trail
    const { results: auditTrail } = await c.env.DB.prepare(
      `SELECT sal.*, e.first_name || ' ' || e.last_name as employee_name
       FROM scale_audit_log sal
       LEFT JOIN employees e ON sal.employee_id = e.id
       WHERE sal.scale_ticket_id = ?
       ORDER BY sal.created_at ASC`
    ).bind(id).all()

    return c.json({ ticket, audit_trail: auditTrail })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// CREATE TICKETS
// ═══════════════════════════════════════

// Create new scale ticket (from office/yard)
scaleTicketRoutes.post('/', async (c) => {
  try {
    const { customer_id, tire_type, notes, vehicle_plate } = await c.req.json()
    const employeeId = c.get('userId')

    if (!customer_id) {
      return c.json({ error: 'Customer is required' }, 400)
    }

    const ticketNumber = await generateTicketNumber(c.env.DB)

    const result = await c.env.DB.prepare(
      `INSERT INTO scale_tickets (ticket_number, customer_id, employee_id, tire_type, notes, vehicle_plate, status)
       VALUES (?, ?, ?, ?, ?, ?, 'field_pending')`
    ).bind(ticketNumber, customer_id, employeeId, tire_type || 'mixed', notes || null, vehicle_plate || null).run()

    const ticketId = result.meta.last_row_id as number
    await auditLog(c.env.DB, ticketId, 'created', employeeId, { source: 'office', customer_id, tire_type })

    return c.json({ success: true, id: ticketId, ticket_number: ticketNumber })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Create ticket from field form (iPad)
scaleTicketRoutes.post('/field', async (c) => {
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

    const ticketNumber = await generateTicketNumber(c.env.DB)

    let customerId = null
    if (pickup_request_id) {
      const pickup = await c.env.DB.prepare(
        'SELECT customer_id FROM pickup_requests WHERE id = ?'
      ).bind(pickup_request_id).first()
      customerId = pickup?.customer_id
    }

    if (!customerId) {
      const customer = await c.env.DB.prepare(
        'SELECT id FROM customers WHERE company_name LIKE ? LIMIT 1'
      ).bind('%' + field_store_name + '%').first()
      customerId = customer?.id || 1
    }

    const now = new Date().toISOString()

    const result = await c.env.DB.prepare(
      `INSERT INTO scale_tickets (
        ticket_number, pickup_request_id, customer_id, employee_id,
        field_store_name, field_employee_name, field_estimated_tires,
        field_signature_data, field_cage_photo_url, field_completed_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'field_complete')`
    ).bind(
      ticketNumber, pickup_request_id || null, customerId, employeeId,
      field_store_name, field_employee_name, field_estimated_tires,
      field_signature_data || null, field_cage_photo_url || null, now
    ).run()

    const ticketId = result.meta.last_row_id as number
    await auditLog(c.env.DB, ticketId, 'created', employeeId, { source: 'field', store: field_store_name })

    if (pickup_request_id) {
      await c.env.DB.prepare(
        "UPDATE pickup_requests SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?"
      ).bind(pickup_request_id).run()
    }

    return c.json({ success: true, id: ticketId, ticket_number: ticketNumber })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// PRINT TRIGGER & WEIGH
// ═══════════════════════════════════════

// Quick-create ticket from scale PRINT trigger (weight-in only, no customer yet)
scaleTicketRoutes.post('/print-trigger', async (c) => {
  try {
    const { weight, photo } = await c.req.json()
    if (!weight || weight <= 0) return c.json({ error: 'Valid weight required' }, 400)

    const employeeId = c.get('userId')
    const ticketNumber = await generateTicketNumber(c.env.DB)
    const now = new Date().toISOString()

    const result = await c.env.DB.prepare(
      `INSERT INTO scale_tickets (ticket_number, customer_id, employee_id, tire_type, weight_in, weight_in_at, photo_in, photo_in_at, status)
       VALUES (?, 0, ?, 'mixed', ?, ?, ?, ?, 'weighed_in')`
    ).bind(ticketNumber, employeeId, weight, now, photo || null, photo ? now : null).run()

    const ticketId = result.meta.last_row_id as number
    await auditLog(c.env.DB, ticketId, 'weighed_in', employeeId, { weight, has_photo: !!photo })

    return c.json({
      success: true,
      id: ticketId,
      ticket_number: ticketNumber,
      weight_in: weight,
      weight_in_at: now
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Record weight (in or out) — manual entry
scaleTicketRoutes.post('/:id/weight', async (c) => {
  const id = c.req.param('id')
  try {
    const { type, weight, photo } = await c.req.json()
    const employeeId = c.get('userId')

    if (!type || !weight || weight <= 0) {
      return c.json({ error: 'Valid weight type and value required' }, 400)
    }

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM scale_tickets WHERE id = ?'
    ).bind(id).first()

    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    const now = new Date().toISOString()

    if (type === 'in') {
      await c.env.DB.prepare(
        `UPDATE scale_tickets SET weight_in = ?, weight_in_at = ?, photo_in = COALESCE(?, photo_in), photo_in_at = COALESCE(?, photo_in_at), status = 'weighed_in', updated_at = datetime('now') WHERE id = ?`
      ).bind(weight, now, photo || null, photo ? now : null, id).run()
      await auditLog(c.env.DB, parseInt(id), 'weighed_in', employeeId, { weight })
    } else if (type === 'out') {
      const netWeight = (ticket.weight_in as number) - weight
      await c.env.DB.prepare(
        `UPDATE scale_tickets SET weight_out = ?, weight_out_at = ?, net_weight = ?, photo_out = COALESCE(?, photo_out), photo_out_at = COALESCE(?, photo_out_at), completed_by = ?, status = 'completed', updated_at = datetime('now') WHERE id = ?`
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
    return c.json({ error: err.message }, 500)
  }
})

// Merge weigh-out with an existing open ticket
scaleTicketRoutes.post('/:id/merge-out', async (c) => {
  const id = c.req.param('id')
  try {
    const { weight, photo } = await c.req.json()
    const employeeId = c.get('userId')
    if (!weight || weight <= 0) return c.json({ error: 'Valid weight required' }, 400)

    const ticket = await c.env.DB.prepare(
      'SELECT * FROM scale_tickets WHERE id = ?'
    ).bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)

    const netWeight = Math.abs((ticket.weight_in as number) - weight)
    const now = new Date().toISOString()

    // Get pricing for this material
    const pricing = await c.env.DB.prepare(
      'SELECT price_per_kg FROM pricing WHERE material_type = ? AND is_active = 1'
    ).bind(ticket.tire_type || 'mixed').first()
    const pricePerKg = pricing ? (pricing.price_per_kg as number) : 0.14
    const subtotal = netWeight * pricePerKg
    const tax = subtotal * 0.05
    const grandTotal = subtotal + tax

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        weight_out = ?, weight_out_at = ?, net_weight = ?,
        photo_out = ?, photo_out_at = ?,
        price_per_kg = ?, total_amount = ?, tax_rate = 0.05, tax_amount = ?, grand_total = ?,
        completed_by = ?, status = 'completed', updated_at = datetime('now')
       WHERE id = ?`
    ).bind(weight, now, netWeight, photo || null, photo ? now : null, pricePerKg, subtotal, tax, grandTotal, employeeId, id).run()

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
    return c.json({ error: err.message }, 500)
  }
})

// Single-weigh using stored vehicle tare
scaleTicketRoutes.post('/:id/stored-tare', async (c) => {
  const id = c.req.param('id')
  try {
    const { vehicle_id } = await c.req.json()
    const employeeId = c.get('userId')

    const ticket = await c.env.DB.prepare('SELECT * FROM scale_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)
    if (!ticket.weight_in) return c.json({ error: 'Ticket has no weight-in recorded' }, 400)

    const vehicle = await c.env.DB.prepare('SELECT * FROM vehicles WHERE id = ? AND is_active = 1').bind(vehicle_id).first()
    if (!vehicle || !vehicle.stored_tare_weight) return c.json({ error: 'Vehicle has no stored tare weight' }, 400)

    const tareWeight = vehicle.stored_tare_weight as number
    const netWeight = Math.abs((ticket.weight_in as number) - tareWeight)
    const now = new Date().toISOString()

    const pricing = await c.env.DB.prepare(
      'SELECT price_per_kg FROM pricing WHERE material_type = ? AND is_active = 1'
    ).bind(ticket.tire_type || 'mixed').first()
    const pricePerKg = pricing ? (pricing.price_per_kg as number) : 0.14
    const subtotal = netWeight * pricePerKg
    const tax = subtotal * 0.05
    const grandTotal = subtotal + tax

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        weight_out = ?, weight_out_at = ?, net_weight = ?,
        vehicle_id = ?, vehicle_tare_used = 1,
        price_per_kg = ?, total_amount = ?, tax_rate = 0.05, tax_amount = ?, grand_total = ?,
        completed_by = ?, status = 'completed', updated_at = datetime('now')
       WHERE id = ?`
    ).bind(tareWeight, now, netWeight, vehicle_id, pricePerKg, subtotal, tax, grandTotal, employeeId, id).run()

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
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// ASSIGN, VOID, FINALIZE
// ═══════════════════════════════════════

// Finalize ticket with pricing
scaleTicketRoutes.post('/:id/finalize', async (c) => {
  const id = c.req.param('id')
  try {
    const { price_per_kg, total_amount, tax_amount, grand_total } = await c.req.json()
    const employeeId = c.get('userId')

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        price_per_kg = ?, total_amount = ?, tax_rate = 0.05,
        tax_amount = ?, grand_total = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(price_per_kg || 0, total_amount || 0, tax_amount || 0, grand_total || 0, id).run()

    await auditLog(c.env.DB, parseInt(id), 'finalized', employeeId, { grand_total })

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Update ticket customer/material (used after print-trigger creates a blank ticket)
scaleTicketRoutes.post('/:id/assign', async (c) => {
  const id = c.req.param('id')
  try {
    const { customer_id, tire_type, notes, vehicle_id } = await c.req.json()
    const employeeId = c.get('userId')

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
        customer_id = COALESCE(?, customer_id),
        tire_type = COALESCE(?, tire_type),
        notes = COALESCE(?, notes),
        vehicle_id = COALESCE(?, vehicle_id),
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(customer_id || null, tire_type || null, notes || null, vehicle_id || null, id).run()

    await auditLog(c.env.DB, parseInt(id), 'assigned', employeeId, { customer_id, tire_type, vehicle_id })

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Void a ticket (requires reason)
scaleTicketRoutes.post('/:id/void', async (c) => {
  const id = c.req.param('id')
  try {
    const { reason } = await c.req.json()
    const employeeId = c.get('userId')

    if (!reason || !reason.trim()) {
      return c.json({ error: 'A reason is required to void a ticket' }, 400)
    }

    await c.env.DB.prepare(
      "UPDATE scale_tickets SET status = 'voided', voided_by = ?, void_reason = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(employeeId, reason.trim(), id).run()

    await auditLog(c.env.DB, parseInt(id), 'voided', employeeId, { reason: reason.trim() })

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════

// Update payment status
scaleTicketRoutes.post('/:id/payment', async (c) => {
  const id = c.req.param('id')
  try {
    const { payment_status, payment_method, square_payment_id, square_checkout_id } = await c.req.json()
    const employeeId = c.get('userId')

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET
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

    const ticket = await c.env.DB.prepare('SELECT grand_total FROM scale_tickets WHERE id = ?').bind(id).first()
    await c.env.DB.prepare(
      `INSERT INTO payment_log (scale_ticket_id, amount, payment_method, square_payment_id, square_checkout_id, status)
       VALUES (?, ?, ?, ?, ?, 'completed')`
    ).bind(id, ticket?.grand_total || 0, payment_method || 'card', square_payment_id || null, square_checkout_id || null).run()

    await auditLog(c.env.DB, parseInt(id), 'payment', employeeId, { method: payment_method || 'card', amount: ticket?.grand_total })

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// PHOTO & RECEIPT
// ═══════════════════════════════════════

// Attach photo to ticket
scaleTicketRoutes.post('/:id/photo', async (c) => {
  const id = c.req.param('id')
  try {
    const { type, photo } = await c.req.json()
    if (!photo || !type) return c.json({ error: 'Photo data and type (in/out) required' }, 400)

    const now = new Date().toISOString()
    if (type === 'in') {
      await c.env.DB.prepare(
        'UPDATE scale_tickets SET photo_in = ?, photo_in_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(photo, now, id).run()
    } else {
      await c.env.DB.prepare(
        'UPDATE scale_tickets SET photo_out = ?, photo_out_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(photo, now, id).run()
    }

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get receipt data for thermal printer
scaleTicketRoutes.get('/:id/receipt', async (c) => {
  const id = c.req.param('id')
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.*, c.company_name, c.contact_name, c.address, c.city, c.phone as customer_phone
       FROM scale_tickets st
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
        material: ticket.tire_type,
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
    return c.json({ error: err.message }, 500)
  }
})

// Mark receipt as printed
scaleTicketRoutes.post('/:id/receipt-printed', async (c) => {
  const id = c.req.param('id')
  try {
    const employeeId = c.get('userId')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE scale_tickets SET receipt_printed = 1, receipt_printed_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(now, id).run()

    await auditLog(c.env.DB, parseInt(id), 'receipt_printed', employeeId)

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// VEHICLES / TARE
// ═══════════════════════════════════════

// List vehicles with stored tare weights
scaleTicketRoutes.get('/vehicles/tare', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, plate_number, vehicle_type, tare_weight, stored_tare_weight FROM vehicles WHERE is_active = 1 ORDER BY name'
    ).all()
    return c.json({ vehicles: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// WEIGHT EDITING (admin/manager only)
// ═══════════════════════════════════════

scaleTicketRoutes.patch('/:id/weight', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { field, new_value, reason } = await c.req.json()
    const employeeId = c.get('userId')

    if (!field || !['weight_in', 'weight_out'].includes(field)) {
      return c.json({ error: 'Field must be weight_in or weight_out' }, 400)
    }
    if (!new_value || new_value <= 0) return c.json({ error: 'Valid weight required' }, 400)
    if (!reason || !reason.trim()) return c.json({ error: 'Reason required for weight edit' }, 400)

    const ticket = await c.env.DB.prepare('SELECT * FROM scale_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404)

    const oldValue = ticket[field] as number
    if (!oldValue) return c.json({ error: 'No existing weight to edit for this field' }, 400)

    // Record the edit
    await c.env.DB.prepare(
      'INSERT INTO scale_weight_edits (scale_ticket_id, field, old_value, new_value, reason, editor_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(parseInt(id), field, oldValue, new_value, reason.trim(), employeeId).run()

    // Update the weight
    const weightIn = field === 'weight_in' ? new_value : (ticket.weight_in as number)
    const weightOut = field === 'weight_out' ? new_value : (ticket.weight_out as number)
    const netWeight = weightIn && weightOut ? Math.abs(weightIn - weightOut) : (ticket.net_weight as number)

    // Recalculate pricing if net changed and ticket is completed
    let pricePerKg = ticket.price_per_kg as number
    let subtotal = ticket.total_amount as number
    let tax = ticket.tax_amount as number
    let grandTotal = ticket.grand_total as number

    if (netWeight !== ticket.net_weight && ticket.status === 'completed' && pricePerKg > 0) {
      subtotal = netWeight * pricePerKg
      tax = subtotal * 0.05
      grandTotal = subtotal + tax
    }

    await c.env.DB.prepare(
      `UPDATE scale_tickets SET ${field} = ?, net_weight = ?, total_amount = ?, tax_amount = ?, grand_total = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(new_value, netWeight, subtotal, tax, grandTotal, id).run()

    await auditLog(c.env.DB, parseInt(id), 'weight_edited', employeeId, {
      field, old_value: oldValue, new_value, reason: reason.trim(), net_weight: netWeight, grand_total: grandTotal
    })

    // Check for anomalies on new values
    await detectAnomalies(c.env.DB, parseInt(id), weightIn, weightOut, netWeight)

    return c.json({ success: true, net_weight: netWeight, grand_total: grandTotal })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
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
    const ticket = await db.prepare('SELECT customer_id, tire_type, created_at FROM scale_tickets WHERE id = ?').bind(ticketId).first()
    if (ticket && ticket.customer_id) {
      const recent = await db.prepare(
        "SELECT COUNT(*) as cnt FROM scale_tickets WHERE customer_id = ? AND tire_type = ? AND id != ? AND created_at > datetime(?, '-10 minutes') AND status != 'voided'"
      ).bind(ticket.customer_id, ticket.tire_type, ticketId, ticket.created_at).first()
      if (recent && (recent.cnt as number) > 0) {
        anomalies.push({ type: 'rapid_repeat', severity: 'medium', description: 'Another ticket for same customer/material within 10 minutes.' })
      }
    }
  } catch (e) { /* non-critical */ }

  // Insert anomalies
  for (const a of anomalies) {
    try {
      await db.prepare(
        'INSERT INTO weight_anomalies (scale_ticket_id, anomaly_type, severity, description) VALUES (?, ?, ?, ?)'
      ).bind(ticketId, a.type, a.severity, a.description).run()
    } catch (e) { /* non-critical */ }
  }

  return anomalies
}

// List anomalies
scaleTicketRoutes.get('/anomalies/list', async (c) => {
  try {
    const resolved = c.req.query('resolved')
    let sql = `SELECT wa.*, st.ticket_number, c.company_name, e.first_name || ' ' || e.last_name as resolved_by_name
               FROM weight_anomalies wa
               LEFT JOIN scale_tickets st ON wa.scale_ticket_id = st.id
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
    return c.json({ error: err.message }, 500)
  }
})

// Resolve an anomaly
scaleTicketRoutes.post('/anomalies/:id/resolve', roleRequired('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  try {
    const { note } = await c.req.json()
    const employeeId = c.get('userId')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE weight_anomalies SET resolved = 1, resolved_by = ?, resolved_at = ?, description = description || ? WHERE id = ?'
    ).bind(employeeId, now, note ? ' | Resolved: ' + note.trim() : '', id).run()

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ═══════════════════════════════════════
// DAILY SETTLEMENT
// ═══════════════════════════════════════

// Get daily settlement summary
scaleTicketRoutes.get('/settlement/daily', async (c) => {
  try {
    const date = c.req.query('date') || new Date().toISOString().split('T')[0]

    const { results: tickets } = await c.env.DB.prepare(
      `SELECT st.id, st.ticket_number, st.grand_total, st.payment_status, st.payment_method, c.company_name
       FROM scale_tickets st
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
      'SELECT * FROM payment_batches WHERE batch_date = ?'
    ).bind(date).first()

    return c.json({ summary, tickets, batch })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Settle a daily batch
scaleTicketRoutes.post('/settlement/batch', roleRequired('admin', 'manager'), async (c) => {
  try {
    const { date } = await c.req.json()
    const employeeId = c.get('userId')
    if (!date) return c.json({ error: 'Date required' }, 400)

    // Check for existing batch
    const existing = await c.env.DB.prepare(
      'SELECT id FROM payment_batches WHERE batch_date = ?'
    ).bind(date).first()
    if (existing) return c.json({ error: 'Batch already settled for this date' }, 400)

    // Get completed tickets for the date
    const { results: tickets } = await c.env.DB.prepare(
      "SELECT id, grand_total FROM scale_tickets WHERE DATE(created_at) = ? AND status = 'completed'"
    ).bind(date).all()

    const totalAmount = tickets.reduce((s: number, t: any) => s + ((t.grand_total as number) || 0), 0)
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'INSERT INTO payment_batches (batch_date, ticket_count, total_amount, status, settled_by, settled_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(date, tickets.length, totalAmount, 'settled', employeeId, now).run()

    return c.json({ success: true, ticket_count: tickets.length, total_amount: totalAmount })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
