# CLAUDE.md

## Project Overview

Reuse Canada Scale CRM — a multi-portal operations platform for tire recycling logistics. Handles customer pickup requests, driver routing, scale house ticketing, and Square payments.

## Tech Stack

- **Runtime**: Cloudflare Pages + Workers (D1 SQLite database)
- **Framework**: Hono with JSX for server-side rendered pages (no SPA/client framework)
- **Styling**: TailwindCSS via CDN (no build step), FontAwesome 6.5 icons
- **Language**: TypeScript (ESNext target, Vite build)
- **Payments**: Square Terminal REST API
- **Hardware**: Web Bluetooth (Accuren Apex scale), Web Serial, browser print for 80mm thermal receipts

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Build to dist/ for Cloudflare Pages |
| `npm run preview` | Local preview via `wrangler pages dev` |
| `npm run deploy` | Build + deploy to Cloudflare Pages |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:seed` | Load seed.sql into local DB |
| `npm run db:reset` | Clear + migrate + seed local DB |
| `npm run cf-typegen` | Generate CloudflareBindings types |

## Project Structure

```
src/
├── index.tsx            # Main Hono app, routes, middleware
├── middleware/auth.ts   # Session validation, role checking
├── routes/              # API endpoints (all Bearer token protected)
│   ├── auth.ts          # Login/logout/verify
│   ├── employee.ts      # Dashboard data, driver status, notifications
│   ├── customer.ts      # Customer pickup requests
│   ├── pickups.ts       # Pickup CRUD & assignment
│   ├── scaleTickets.ts  # Scale ticket operations
│   ├── routing.ts       # Route planning & stops
│   ├── square.ts        # Square payment integration
│   └── pricing.ts       # Material pricing rates
├── pages/               # SSR HTML pages (return HTML strings)
│   ├── login.ts, customerDashboard.ts, employeeDashboard.ts
│   ├── driverPortal.ts, driverManagement.ts, pickupManagement.ts
│   ├── scaleHouse.ts, scaleTickets.ts, routing.ts
│   ├── fieldForm.ts, customerManagement.ts
└── utils/
    ├── layout.ts        # Base HTML layout (head, TailwindCSS config)
    └── employeeLayout.ts # Sidebar wrapper for employee pages
migrations/              # D1 SQL migrations (sequential numbered)
```

## Key Patterns

- **Auth**: Bearer token (48-char alphanumeric) in `Authorization` header. Single `sessions` table for both customer & employee users. Middleware enforces role-based access.
- **Pages**: Server-rendered HTML via Hono/JSX. Pages use `layout()` or `employeeLayout()` wrappers. Inline `<script>` tags for interactivity, Axios CDN for API calls.
- **API**: RESTful JSON endpoints under `/api/*`. Responses are `{ data: [...] }` or `{ error: string }`. CORS enabled on API routes only.
- **Database**: D1 SQLite with prepared statements and parameter binding. Auto-increment IDs, `CURRENT_TIMESTAMP` defaults. Booleans as INTEGER 0/1. Images stored as base64 text.
- **Styling**: All Tailwind utility classes, no CSS files. Brand colors: `rc-green`, `rc-orange`, `rc-gray`. Card-hover class for interactive elements.
- **Error format**: JSON `{ error: string }` with appropriate HTTP status codes (400/401/403/500).

## Database

Key tables: `customers` (with region N/S/E/W), `employees` (roles: admin/manager/driver/yard_operator), `sessions`, `pickup_requests` (status: pending/scheduled/completed), `scale_tickets`, `routes`, `route_stops`, `vehicles`, `pricing`, `payment_log`, `driver_status`, `pickup_proof`.

## Environment

- D1 database binding configured in `wrangler.jsonc`
- Cloudflare bindings typed via `cf-typegen` script
- No `.env` file — secrets managed via Cloudflare dashboard
