# Phase 2.8 — Platform & Growth Surface Decisions

**Status:** Accepted (authoritative for the multi-merchant platform extension)
**Date:** 2026-09-21
**Scope:** Extend the Phase 2 freeze so the system can host several merchants and
render AI interventions on more than one customer surface.

This document is the **single authoritative source** for every decision listed
below. It **extends** [`phase-2.7-decisions.md`](./phase-2.7-decisions.md); it
does not replace it. Where 2.8 is silent, 2.7 governs. Where an earlier document
conflicts with a decision here, that document is superseded and points here.

**No ADR-2.7-* decision is reversed by this document.** Every change below is
additive. That is the finding, not a coincidence: the composite `(storeId, id)`
foreign keys frozen in ADR-2.7-003 already made store isolation structural, so
hosting many merchants is a seed and a route, not a migration of the domain.

**Confirmed product inputs**

- Tenant resolution: path prefix `/s/[storeSlug]`.
- Catalogue unit model: pack-based (no unit of measure).
- AI surfaces: Cart and Checkout end-to-end first, then Home; notification means
  an in-app tray.
- Demo depth: one store carries the full growth loop, the rest are catalog-depth.

---

## Schema delta at a glance

The entire requirement costs **two columns, one enum and one index.** No new
tables.

| Change | Model | ADR |
|---|---|---|
| `slug String @unique` | Store | [2.8-002](#adr-28-002--store-public-identity--tenant-resolution) |
| `surface Surface` + `@@index([storeId, surface, status])` | AiAction | [2.8-006](#adr-28-006--ai-action-surface-placement) |
| `enum Surface { HOME PRODUCT_DETAIL CART CHECKOUT NOTIFICATION }` | — | [2.8-006](#adr-28-006--ai-action-surface-placement) |

Everything else in this document is a rule, a naming convention, or a non-goal.

---

## ADR-2.8-001 — Multi-Merchant Is In Scope; Multi-Store Per Merchant Is Not

**Decision.** The platform hosts **many Merchants, each owning exactly one
Store**. ADR-2.7-002 (UNIQUE on `Store.merchantId`) is **unchanged and still
correct** — it permits N merchants with one store each, and forbids only one
merchant owning several stores.

**Context.** [`phase-2-freeze-checklist.md`](./phase-2-freeze-checklist.md) and
[`phase-2.7-architecture-review.md`](./phase-2.7-architecture-review.md) §5 list
"Multi-store" as deferred. Read literally against the new requirement that looks
like a contradiction. It is not: those entries mean *multi-store per merchant*.

**Options.** Treat the requirement as a conflict and relax the UNIQUE; clarify
the wording; merge Merchant and Store.

**Chosen.** Clarify the wording. Keep the UNIQUE.

**Why.** Relaxing `Store.merchantId` UNIQUE would remove the structural
protection ADR-2.7-002 exists to provide and buy nothing the requirement asks
for. identity-model §6 already explains why Merchant and Store stay separate;
this is that decision paying out.

**Impact.** Deferred lists must read "multi-store **per merchant**". No schema
change, no code change.

**Enforcement class:** database-enforced (unchanged).

---

## ADR-2.8-002 — Store Public Identity & Tenant Resolution

**Decision.**

1. `Store` gains **`slug String @unique`** — unique **platform-wide**, not
   store-scoped.
2. The public storefront is served under the path prefix **`/s/[storeSlug]`**.
3. **`storeId` is derived from the resolved route and from nothing else.** It is
   never read from a request body, query parameter, header, or cookie.
4. Merchant dashboard requests resolve `storeId` from the authenticated
   Merchant's Store (Phase 4), never from client input.

**Context.** Nothing in Phase 2 defined how an HTTP request names a Store. With
one store that question never arose; with several it is the tenant boundary.

**Options.** Path prefix; subdomain per store; both.

**Chosen.** Path prefix.

**Why.** It works on `localhost` with no DNS or hosts-file setup, maps directly
to a Next.js dynamic segment, and gives exactly one resolution path to keep
correct. Subdomains are more realistic and would give each store its own cookie
origin for free, but two resolution paths means two sets of isolation bugs.
Moving to subdomains later reuses the same `Store.slug` and changes only the
resolver.

**Why the slug is platform-global.** It is the tenant *selector*. A selector
cannot itself be tenant-scoped without circularity. This is one of only three
platform-global identifiers in the system, alongside `Merchant.email` and the
Razorpay provider ids on `PaymentAttempt` — all correct, all deliberate.

**Impact.** Supersedes the implicit single-store assumption in
`lib/merchant.ts` and `prisma/seed.ts`.

**Implementation.** Add the column and a store-context resolver. The Product
domain services already take `storeId` as an explicit required argument and read
classification through `storeId_id` composite keys, so **no domain service
changes** — only their callers.

**Enforcement class:** database-enforced (UNIQUE) + application (resolver).

---

## ADR-2.8-003 — Anonymous Tokens Are Per-Store

**Decision.** `Session.anonymousId` is minted **per Store**. A visitor browsing
two stores on the same device holds two unrelated tokens. No query may filter on
`anonymousId` without also filtering on `storeId`.

**Context.** ADR-2.7-010 defines the token's entropy, opacity and retention but
predates the possibility of a second store sharing a browser origin. Under a
path-prefixed storefront every store shares one cookie origin, so a single
first-party cookie would silently link one person's behaviour across unrelated
merchants.

**Options.** One token per device; one token per (device, store).

**Chosen.** Per (device, store) — cookie name or path carries the store.

**Why.** Cross-merchant behavioural linkage is a privacy harm nobody asked for,
and it would leak one merchant's customer intelligence into another's AI
context. ADR-2.7-009's backfill already filters by `storeId`, so *identity*
attribution could not cross stores; this closes the *behavioural* path too.

**Impact.** Extends ADR-2.7-010. No schema change — `anonymousId` was never
globally unique and `Session` already carries `storeId`.

**Enforcement class:** application.

---

## ADR-2.8-004 — Catalogue Is Domain-Agnostic and Pack-Based

**Decision.**

1. The catalogue model is **not electronics-specific**. Wording in
   [`product-catalog-model.md`](./product-catalog-model.md) §1 and
   [`PROJECT-CONTEXT.md`](../PROJECT-CONTEXT.md) that names electronics is
   **illustrative, not normative**.
2. **One purchasable pack is one Product with one SKU.** "Tomatoes 500 g" and
   "Tomatoes 1 kg" are two Products. There is **no unit of measure, no
   price-per-unit and no fractional quantity** in the MVP.

**Context.** The platform now hosts dairy, fruit/vegetable and utensil stores
alongside electronics. Goods sold by weight or volume appear to need decimal
quantities.

**Options.** Pack-based products; `unitOfMeasure` + decimal quantity +
price-per-unit.

**Chosen.** Pack-based.

**Why.** Decimal quantity would touch `cart_items_quantity_positive`,
`order_items_quantity_positive`, every line-total calculation, the conditional
inventory decrement in the Order→PAID transaction, and would reopen the
integer-paise exactness argument that ADR-2.7-020 settled. Pack-based costs
nothing, is representable today, and is how real quick-commerce catalogues are
actually modelled. It is also the guard that keeps grocery from dragging in
delivery slots, expiry dates and batch tracking.

**Impact.** Extends catalog §1 and PRD-1..PRD-19, none of which change. Restates
that `Product.stockQuantity` counts **packs**.

**Implementation.** None. This ADR exists to prevent a change, not to cause one.

**Enforcement class:** already database-enforced (`quantity > 0` on integer
columns).

---

## ADR-2.8-005 — Spec Registry Keys Under Multi-Store

**Decision.** ADR-2.7-006 is **unchanged**: spec schemas stay keyed by
`(categoryId, subcategoryId | null)` in application Zod code. Multi-store is
handled by **provisioning each store's Category and Subcategory rows with
deterministic, store-prefixed ids** — `dairy_cat_milk`,
`utensils_cat_cookware`, `produce_cat_vegetables` — and registering a schema per
key in `lib/catalog/spec-registry.ts`.

**Context.** `validateProductSpecs` deliberately has **no fallback**: an
unregistered `(categoryId, subcategoryId)` rejects any product that supplies
specs. With ids hard-coded to one seeded store, every other store could create
products only with `specs = null`.

**Options.** Deterministic prefixed ids; a `Category.specKey` column; key by
`(storeId, categorySlug, subcategorySlug)`.

**Chosen.** Deterministic prefixed ids.

**Why.** ADR-2.7-006 already accepted the trade "adding a category is a code
change, not a migration"; this is the same trade at four stores. A `specKey`
column is cleaner in the abstract and is the right move **if** the catalogue
ever becomes merchant-self-service — catalog §8.3 and §15 already name that
trigger. Adding it now is a column and a migration bought for a problem four
hand-provisioned stores do not have.

**Impact.** No schema change, no ADR change. Constrains the seed/provisioning
convention.

**Consequence to accept knowingly.** A store whose categories have no registered
schema can only hold spec-less products, which weakens AI compatibility
reasoning for that store (ADR-2.7-025 permits only catalog-supported relations).
Provisioning must register schemas, or accept category/brand-level relations
only for that store.

**Enforcement class:** application (Zod) + seed convention.

---

## ADR-2.8-006 — AI Action Surface (Placement)

**Decision.**

1. `AiAction` gains **`surface`**, a closed enum:
   `HOME | PRODUCT_DETAIL | CART | CHECKOUT | NOTIFICATION`.
2. **The application sets `surface`, never the model.** It is not part of the
   ADR-2.7-025 structured output schema, and a model-supplied surface is
   ignored.
3. `surface` is **write-once**, fixed at generation. Re-placing an action would
   invalidate the GuardrailEvaluation snapshot taken against its original
   context.
4. Index `@@index([storeId, surface, status])` supports the render query.
5. Suggestion cards render price and availability from **`Product` at read
   time**. `AiAction.proposedOffer` is a proposal, never price truth.
6. **Execution-time revalidation (ADR-2.7-025) still applies at every render**,
   not only at approval. Multi-surface makes this more important, not less: the
   same approved action may be rendered hours apart from when it was approved.

**Context.** The requirement calls for suggestions on home, product, cart,
checkout and notification surfaces. Placement is not derivable from
`actionType`: a `CROSS_SELL` can legitimately appear on the product page, in the
cart, or at checkout.

**Options.** Derive surface from `actionType`; a `surface` column; a key inside
`proposedOffer` JSON; a `Surface` lookup table.

**Chosen.** A column with a closed enum.

**Why.** It is a genuinely new, queryable fact. JSON would hide a `WHERE` clause
in a blob. A table would add a join and no fact — the vocabulary is closed and
changes only by deploy. Keeping the decision out of the model's hands follows
GR-1/GR-2: placement is a business decision, exactly like a guardrail.

**Why no new action type.** A homepage "you might like" strip with no
Opportunity behind it is the "simple recommendation engine" this project
explicitly is not. **The homepage renders only Opportunity-backed actions**,
anchored on recent session or purchase behaviour. `AiActionType` is unchanged.

**Why no new Event type.** `OFFER_VIEWED` / `OFFER_CLICKED` / `OFFER_DISMISSED`
already reference the Action, and the migration already CHECKs that they carry
an `aiActionId`. A payload **may** echo the surface for analytics; the column
remains the source of truth and a client-supplied surface string is never
authoritative.

**Build order.** Cart and Checkout end-to-end first; Home after they are proven.
`PRODUCT_DETAIL` and `NOTIFICATION` ship in the enum so the vocabulary is stable,
and are wired later.

**Impact.** Extends ADR-2.7-025. Lifecycle, output schema and attribution are
unchanged.

**Enforcement class:** database (enum) + application (write-once, revalidation).

---

## ADR-2.8-007 — Notification Surface & Off-Session Exposure

**Decision.**

1. For the MVP, `NOTIFICATION` means an **in-app notification tray inside the
   storefront**. A Session exists, so `OFFER_VIEWED` works unchanged.
2. **`Event.sessionId` stays NOT NULL.** EV-1 and INV-6 are not weakened.
3. When off-channel delivery (email/SMS/push) arrives in Phase 11, the rule is:
   **delivery is action execution, not exposure.** Delivery records
   `AiAction → EXECUTED` plus an `AuditEntry(AI_ACTION_EXECUTED)`. **Exposure is
   recorded only** when the customer returns to the storefront and that session
   emits `OFFER_VIEWED` referencing the action.

**Context.** ADR-2.7-028 makes `OFFER_VIEWED` the precondition for revenue
attribution, and `Event` requires a Session. An email opened away from the
storefront has no Session, so naively supporting notifications would force
`sessionId` nullable.

**Options.** In-app only; nullable `sessionId`; a synthetic "notification
session"; delivery-is-execution / return-is-exposure.

**Chosen.** In-app now; delivery-is-execution as the written rule for Phase 11.

**Why.** Nulling `sessionId` breaks a structural invariant for a feature that is
deferred anyway. A synthetic Session would be a fabricated fact in a system whose
whole posture is that inferences must not disguise themselves as observations.
The delivery/exposure split is also simply more honest: an unopened email is not
an exposure, and GR-6 already says generation is not exposure.

**Impact.** Extends growth §7.6 (channels deferred) and ADR-2.7-028. No schema
change.

**Enforcement class:** database (NOT NULL, unchanged) + application.

---

## ADR-2.8-008 — Policy Absence Semantics & Store Provisioning Baseline

**Decision.**

1. **A Policy row that does not exist is a constraint that is not applied.**
   Absence is permissive.
2. **Structural rules are not policies and always apply**, regardless of Policy
   rows: store ownership, `lifecycleStatus = ACTIVE`, purchasability, sufficient
   stock, candidate-set membership, and the customer-facing projection boundary.
   These are invariants (PRD-9, PRD-11, AI-7, ADR-2.7-007), not merchant
   configuration.
3. **Store provisioning seeds a baseline policy set** — at minimum
   `MAX_DISCOUNT`, `FREQUENCY_LIMIT` and `INVENTORY_REQUIREMENT` — so no store
   operates unconstrained in practice.

**Context.** ADR-2.7-026 defines Policy rows, versions and evaluation snapshots
but never says what a store with **zero** rows means. With one hand-configured
store that never came up. With several, an unconfigured store is the normal
case, and fail-open versus fail-closed produce opposite demos.

**Options.** Absence = permissive; absence = deny; absence = hard-coded defaults
in code.

**Chosen.** Permissive, with structural rules always on and a seeded baseline.

**Why.** Fail-closed on a *policy* would mean a merchant who has configured
nothing can sell nothing via AI — which conflates "the merchant set no discount
ceiling" with "the merchant forbids discounts". Hard-coded code defaults would
create a second, invisible home for merchant constraints, which ADR-2.7-026
exists to prevent. Permissive-plus-baseline keeps Policy the only home for
merchant rules while making the default configuration safe.

**Impact.** Extends ADR-2.7-026. No schema change.

**Implementation.** Guardrail engine: no matching enabled Policy for a
constraint type → that constraint contributes no rejection, and the
GuardrailEvaluation `rules` snapshot records that the constraint was **not
configured** (not that it passed). The distinction matters for merchant trust.

**Enforcement class:** application (deterministic), recorded in the evaluation
snapshot.

---

## ADR-2.8-009 — Platform Boundaries and Non-Goals

**Decision.** The word "platform" in this project means **shared commerce and
growth infrastructure, store-scoped**. It does **not** mean:

| Not modelled | Consequence to state honestly |
|---|---|
| Platform-admin actor | Merchant and Store creation is an operational/seed action, not a product surface. ADR-2.7-007's three actors are unchanged |
| Merchant settlement, payouts, commission, Razorpay Route | One platform Razorpay **test** account. Funds do not route to merchants. No payout entity exists |
| Cross-store analytics | Every dashboard figure is scoped to the merchant's own Store |
| Cross-store customer identity | Customer stays store-scoped (`@@unique([storeId, email])`). The same human at two stores is two rows, by design |
| Store branding/theming, onboarding UI | Deferred; not required by the growth loop |
| Per-category GST rates | Prices remain GST-inclusive per ADR-2.7-021; `taxPaise` stays null. Merchant contribution stays **indicative**, never a tax-accurate P&L |
| Delivery slots, riders, serviceability, expiry/perishability | Out of scope. Quick-commerce *logistics* is not what this project demonstrates |

**Why record non-goals as an ADR.** Because "platform" and "like Blinkit" both
imply capabilities the schema cannot back. Writing them down here means the
README, the dashboard copy and the demo narrative can be checked against a list
rather than against optimism.

**Note on webhook routing.** No change is needed for multi-merchant Razorpay
handling: `PaymentAttempt.(provider, providerPaymentId)` is platform-globally
unique and the row carries `storeId`, so one webhook endpoint resolves the
correct store from the attempt it matches.

---

## ADR-2.8-010 — Demo Depth Per Store

**Decision.** **One store carries the complete growth loop; the others are
catalog-depth.**

| Store | Depth |
|---|---|
| Electronics | Full chain: events → opportunity → AI action → guardrail → exposure → order → payment → attribution → audit |
| Dairy, Fruit & Vegetable, Utensils | Merchant, Store, catalogue, customers, sessions, a small number of PAID orders |

**Context.** `prisma/seed.ts` is ~2,300 lines for one store with a complete loop.

**Why.** Four complete loops would make the seed the largest and most fragile
artefact in the project while proving nothing the first loop does not already
prove. The additional stores exist to demonstrate **tenancy and catalogue
generality** — which catalog-depth data shows completely — not to demonstrate
the loop four times.

**Implementation.** Per-store catalogue data extracted into separate modules so
the seed stays readable; every row keeps a stable id and an `upsert` so
`db seed` remains deterministic and re-runnable (CLAUDE.md §18).

---

## Platform invariants

Testable additions. Later phases must not violate these without amending this
document.

| # | Invariant |
|---|---|
| PLT-1 | Every Merchant owns exactly one Store; many Merchants may exist. `Store.merchantId` stays UNIQUE ([2.8-001](#adr-28-001--multi-merchant-is-in-scope-multi-store-per-merchant-is-not)) |
| PLT-2 | `Store.slug` is unique platform-wide and is the only public store identifier ([2.8-002](#adr-28-002--store-public-identity--tenant-resolution)) |
| PLT-3 | `storeId` is derived from the resolved route or the authenticated Merchant — never from client-supplied input ([2.8-002](#adr-28-002--store-public-identity--tenant-resolution)) |
| PLT-4 | No query filters on `anonymousId` without `storeId`; tokens are minted per Store ([2.8-003](#adr-28-003--anonymous-tokens-are-per-store)) |
| PLT-5 | One purchasable pack is one Product with one SKU; quantities are integers ([2.8-004](#adr-28-004--catalogue-is-domain-agnostic-and-pack-based)) |
| PLT-6 | `AiAction.surface` is set by the application, is write-once, and is never supplied by the model ([2.8-006](#adr-28-006--ai-action-surface-placement)) |
| PLT-7 | A rendered suggestion reads price, availability and purchasability from `Product` at read time, and revalidates hard constraints before display ([2.8-006](#adr-28-006--ai-action-surface-placement)) |
| PLT-8 | `Event.sessionId` is never null. Off-channel delivery is execution, not exposure ([2.8-007](#adr-28-007--notification-surface--off-session-exposure)) |
| PLT-9 | An absent Policy applies no constraint; structural rules apply unconditionally and the evaluation snapshot distinguishes "not configured" from "passed" ([2.8-008](#adr-28-008--policy-absence-semantics--store-provisioning-baseline)) |
| PLT-10 | AI candidate sets, event windows and policy reads are assembled with a `storeId` filter ([2.8-002](#adr-28-002--store-public-identity--tenant-resolution), ADR-2.7-007) |

---

## Store provisioning checklist

A sequence, not a lifecycle — there is deliberately no `Store.status` and no
state machine ([2.8-002](#adr-28-002--store-public-identity--tenant-resolution)).
Each step is idempotent on a stable id.

1. Create `Merchant` (platform-unique email).
2. Create `Store` with a platform-unique `slug`.
3. Create `Brand`, `Category`, `Subcategory` rows with **deterministic
   store-prefixed ids** ([2.8-005](#adr-28-005--spec-registry-keys-under-multi-store)).
4. Register spec schemas for those keys in `lib/catalog/spec-registry.ts`, or
   knowingly accept spec-less products for that store.
5. Create the baseline `Policy` set ([2.8-008](#adr-28-008--policy-absence-semantics--store-provisioning-baseline)).
6. Create `Product` rows (packs, integer paise, `sellingPricePaise <= mrpPaise`).

---

## Open items deliberately left open

| Item | Why it can wait |
|---|---|
| Analytics metric definitions (which dashboard number is computed from what) | Needed before the analytics slice, not before the storefront. ADR-2.7-032 already fixes the *method*: Postgres queries over indexed Events/Orders/AttributionRecords, never a materialized column |
| `Category.specKey` column | Trigger is merchant-self-service catalogue ([2.8-005](#adr-28-005--spec-registry-keys-under-multi-store), catalog §8.3) |
| Subdomain tenant resolution | Reuses `Store.slug`; resolver-only change ([2.8-002](#adr-28-002--store-public-identity--tenant-resolution)) |
| `Store.status` | All demo stores are live |
| Email/SMS/push channels | Phase 11, under the rule in [2.8-007](#adr-28-007--notification-surface--off-session-exposure) |

---

## Index of ADRs

| ID | Title |
|---|---|
| ADR-2.8-001 | Multi-merchant in scope; multi-store per merchant deferred |
| ADR-2.8-002 | Store public identity & tenant resolution |
| ADR-2.8-003 | Anonymous tokens are per-store |
| ADR-2.8-004 | Catalogue is domain-agnostic and pack-based |
| ADR-2.8-005 | Spec registry keys under multi-store |
| ADR-2.8-006 | AI Action surface (placement) |
| ADR-2.8-007 | Notification surface & off-session exposure |
| ADR-2.8-008 | Policy absence semantics & provisioning baseline |
| ADR-2.8-009 | Platform boundaries and non-goals |
| ADR-2.8-010 | Demo depth per store |
