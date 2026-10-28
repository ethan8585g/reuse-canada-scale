# Commercial readiness review — configurable truck-scale software

Review date: October 16, 2026. Intended customers: businesses operating truck scales, with customer-specific branding. Based on the current local application and interactive prototype. This is a product/code review, not a penetration test, hardware certification, deployment audit, or verification of backup settings. No production records or settings were changed.

## Recommendation

Package the product around dependable weigh-in → weigh-out → receipt/payment → searchable evidence. Begin with a narrow, explicitly supported operating profile and paid pilots, even if the eventual product serves many industries. Make the branding configurable rather than maintaining a separate code fork for every customer.

The prototype is a useful sales demonstration. Its local browser data, simulated hardware, fabricated camera images and sample payment approvals are not production functionality. The existing production application supplies real operations, but the prototype redesign and newly added Vault/multi-camera/material attachments still need integration.

## Verified code findings to address before a customer launch

1. **Customer-company isolation is not established in the reviewed request path.** `src/middleware/auth.ts` authenticates customer/employee identities, and `src/routes/scaleTickets.ts` queries tickets against a single DB binding with no organisation scope in the reviewed list query. This is compatible with a deployment dedicated to one company, not proof of safe shared-company hosting. Choose either separately provisioned app/database/storage credentials per company, or implement tenant identity and enforce it across every API, query, attachment, export and background job. A customer record in today's CRM is the yard's customer, not the software subscriber. Never treat those as interchangeable.
2. **Payment-state authority and permissions need tightening.** `/api/scale-tickets/:id/payment` accepts caller-supplied status/method/payment identifiers and defaults missing status to paid. The route uses employee authentication, without an explicit narrower role gate or Square verification in that handler. Provider-confirmed card state must be authoritative; define a distinct audited cash/manual-payment workflow and strict state/value validation. Existing payment-ID uniqueness is useful but insufficient for cash retries and status transitions. See `src/routes/scaleTickets.ts:977` and the shared middleware at line 23.
3. **Void access is broader than a commercial permission model should allow.** The reviewed void handler requires an employee session and reason but does not enforce a manager role or reject a completed/paid ticket. Define permissions and an explicit correction/refund workflow; a void is not proof a payment was refunded. See `src/routes/scaleTickets.ts:932`.
4. **Concurrent weigh-out can race.** `/:id/merge-out` checks the ticket status in a SELECT, then updates by ID without an eligible-status predicate. Two requests may both pass the initial check. Use an atomic conditional transition and verify affected rows; add operation idempotency for retries. Validate related photo, audit and payment effects. See `src/routes/scaleTickets.ts:630`.
5. **Audit writes can fail silently.** `auditLog()` catches and discards write errors. For sensitive changes, persist the audit record with the mutation where feasible, or maintain a durable recovery queue and visible incident state. Do not promise a complete evidentiary trail while omissions can disappear silently. See `src/routes/scaleTickets.ts:88`.
6. **Session hardening is incomplete.** Login sets an HttpOnly cookie but also returns the token in JSON; the login page stores the full response in localStorage. The cookie does not protect that second token copy from page-script access. Review cookie-only browser sessions, migration compatibility, logout/revocation, CSRF/origin defenses and admin MFA. Existing salted password hashing, failed-login throttling and deactivated-account checks are positive foundations. See `src/routes/auth.ts:136` and `src/pages/login.ts:203` / `:227`.
7. **The archive is still a local prototype.** `prototypes/scale-house-redesign/vault.js` stores captures in IndexedDB, has illustrative camera images and simulated matching, and cannot guarantee retention across browser deletion or device loss. Failed captures have an in-session retry, not a durable station upload queue. Production needs object storage, indexed capture metadata, company-scoped access, retention configuration, backups and tested restores. Existing production `photo_in`/`photo_out` fields and their update endpoint are not an append-only archive of every camera picture.
8. **History must scale beyond a bounded list.** The ticket list defaults to 100 and caps at 500 records; the reviewed query does not implement cursor-based browsing. Provide server-side pagination, full-history filters and server-calculated totals/export. Populate material filters from distinct materials actually used in accessible tickets, not from only the currently loaded page. Check date boundaries consistently in the station timezone.
9. **Critical behavior needs a repeatable release gate.** The inspected package scripts contain no test script, and the file-name search found no tracked test/spec files. This does not establish that no testing exists elsewhere. Add focused automated integration checks for permissions, tenant isolation, duplicate captures, payment retries/cancellation, net-weight direction, paid-ticket editing, stale tickets and photo/print recovery. Compile the emitted inline browser scripts as well as the TypeScript build.
10. **Generic deployment configuration is not yet demonstrated.** GST is a source constant (`src/utils/money.ts`) and the existing installation targets one brand/site/station. Company-specific taxes, timezone, units, receipt identity, hardware and allowed bridge origins need a controlled configuration model rather than customer-specific source edits.

## White-label configuration

Use one maintained product with Company → Sites → Stations. A first customer may have one of each; do not force complicated setup when defaults suffice.

| Setting group | Per-company/site configuration |
| --- | --- |
| Brand | Business name, logo, primary/accent colour, accessible contrast, receipt/email preview; optional branded domain later |
| Business identity | Address, contact details, receipt footer, tax registration fields, ticket numbering rules |
| Operations | Timezone, kg/lb/tonne/short-ton display and billing rules, inbound/outbound/pickup/drop-off rules, material catalogue |
| Pricing | Material/unit rate, effective date, tax treatment, customer-specific agreements when needed, rounding/minimum-charge rules |
| Hardware | Named station, scale protocol/serial settings, camera identity and role, printer queue, terminal pairing |
| People | Owner/admin, manager, operator, driver and read-only access with action-level permissions |
| Evidence | Capture policy, original versus preview image retention, storage quota, retention period, export permissions |

Unit conversion, billing units and ticket direction need explicit rules; changing a label is not a conversion. Preserve the original measured value/unit and rate applied to each completed ticket. Quotes, charges and paid receipts must not change when a future price changes.

Allow visual branding but preserve consistent warning/error/success meanings and legibility. Avoid a separate repository/branch of product code for each customer. No additional repository, project or domain is provisioned by this review.

## Changes to the actual product experience

### First priority: make daily work and failures obvious

- A clear current-load workflow with arrival, identity, departure, payment and receipt status. Keep only the next meaningful action prominent.
- A persistent **Needs attention** queue: unknown customer, unmatched departure, conflicting vehicle match, missing picture, stale reading, failed print, pending/failed payment and upload awaiting sync. Do not rely only on short-lived toast messages.
- Separate physical visit state, ticket state, payment state and print state. A completed weighing may be unpaid; a paid ticket may still need a receipt. A camera departure alone does not mean the scale ticket completed.
- Reliable draft recovery and visible offline/queued/synced states. Define which actions can proceed offline; never invent offline card approval. Reconnecting must not duplicate loads or payments.
- One transaction workspace for reviewing ticket, pictures, identity, totals, payment and receipt. Reduce the series of separate modal screens once the interaction is proven.
- A vehicle directory for repeat visits: plate, make/model/type, colour and usual driver, while keeping ticket fields editable and confirming ambiguous plate matches. Do not replace live tare with stored tare in the existing Assign flow.

### Photo Vault improvements before claiming real tracking

- Keep **Detected**, **Operator-confirmed**, **Unmatched** and **Capture failed** distinct. Display detector confidence only if genuinely supplied; never invent it.
- Persist event/camera timestamps and time-source information, camera health, identity observations and operator corrections. Avoid silent cross-camera or cross-visit reassignment.
- Let managers review unmatched events and reopen a decision with an audit reason. Use configurable visit-age rules and conservative duplicate/plate handling.
- Separate original evidence from compressed previews. Current material uploads accept under 20 MiB but keep resized JPEGs; this is not original-image preservation.
- Export a visit as an accessible report; add a bulk archive format and full-history export for customers that need to leave the product.
- Expose storage usage and retention settings. “Save every picture” requires capacity planning and a clear definition: all captured snapshots, event stills, or continuous video frames are very different workloads.

### Setup that can be repeated at another yard

A guided setup checklist should cover company details → branding → units/taxes → materials/prices → employees → scale → cameras → printer → payments → test load. Show a clear pass/fail result for each device and a working demo mode. Include support diagnostics: app/bridge versions, last readings, camera health, print queue state and recent failures, excluding secrets and unnecessary personal data.

Publishing a button labelled Add printer is not enough: it must discover usable queues and guide OS installation when required. Similarly, adding a camera address must result in a tested compatible stream and a defined photo/plate role.

## Scope for the first sale

**Include:** supported scale hardware, customer/vehicle records, material pricing, weigh-in/out, usable receipts, payment reconciliation, reliable ticket/photo history, company branding, roles, export, monitoring, backup/restore and assisted installation.

**Pilot behind a clearly labelled option:** automatic camera arrival/departure detection, multi-camera identity matching and hands-off automatic charging. Expand only after real yard observations demonstrate reliable handling of ambiguous visits and equipment failures.

**Defer unless the first buyer needs it:** unrelated fleet/pickup CRM breadth, elaborate theme editors, multiple payment processors, advanced accounting connectors and fully self-service onboarding. Offer modules rather than exposing tire-specific workflows to unrelated scale industries.

Do not market the product as universally compatible or certified based on a prototype. Agree on a supported hardware/operating profile, and independently verify any jurisdiction- or industry-specific requirements before making compliance claims.

## Release gates for a paid pilot

1. Choose and demonstrate company isolation; a user from one subscriber cannot retrieve another's ticket, picture, export or settings.
2. Prove a complete load on the actual supported hardware, including the corrected receipt.
3. Disconnect scale/camera/network/printer at relevant points; show recovery without lost events or duplicate charges.
4. Validate pricing/unit direction and lock/reconcile paid ticket corrections.
5. Confirm real payment results server-side and reconcile them to the day's totals.
6. Capture, pair, review and retrieve pictures after a station restart; test retrieval from backups.
7. Demonstrate repeatable installation and configuration at a second station/company.
8. Provide a support contact, documented update/rollback process, customer export and agreed retention/service expectations.

No blanket readiness percentage is justified by this review. The key commercial milestone is a second yard operating successfully with a repeatable install and predictable support effort, not another set of screens.
