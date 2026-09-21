# Product & Catalog Model

**Status:** Accepted — **partially superseded by Phase 2.7**
**Source:** [Plan 002 — Product Catalog & Inventory](../plans/plan-002-product-catalog-inventory.md)
**Builds on:** [Identity Model](./identity-model.md) (Plan 001)
**Phase:** Groundwork for Phase 2 (Product + Customer data model)
**Phase 2.7:** [`phase-2.7-decisions.md`](./phase-2.7-decisions.md) is authoritative where this document conflicts.

This document is the normative product and inventory model for The Next Gen
Store. Where the plan describes intent, this document decides. Where Phase 2.7
ADRs decide otherwise, the ADR wins.

### Phase 2.7 supersessions (catalog)

| Topic | Authoritative |
|---|---|
| Slug uniqueness / store isolation / subcategory∈category | [ADR-2.7-003](./phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership) |
| Product deletion / archival | [ADR-2.7-004](./phase-2.7-decisions.md#adr-27-004--product-deletion-is-archival) |
| Lookup lifecycle | [ADR-2.7-005](./phase-2.7-decisions.md#adr-27-005--lookup-entity-lifecycle) |
| Specs registry key | [ADR-2.7-006](./phase-2.7-decisions.md#adr-27-006--specs-registry-key--validation-ownership) |
| GST / OPEN-1 | [ADR-2.7-021](./phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed) |
| Inventory concurrency | [ADR-2.7-019](./phase-2.7-decisions.md#adr-27-019--inventory-concurrency) |
| Historical truth | [ADR-2.7-001](./phase-2.7-decisions.md#adr-27-001--historical-truth-principle) |

### Phase 2.8 supersessions (catalog)

| Topic | Authoritative |
|---|---|
| "Electronics" wording is illustrative; catalogue is domain-agnostic and **pack-based** (no unit of measure, integer quantities) | [ADR-2.8-004](./phase-2.8-platform-decisions.md#adr-28-004--catalogue-is-domain-agnostic-and-pack-based) |
| Spec registry keys across several stores | [ADR-2.8-005](./phase-2.8-platform-decisions.md#adr-28-005--spec-registry-keys-under-multi-store) |

It contains no Prisma schema, no migrations and no code changes. Conceptual
attributes are named because naming them *is* the model; §14 records where the
current implementation disagrees with what is decided here, as findings rather
than edits.

---

## 1. Product

A **Product** is an item sold through a Store. The examples throughout this
document are electronics — batteries, chargers, USB cables, pendrives, speakers,
headphones, RAM, SSDs, graphics cards — because that is the store the growth loop
is demonstrated on. They are **illustrative, not normative**: the model is
domain-agnostic and the platform also hosts dairy, fruit & vegetable and utensil
stores ([ADR-2.8-004](./phase-2.8-platform-decisions.md#adr-28-004--catalogue-is-domain-agnostic-and-pack-based)).

```text
Merchant ──1:1──> Store ──1:N──> Product
```

Every Product belongs to exactly one Store. A Product never exists globally.
This extends the store-scoping rule already established for Customers, Sessions
and Events in the Identity Model (§3) — **everything the storefront touches
names its Store directly**, which is what keeps multi-store a policy change
rather than a migration.

A Product is composed of six facets:

```text
Product
  ├── Identity          §2
  ├── Classification    §7    (Brand / Category / Subcategory)
  ├── Pricing           §4    (three stored prices)
  ├── Inventory         §5    (stock, threshold, derived availability)
  ├── Specifications    §8    (flexible, per-category)
  └── Images            §9
```

**One purchasable thing is one Product with one SKU.** There are no variants in
the MVP. "Aeris Earphones" and "Aeris Earphones Lite" are two Products, not one
product with two options.

This extends to goods normally sold by weight or volume: **one purchasable pack
is one Product**. "Tomatoes 500 g" and "Tomatoes 1 kg" are two Products, and
`stockQuantity` counts packs. There is no unit of measure, no price-per-unit and
no fractional quantity in the MVP
([ADR-2.8-004](./phase-2.8-platform-decisions.md#adr-28-004--catalogue-is-domain-agnostic-and-pack-based)).

---

## 2. Identity fields

| Field | Type | Required | Notes |
|---|---|:---:|---|
| `id` | identifier | ✅ | |
| `storeId` | reference → Store | ✅ | PRD-1 |
| `name` | text | ✅ | |
| `slug` | text | ✅ | Storefront URL; stable across renames; **unique within Store** `(storeId, slug)` — [ADR-2.7-003](./phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership) |
| `description` | long text | ✅ | |
| `sku` | text | ✅ | Unique **within a Store** — PRD-2 |
| `lifecycleStatus` | enum | ✅ | `DRAFT` \| `ACTIVE` \| `ARCHIVED` — §6 |
| `externalUrl` | url | — | Inert metadata — §10 |
| `createdAt` | timestamp | ✅ | |
| `updatedAt` | timestamp | ✅ | |

### SKU

SKU is a merchant-entered identifier, unique per Store. Deliberately **not**:

- auto-generated — merchants arrive with their own SKU conventions
- globally unique — two stores may legitimately use `CBL-001`
- parsed for meaning — no warehouse/bin/location encoding

---

## 3. Money representation

**Decision D-1 — all monetary values are integers in paise.**

₹2,500 is stored as `250000`. This applies to every amount in the system, not
just Product.

Field names carry the unit so the convention cannot be misread at a call site:

```text
mrpPaise            250000     →  ₹2,500
sellingPricePaise   232000     →  ₹2,320
costPricePaise      190000     →  ₹1,900
```

Why integers rather than floats or `NUMERIC`:

- **Exactness.** Profit and margin are computed from these figures and shown to
  a merchant. Binary floating point cannot represent ₹0.10 exactly, and the
  error compounds across aggregates. Integer paise cannot drift.
- **Boundary-safe.** Integers cross the Server → Client Component boundary as
  plain JSON. Prisma's `Decimal` does not, and would need an explicit
  conversion at every such boundary in this app.
- **Matches the payment rail.** Razorpay accepts amounts in paise (Phase 10),
  so no conversion is introduced at the point where mistakes are expensive.

Rounding happens **only at display**. Percentages are computed from paise
integers and rounded for presentation, never stored.

Currency is INR throughout. There is no `currency` field: a single-currency
system that stores a constant on every row invites the bug where the constant
is wrong. Adding one later is additive.

---

## 4. Pricing

### 4.1 Stored — three prices, three meanings

| Field | Meaning | Required |
|---|---|:---:|
| `mrpPaise` | Reference/list price. In India, MRP is the legal **maximum** retail price. | ✅ |
| `sellingPricePaise` | What the customer pays today. | ✅ |
| `costPricePaise` | What the merchant acquires the product for. | — |

`costPricePaise` is **optional**. A merchant may not know or wish to record it.
When it is absent, profit and margin are **unavailable** — not zero, and not
guessed. Surfaces must render them as unknown, the same way the dashboard
renders an unmeasured metric today (`—`), rather than reporting a fabricated
₹0 profit.

### 4.2 Derived — never stored

```text
discountAmount   = mrpPaise − sellingPricePaise
discountPercent  = discountAmount / mrpPaise × 100

profit           = sellingPricePaise − costPricePaise      (null if cost absent)
profitMargin     = profit / sellingPricePaise × 100        (null if cost absent)
```

Margin is expressed against **selling price**, per Plan 002 §4. Note this is
margin, not markup (`profit / costPrice`) — the two differ and the merchant UI
must label which it shows.

Worked example from the plan:

```text
MRP           ₹3,000    (stored, 300000)
Selling       ₹2,400    (stored, 240000)
Cost          ₹1,900    (stored, 190000)

Discount      ₹600 / 20.0%    ← derived
Profit        ₹500            ← derived
Margin        20.83%          ← derived
```

### 4.3 Constraints

- `0 ≤ sellingPricePaise ≤ mrpPaise` (PRD-4). Selling above MRP is not merely
  odd, it is unlawful, and it would make `discountAmount` negative.
- `costPricePaise ≥ 0` when present. It **may exceed** selling price — a
  loss-leader is a legitimate merchant decision. Profit is then negative and
  should be surfaced as such, not suppressed.

### 4.4 Confidentiality boundary

`costPricePaise`, `profit` and `profitMargin` are **merchant-only** (PRD-6).
They must never reach the storefront, a customer-facing API response, or the
text of any AI message sent to a customer. This is a hard boundary, not a UI
preference — the AI reasons over margin when choosing what to recommend, so the
value is present in the agent's context and must be stripped from its output.

---

## 5. Inventory

### 5.1 Stored

| Field | Type | Notes |
|---|---|---|
| `stockQuantity` | integer ≥ 0 | Units on hand |
| `lowStockThreshold` | integer ≥ 0, nullable | Falls back to `Store.defaultLowStockThreshold` |

A per-product threshold matters because "low" is category-dependent: 5 graphics
cards is low, 5 USB cables is not. The store-level default exists so a merchant
need not set it on every row.

### 5.2 Derived — availability

```text
stockQuantity == 0                        →  OUT_OF_STOCK
stockQuantity <= effectiveThreshold       →  LOW_STOCK
otherwise                                 →  IN_STOCK

effectiveThreshold = lowStockThreshold ?? store.defaultLowStockThreshold
```

**Availability is never stored** (PRD-8). Storing it alongside `stockQuantity`
would be two representations of one fact, and they would eventually disagree —
which is exactly the contradictory state Plan 002 §5 forbids, and exactly what
the current implementation does (§14, CFT-1).

### 5.3 Purchasability

```text
isPurchasable = lifecycleStatus == ACTIVE AND stockQuantity > 0
```

Enforced **server-side at the commerce operation**, mirroring the Identity
Model's INV-10 treatment of the login boundary. A hidden button is not a
control.

---

## 6. Lifecycle vs availability

These are two different questions and must not share a field:

| | Question | Kind | Values |
|---|---|---|---|
| **Lifecycle** | Does the merchant intend to sell this? | Stored intent | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| **Availability** | Can it be bought right now? | Derived fact | `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` |

- `DRAFT` — being prepared; invisible to customers.
- `ACTIVE` — published to the storefront.
- `ARCHIVED` — withdrawn from sale, record retained. Once orders exist, a
  Product referenced by an order is **never hard-deleted**; archiving is the
  withdrawal mechanism (PRD-16).

**Storefront visibility** = `lifecycleStatus == ACTIVE`. An out-of-stock
product stays *visible* but not *purchasable*. This is deliberate: it is what
lets the storefront say "out of stock — here is an equivalent in stock today",
which is the substitution behaviour the growth agent exists to perform.

---

## 7. Classification

**Decision D-3 — Brand, Category and Subcategory are lookup entities, not
strings.**

```text
Store ──1:N──> Brand
Store ──1:N──> Category ──1:N──> Subcategory
                                      ↑
Product ──> brandId (nullable) ───────┤
        ──> categoryId (required) ────┤
        ──> subcategoryId (nullable) ─┘
```

| Entity | Fields | Scope |
|---|---|---|
| `Brand` | `id`, `storeId`, `name`, `slug` | Store |
| `Category` | `id`, `storeId`, `name`, `slug`, `position` | Store |
| `Subcategory` | `id`, `categoryId`, `name`, `slug`, `position` | Category |

- **Exactly two levels.** No arbitrary nesting (Plan 002 §10).
- `brandId` is nullable — generic USB cables have no meaningful brand.
- `subcategoryId` is nullable — not every category needs subdividing.
- Brand is store-scoped for consistency with every other catalog entity. A
  shared brand registry across stores is a post-MVP concern.

The reason this is not free text: the growth agent's core moves — substitution,
cross-sell, upsell — are all *"find another product related to this one"*
queries. "Same subcategory, different brand, in stock, similar price" is a join.
Against free text it is a string comparison that silently fails the moment
someone types `audio` instead of `Audio`, and the failure is invisible: filter
facets fragment and the AI simply stops finding valid alternatives.

---

## 8. Flexible specifications

**Decision D-2 — a single JSONB `specs` column, validated at write time against
a per-category schema registry defined in application code.**

### 8.1 Shape

`specs` is a **flat** object. Values are primitives only — `string`, `number`
or `boolean` (PRD-12). No nested objects, no arrays in the MVP: flatness is
what keeps filtering and indexing tractable.

```text
Headphones          Solid-State Drive        Graphics Card
──────────          ─────────────────        ─────────────
type: "Over-ear"    capacityGb: 1000         memoryGb: 12
noiseCancel: true   interface: "NVMe"        memoryType: "GDDR6"
batteryHours: 30    formFactor: "M.2"        interface: "PCIe"
```

### 8.2 Units are encoded in the key, not the value

`batteryHours: 30`, never `batteryLife: "30 hours"`.

A numeric spec stores the **magnitude in the canonical unit named by its key**.
This is what makes range queries possible — *"noise-cancelling headphones over
20 hours battery"* is a numeric comparison, and a string like `"30 hours"` can
only be matched exactly. It also removes the ambiguity of `capacity: 1` (1 TB?
1 GB?).

### 8.3 The registry

Each schema is keyed by **`(categoryId, subcategoryId | null)`** in app code
(Zod), e.g. `lib/catalog/spec-registry.ts`
([ADR-2.7-006](./phase-2.7-decisions.md#adr-27-006--specs-registry-key--validation-ownership)).
When subcategory is null, the category-level schema applies. One definition
drives four things:

1. Which fields the merchant product form renders
2. Write-time validation — unknown keys are **rejected**, so the registry stays
   meaningful rather than decorative
3. Filter facets on the storefront
4. A machine-readable description of what a spec *means*, for the agent

Adding a category is a code change, not a migration. That is the trade this
buys: no `ALTER TABLE` per category, at the cost of a deploy per category. For
a single-merchant MVP that is the right side of the trade; if the catalogue
ever becomes merchant-self-service, moving definitions into their own table is
an additive change (see §15).

### 8.4 Queryability

A GIN index on `specs` supports containment queries. This is a genuine
relational capability, not a JSON blob the database cannot see into — which is
what separates this from stuffing a serialized string in a text column.

EAV was rejected: one row per attribute makes every product read a join fan-out,
is weakly typed in practice anyway, and is the "unnecessarily complicated
attribute framework" Plan 002 §7 warns against.

---

## 9. Images

A separate `ProductImage` relation, not a JSON array:

| Field | Notes |
|---|---|
| `id` | |
| `productId` | |
| `url` | Opaque; hosting is out of scope |
| `altText` | Required — accessibility is not optional |
| `position` | Integer, unique per product |

**The primary image is the one with the lowest `position`** (PRD-14). There is
no `isPrimary` flag, because a flag admits two contradictory states — zero
primaries, or two — and this model's whole posture is to make contradictory
states unrepresentable.

A relation rather than JSON because, unlike specs, image structure does **not**
vary by category, and ordering plus future per-image metadata (Cloudinary
`public_id`, transformations) are relational facts.

---

## 10. External product URL

`externalUrl` is optional, inert metadata (PRD-15).

- The Product is fully functional without it.
- **No commerce, pricing, inventory or AI behaviour may depend on it.**
- It is excluded from the agent's decision inputs. The agent must not reason
  about a competitor's page it cannot read, and must never present an external
  price it cannot verify.

No integrations with Amazon, Flipkart or Blinkit. No scraping. The field is a
link a merchant chose to record, nothing more.

---

## 11. Stored vs derived

The governing rule: **one fact, one home.** A value is stored only if it cannot
be reliably computed, or if history requires it.

| Stored | Derived (computed on read) |
|---|---|
| `name`, `slug`, `description`, `sku` | `discountAmount`, `discountPercent` |
| `brandId`, `categoryId`, `subcategoryId` | `profit`, `profitMargin` |
| `mrpPaise`, `sellingPricePaise`, `costPricePaise` | `availability` |
| `stockQuantity`, `lowStockThreshold` | `isPurchasable`, storefront visibility |
| `lifecycleStatus` | primary image |
| `specs`, images, `externalUrl` | sales velocity, demand, conversion rate |
| `createdAt`, `updatedAt` | inventory turnover, revenue, AI-attributed revenue |

### Product intelligence stays derived

Total sales, demand score, sales velocity, days since last sale, conversion
rate, inventory turnover, popularity and attributed revenue are **not** Product
fields. They are computed from data that does not exist yet:

```text
Orders + Order Items   →  sales velocity  →  demand
Events + Orders        →  product conversion rate
Inventory + Sales      →  inventory turnover
```

Formulas are defined in later phases, once Orders (Phase 6) and Events
(Phase 7) exist. Caching these later is a performance decision, and a cache
must be explicitly derived and invalidated — never a column the merchant can
edit.

---

## 12. Inventory and the AI

Inventory is a legitimate and valuable signal: recommend products with healthy
stock, promote excess inventory, avoid recommending what cannot be bought, and
communicate genuine scarcity.

### The scarcity constraint, made testable

Plan 002 §6 states the AI must never manufacture scarcity. Stated so it can be
checked:

1. A scarcity claim may only be made when `availability == LOW_STOCK` — and
   "low" is the **merchant's** configured threshold, not the agent's judgement.
2. If the agent states a unit count, it must equal `stockQuantity` as observed
   at generation time.
3. **The observed `stockQuantity` is recorded on the resulting AI action and
   audit entry.** The claim is then auditable after the fact, even though stock
   has since moved.
4. The agent must never recommend a Product where `isPurchasable` is false
   (PRD-11).

Point 3 is the Identity Model's audit principle (§5.1) applied to inventory:
the record must preserve **what was true at the time**, so a later reader can
tell a genuine low-stock message from a fabricated one. Without the observed
figure stored alongside the claim, "only 7 left" is unfalsifiable a week later.

---

## 13. Invariants

| # | Invariant |
|---|---|
| PRD-1 | Every Product belongs to exactly one Store. A Product never exists without Store ownership. |
| PRD-2 | `sku` is unique within a Store, not globally. |
| PRD-3 | All monetary values are integers in paise. No floating-point money anywhere in the system. |
| PRD-4 | `0 ≤ sellingPricePaise ≤ mrpPaise`. |
| PRD-5 | `costPricePaise` is optional. When absent, profit and margin are unavailable — never zero, never estimated. |
| PRD-6 | Cost price, profit and margin are merchant-only, and must never appear on a customer-facing surface or in AI output sent to a customer. |
| PRD-7 | `stockQuantity ≥ 0`. |
| PRD-8 | Availability is always derived from stock and threshold. It is never stored. |
| PRD-9 | A Product is purchasable iff `lifecycleStatus == ACTIVE` and `stockQuantity > 0`, verified server-side at the commerce operation. |
| PRD-10 | Any AI scarcity claim matches `stockQuantity` observed at generation time, and that observed value is recorded with the action. |
| PRD-11 | The AI never recommends a Product that is not purchasable. |
| PRD-12 | `specs` values are primitives only. Numeric specs store magnitude in the canonical unit named by the key. |
| PRD-13 | `specs` keys are validated against the registered schema for the product's category at write time; unknown keys are rejected. |
| PRD-14 | The primary image is the image with the lowest `position`. Primary is never a stored flag. |
| PRD-15 | `externalUrl` is inert. No commerce, pricing or AI behaviour depends on it. |
| PRD-16 | A Product referenced by an Order, Event, AI Action, Opportunity, or Cart is never hard-deleted. `ARCHIVED` is the withdrawal state. Unreferenced `DRAFT` may be hard-deleted. ([ADR-2.7-004](./phase-2.7-decisions.md#adr-27-004--product-deletion-is-archival)) |
| PRD-17 | `(storeId, slug)` is unique for Product. Brand/Category/Subcategory slugs are unique within their store (and subcategory within category). ([ADR-2.7-003](./phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership)) |
| PRD-18 | If `subcategoryId` is set, it must belong to `categoryId` (same Store). ([ADR-2.7-003](./phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership)) |
| PRD-19 | MRP and selling prices are GST-inclusive; cost is GST-exclusive. Merchant profit/margin is **indicative contribution**, not accounting profit. ([ADR-2.7-021](./phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed)) |

---

## 14. Conflicts with the current implementation

Found by reviewing `types/index.ts`, `lib/labels.ts`, `lib/placeholder-data.ts`
and `components/products/products-view.tsx`.

**Nothing here has been changed.** These are recorded corrections, to be applied
in the phase named. Two are genuine contradictions with the accepted model; the
rest are gaps.

| # | Where | Kind | Finding | Resolution |
|---|---|---|---|---|
| CFT-1 | `types/index.ts:35`, `lib/labels.ts:49` | **Contradiction** | `ProductStatus = "active" \| "draft" \| "out_of_stock"` merges merchant lifecycle with stock availability, and stores `out_of_stock` alongside `stock` — two homes for one fact. Nothing prevents `{ stock: 5, status: "out_of_stock" }`. | Split into stored `lifecycleStatus` (§6) and derived `availability` (§5.2). |
| CFT-2 | `components/products/products-view.tsx:40` | **Contradiction** | `LOW_STOCK_THRESHOLD = 20` is a single hard-coded constant in the presentation layer, applied to every product. | Per-product `lowStockThreshold` with store default; availability computed in the domain layer, not the view. |
| CFT-3 | `types/index.ts`, `lib/format.ts`, all demo data | **Contradiction** | Money is plain JS `number` in whole rupees. Conflicts with D-1, and cannot represent paise at all. | Convert to integer paise. **Scope is system-wide**, not just Product — it also covers `Customer.lifetimeValue`, `Opportunity.expectedRevenueImpact`, `AgentAction.revenueGenerated` and `AuditLogEntry.amount`. |
| CFT-4 | `types/index.ts:42` | Gap | Single `price` field. | Three fields: `mrpPaise`, `sellingPricePaise`, `costPricePaise`. Enables the discount and margin the dashboard already talks about. |
| CFT-5 | `types/index.ts:37` | Gap | No `storeId`. Violates PRD-1. | Add `storeId`. |
| CFT-6 | `types/index.ts:41` | Gap | `category` is free text (`"Audio"`, `"Wearables"`); no brand, no subcategory. | Lookup entities per §7. |
| CFT-7 | `types/index.ts:37-45` | Gap | Missing `slug`, `description`, `images`, `specs`, `externalUrl`, `createdAt`, `updatedAt`. | Add per §2. |
| CFT-8 | `types/index.ts:40` | Gap | SKU uniqueness is unexpressed. | Unique constraint on `(storeId, sku)`; validated at write. |

### Assessment

None of this blocks anything. The UI was built to render whatever it is handed,
and Plan 001's boundary holds: pages pass data as props, so these are changes to
types and the data-access layer, not to components.

Two notes on sequencing:

- **CFT-3 is the widest change** and the one most worth doing early — every
  further money-handling feature written before it is another site to convert
  afterwards.
- **CFT-1 is the one that can silently produce wrong output.** The other gaps
  are absences you notice; a product marked `active` with zero stock is a
  product the agent may recommend and a customer cannot buy.

---

## 15. Deferred

| Deferred | Where it goes |
|---|---|
| Prisma schema, migrations, PostgreSQL setup | Phase 3 |
| Product variants | Only if a requirement demands them |
| Price history / historical pricing | Separate pricing-history concept when needed (Plan 002 §4) — never by overwriting current values |
| Dynamic pricing, AI pricing engine, AI-set discounts | Explicitly deferred (Plan 002 §12). The AI must not change base selling price; future actions propose **bounded** offers under merchant rules. |
| Derived intelligence formulas (velocity, demand, turnover, conversion) | Phases 6–7, once Orders and Events exist |
| Image hosting / Cloudinary | Phase 5+ |
| Spec definitions stored in DB rather than code | Revisit if the catalogue becomes merchant-self-service (§8.3) |
| Multi-warehouse, suppliers, purchase orders, advanced SKU management | Post-MVP |
| Multi-currency | Post-MVP; additive |
| Global (cross-store) brand registry | Post-MVP |

### OPEN-1: tax treatment — **CLOSED by Phase 2.7**

~~Prior open question about GST inclusivity.~~

**Resolved** by [ADR-2.7-021](./phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed):

- `mrpPaise` and `sellingPricePaise` are **GST-inclusive**.
- `costPricePaise` is **GST-exclusive** (as recorded by the merchant).
- Merchant-facing profit/margin = selling − cost when cost is present, labeled
  **indicative contribution** — not accounting / net profit.
- OrderItem line totals are GST-inclusive; optional `taxPaise` breakdown when known.

---

## 16. Traceability

Plan 002 §17 completion criteria:

| Criterion | Section |
|---|---|
| Product clearly defined | §1 |
| Product → Store ownership defined | §1, PRD-1 |
| Required product fields finalized | §2, §4.1, §5.1 |
| Pricing sources of truth finalized | §3, §4, §11 |
| Inventory model finalized | §5, §6 |
| SKU decision finalized | §2, PRD-2 |
| Brand/category/subcategory structure finalized | §7 |
| Flexible specifications approach decided | §8 |
| External URL confirmed as optional metadata | §10, PRD-15 |
| Stored vs derived clearly separated | §11 |
| Dynamic pricing explicitly deferred | §15 |
| AI-relevant product data requirements documented | §12 |
| No premature database implementation | Whole document — §15 defers it to Phase 3 |
