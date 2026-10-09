import { Hono } from 'hono'
import { BUILD_ID } from './utils/build'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { customerRoutes } from './routes/customer'
import { employeeRoutes } from './routes/employee'
import { scaleTicketRoutes } from './routes/scaleTickets'
import { scaleBridgeRoutes } from './routes/scaleBridge'
import { scaleAgentRoutes } from './routes/scaleAgent'
import { pickupRoutes } from './routes/pickups'
import { routeRoutes } from './routes/routing'
import { squareRoutes } from './routes/square'
import { pricingRoutes } from './routes/pricing'
import { invoiceRoutes } from './routes/invoices'
import { junkRemovalRoutes } from './routes/junkRemoval'
import { fleetRoutes } from './routes/fleet'
import { stationRoutes } from './routes/station'
import { renderLogin } from './pages/login'
import { renderCustomerDashboard } from './pages/customerDashboard'
import { renderEmployeeDashboard } from './pages/employeeDashboard'
import { renderScaleHouse } from './pages/scaleHouse'
import { renderScaleTickets } from './pages/scaleTickets'
import { renderPublicTicket } from './pages/publicTicket'
import { renderPickupManagement } from './pages/pickupManagement'
import { renderRouting } from './pages/routing'
import { renderFieldForm } from './pages/fieldForm'
import { renderCustomerManagement } from './pages/customerManagement'
import { renderDriverManagement } from './pages/driverManagement'
import { renderDriverPortal } from './pages/driverPortal'
import { renderJunkRemovalQuoting } from './pages/junkRemovalQuoting'
import { renderFleet } from './pages/fleet'
import { renderInvoices } from './pages/invoices'
import { renderInvoiceBuilder } from './pages/invoiceBuilder'
import { renderInvoicePrint } from './pages/invoicePrint'

type Bindings = {
  DB: D1Database
  maps_key: string
  GOOGLE_MAPS_API_KEY: string
  SQUARE_APP_ID: string
  SQUARE_ACCESS_TOKEN: string
  open_ai: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ── Middleware ──────────────────────────────
app.use('/api/*', cors())

// ── API Routes ─────────────────────────────
app.route('/api/auth', authRoutes)
app.route('/api/customer', customerRoutes)
app.route('/api/employee', employeeRoutes)
app.route('/api/scale-tickets', scaleTicketRoutes)
app.route('/api/scale-bridge', scaleBridgeRoutes)
app.route('/api/scale-agent', scaleAgentRoutes)
app.route('/api/pickups', pickupRoutes)
app.route('/api/routes', routeRoutes)
app.route('/api/square', squareRoutes)
app.route('/api/pricing', pricingRoutes)
app.route('/api/invoices', invoiceRoutes)
app.route('/api/junk-removal', junkRemovalRoutes)
app.route('/api/fleet', fleetRoutes)

// ── Which build is live. The Scale House page polls this and reloads itself
// when a newer build is deployed, because that tab stays open for days. ──
app.get('/api/version', (c) => c.json({ build: BUILD_ID }))

// ── Scale-house station setup (installer + scale-bridge), fetched by curl on
// the Mac at the scale. Public: see src/routes/station.ts. ──
app.route('/station', stationRoutes)

// ── Config endpoint (serves safe public keys) ──
app.get('/api/config/maps-key', (c) => {
  const key = c.env.maps_key || c.env.GOOGLE_MAPS_API_KEY || ''
  return c.json({ key })
})

// ── No-cache middleware for all page routes ──
// Prevents browser from caching stale HTML pages
app.use('*', async (c, next) => {
  await next()
  // Only apply no-cache to HTML pages (not API routes)
  const ct = c.res.headers.get('content-type') || ''
  if (ct.includes('text/html')) {
    c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    c.res.headers.set('Pragma', 'no-cache')
    c.res.headers.set('Expires', '0')
  }
})

// ── Page Routes ────────────────────────────

// Landing / Login
// Public read-only ticket behind a share link. No session: the unguessable
// token IS the credential, which is what makes the link sendable to a customer.
// A revoked share 404s like a bad token - no hint that it once existed.
app.get('/t/:token', async (c) => {
  const token = c.req.param('token')
  if (!/^[a-f0-9]{48}$/.test(token)) return c.text('Not found', 404)
  try {
    const ticket = await c.env.DB.prepare(
      `SELECT st.ticket_number, st.status, st.created_at, st.tire_type,
              st.weight_in, st.weight_out, st.net_weight, st.grand_total,
              c.company_name,
              COALESCE(NULLIF(st.driver_name, ''), dr.first_name || ' ' || dr.last_name) as driver_display_name
       FROM ticket_shares ts
       JOIN scale_tickets st ON st.id = ts.scale_ticket_id
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN route_stops rs ON st.route_stop_id = rs.id
       LEFT JOIN routes r ON rs.route_id = r.id
       LEFT JOIN pickup_requests pr ON st.pickup_request_id = pr.id
       LEFT JOIN employees dr ON dr.id = COALESCE(r.assigned_employee_id, pr.assigned_employee_id)
       WHERE ts.token = ? AND ts.revoked_at IS NULL`
    ).bind(token).first()

    if (!ticket) return c.text('This link is no longer valid.', 404)
    return c.html(renderPublicTicket(ticket as any))
  } catch (err) {
    console.error('share link error:', err)
    return c.text('Server error', 500)
  }
})

app.get('/', (c) => c.html(renderLogin()))
app.get('/login', (c) => c.html(renderLogin()))

// Customer Pages
app.get('/customer/dashboard', (c) => c.html(renderCustomerDashboard()))
app.get('/customer/pickups', (c) => c.html(renderCustomerDashboard()))

// Employee Pages
app.get('/employee/dashboard', (c) => c.html(renderEmployeeDashboard()))
app.get('/employee/scale-house', (c) => c.html(renderScaleHouse(BUILD_ID)))
app.get('/employee/scale-tickets', (c) => c.html(renderScaleTickets()))
app.get('/employee/scale-tickets/new', (c) => c.html(renderScaleTickets()))
app.get('/employee/pickups', (c) => c.html(renderPickupManagement()))
app.get('/employee/routing', (c) => c.html(renderRouting()))
app.get('/employee/fleet', (c) => c.html(renderFleet()))
app.get('/employee/customers', (c) => c.html(renderCustomerManagement()))
app.get('/employee/drivers', (c) => c.html(renderDriverManagement()))
app.get('/employee/junk-removal', (c) => c.html(renderJunkRemovalQuoting()))
app.get('/employee/invoices', (c) => c.html(renderInvoices()))
app.get('/employee/invoices/new', (c) => c.html(renderInvoiceBuilder()))
// Print shell: a static HTML page that fetches /api/invoices/:id client-side
// with a Bearer token. The worker never reads D1 here, so an unauthenticated
// visitor cannot pull invoice PII by guessing IDs.
app.get('/employee/invoices/:id/print', (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.text('Invalid id', 400)
  return c.html(renderInvoicePrint())
})
app.get('/employee/field-form/:ticketId', (c) => c.html(renderFieldForm()))
app.get('/employee/field-form', (c) => c.html(renderFieldForm()))

// Driver Portal (dedicated driver interface)
app.get('/driver/portal', (c) => c.html(renderDriverPortal()))

export default app
