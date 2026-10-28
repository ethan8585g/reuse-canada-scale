# Scale House redesign: implementation progress

Source of truth: `~/Desktop/scale-house-redesign` (checksummed handoff). Scope chosen by owner on 2026-10-16: **checkpoint A only**, Scale House page only. Nothing deployed, pushed or migrated remotely.

## Done (checkpoint A): `src/pages/scaleHouse.ts` only

- Page heading, **New ticket** button, three tabs (Weighing station / Ticket history / Equipment & settings), with ARIA tablist, arrow/Home/End keys and the last tab remembered in `localStorage.rc_sh_tab`.
- **Station overview strip:** live status for scale, camera, printer and co-pilot mode. Each chip links to the relevant control.
- **Weighing station:** existing weighbridge restyled to the design (dark green, lime Capture). **Material for new loads** maps to the existing agent `material` setting; only admin/manager can change it, and the server enforces that. The design's **In the yard** list:
  - The heading stays visible while the list scrolls (max 28rem).
  - #1 is the oldest load, not the ticket number.
  - The Walk-In sentinel is shown as "Needs customer".
  - Each row shows the vehicle, or "Vehicle not recorded".
  - Each row has Assign/Edit, Weigh out (existing Connect-to-truck path), Drop-off/Pickup, View and Void.
- **Floating live-ticket cards:** now off by default. An opt-in checkbox in Equipment turns them back on.
- **Today's activity:** keeps the existing stat IDs, adds "Review payments", and computes "today" from the local date instead of UTC.
- **Co-pilot panel:**
  - Manual/Auto switch maps to the agent's `off`/`live` modes via the existing `setAgentMode` (server-enforced, admin/manager). Dry run stays in Equipment.
  - Primary action, Weigh and Bill steps, plus counts for loads in the yard, unanswered drop-off/pickup questions, and scale state.
  - **Check in** and **Emergency contact** are visibly disabled with "not set up yet".
- **Recently completed:** today's closed tickets, each opening the existing ticket window.
- **Today's payments:** card/cash/unpaid/all categories with counts and totals, then the list, then one record. The record shows ticket identity, vehicle, driver, weights, rate, GST, total, status, transaction reference, recorded time, notes and activity. Actions: open the ticket, reprint, and, for an unpaid pickup only, Collect on Square or Record cash through the existing paths. Settlement remains paid-only on the server.
- **Ticket history:** existing panel with period, search and status filters. Added **Material** and **Customer** filters whose options come only from loaded ticket values, plus Clear filters, CSV export of the filtered rows, client-side totals while those filters are active, and a count badge on the tab.
- **Equipment & settings:** the existing Scale Agent, Receipt Printer, Pickup Prices, Settlement, Square and shortcut cards, unchanged inside.

## Checks run

- `npm run build`.
- `node --check` on all 7 rendered inline scripts.
- No new single backslashes; no duplicate element IDs.
- Headless Chrome against local D1, desktop and 390 px: no horizontal page overflow, no page errors.
- Combined history filters, yard scroll, payments drill-down and Escape-close all work.
- Row Pickup/Drop-off switch saves; Weigh out refuses with no live scale.
- Full manual cycle: 16,000 in → live 6,000 out → 10,000 kg net, $0 drop-off, driver saved, listed under Recently completed. A zero reading creates nothing.

## Done (checkpoint B, settings, without picture uploads per owner)

Migration `0024_station_branding_material_notes.sql` (applied locally only; it **must be applied remotely before deploying**, because the pricing save writes `notes`).

- **Branding & appearance:** business name, primary/accent colours, 4 presets, live page preview, Save/Cancel/Restore default, and Escape reverts the draft.
  - Contrast ≥4.5:1 is enforced in both the browser and `utils/branding.ts`.
  - `GET/PUT /api/scale-agent/branding`, with PUT limited to admin/manager.
  - Applies to the Scale House page and its receipts (`/receipt` → `company`).
  - No logo, because uploads were deferred.
- **Material notes:** `pricing.notes`, editable on Add material and on each row of the materials window, and shown under the material in Pickup Prices.
- **Add printer:** a guided dialog (install the printer in macOS, then Find printers through the bridge). It does not claim to install printers.
- **Cameras:**
  - Multiple named cameras in `localStorage.rc_cameras`. One is the ticket camera (the existing pipeline); the others are view-only through the bridge proxy or a local webcam.
  - Add, edit, remove, pause/resume and "Use for ticket photos"; Agent DVR discovery in the editor; RTSP addresses are rejected with guidance.
  - Full-viewport console opened from the feed, the expand button or Equipment. It has All cameras and Photo Vault buttons, and Take picture (ticket camera → the existing capture; other cameras → the Recent strip only, not uploaded).
  - Pan/tilt/zoom/home and talk are visibly disabled with the reason. Feeds stop on close, on switch, on pause and when the tab is hidden.
- **Photo Vault:** a read-only view of photos already stored on tickets. It filters by date range, In+out / Arrival only / Departure only, and text. The detail view shows both photos with time, weight, plate (camera-read vs operator-entered), appearance, the photo-check verdict and how the photos were paired (same ticket), plus a download per photo. It also exports a printable visit report and CSV metadata. Capped at 300 tickets per range, and it says so when that limit is hit.

Checks: build; all 7 inline scripts `node --check`; no new backslashes; no duplicate ids; branding validation unit cases (4 presets pass, too-light/bad-hex/no-name rejected); yard_operator PUT → 403. Headless Chrome against local D1 covered:
- branding preview/Escape/save/reload persistence, receipt company and restore;
- material notes saved and shown;
- RTSP rejected, a second camera added, the console's All-cameras grid, paused camera disabling Take picture, PTZ/talk disabled, Escape stopping every viewer;
- Vault search → detail with 2 photos → visit report with 2 images;
- 390 px console with no overflow and no page errors.

## Not done (checkpoint C, plus deferred uploads)

| Item | What it needs before it can be real |
|---|---|
| Branding (name, logo, colours, presets) | New migration + admin-only API; logo stored as data (JPG/PNG/WebP < 20 MiB, no SVG); applying it to receipts/invoices/driver pages touches pages outside Scale House, which the owner excluded |
| Material notes + picture | Migration on `pricing` (notes, image ref) + server-side decode/validation; storage, since D1 is not a blob store: **Cloudflare R2 bucket binding** (not configured in `wrangler.jsonc`) |
| Add-printer flow | Real setup is macOS/CUPS via `scale-bridge.js`; needs a bridge endpoint and restart on the scale Mac |
| Multiple cameras, full-screen console, PTZ/talk | PTZ/two-way audio need the camera's control API (Reolink via Agent DVR), capability checks and microphone consent; none exists in the bridge today |
| Durable Photo Vault | R2 (above) + an indexed metadata table, pagination and an explicit retention policy |
| Unattended check-in, licence per visit, emailed payment links/invoices, incidents | **Email provider** (none configured: no API key or sender domain), Square **Checkout/Payment Links** API + webhook endpoint (signature key secret exists: `SQUARE_WEBHOOK_SIGNATURE_KEY`), a document store for licences (R2) with a retention policy, a public check-in page (outside Scale House), and an emergency contact |
