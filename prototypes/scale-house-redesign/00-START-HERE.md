# Scale House: final implementation handoff

This is the final agreed design, not a new design exercise. Implement it in the existing `reuse-canada-scale` repository. The prototype is a working local interaction reference, not production-ready software.

## Read economically

1. Read this file and `01-FINAL-SPEC.md` once. Follow the repo's `AGENTS.md`.
2. Use `02-SOURCE-MAP.md` to find only the functions needed for the current step. Do not dump all production files or all prototype scripts into context.
3. Open `index.html` for the visual reference, or serve this directory locally. Source is included once; no duplicate standalone HTML or historical conversation in this ZIP. `screenshots/` is optional visual reference.
4. Implement, validate, then keep a short progress note: completed files, checks, remaining integration needs. Do not repeatedly re-plan, re-read finished files, or rewrite this spec. Reuse existing production flows instead of rebuilding them.

## Delivery order

- **A — Existing workflow:** apply the approved layout to `src/pages/scaleHouse.ts`, preserving existing auth, scale/bridge, customer/ticket/receipt/payment/pickup behavior. Add responsive tabs, inline scrollable yard queue, history filters, interactive payment records and co-pilot. Reuse current backend routes.
- **B — Settings and records:** add authorized persisted branding, material notes/images, printer setup, multi-camera full-screen controls and durable Photo Vault where missing. Inspect current schema/API support first; do not invent unsupported fields silently. Use capability-aware fallbacks for hardware features.
- **C — Unattended:** implement server-controlled Auto gating, driver visits, per-visit licence extraction/review, camera/weight matching, account invoices/walk-in payment links, email delivery and Emergency contact incident handling. Reuse current scale-agent logic and invoicing/payment constraints. Keep unavailable integrations visibly unavailable; never mark a fake operation successful in production.

A/B/C are implementation checkpoints within the requested scope, not permission to omit C. Finish independently implementable work. If provider access or a product decision genuinely blocks real integration, list the exact missing item and completed work; do not claim unattended production readiness.

## Boundaries

Only repo/Cloudflare project `reuse-canada-scale`, domain `www.reusecanadascale.com`. No deployment, push, remote migrations or real customer emails/payments without further user authorization. Preserve unrelated working-tree changes. Do not replace the Hono app with a new SPA, copy demo state into production, or remove existing pickup/drop-off behavior. No new subscriptions, packages or services merely to imitate the static design.

## Verification

`node verify-prototype.mjs` checks source syntax/order and focused demo guards. Production needs its own emitted-inline-JS syntax check, `npm run build`, and functional checks in the final spec. The prototype tests do not certify real hardware, OCR, emails, payments, security or multi-tenant isolation. See `03-VERIFICATION.md` for what was actually checked.
