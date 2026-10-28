# Targeted source map

Paths below are relative to the existing repository, not this extracted prototype folder. Line locations can move; search the named function/route. Do not reimplement an existing operation before inspecting its handler.

## Prototype files — inspect only the feature being ported

| File | Contents / search anchors |
|---|---|
| `index.html` | Approved shell and sections; IDs `workspace`, `history`, `equipment`, `vault`, `unattended`, native dialog |
| `styles.css` | Design tokens, responsive layout, camera/fullscreen and co-pilot styles |
| `app.js` | `render`, `renderEquipment`, `filtered`, `syncHistoryFilters`, `capture`, `newTicket`, `assign`, `weighOut`, `complete`, `receipt`, `paymentList`, `paymentDetail`, `settings`, material image handling |
| `cameras.js` | `cameraWall`, `cameraDetail`, `moveCamera`, `snapshotCamera`, `cameraEditor`; simulated talk/motion |
| `vault.js` | `vaultRecord`, `appendVault`, `captureTicketVault`, `captureManualVault`, `renderVault`; IndexedDB and pairing/export demo |
| `unattended.js` | `startDriver`, `driverLicence`, `driverConfirm`, `autoWeigh`, `autoIncident`, `autoReview`, `autoInvoice`, `autoCheckout`; guarded form submissions |
| `personalize.js` | `renderCockpit`, `requireAuto`, `stationMode`, `brandingSettings`, `applyBrand`; appearance draft/save/cancel |

Script order: cameras → vault → unattended → personalize → app. Existing DOM must exist before scripts. Avoid embedding the standalone version as well as these source files; they are duplicates.

## Production entry points verified in this workspace

- `src/index.tsx`: `/employee/scale-house` renders `renderScaleHouse`; mounts `/api/scale-tickets`, `/api/scale-agent`, `/api/scale-bridge`, `/api/pricing`, `/api/square`, `/api/invoices`.
- `src/pages/scaleHouse.ts`: page markup, client state/hardware. `captureWeight` ~1149, `connectBridge` ~2011, `bootstrapScale` ~2061, `connectUSBSerial` ~2242, `connectBluetooth` ~2311, `loadOpenTickets` ~4293. Search other handlers by UI/endpoint; no need to read the whole file at once.
- `src/utils/employeeLayout.ts`: existing CRM navigation wrapper. `src/utils/layout.ts`: shared styles/layout. `src/middleware/auth.ts`: roles/session protections.
- `src/routes/scaleTickets.ts`: print-trigger, assign/quick-customer, merge-out, receipt/receipt-printed, settlement/daily and settlement/batch, void/type, ticket detail/audit. Preserve newer vehicle appearance/camera match and pickup changes.
- `src/routes/scaleBridge.ts`: remote/current bridge state; preserve bridge auth and stale-reading checks.
- `src/routes/scaleAgent.ts`: GET/PUT `/settings`, POST `/decide`, `/decisions/:id/outcome`, `/vision`, `/verify`, `/verify-sweep`, GET `/log`. This is existing functionality, not a blank-slate new agent.
- `src/routes/pricing.ts`: GET/POST `/`; POST `/:id` for ordinary rate, POST `/:id/pickup` for pickup rate, DELETE `/:id`. Preserve role restrictions.
- `src/routes/square.ts`: POST `/terminal-checkout`, GET `/terminal-checkout/:id`, POST `/terminal-checkout/:id/cancel`, `/payment`, `/cash-payment`, GET `/devices`. Terminal checkout is not automatically a hosted payment-link or two-way audio API.
- `src/routes/invoices.ts`: list/detail/uninvoiced tickets, create, issue, void. Reuse numbering, line-item uniqueness and audit; inspect auth before extending driver-accessible invoice links.
- `src/pages/scaleTickets.ts`, `src/pages/invoices.ts`: existing history/detail and invoicing UI; integrate rather than fork conflicting payment/ticket states.

## Schema inspection starting points

Read only relevant migrations plus the current queries: `0012_invoicing.sql`, `0014_scale_ticket_driver.sql`, `0018_scale_agent.sql`, `0020_scale_agent_customer_prompt.sql`, `0022_scale_agent_appearance.sql`, `0023_ticket_type_pickup.sql`, and pricing/payment/settlement migrations as needed. Migration `0022_scale_agent_appearance.sql` is not evidence that business branding exists; inspect its columns. Allocate new migration numbers from the current directory, never from this document.

## Integration work not proven complete by the prototype

Public authenticated driver check-in; real licence extraction/document handling; production visit state and camera-event matching; hosted payment links and signed callbacks; email delivery/retries; tenant branding/storage; durable image vault; camera PTZ/two-way audio. Check existing source before adding each piece, but do not assume demo success means backend support.
