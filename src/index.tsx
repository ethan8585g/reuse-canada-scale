import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { customerRoutes } from './routes/customer'
import { employeeRoutes } from './routes/employee'
import { scaleTicketRoutes } from './routes/scaleTickets'
import { scaleBridgeRoutes } from './routes/scaleBridge'
import { craneTicketRoutes } from './routes/craneTickets'
import { craneBridgeRoutes } from './routes/craneBridge'
import { cranePricingRoutes } from './routes/cranePricing'
import { pickupRoutes } from './routes/pickups'
import { routeRoutes } from './routes/routing'
import { squareRoutes } from './routes/square'
import { pricingRoutes } from './routes/pricing'
import { invoiceRoutes } from './routes/invoices'
import { junkRemovalRoutes } from './routes/junkRemoval'
import { renderLogin } from './pages/login'
import { renderCustomerDashboard } from './pages/customerDashboard'
import { renderEmployeeDashboard } from './pages/employeeDashboard'
import { renderScaleHouse } from './pages/scaleHouse'
import { renderScaleTickets } from './pages/scaleTickets'
import { renderOverheadCrane } from './pages/overheadCrane'
import { renderCraneTickets } from './pages/craneTickets'
import { renderPickupManagement } from './pages/pickupManagement'
import { renderRouting } from './pages/routing'
import { renderFieldForm } from './pages/fieldForm'
import { renderCustomerManagement } from './pages/customerManagement'
import { renderDriverManagement } from './pages/driverManagement'
import { renderDriverPortal } from './pages/driverPortal'
import { renderJunkRemovalQuoting } from './pages/junkRemovalQuoting'
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
app.route('/api/crane-tickets', craneTicketRoutes)
app.route('/api/crane-bridge', craneBridgeRoutes)
app.route('/api/crane-pricing', cranePricingRoutes)
app.route('/api/pickups', pickupRoutes)
app.route('/api/routes', routeRoutes)
app.route('/api/square', squareRoutes)
app.route('/api/pricing', pricingRoutes)
app.route('/api/invoices', invoiceRoutes)
app.route('/api/junk-removal', junkRemovalRoutes)

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
app.get('/', (c) => c.html(renderLogin()))
app.get('/login', (c) => c.html(renderLogin()))

// Customer Pages
app.get('/customer/dashboard', (c) => c.html(renderCustomerDashboard()))
app.get('/customer/pickups', (c) => c.html(renderCustomerDashboard()))

// Employee Pages
app.get('/employee/dashboard', (c) => c.html(renderEmployeeDashboard()))
app.get('/employee/scale-house', (c) => c.html(renderScaleHouse()))
app.get('/employee/scale-tickets', (c) => c.html(renderScaleTickets()))
app.get('/employee/scale-tickets/new', (c) => c.html(renderScaleTickets()))
app.get('/employee/overhead-crane', (c) => c.html(renderOverheadCrane()))
app.get('/employee/crane-tickets', (c) => c.html(renderCraneTickets()))
app.get('/employee/crane-tickets/new', (c) => c.html(renderCraneTickets()))
app.get('/employee/pickups', (c) => c.html(renderPickupManagement()))
app.get('/employee/routing', (c) => c.html(renderRouting()))
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
