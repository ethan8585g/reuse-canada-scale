# CLAUDE.md

## Scope (IMPORTANT)

This project is **exclusively** tied to:
- **GitHub repo**: `reuse-canada-scale`
- **Cloudflare Pages project**: `reuse-canada-scale`
- **Production domain**: `www.reusecanadascale.com`

Do NOT deploy, push, or reference any other GitHub repo, Cloudflare project, or domain from this working directory. All `npm run deploy`, `wrangler` commands, `git push`, and PR operations must target the above resources only. If a command or task appears to point elsewhere, stop and confirm with the user before proceeding.

## Project Overview

Reuse Canada Scale CRM — a multi-portal operations platform for tire recycling logistics. Handles customer pickup requests, driver routing, scale house ticketing, and Square payments.

## Tech Stack

- **Runtime**: Cloudflare Pages + Workers (D1 SQLite database)
- **Framework**: Hono with JSX for server-side rendered pages (no SPA/client framework)
- **Styling**: TailwindCSS via CDN (no build step), FontAwesome 6.5 icons
- **Language**: TypeScript (ESNext target, Vite build)
- **Payments**: Square Terminal REST API
- **Hardware**: Web Bluetooth (Western APX indicator, model AM5332C, via IRXON RS-232↔BT adapter), Web Serial, browser print for 80mm thermal receipts

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

## Scale House Module

- **Print-trigger flow**: `POST /api/scale-tickets/print-trigger` creates a weighed-in ticket assigned to the sentinel `walk-in@reuse-canada.local` customer (kept `is_active=0`). Operator then either assigns a real customer via `POST /:id/assign`, quick-creates one via `POST /quick-customer`, or leaves it unassigned ("Unknown — Live Ticket").
- **Live ticket cards**: Active (status `weighed_in`, no `weight_out`) tickets render as floating `position: fixed` cards in `#live-tickets-panel` (top-right by default, draggable). Cards display a **sequential yard position** in the header (#1 = oldest active ticket in the yard, #2 = next, etc.) — this is NOT the persistent ticket number, which still appears as "Load #" in the card body. Positions persist in the `liveTicketPositions` JS object through the 15s auto-refresh in `loadOpenTickets()`. Drag uses delegated mouse + touch handlers on the panel.
- **Connect to Truck on Scale / live tare in Assign modal**: Each live ticket card has a "Connect to Truck on Scale" button, and the Assign modal exposes a "Use live scale weight" button (real-time display via `refreshAssignLiveTare()`). Both pull `currentLiveWeight` from the connected scale, set `lastPrintWeight`, capture a photo, and call `POST /:id/merge-out` (the card flow routes through `previewMerge()` to show a confirm dialog; the modal flow completes directly since the operator already saw the value on the button). Same 3s debounce as the print-trigger path so a single stable reading can't fire twice. **The Assign modal does NOT show stored vehicle tares** — the only outbound-weight option is the live reading.
- **Walk-in detection**: A ticket is "unassigned" when `customer_id` is the sentinel walk-in row (`company_name === 'Walk-In'`). Don't treat `customer_id IS NULL` as unassigned — the FK on `scale_tickets.customer_id` requires a value, so the placeholder is used instead.

## Database

Key tables: `customers` (with region N/S/E/W), `employees` (roles: admin/manager/driver/yard_operator), `sessions`, `pickup_requests` (status: pending/scheduled/completed), `scale_tickets`, `routes`, `route_stops`, `vehicles`, `pricing`, `payment_log`, `driver_status`, `pickup_proof`.

## Environment

- D1 database binding configured in `wrangler.jsonc`
- Cloudflare bindings typed via `cf-typegen` script
- No `.env` file — secrets managed via Cloudflare dashboard

## Recent Work Log

Append-only log of significant tasks Claude has completed. One dated bullet per task — scope, what shipped, and any non-obvious decisions a future Claude would benefit from knowing without re-reading every diff.

- **2026-05-20** — Audited the dirty working tree and shipped 4 scoped commits: (1) backfilled the forgotten `migrations/0005_junk_removal_quotes.sql` that supported the already-merged junk-removal module; (2) web scale-bridge (`scale_bridge_state` single-row table + `/api/scale-bridge` publish/current + scaleHouse throttled publishToWebBridge() + "Pull from Scale House" button on the scale-tickets weight modal); (3) invoicing module (draft → issued → void with UNIQUE constraint on `invoice_line_items.scale_ticket_id`, retry-on-conflict number allocation, walk-in sentinel guard, audit log); (4) chore commit (hardware rename, .gitignore, PM2 deletion, CF project rename). Fixed P0 PII leak: `/employee/invoices/:id/print` was reading D1 server-side with no auth — converted to a static shell that fetches `/api/invoices/:id` client-side with the Bearer token. Dropped unused `MAPS_KEY` (uppercase) binding and the `--commit-dirty=true` deploy flag. Excluded the user's parallel crane WIP (imports + routes + files) from every commit per [feedback_scope_guard]. **Deploy attempt blocked from this environment**: SSH deploy key on this machine is read-only on `ethan8585g/reuse-canada-scale`, and the CF API token's IP allowlist excludes this machine's IP — both `git push origin main` and `npm run deploy` must be run from the user's normal dev machine. Subsequently resolved the 3-way CF project-name mismatch: `wrangler.jsonc`, `package.json`, and `CLAUDE.md` Scope all now agree on `reuse-canada-scale`. Then shipped the overhead crane module (parallel-to-scale stack: `crane_tickets`, `crane_audit_log`, `crane_weight_edits`, `crane_anomalies`, `crane_payment_batches`, `crane_pricing`, `crane_bridge_state`, ticket prefix `RC-CR-YYYY-NNNNN`) — caught and fixed a runtime bug along the way: the crane payment route was inserting into `payment_log` with `crane_ticket_id`, but that table has `scale_ticket_id NOT NULL` and no crane column. Added a parallel `crane_payment_log` table (same shape + partial UNIQUE on `square_payment_id` matching 0009) and pointed the route at it.
