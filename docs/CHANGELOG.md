# Changelog

Notable decisions and changes, newest first. Architecture entries link to the
document that holds the decision; the document, not this file, is authoritative.

---

## 2026-09-21

### Process — documentation and roadmap restructure

Reorganised so that **"implement phase 3.X"** is a complete instruction.

**Roadmap reordered — vertical slice first.** The breadth-first 1–14 ladder is
retired. The project now builds the growth loop end-to-end on one store,
deployed, before broadening. The reason was measurable: 5,588 lines of
architecture docs and 3,936 lines of fabricated seed data against 1,112 lines of
domain logic, zero API routes, and nothing that ran. The seed manufactured AI
actions and attribution records no engine had produced.

**Numbering collapsed from three systems to two.** Architecture is `2.x`,
implementation is `3.x`. The three-level `3.2.1` form is gone; mapping tables in
[`STATUS.md`](./STATUS.md) and [`archive/README.md`](./archive/README.md) keep
old references readable.

**Created**

- [`INDEX.md`](./INDEX.md) — documentation map, authority order, invariant prefixes
- [`ROADMAP.md`](./ROADMAP.md) — milestones M0–M3, all phases, ordering rationale
- [`phases/README.md`](./phases/README.md) — the phase contract, rules for the implementing agent, inherited definition of done
- 13 phase specs for M1 — 3.5–3.9 READY with full contracts, 3.10–3.17 DRAFT with scope and acceptance
- Milestone records for [M0](./phases/m0-foundation/README.md), [M2](./phases/m2-depth/README.md), [M3](./phases/m3-demo/README.md)
- [`archive/README.md`](./archive/README.md) — what was superseded and by what

**Moved**

- `IMPLEMENTATION-STATUS.md` → [`STATUS.md`](./STATUS.md), rewritten
- `Phase-track.md`, `phase-2-freeze-checklist.md`, `plans/plan-001`, `plans/plan-002` → [`archive/`](./archive/README.md)

**Updated**

- [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md) — rewritten around the new map
- `CLAUDE.md` §16–17 — phase workflow replaces the database-order section

**Recorded as debt**

- D-15: README lists "Recommendation" as an AI action type; `AiActionType` has no such value

### Implementation — Phase 3.4 (was 3.2.3): platform schema delta + multi-store seed

First code for the Phase 2.8 decisions.

**Schema**

- `Store.slug` — platform-unique, resolves `/s/[storeSlug]` (ADR-2.8-002)
- `enum Surface { HOME PRODUCT_DETAIL CART CHECKOUT NOTIFICATION }` and
  `AiAction.surface`, plus `@@index([storeId, surface, status])` (ADR-2.8-006)
- CHECK `(decision = 'ACT') = (surface IS NOT NULL)` — `surface` is null exactly
  when the decision was `NO_ACTION`, mirroring the existing `actionType` rule
- Migration `20260921120000_phase_2_8_platform_delta`, hand-written: the
  generated form would have added a NOT NULL column to a populated table, and
  the CHECK is not expressible in Prisma (ADR-2.7-031)

**Seed**

- Four merchants, one store each (ADR-2.8-001). Electronics keeps the full
  growth loop; Daily Dairy, Fresh Harvest and Copper & Clay are catalog-depth
  (ADR-2.8-010)
- Per-store data extracted to `prisma/seed-data/`
- Deterministic store-prefixed category ids; spec schemas for all three new
  stores in `lib/catalog/spec-registry-stores.ts` (ADR-2.8-005)
- The seed now runs every product through `validateProductSpecs`, so an
  unregistered category fails loudly at seed time instead of silently rejecting
  specs later
- Baseline `Policy` set per store, so no store runs unconstrained (ADR-2.8-008)
- Surfaces assigned intentionally per scenario; all five values exercised

**Verification**

- `scripts/verify-db.ts` replaced its `SELECT 1` with 22 assertions covering
  tenancy, store isolation, spec coverage, platform invariants, commerce
  invariants and money. 22 passed, 0 failed
- Isolation negative-controlled: a dairy product is reachable by its own
  `(storeId, id)` and unreachable with the electronics `storeId`

**Also**

- `eslint.config.mjs` now ignores `lib/generated/**`. `npm run lint` had been
  failing with 772 errors from the generated Prisma client since Phase 3.1

### Architecture — Phase 2.8 Platform & Growth Surfaces

Documentation only — no schema, migrations or application code.

**Created**

- [`docs/architecture/phase-2.8-platform-decisions.md`](./architecture/phase-2.8-platform-decisions.md) — ADR-2.8-001…010, invariants PLT-1…PLT-10

**Renamed**

- `architecture-review.md` → [`phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md) — six documents already linked to that name; the file did not exist

**Updated**

- PROJECT-CONTEXT (product statement, authority map, 2.8 decisions), freeze checklist, 2.7 review §5
- Supersession banners: identity, product-catalog, activity-tracking, growth-system

**Major decisions**

- Multi-**merchant** is in scope; multi-store **per merchant** stays deferred. `Store.merchantId` UNIQUE unchanged
- Tenant resolution: `Store.slug` (platform-unique) + path prefix `/s/[storeSlug]`; `storeId` derives from the route only
- `anonymousId` is minted per Store; never queried without `storeId`
- Catalogue is domain-agnostic and **pack-based** — one pack = one Product + one SKU, integer quantities, no unit of measure
- `AiAction.surface` (HOME / PRODUCT_DETAIL / CART / CHECKOUT / NOTIFICATION), set by the application and write-once. No new action type, no new event type
- Notifications are an in-app tray for the MVP; off-channel delivery is execution, **not** exposure
- Absent Policy = constraint not applied; structural rules always apply; provisioning seeds a baseline policy set
- Non-goals recorded: no platform-admin actor, no merchant settlement/payouts/Route, no cross-store analytics or identity, no GST rate engine
- Demo depth: electronics carries the full growth loop; dairy / produce / utensils are catalog-depth

**Schema delta:** two columns, one enum, one index. No new tables.

**Status:** `READY FOR PHASE 3 (multi-merchant)`

### Process — implementation progress tracker

**Created**

- [`docs/IMPLEMENTATION-STATUS.md`](./STATUS.md) — single home
  for build progress: done slices with file/commit evidence, remaining 3.2.x
  domain slices with scope + authority + done-when, application phases 4–14,
  and a numbered known-debt register (D-1…D-12)

**Updated**

- [`Phase-track.md`](./archive/Phase-track.md) — now owns the build **order** only;
  status marks removed so progress has one home
- PROJECT-CONTEXT authority map

---

## 2026-09-19

### Architecture — Phase 2.7 Resolution & Freeze

Documentation only — no Prisma schema, migrations, or application code.

**Created**

- [`docs/architecture/phase-2.7-decisions.md`](./architecture/phase-2.7-decisions.md) — ADR-2.7-001…033
- [`docs/architecture/phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md)
- [`docs/architecture/phase-2-freeze-checklist.md`](./archive/phase-2-freeze-checklist.md)
- [`docs/PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md)

**Updated**

- Identity, product-catalog, activity-tracking, growth-system docs — supersession banners + conflicting sections
- [`Phase-track.md`](./archive/Phase-track.md) — dual numbering note; Phase 2 marked done for architecture

**Major decisions**

- Merchant↔Store 1:1 database-enforced; store isolation composites & slug uniqueness
- GST-A: MRP/selling inclusive, cost exclusive; indicative contribution
- Order 1:N PaymentAttempt; inventory conditional decrement in Order→PAID txn
- Event trust classes; server-only PURCHASE; cart/order lifecycles
- Opportunity = deterministic → AI; Action lifecycle without response/conversion states
- Policy/guardrail versioning + frequency ledger; attribution 7d last-touch
- Historical truth principle; Prisma gaps → raw SQL OK

**Status:** `READY FOR PHASE 3`

**Closed:** OPEN-1 (GST).

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

**Open** — ~~OPEN-1: GST treatment~~ → **Closed 2026-09-19** in Phase 2.7
([ADR-2.7-021](./architecture/phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed)).

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
  migration. *(1:1 is now DB-enforced — ADR-2.7-002.)*

---

## Earlier

- **Phase 1 — Merchant UI shell.** Next.js 16 App Router, Tailwind v4, eight
  dashboard routes, component system, demo-data layer. See
  [`README.md`](../README.md).
