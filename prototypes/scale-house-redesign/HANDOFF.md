# Scale House redesign — implementation handoff

Prepared October 16, 2026. This is an interactive design prototype for **reuse-canada-scale**, not a production replacement. Production scope remains the GitHub and Cloudflare Pages project `reuse-canada-scale` and `www.reusecanadascale.com` only.

## Open and share

- **scale-house-prototype.html** is the complete standalone prototype, including styles, scripts and the illustrative camera scene. Double-click to open it in a browser. No build, installation or external assets required.
- **index.html**, **styles.css**, **app.js**, **cameras.js**, **vault.js**, **unattended.js** are the same design as separate editable files.
- **CLAUDE-PROMPT.md** contains the implementation request to paste into Claude.
- **scale-house-handoff.zip** packages all of the above. Give Claude the ZIP, or the standalone HTML plus this guide and prompt.
- Local interactive preview: `http://127.0.0.1:4173/`. Restart if needed from this directory with `python3 -m http.server 4173 --bind 127.0.0.1`.
- Tickets, settings and unattended visits/outbox use `rc_scale_design_demo_v1` in local storage; Photo Vault captures use IndexedDB `rc-scale-photo-vault-demo`. Licence previews remain in memory only. Reset demo restores the initial sample. Demo dates stay anchored to October 16, 2026 so period filters remain reproducible.

## Design intent

Prioritize the physical workflow: read scale → capture → identify load → weigh out → receipt → payment. The primary action is visually dominant, customer exceptions are visible in the yard queue, and station configuration no longer competes with weighing.

Three sections replace the long settings-heavy page:

1. **Weighing station:** compact connection status, dark green weight display, material picker, sequential yard queue, camera preview, daily figures, payment summary, recently completed loads.
2. **Ticket history:** period and custom-date controls, search by ticket/customer/plate, status filter, CSV export, ticket details and receipts.
3. **Equipment & settings:** scale connection, camera, automation, printer, material rates, Square Terminal. Each opens a focused dialog.

The standalone left rail is a design reference only. Integrate with the existing `employeePageWrapper()` navigation; do not install a second production sidebar. Keep other CRM navigation and permissions.

## Visual tokens and responsive layout

See `:root` in styles.css. Main colours: forest `#246244`, dark scale `#1d352b`, lime action `#d4ef9d`, warm grey background `#f4f5f1`, ink `#202c28`, border `#e2e7e0`. This proposes a softer use of the existing green brand; confirm any broader rebrand separately.

System sans-serif, 36px page title, 86px desktop scale reading, tabular numbers. Panels use 16px corners and thin borders. Main content is at most 1600px wide. Desktop work area uses approximately a 65/35 column split. At 800px the scale/yard stacks above supporting panels; at 530px everything is a single column and rail disappears. Tables scroll within their container.

Map styles to Tailwind utilities and the existing layout conventions where practical. If embedding CSS, scope it to the Scale House root; prototype global button/input/table rules must not affect other CRM pages.

## What is interactive

- Capture loaded/empty/custom/clear scale readings; connection on/off gates capture.
- Create a load (manual or captured gross); choose material; assign/edit customer, driver, phone, plate and notes; add a sample customer.
- Complete an open load using an outgoing weight; reject zero, disconnected or greater/equal outbound readings; show gross, tare, net, total.
- View tickets, record a reason when voiding, view receipts, simulate card/cash payment and unpaid state.
- Daily figures, yard position and filtered history update from the same sample state.
- Search, status/date filters, CSV export, native modal focus/escape, keyboard shortcuts.
- Camera preview/pause/snapshot acknowledgement; device settings, pricing updates/add-material, sample terminal pairing, automation preferences, simulated settlement, sample print/reprint.
- Download handoff assets and copy the Claude prompt.

## Deliberate simulation boundaries

No API calls, auth, camera access, serial/Bluetooth/bridge connections, actual prints, actual Square payments, real settlements or backend persistence. Camera is an inline illustration. Snapshots store illustrated images and metadata in the local IndexedDB Photo Vault. Printing shows a preview/acknowledgement. Pairing generates no real device request. Automation preferences persist but do not run autonomous decisions; all captures are deliberate demo clicks. Receipt tax is a sample 5% GST calculation; production totals and tax must remain server-authoritative. Prototype uses `open` and empty customer strings for convenience; **these are not production schema values**. Current production changes include pickup/drop-off logic not modelled here; preserve that functionality.

## Production wiring map

Existing implementation: `src/pages/scaleHouse.ts`, wrapper `src/utils/employeeLayout.ts`, routes under `src/routes/`. The original workflow is a presentation refactor; QR visits, identity extraction, hosted payment links, durable photo retention, email delivery and camera PTZ/audio require additional production integration. Reuse existing business logic rather than copying demo app.js into production.

| Prototype control | Existing implementation to preserve/reuse |
| --- | --- |
| Scale display, connection, advanced settings | `bootstrapScale`, `connectBridge`, `connectUSBSerial`, `connectBluetooth`, `acceptWeight`, `updateLiveWeightDisplay`, `saveScaleSettings`, bridge SSE and reconnect/stale logic |
| Capture | `captureWeight`, `onPrintTrigger`, stable-reading validation and existing debounce |
| Arriving load | `POST /api/scale-tickets/print-trigger` with captured weight/photo and existing test-offset handling |
| Manual ticket | `POST /api/scale-tickets`; retain real customer and form validation |
| Customer assignment | `POST /api/scale-tickets/:id/assign`, quick customer `POST /api/scale-tickets/quick-customer`, driver and vehicle fields |
| Weigh out | `previewMerge`, `confirmMerge`, `useLiveTareInAssignModal`, `POST /api/scale-tickets/:id/merge-out` |
| Yard queue | `loadOpenTickets`; status `weighed_in` and existing field statuses; preserve sequential yard position and stored ticket ID distinction |
| Ticket history | `loadTicketHistory`/existing history loaders, `GET /api/scale-tickets`, detail and audit via `GET /api/scale-tickets/:id` |
| Void | `POST /api/scale-tickets/:id/void` with reason and backend status restrictions |
| Camera | Existing source selection, start/stop, network proxy, reconnect, capture/stamping, recent snapshots and plate recognition; preserve all configuration |
| Receipt | `autoPrintReceipt`, `printViaBridge`, `browserPrintReceipt`, `GET /api/scale-tickets/:id/receipt`, `POST /:id/receipt-printed` |
| Automation | `/api/scale-agent/settings`, `/decide`, decision outcome logging, single-truck/age/weight guards and plate verification |
| Pricing | `GET /api/pricing`, create `POST /api/pricing`, rate update `POST /api/pricing/:id`; preserve role gates and pickup-specific pricing |
| Daily settlement | `GET /api/scale-tickets/settlement/daily`, `POST /api/scale-tickets/settlement/batch` |
| Card/cash | Existing Square checkout creation/poll/cancel, payment status bookkeeping and `/api/square/cash-payment` |
| Ticket type | Preserve current `/api/scale-tickets/:id/type` and pickup/drop-off behavior; add controls into ticket detail without dropping this current WIP |

Function names are orientation hints; inspect the current source before editing, since the working tree already contains user changes.

## Business rules that must survive the redesign

- Walk-in uses the inactive sentinel customer (`company_name === 'Walk-In'`), never a null customer ID.
- Yard position (#1 oldest active) differs from persistent Load/ticket number. The new inline queue replaces floating visual presentation, not identification semantics.
- Live tare must come from the live scale. Do not restore stored vehicle tare choices in the Assign modal.
- Keep 3-second capture debounce, stable-weight protections, correct inbound/outbound handling, photos, audit log and hardware recovery.
- Assignment alone does not close or print a ticket. Completion triggers receipt; preserve the awaited print sequence, bridge-first printing, fallback, errors and reprint.
- Keep completed-ticket material repricing on the server, and preserve single-truck/age/negative-reading safety.
- Payment methods here are demonstration strings. Preserve actual backend statuses, retries, Square IDs, duplicate protection and role checks.
- Keep the camera/agent and pickup ticket features that are newer than the screenshots. Expose advanced options in appropriate settings panels, not by deleting behavior.
- Use existing authenticated requests. Never ship demo storage, fake terminal approvals, fixed date or sample data into production.

## Suggested implementation sequence

1. Read AGENTS.md and inspect the dirty working tree; preserve all unrelated edits.
2. Map current DOM IDs and event handlers before moving markup. Keep device/agent initialization running once across tab changes.
3. Apply the page shell, tokens, weight panel and inline yard queue. Wire existing state into the new views.
4. Move history/settings into tabs and dialogs, preserving advanced functions and backend permission checks.
5. Connect existing assignment, weigh-out, receipt/payment and settlement flows. Keep production error and pending states.
6. Validate a real rendered page: extract emitted inline scripts and syntax-check them. The outer TypeScript template literal can compile even when client JS is broken. Avoid unescaped nested backticks and template interpolation.
7. Check mobile, keyboard navigation, disconnect/reconnect, double capture, unknown customer, outbound validation, print failure, Square failure/cancel and stale tickets. Build before proposing deployment.

## Acceptance walkthrough

1. Reset demo; loaded truck reads 18,420 kg.
2. Capture → arriving load → create ticket. Yard count increases; ticket is unassigned if no customer selected.
3. Assign customer/driver/plate and save. Yard card updates without losing the load.
4. Empty truck → weigh out the new load → confirm 7,860 kg tare / 10,560 kg net.
5. With Mixed Tires at $0.14, sample subtotal $1,478.40 + $73.92 GST = $1,552.32.
6. Complete → receipt → cash/card. Receipt status changes to paid; yard count decreases; totals/history update.
7. History filters/search return the expected row; yesterday shows the sample October 15 row.
8. Connection off disables capture; zero weight disables capture; outbound gross-or-higher cannot complete.
9. Cancel any form without saving and confirm no state changes. Escape closes dialogs.
10. Equipment settings persist on refresh. Reset demo returns a clean start.

## Delivery status

Prototype only. No production application replacement, database mutation, commit, push or deployment was performed as part of this redesign. Earlier connection-notice edits in the existing page remain separate. No external fonts, image downloads or package installation are needed.

## Multi-camera revision — October 16, 2026

The prototype now supports a camera collection, implemented in `cameras.js` (loaded before `app.js`). Initial sample cameras: Truck scale, Entry gate, Unloading yard (paused). Existing demo records are preserved on upgrade.

- Compact camera switcher in the weighing station; all-camera grid; individual enlarged previews.
- Add, rename, configure source/address, pause/resume, and remove individual cameras. Removing the last camera is unavailable.
- Independent selected-view camera and ticket-photo camera. Browsing a feed does not change which camera supplies ticket photos.
- Exactly one ticket-photo camera is retained; removing it selects the first remaining camera. Paused photo cameras show an explicit warning in their detail view.
- Per-camera simulated snapshot acknowledgements and enabled states persist locally. Cameras shown are illustrations, not independent real video feeds.

Production integration requires extending the current single-camera configuration to a collection with stable IDs and separate selected-view/photo-camera IDs. Do not assume the existing bridge already supports concurrent streams. Inspect camera device discovery/proxy APIs first; retain per-camera retry/health state and stop unused streams. Preserve source identity with captured photos, and do not silently substitute another angle if the chosen ticket camera fails. Plate recognition may require its own explicit camera selection; the prototype's ticket-photo preference does not configure plate recognition. Credentials should not be stored as plain camera URLs in browser storage. This revision demonstrates configuration and presentation only, not actual multi-camera photo capture.

## Ticket-history filters revision — October 16, 2026

Added labelled Material and Customer dropdowns next to Status, plus Clear filters. Material choices are distinct nonempty values from existing tickets only (not the full pricing catalogue), per user clarification. Customer includes an explicit Unassigned / walk-in choice. Filters combine with search, status and date; summary figures and CSV use the same filtered rows. Clear filters resets to Today with all materials/customers/statuses. Production should obtain distinct material values from ticket data across the accessible history, not merely the current paginated response; preserve auth/role scope. Verified Material=Mixed Tires plus Customer=Kal Tire returns only its matching ticket.

## Add printer revision — October 16, 2026

Receipt printer settings now include **＋ Add printer** beside the selector. An inline name form rejects empty/duplicate names, adds a sample printer to a persisted demo list, and selects it in the pending settings form. Save settings applies it as the receipt destination. Adding a printer preserves unsaved print preferences. This does not install a macOS printer: production should discover installed queues through the bridge `/printers` endpoint and guide the operator through macOS printer setup if needed. A display name alone is not a usable printer queue.

## Material notes and picture revision — October 16, 2026

Add a material now includes optional free-text Notes (2,000 characters) and one picture (JPEG/PNG/WebP, under 20 MB), with preview and Remove picture. Images under 20 MiB are accepted (20 MiB and above rejected); decoded images are resized to at most 1600px on the longest side and saved as JPEG quality 0.8, with transparent areas flattened to white. Originals are not retained in this local prototype. File contents are decoded before acceptance, pending reads block saving, and storage failures leave the form open with a clear message. Name/rate/notes/picture are saved together in demo storage; notes and thumbnails appear in the pricing list and material picker. Empty names with notes/images and duplicate material names are rejected. Browser-verified picture loading/preview; isolated handler check verified notes/image/rate persisted together. Production requires backend schema/storage and authenticated validation for material notes and attachments; do not assume existing pricing endpoints accept these fields. Keep uploads private to the application and use appropriate image validation and storage limits.

## Photo Vault revision — October 16, 2026

**Equipment & settings → Photo Vault** opens a dedicated archive. `vault.js` (loaded before app.js) persists individual images and immutable capture metadata in IndexedDB `rc-scale-photo-vault-demo`, independently from ticket demo storage. The prototype does not expire or delete archived pictures; clearing browser/site storage can erase the archive. Reset demo does not clear Vault. Failed writes surface an error with an in-session retry; browser quota and device loss mean this is not a production backup.

### Captures and pairing

- New ticket weigh-in and completed-ticket weigh-out produce illustrated captures from every enabled sample camera, grouped under a stable visit ID; the chosen ticket-photo camera has its role marked. No enabled camera creates an explicit missing-photo event, not a fictitious image.
- Manual camera snapshots and new material picture attachments are also archived after this feature is loaded. Earlier unarchived snapshots/uploads cannot be recovered. Example seeded visits are explicitly sample captures, not historical evidence.
- Simulate camera event demonstrates arrival/departure tracking independent of tickets. Entered plate, customer, notes, source camera and timestamps are recorded. No real camera analysis occurs.
- A simulated departure pairs only with exactly one unmatched arrival with the same normalized plate in the past 12 hours. Missing, ambiguous or stale matches remain departure-only. Explicit ticket capture uses its stable ticket visit, not plate guessing.
- Manual link/correction requires a reason and prevents departure-before-arrival pairing. Unpair preserves all captures. Pairing history retains old visit IDs, timestamps and operator. Recorded customer/plate/driver/material remain immutable snapshots even if the linked ticket is later edited.
- Metadata: capture/visit IDs; event and archive ISO timestamps; Edmonton timezone; camera ID/name/source; station; demo operator; ticket number/ID; plate/customer/driver/material; measured, gross, tare and net weights when known; notes; photo role; capture status; pairing evidence and correction history. Unknown values are shown as not recorded, not invented.

### Access and exports

Search plate/ticket/customer/driver/material/camera/notes. Filter by arrival-only, departure-only, paired, snapshots/materials, camera and capture date. Date/camera filters include the entire matching visit so the paired counterpart remains visible. Statistics at the top describe the whole archive; result count describes the filters.

Visit detail shows every capture with its timestamp and metadata, not only the two summary thumbnails. Download individual pictures, export filtered metadata as JSON, or download a self-contained HTML visit report with embedded pictures and all metadata. The report can be opened without the app. Initial sample camera images are inline SVG illustrations; material attachments are resized JPEG images.

### Production implementation requirements

This is a design and interaction reference, not live surveillance or durable retention. Real recording requires bridge/camera event ingestion, motion/direction detection, plate extraction with confidence, duplicate suppression, and server-side identity/visit matching. Store images in durable object storage with indexed metadata/relations in D1; authenticate every read/write/download and reuse existing roles. Preserve original capture times and camera identity; distinguish inference from confirmed operator edits. Retain unmatched and failed events for review. Keep pairing correction audit history, and guard against concurrent duplicate departures and repeated plate visits. Add pagination, retrieval indexes and backups; choose retention/capacity explicitly with the user rather than promising infinite storage. Avoid continuous video recording unless separately requested; this request concerns pictures and truck arrival/departure events.

Verified in browser: simulated arrival becomes awaiting departure; matching departure forms a pair; captures and pairing survive reload; detail view exposes original metadata; standalone report downloads with embedded images. Browser console reported no errors. Capture generation remains illustrative.

## Vehicle and driver details — added after finishing Photo Vault

Receipts and ticket details now show Vehicle, Colour, Licence plate #, and Driver name, with “Not recorded” for missing values. New ticket and Edit details forms capture those fields. Completed tickets also expose Edit details, allowing missing identity information to be filled in before reprinting. New Vault ticket captures snapshot vehicle/colour along with existing plate/driver, and search includes those values; older captures keep their original recorded metadata. Production needs appropriate vehicle/colour storage or existing vehicle relationships; do not infer that the current ticket API accepts these new free-text fields. Preserve current authorization, completed-ticket repricing, payment reconciliation and auditing rules when editing finished tickets. Verified forms include all four fields and receipt displays existing plate/driver without inventing missing vehicle/colour.

## Interactive payments revision — October 16, 2026

Today's payments category rows (card/cash/unpaid/all) now drill into individual ticket payment records. Each record shows status, amount, ticket/customer identity, vehicle/colour/plate/driver, measured weights, material/rate/subtotal/tax, payment reference/timestamp when actually present, notes and activity. Actions: open full ticket, view receipt with a return link, simulated reprint, save payment notes and collect unpaid balances using existing demo card/cash flow. Newly recorded sample payments receive a demo reference/timestamp and activity entry; older seeded records show missing timestamps/references explicitly. No real transactions/refunds occur. Production must retrieve provider-confirmed transaction state, enforce role permissions and persist notes/audit records server-side. Verified browser summary → unpaid list → full detail/actions. Yard queue also now scrolls independently at a bounded height while its heading remains visible.


## Unattended yard and driver QR check-in — October 16, 2026

Open **Equipment & settings → Unattended station**, or the weighing-station banner. **Driver QR check-in** previews the mobile landing form; it does not generate a publicly reachable QR code. Start a walk-in or registered-account visit, use the fictional sample licence, simulate extraction, confirm driver/expiry/email/material/vehicle/colour/plate, and check in. Licence upload is required anew for every visit. Optional sample files accept JPG/PNG/WebP strictly under 20 MiB; no dimensions limit is imposed. Uploaded images are used only as temporary previews, not OCR inputs, and are discarded on completion/close/reload. Do not upload real identity documents. No licence image or licence number is persisted or added to Photo Vault.

From the visit card, simulate arrival with an observed plate and stable inbound weight, then departure with a lower outbound weight. Each event targets one visit; duplicate active plates are blocked. Connected scale, enabled camera, stable positive weight and exact normalized plate are required. Completed visits cannot be weighed twice. The flow creates ordinary demo tickets and pairs the illustrative in/out photos under a unique visit ID in Photo Vault. Multiple visits can coexist; this is a drop-off demonstration, not the existing production pickup workflow.

At weigh-out, the driver may leave while the balance remains unpaid. A walk-in receives a **payment-email preview → online checkout preview → simulated successful payment → receipt**. An approved demo account receives an **invoice-email preview → itemized unpaid invoice → optional online checkout**. Sample invoices use 30-day terms and 5% GST for illustration; actual account terms/tax must come from the backend. Email outbox entries are labelled previews and never sent. No payment provider is called and no card details are collected. Paid sample tickets reconcile with the existing ticket/payment views, with a timestamp/reference/activity entry.

**Emergency contact** settings capture contact name, email and an email-alert toggle. SMS is deferred. Simulate a plate mismatch, unstable reading, unavailable camera/scale, or use Try an exception: the visit pauses, an incident is recorded, and an email preview targets the configured emergency address. Missing or disabled delivery is explicitly reported. Remote review requires notes and restores the previous stage; retry must pass the same checks. This is a local workflow mockup, not an authenticated remote support console.

### Required production work for Claude

- Preserve the current Hono/Cloudflare D1 app and hardware flows. Add server-side station/tenant-scoped visits, event processing and configuration with authorized roles; never trust local storage as an authority.
- Serve a real mobile driver route behind a station QR URL. Use signed, expiring, narrowly scoped visit tokens; prevent ticket/customer lookup leaks. Authenticate registered-account access and confirm invoicing approval on the server. The demo account selector is not authentication.
- Require licence capture each visit. Implement explicit collection/retention controls, restricted encrypted document storage, access auditing, and a genuine extraction service. Show extracted fields for correction and track confidence. Document extraction is not identity verification. Low-confidence, unreadable or expired documents need a review/retry path before weigh-in. Do not put identity documents into the general camera vault or client local storage.
- Integrate camera plate observations with confidence thresholds, capture timestamps and device health, and stable scale readings with verified station identity. Persist and deduplicate events; serialize transitions and prevent duplicate tickets/charges. Match the correct checked-in visit and retain ambiguous observations for emergency review. Do not infer identity from a face or promise verification based on the illustrative prototype.
- Store inbound/outbound photos durably with camera/visit/ticket metadata. Address bridge outages, camera outages, no-show/abandoned visits, failed captures, retries and missing departures. Do not silently release an exception to billing. Preserve the existing production pickup/drop-off rules; this demo only exercises drop-offs.
- Generate invoices using the existing invoicing constraints and approved account terms. Generate real hosted payment links through the provider; server-authoritative totals and verified, idempotent payment webhooks update ticket/invoice status. Departure permission is separate from payment confirmation. A browser success click cannot mark real money paid.
- Implement a durable email outbox with delivery status, retry/backoff, bounce/failure reporting and configured sender. Send invoices/payment links to verified billing contacts, and operational exceptions to the configured **Emergency contact**. Do not attach licence images. SMS is a future extension, not enabled now.
- Add visit/incident/audit screens with authenticated remote resolution and full history. Missing emergency contact or unhealthy integrations must block enabling production unattended mode. Agree on safe physical access/signage and outage behavior before enabling a real yard.
- Tenant branding (logo/colours/contact identity) must apply to the mobile check-in, invoices and emails. Keep the current prototype's Reuse Canada branding until tenant configuration exists.

### Verified locally

Browser-tested walk-in check-in → matched arrival → departure → unpaid email preview → simulated online payment → paid receipt; registered check-in → plate-mismatch incident addressed to the configured emergency email → resolution and retry → paired weigh-in/out → unpaid itemized invoice. No real email, OCR, payment or production deployment occurred. Demo test records use example.com addresses and AUTO 101 / AUTO 202 plates.


## Mode controls, co-pilot and branding — October 16, 2026

The unattended workflow is enabled **only** when `state.settings.mode === 'live'` (Auto mode). Manual/Off, Assisted and Dry run all retain the original operator capture/assign/weigh-out workflow and do not trigger unattended check-in, weights, exceptions or new billing. Controls are disabled in the unattended overview and mutation handlers recheck the mode on submission. Turning Auto off preserves visits and historical invoices/payment links, which can still be viewed and paid; it does not cancel issued balances. Re-enabling Auto resumes the available visit actions. Production must enforce the same rule server-side, including queued events and concurrent mode changes; this prototype is not a security boundary. Do not globally stop manual receipt printing or manual payment collection when Auto is off.

The redesigned Station co-pilot panel provides a persistent Manual/Auto switch, mode-specific explanation and primary action, clickable Check in / Weigh / Bill explanations, active-visit and unresolved-incident counts, scale status, Emergency contact shortcut and advanced settings. Count buttons open the unattended records view. Manual capture uses the original capture dialog.

Equipment & settings now includes **Branding & appearance** (`personalize.js`). It supports a business name, four colour presets (Forest/Ocean/Clay/Midnight), custom primary/accent colours, logo upload/removal, instant preview, Cancel, Save and Restore default look. Uploaded JPG/PNG/WebP files must be strictly under 20 MiB, are decoded and resized to at most 400px before local persistence; transparent PNG is preserved. Invalid images show an error. Save commits to the existing demo browser state; Cancel/X/Escape restores the last saved appearance. Restore default look is a draft change until Save. Button foreground adjusts for the selected colour. Business identity appears in navigation, footer, page title and new receipt renderings; future invoice email subjects use the current name. Past email previews remain historical snapshots. Logo appears in the rail and live branding preview. Full tenant-branded production invoices, mail templates and driver pages still need server-side integration.

Production: keep branding scoped to the current tenant/site, restrict edits by role, validate uploads server-side, store logos durably, validate colour contrast across all surfaces, and invalidate cached branding safely. Never use a user-supplied logo as executable SVG/HTML. Preserve the existing Reuse Canada defaults. Split source now includes personalize.js; keep script order cameras → vault → unattended → personalize → app in standalone packaging.

Verified in the browser: Manual disables QR entry; enabling Auto restores it; original manual Capture opens its arrival/departure chooser; Ocean colours survive save/reload; defaults can be restored. No console errors observed. All changes remain local prototype behavior.


## Full-screen camera console — October 16, 2026

Click any camera tile in All cameras or the weighing-station camera image to open a viewport-filling camera dialog. Controls: Take picture, directional pan/tilt, zoom 1–3×, return to centre, Start/Stop talking, pause/resume, All cameras and Photo Vault. Keyboard Enter/Space opens the main camera image; Escape/close exits the dialog. On narrow screens controls stack below the feed. Manual camera controls remain available in both operating modes.

Pan/tilt/zoom animate the illustration only, with bounded offsets saved per demo camera. Snapshots use the existing IndexedDB Photo Vault queue, include simulated PTZ metadata, and remain clearly labelled illustrations. Talk is a visible local toggle: no microphone permission, recording or transmission occurs. Pause disables picture/movement/talk and resets talk state; closing, switching cameras or leaving the browser tab also stops the talk preview. Full-screen means filling the app viewport, not changing the browser/OS fullscreen state.

Production must detect per-camera capabilities before offering movement or two-way audio. Integrate real PTZ through the authorized bridge/vendor API with bounded motion, rate limits and stop-on-release/disconnect/timeout. Do not expose camera credentials to the browser. Add secure audio transport, explicit microphone consent, a visible transmission indicator and a reliable stop/mute on close, camera switch, pause, tab background and connection loss. Fixed cameras need a clear “Movement unavailable” state; unsupported audio must not display a working Talk control. Real snapshots must use the actual selected stream, retain capture time/camera identity, and report durable storage success or failure. Require appropriate camera access permissions. No real hardware commands are sent by this prototype.

Browser verified: camera tile opens fullscreen; pan and zoom change the illustrated view; talk toggles visibly; pause disables controls; snapshot appears in Photo Vault with its timestamp. Restored the camera to enabled after testing.
