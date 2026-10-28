# Final agreed requirements

This file supersedes chronological design notes. Keep the existing product's functionality when implementing the new UI.

## Operator workspace

- Three main sections: Weighing station, Ticket history, Equipment & settings. Keep existing shared CRM navigation and role permissions. Responsive desktop/mobile layout; accessible named controls, keyboard focus and Escape-close dialogs.
- Weight display, scale connection, material selection and primary Capture action remain prominent. Connection guidance uses short plain language; technical setup stays in expandable equipment help.
- In-the-yard list scrolls within a bounded area; its heading stays visible. Oldest active ticket is yard position 1, not persistent ticket number 1. Open a ticket, assign customer, edit details, weigh out or void with reason.
- Manual workflow: capture arrival → ticket/customer/material/driver/vehicle/colour/plate → live outgoing tare → receipt → collect payment or leave unpaid. Vehicle, colour, licence plate and driver name appear in details and receipts. Missing values are explicit, not invented.
- Ticket History: date/range, search, status, Material and Customer filters combine. Material options come only from values present in ticket history. Customer options likewise reflect ticket data. Clear filters and empty states; CSV export and ticket detail access.
- Today's payments: clickable card/cash/unpaid/all categories → individual record with full ticket identity, weights/rate/tax/amount, status, actual transaction reference/time, notes and activity. Open ticket/receipt, collect an unpaid balance, reprint. Settling a day does not mark unpaid tickets paid.

## Mode and co-pilot

- **Only Auto mode enables unattended check-in and automatic weighing/billing.** Turning it off pauses unattended mutations while retaining visits. Manual/Off, Assisted and Dry run use the original operator workflow. Existing unpaid invoices/payment links remain usable; do not cancel debts when switching modes.
- Enforce mode on the server, including queued/retried events and concurrent changes; disabled buttons alone are insufficient. Keep manual camera controls available in either mode.
- Interactive co-pilot panel: Manual/Auto switch, mode-specific primary action and explanation, Check in/Weigh/Bill step buttons, active visits/unresolved incident counts, scale health, emergency-contact shortcut and advanced settings.

## Equipment and personalization

- Printers: Print to selector, Add printer flow, test/reprint, auto-print and photo preferences. Prototype adds a local named printer; real discovery/setup must use supported bridge/OS paths.
- Materials: configured rates; add name/rate/notes and optional picture. JPG/PNG/WebP, **strictly under 20 MiB**, no arbitrary pixel-dimension restriction. Show validation, preview and removal. Demo resizes; production must validate/decode server-side and handle storage.
- Branding & appearance: business name, uploaded logo, primary/accent colours, four presets, immediate preview, Save/Cancel/Restore default. Cancel/X/Escape reverts draft. Logo accepts JPG/PNG/WebP under 20 MiB; transparent PNG supported. Demo limits rendered logo to 400px and persists locally. Production branding is tenant/site scoped and role protected; apply consistently to station, driver pages, receipts/invoices/emails. Store logo as data, never executable HTML/SVG. Validate contrast, not just visual preference.

## Cameras and Photo Vault

- Multiple named cameras, source/device settings, enabled/paused status, active view, one designated ticket-photo camera. Preserve existing production capture support and camera/agent settings.
- Clicking a tile or main feed opens a full-viewport camera console. Take picture, pan/tilt, zoom, home, Start/Stop talking, pause/resume, All cameras, Photo Vault. Controls stack on mobile. Disabled cameras cannot take pictures/move/talk. Audio stops on close, switch, pause, background or disconnect.
- Prototype uses illustrations, bounded motion and a talk toggle; it never accesses a microphone or sends commands. Real PTZ/audio require camera capability checks, authorized bridge/vendor integration, microphone consent and visible transmit state. Use movement stop/timeouts and rate limits. Clearly disable unsupported functions.
- Photo Vault: save every requested picture/capture event; group in/out by visit with camera, date/time/timezone, ticket/customer/material, vehicle/colour/plate/driver, weights, source and association basis. Keep arrival-only/departure-only/unmatched events; search/filter by date/camera/status/text; detail and image access; correct pairing with audit trail; export metadata and portable visit report.
- Persist originals/capture times; distinguish observed facts, inferred matches and operator edits. Demo uses IndexedDB; real images need authenticated durable storage plus indexed metadata, pagination, backup and explicit retention/capacity policy. Never promise infinite storage. No continuous video requested. Keep licence documents separate from general camera pictures.

## Unattended driver journey (Auto only)

1. Yard QR opens a short mobile check-in. Support walk-ins and registered accounts; registered access and invoicing eligibility must be authenticated server-side. Demo dropdown is not authentication.
2. **Every visit requires a fresh driver's licence upload.** Extract info automatically, show it for correction/confirmation, and handle expiry/unreadable/low-confidence cases through retry or emergency review. OCR does not establish identity or document authenticity. Camera vehicle/plate verification is required; facial recognition was not specified.
3. Driver confirms name, email, material, plate, vehicle and colour. Preserve selected rate/terms server-side. Use signed, expiring visit tokens with narrowly scoped access; prevent duplicate active visits and record leakage.
4. Arrival: match a confident camera observation to the correct checked-in visit; wait for valid stable scale weight; create the inbound ticket and capture images.
5. Departure: match that visit, capture valid outgoing weight/photos, complete once, compute totals server-side. Ambiguous matches, stale/unstable readings, outages and mismatches pause processing for review. Multiple trucks can be in the yard; serialize/deduplicate station events and guard concurrent completion.
6. **Driver may leave before payment.** Walk-in receives an emailed hosted payment link; approved account receives an emailed invoice using its approved terms. Keep debt unpaid until provider-confirmed payment. Receipt follows confirmed payment as appropriate. Demo 5% GST/30-day terms are samples, not business rules.
7. **Email only now; SMS later.** Durable outbox with retry and delivery/bounce/failure visibility. Signed/idempotent payment webhooks, secure provider checkout, no raw card handling or browser-only paid flags. Reuse existing invoice uniqueness/audit rules.
8. Emergency contact: configurable name/email and alert toggle. Incident records, email alerts, authenticated remote review and resolution notes. Resolution restores the prior step; it cannot bypass subsequent checks. Missing contact/unhealthy integrations must prevent production unattended enablement. Define no-show, abandoned visit, unreadable licence, missing departure, offline and recovery behavior before real yard operation.

## Preserve production invariants

Walk-In is the inactive sentinel customer, not a null customer ID. Production open status is not demo `open`. Live tare must use current scale reading, not stored vehicle tare. Keep stable-reading/debounce/stale guards; assignment alone does not complete/print; completion uses existing print/bridge/fallback sequence. Keep pickup/drop-off semantics, server repricing, roles, audit, transaction idempotency and error paths. Never copy localStorage, seed date, sample OCR or demo approvals into production.

## Acceptance checkpoints

- Manual loaded capture → assign → valid empty weigh-out → correct receipt → payment; disconnected/zero/invalid/repeated readings cannot complete. Manual behavior survives Auto toggles.
- History combined filters and yard scroll work. Payment category → record → ticket/receipt/notes/payment works without incorrect paid or settlement state.
- Branding save persists, cancel restores, logo validation/removal works. Material notes/picture persist, invalid/oversize input produces a useful error.
- Each camera opens full screen; correct camera captures, PTZ bounds/home, pause and talk-stop behavior. Unsupported real features are clearly unavailable. Vault pairing/filter/export and failure/retry work.
- Walk-in and approved-account unattended paths, licence each visit, mismatch/unstable/offline exception, remote resolution/retry, multi-truck association, duplicate event prevention, unpaid departure and email/payment failure/retry.
- Auto-off blocks direct requests as well as UI entry. Auth/tenant access, document retention/access, payment webhooks and durable storage are verified before enabling real unattended operation.
