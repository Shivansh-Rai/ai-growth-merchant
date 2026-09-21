# Implementation Status

**Last updated:** 2026-09-21
**Authority:** This file is the **single home for build progress**.
[`Phase-track.md`](./Phase-track.md) owns the phase *ladder* (what order things
happen in); this file owns *what is actually done*. Architecture decisions live
in [`architecture/`](./architecture/) — nothing here decides domain behaviour.

Two numbering systems coexist and must not be conflated
([ADR-2.7-033](./architecture/phase-2.7-decisions.md#adr-27-033--phase-numbering-legend)):

| System | Meaning |
|---|---|
| **Architecture 2.1–2.8** | Domain design documents |
| **Implementation 1–14** | Build ladder in [`Phase-track.md`](./Phase-track.md) |
| **3.2.x** | Domain-service slices inside implementation Phase 3 |

---

## At a glance

```text
Architecture          ✅
Database foundation   ✅
Products              ✅

Platform delta (2.8)  ⏳   ← smallest next slice
Identity & Sessions   ⏳   ← next domain slice
Events                ⏳
Cart                  ⏳
Checkout              ⏳
Orders                ⏳
Payments              ⏳
Inventory flow        ⏳   (no standalone slice — see note)
AI Growth             ⏳
Attribution           ⏳
Auth                  ⏳
Storefront            ⏳
UI wiring             ⏳
Full integration      ⏳
```

**Legend:** ✅ done · 🔨 in progress · ⏳ not started · ⚠️ known debt

> **Note on "Inventory flow".** Inventory has no slice of its own by design.
> Reads live in the catalog slice; the authoritative decrement happens inside
> the Order→PAID transaction at payment confirmation
> ([ADR-2.7-019](./architecture/phase-2.7-decisions.md#adr-27-019--inventory-concurrency)).
> Building it separately would create a second home for stock mutation.

---

## Done

### ✅ Phase 1 — Merchant dashboard UI shell

Next.js 16 App Router, Tailwind v4, Satoshi. Eight dashboard routes, component
system, empty states.

**Evidence:** `app/(dashboard)/*`, `components/*`, `components/ui/*`
**Caveat:** every page renders `[]` — the shell is **not wired to the database**
(`app/(dashboard)/products/page.tsx:12`). UI types still carry the CFT conflicts
listed under [Known debt](#known-debt).

### ✅ Phase 2 — Architecture & domain modelling (2.1–2.6)

Identity, catalog, events + commerce, AI growth + guardrails + attribution.

**Evidence:** [`identity-model.md`](./architecture/identity-model.md),
[`product-catalog-model.md`](./architecture/product-catalog-model.md),
[`activity-tracking.md`](./architecture/activity-tracking.md),
[`growth-system-and-guardrails.md`](./architecture/growth-system-and-guardrails.md)

### ✅ Phase 2.7 — Architecture review & freeze

32 findings raised, 33 ADRs written, zero critical unresolved.

**Evidence:** [`phase-2.7-decisions.md`](./architecture/phase-2.7-decisions.md),
[`phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md),
[`phase-2-freeze-checklist.md`](./architecture/phase-2-freeze-checklist.md)

### ✅ Phase 2.8 — Platform decisions / multi-merchant model

10 ADRs, 10 platform invariants. Extends 2.7, reverses nothing.

**Evidence:** [`phase-2.8-platform-decisions.md`](./architecture/phase-2.8-platform-decisions.md)
**Carries forward:** a 2-column schema delta that is **not yet applied** — see
[3.2.3](#-323--platform-schema-delta--multi-store-seed).

### ✅ Phase 3.1 — PostgreSQL + Prisma foundation

Full 22-model schema, one migration, PostgreSQL-native invariants Prisma cannot
express, deterministic seed, verification script.

**Evidence:** `prisma/schema.prisma` (1,087 lines),
`prisma/migrations/20260920133705_init_phase3_domain_model/migration.sql`,
`prisma/seed.ts`, `scripts/verify-db.ts`
**Includes:** 5 partial unique indexes (one ACTIVE cart, one SUCCEEDED payment
attempt, one PURCHASE event per order, one OPEN opportunity per dedupe key, one
live attribution record per order) and ~30 CHECK constraints.
**Commits:** `c23e24c`

### ✅ Phase 3.2.1 — Prisma client / server DB layer

**Evidence:** `lib/prisma.ts` · **Commit:** `5226094`

### ✅ Phase 3.2.2 — Product domain slice

| Capability | File |
|---|---|
| `createProduct` | [create-product.ts](lib/products/create-product.ts) |
| `updateProduct` | [update-product.ts](lib/products/update-product.ts) |
| `archiveProduct` | [archive-product.ts](lib/products/archive-product.ts) |
| `getProduct` | [get-product.ts](lib/products/get-product.ts) |
| `listProducts` | [list-products.ts](lib/products/list-products.ts) |
| Domain errors | [errors.ts](lib/products/errors.ts) |
| Prisma error mapping | [prisma-errors.ts](lib/products/prisma-errors.ts) |
| Specs registry (Zod) | [spec-registry.ts](lib/catalog/spec-registry.ts) |

Store isolation is enforced by explicit `storeId` arguments plus `storeId_id`
composite lookups. Zod at the boundary, PostgreSQL as final authority.

**Commits:** `ef51d64`, `19b1810`, `eac4aa3`

---

## Remaining — Phase 3 domain layer

Each slice follows CLAUDE.md §16: read the architecture → inspect existing code
→ plan → implement that scope only → validate → review.

### ⏳ 3.2.3 — Platform schema delta + multi-store seed

The 2.8 decisions that need database support.

**Scope**
- `Store.slug String @unique` (platform-global)
- `enum Surface { HOME PRODUCT_DETAIL CART CHECKOUT NOTIFICATION }`
- `AiAction.surface` + `@@index([storeId, surface, status])`
- One migration
- Seed rework: 4 merchants × 1 store (electronics, dairy, fruit & vegetable,
  utensils); electronics keeps the full growth loop, the rest are catalog-depth
- Deterministic store-prefixed category ids; spec schemas registered per store
- Baseline `Policy` rows per store
- `verify-db.ts`: add cross-store negative assertions

**Authority:** [2.8-002](./architecture/phase-2.8-platform-decisions.md#adr-28-002--store-public-identity--tenant-resolution),
[2.8-005](./architecture/phase-2.8-platform-decisions.md#adr-28-005--spec-registry-keys-under-multi-store),
[2.8-006](./architecture/phase-2.8-platform-decisions.md#adr-28-006--ai-action-surface-placement),
[2.8-008](./architecture/phase-2.8-platform-decisions.md#adr-28-008--policy-absence-semantics--store-provisioning-baseline),
[2.8-010](./architecture/phase-2.8-platform-decisions.md#adr-28-010--demo-depth-per-store)

**Done when:** `db:verify` passes with 4 stores; a product created in store A is
unreachable with store B's `storeId`; every store's categories resolve a spec
schema or are knowingly spec-less.

**Sequencing note.** This is **not a blocker** for identity — `Session` already
carries `storeId`. It is listed first because it is small, and because doing it
now means one migration instead of two and makes per-store isolation testable
from the identity slice onward. Skipping ahead to 3.2.4 is a legitimate call.

### ⏳ 3.2.4 — Identity & Session domain ← *next domain slice*

**Scope**
- `createCustomer` / `getCustomer` — store-scoped, `(storeId, email)` unique
- `startSession` — mints a **per-store** `anonymousId` (≥128 bits, server-side)
- `touchSession` — bumps `lastActivityAt` on server time
- `endSession` — explicit logout only
- Session-ended is **derived**, never stored: `endedAt IS NOT NULL` OR
  `now() - lastActivityAt > 30 min`
- `attachCustomerToSession` — sets `customerId` once, never overwrites
- Identity-attribution backfill — the atomic store-scoped `UPDATE` from
  ADR-2.7-009, first-claim-wins

**Authority:** [2.7-008](./architecture/phase-2.7-decisions.md#adr-27-008--session-lifecycle-server-time),
[2.7-009](./architecture/phase-2.7-decisions.md#adr-27-009--identity-attribution-concurrency),
[2.7-010](./architecture/phase-2.7-decisions.md#adr-27-010--anonymous-token-requirements),
[2.8-003](./architecture/phase-2.8-platform-decisions.md#adr-28-003--anonymous-tokens-are-per-store),
INV-1…INV-10

**Watch for**
- `anonymousId` is never an authorization credential (INV-4, ADR-2.7-010)
- Never query `anonymousId` without `storeId` (PLT-4)
- `customerId` immutability (INV-5) is application-enforced — PostgreSQL cannot
  express it without a trigger, which Phase 3 does not introduce
- "Identity attribution" ≠ "revenue attribution" — keep the words apart

**Done when:** two concurrent logins on one token attribute exactly once; a
session that was authenticated is never back-filled; sessions in store A are
untouched by a login in store B.

### ⏳ 3.2.5 — Catalog lookup services *(small; can trail 3.2.4)*

`createCategory` / `createSubcategory` / `createBrand` / list + archive.
Currently only the seed writes these rows.

**Authority:** [2.7-003](./architecture/phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership),
[2.7-005](./architecture/phase-2.7-decisions.md#adr-27-005--lookup-entity-lifecycle), PRD-17, PRD-18
**Watch for:** subcategory ∈ category (already a composite FK); RESTRICT on
delete, retire via `isActive`.

### ⏳ 3.2.6 — Event ingestion

**Scope**
- `recordEvent` with per-type Zod payload schemas for all 11 canonical types
- Trust class derived from `type`, never stored
- `receivedAt` = server UTC authority; `clientOccurredAt` untrusted
- **Client-submitted `PURCHASE` is rejected** at the boundary
- Soft dedupe on `(sessionId, clientEventId)`
- 16 KiB payload cap (already a CHECK — the service should fail first, cleanly)
- Bumps `Session.lastActivityAt`

**Authority:** [2.7-011](./architecture/phase-2.7-decisions.md#adr-27-011--event-trust-levels)–[2.7-014](./architecture/phase-2.7-decisions.md#adr-27-014--event-retention-mvp),
EV-1…EV-10
**Watch for:** `OFFER_*` requires `aiActionId`; events are immutable — no update
or delete path, ever.

### ⏳ 3.2.7 — Cart

`getActiveCart` / `addItem` / `updateQuantity` / `removeItem`.

**Authority:** [2.7-015](./architecture/phase-2.7-decisions.md#adr-27-015--cart-lifecycle--uniqueness), CO-1…CO-5
**Watch for:** authenticated customers only (no anonymous cart); one ACTIVE cart
per `(storeId, customerId)`; one row per `(cartId, productId)`; **no price
stored on CartItem**; add-to-cart reserves nothing.

### ⏳ 3.2.8 — Checkout → Order (PENDING)

Server-calculated totals from `Product`; Order created PENDING with an
idempotency key; OrderItems snapshot name, SKU, unit price, discount, line total.

**Authority:** [2.7-016](./architecture/phase-2.7-decisions.md#adr-27-016--order-lifecycle),
[2.7-017](./architecture/phase-2.7-decisions.md#adr-27-017--orderitem-historical-snapshot),
[2.7-023](./architecture/phase-2.7-decisions.md#adr-27-023--offer-fact-separation), CO-6…CO-9
**Watch for:** client totals are never trusted; Order stores **no** total —
Order Value is the sum of its lines; offer facts stay separate (proposed vs
approved vs redeemed vs line discount).

### ⏳ 3.2.9 — Payments, inventory decrement, PURCHASE

The single most correctness-sensitive slice.

**Scope**
- `PaymentAttempt` create/transition; Order 1:N attempts
- Razorpay webhook: **verify signature server-side**, then process idempotently
  on `providerEventId` / `providerPaymentId`
- **Provider calls stay outside the DB transaction**
- In one transaction: conditional decrement
  (`WHERE stockQuantity >= qty AND lifecycleStatus = 'ACTIVE'`) → Order PAID
- 0 rows affected → **abort, fail closed, do not mark PAID**
- Emit the server-side `PURCHASE` Event after commit
- Cart → CONVERTED

**Authority:** [2.7-018](./architecture/phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt),
[2.7-019](./architecture/phase-2.7-decisions.md#adr-27-019--inventory-concurrency), CO-10…CO-15
**Watch for:** duplicate webhooks must not double-decrement; the browser never
authorizes success; at most one SUCCEEDED attempt per order.
**Done when:** two concurrent buyers of the last unit produce exactly one PAID
order; replaying a webhook five times changes nothing after the first.

### ⏳ 3.2.10 — Opportunity detection

Deterministic signal → `Opportunity`. **No LLM in this step.**

**Authority:** [2.7-024](./architecture/phase-2.7-decisions.md#adr-27-024--opportunity-model)
**Watch for:** dedupe key unique among OPEN per store; 24 h default TTL; an
Opportunity may exist with no Action ever taken.

### ⏳ 3.2.11 — AI action generation

Application assembles the candidate set → model returns structured output →
application validates before anything is written.

**Authority:** [2.7-025](./architecture/phase-2.7-decisions.md#adr-27-025--ai-action-lifecycle--output-boundary),
[2.8-006](./architecture/phase-2.8-platform-decisions.md#adr-28-006--ai-action-surface-placement), AI-1…AI-11
**Watch for:** `targetProductId ∈ candidateProductIds` or reject; `surface` is
set by the **application**, never the model; store reproducibility metadata but
**never chain-of-thought**; record `observedStockQuantity` for scarcity claims;
`NO_ACTION` is a valid recorded decision.

### ⏳ 3.2.12 — Guardrail / policy engine

Deterministic evaluation → APPROVE | REJECT + reason, snapshotted.

**Authority:** [2.7-026](./architecture/phase-2.7-decisions.md#adr-27-026--guardrail--policy-model),
[2.7-027](./architecture/phase-2.7-decisions.md#adr-27-027--guardrail-frequency-concurrency),
[2.8-008](./architecture/phase-2.8-platform-decisions.md#adr-28-008--policy-absence-semantics--store-provisioning-baseline), GR-1…GR-5
**Watch for:** frequency limits enforced by the **unique ledger row**, not a
read-then-write; an absent Policy applies no constraint and the snapshot must
say *"not configured"*, not *"passed"*; rejected actions stay auditable;
re-evaluate hard constraints at EXECUTION, not just GENERATION.

### ⏳ 3.2.13 — Exposure & revenue attribution

**Authority:** [2.7-028](./architecture/phase-2.7-decisions.md#adr-27-028--attribution-model-mvp),
[2.7-022](./architecture/phase-2.7-decisions.md#adr-27-022--revenue-terminology), GR-6…GR-12
**Watch for:** exposure requires `OFFER_VIEWED` — generation is not exposure;
7-day window from exposure `receivedAt`; last-touch 100%; amount = matched
OrderItem line total; VOIDED on order cancel; **never** describe attributed
revenue as causal or incremental.

### ⏳ 3.2.14 — Audit trail

Append-only `AuditEntry` writes. Not a standalone slice — folded into 3.2.9,
3.2.11, 3.2.12 and 3.2.13 as each decision point lands.

**Authority:** [2.7-029](./architecture/phase-2.7-decisions.md#adr-27-029--audit-model)
**Watch for:** no update or delete API, ever. Audit ≠ Event.

---

## Remaining — application layer

| Phase | Scope | Notes |
|---|---|---|
| ⏳ **4** — Auth | Merchant accounts + customer accounts, session transport | Separate namespaces (INV-7). Replaces the hardcoded `lib/merchant.ts`. Store context: merchant → their store; storefront → route slug |
| ⏳ **5** — Merchant catalogue UI | Wire dashboard to the product domain; clears CFT-1…CFT-8 | First real use of the 3.2.2 services |
| ⏳ **6** — Customer storefront | `/s/[storeSlug]` — listing, PDP, cart, checkout | `storeId` from the route **only** (PLT-3) |
| ⏳ **7** — Activity tracking | Client event wiring into 3.2.6 | No mouse/hover/scroll events (EV-6) |
| ⏳ **8** — AI growth agent | Model integration behind 3.2.11 | Bounded, app-assembled context — never a full event dump |
| ⏳ **9** — AI surfaces | Render approved actions: **Cart + Checkout first, then Home** | Revalidate at render; read price from `Product`, not the action |
| ⏳ **10** — Razorpay test payments | Client integration over 3.2.9 | One platform test account; no merchant settlement |
| ⏳ **11** — Notifications | **In-app tray** for MVP | Off-channel = execution, not exposure ([2.8-007](./architecture/phase-2.8-platform-decisions.md#adr-28-007--notification-surface--off-session-exposure)) |
| ⏳ **12** — Audit + analytics UI | Merchant dashboards over indexed data | Postgres queries only — no materialized metric columns ([2.7-032](./architecture/phase-2.7-decisions.md#adr-27-032--scalability-boundaries-not-built)). Metric definitions still to be written |
| ⏳ **13** — Testing & evaluation | Isolation, concurrency, idempotency, guardrail, attribution | **No test runner installed yet** |
| ⏳ **14** — Production polish / demo | The full loop, end to end | Demo narrative must match [2.8-009](./architecture/phase-2.8-platform-decisions.md#adr-28-009--platform-boundaries-and-non-goals) non-goals |

---

## Known debt

| # | Item | Where | Clears in |
|---|---|---|---|
| ⚠️ D-1 | 2.8 schema delta not applied (`Store.slug`, `AiAction.surface`) | `prisma/schema.prisma` | 3.2.3 |
| ⚠️ D-2 | Seed is single-store, hardcoded `STORE_ID` | `prisma/seed.ts:63` | 3.2.3 |
| ⚠️ D-3 | Spec registry keyed to one store's seeded ids — a second store **cannot store specs at all** | `lib/catalog/spec-registry.ts:160` | 3.2.3 |
| ⚠️ D-4 | **CFT-1** `ProductStatus` merges lifecycle with availability | `types/index.ts:34` | Phase 5 |
| ⚠️ D-5 | **CFT-2** `LOW_STOCK_THRESHOLD = 20` hardcoded in the view | `components/products/products-view.tsx:38` | Phase 5 |
| ⚠️ D-6 | **CFT-3** money as rupee `number`, not integer paise | `types/index.ts:41`, `lib/format.ts` | Phase 5 |
| ⚠️ D-7 | **CFT-4…CFT-8** missing `storeId`, slug, three prices, lookups, images, specs on UI types | `types/index.ts` | Phase 5 |
| ⚠️ D-8 | Merchant identity hardcoded | `lib/merchant.ts:14` | Phase 4 |
| ⚠️ D-9 | Dashboard renders `[]` — not wired to the database | `app/(dashboard)/*/page.tsx` | Phase 5 |
| ⚠️ D-10 | No API routes exist | `app/` | Phase 4–6 |
| ⚠️ D-11 | No test runner, no tests | `package.json` | Phase 13 |
| ⚠️ D-12 | Analytics metric definitions undocumented | — | Before Phase 12 |

CFT items are catalogued in
[`product-catalog-model.md` §14](./architecture/product-catalog-model.md#14-conflicts-with-the-current-implementation).

---

## Definition of done (every slice)

1. Behaviour traces to a named ADR or invariant — **no invented domain rules**.
2. Zod at the boundary; PostgreSQL constraints as final authority.
3. Store isolation: `storeId` explicit, composite lookups, no cross-store read.
4. Typed domain errors — no silent fallbacks.
5. Merchant-only fields (cost, margin, contribution, rationale, confidence)
   excluded from any customer-facing projection.
6. Money is integer paise throughout.
7. `npm run lint` and `npm run db:verify` pass.
8. This file updated; [`CHANGELOG.md`](./CHANGELOG.md) entry added.

---

## Update protocol

When a slice lands: flip its ⏳ to ✅, move it to **Done** with file evidence and
the commit, clear any debt rows it resolves, and bump **Last updated**. If a
slice surfaces a domain question the architecture does not answer, **stop and
raise an ADR** — do not decide it in the service (CLAUDE.md §21).
