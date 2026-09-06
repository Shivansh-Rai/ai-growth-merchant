# Changelog

Notable decisions and changes, newest first. Architecture entries link to the
document that holds the decision; the document, not this file, is authoritative.

---

## 2026-09-06

### Architecture — Plan 002: Product & Catalog Model

Accepted [`docs/architecture/product-catalog-model.md`](./architecture/product-catalog-model.md).
Documentation only — no code, schema or migrations.

**Decided**

- **D-1 — Money is integer paise, system-wide.** ₹2,500 is `250000`. Field names
  carry the unit (`sellingPricePaise`). Exact under profit/margin arithmetic,
  JSON-safe across the Server → Client boundary, and matches the Razorpay
  amount format used in Phase 10.
- **D-2 — Flexible specs are one JSONB column** validated at write time against
  per-category Zod schemas held in app code. Flat, primitives only, numeric
  magnitudes in the canonical unit named by the key (`batteryHours: 30`). GIN
  indexed. EAV rejected.
- **D-3 — Brand, Category and Subcategory become lookup entities**, two levels
  deep, store-scoped. Reliable equality is what makes AI substitution and
  cross-sell work as joins rather than string comparisons.
- Three stored prices (MRP, selling, cost); discount, profit and margin are
  always derived. Cost price is optional — when absent, profit and margin are
  *unavailable*, never zero.
- Lifecycle (`DRAFT`/`ACTIVE`/`ARCHIVED`, stored) is separated from availability
  (`IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`, derived).
- Cost, profit and margin are merchant-only and must never reach a customer
  surface or AI output.
- AI scarcity claims must match observed stock, and that observed figure is
  recorded with the action so the claim stays auditable.

**Recorded, not applied** — eight conflicts between the accepted model and the
Phase 1 UI code (`product-catalog-model.md` §14). Two are contradictions worth
noting here:

- Product `status` merges lifecycle with stock availability and stores
  `out_of_stock` alongside `stock` — two homes for one fact.
- Money is currently plain JS numbers in whole rupees, which conflicts with D-1.
  Conversion is system-wide, not just Product.

**Open** — OPEN-1: GST treatment of prices is unstated, and profit/margin are
overstated if selling price is tax-inclusive while cost is not. Must be resolved
before merchant-facing margin figures ship.

### Architecture — Plan 001: Identity Model

Accepted [`docs/architecture/identity-model.md`](./architecture/identity-model.md).
Documentation only.

- No `Visitor` entity. A Session carries a required durable `anonymousId`
  (device token) and a nullable `customerId`; "visitor" is a *state* of a
  Session.
- On login, prior anonymous sessions on the same device token within 30 days are
  attributed to the customer, guarded so a shared device cannot leak one
  person's browsing into another's profile.
- `customerId` (authenticated at the time) is kept distinct from
  `attributedCustomerId` (inferred afterwards), so the audit trail can always
  answer what was actually known at the time.
- Merchant and Customer are separate identity namespaces.
- Store stays a separate domain concept from Merchant despite the 1:1
  relationship, making multi-store a later cardinality change rather than a
  migration.

---

## Earlier

- **Phase 1 — Merchant UI shell.** Next.js 16 App Router, Tailwind v4, eight
  dashboard routes, component system, demo-data layer. See
  [`README.md`](../README.md).
