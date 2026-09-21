# The Next Gen Store — Phase 2 Architecture

**Project:** The Next Gen Store  
**Repository:** `ai-merchant-growth`  
**Track:** Razorpay Track 01 — AI Growth & Agentic Commerce  
**Phase 2.7:** [`phase-2.7-decisions.md`](./phase-2.7-decisions.md) is authoritative where this rollup conflicts.

> **Status:** Phases 2.1–2.4 content below remains useful summary, but **Phase 2.7
> supersedes** contradictions on GST, cart lifecycle, PaymentAttempt cardinality,
> inventory concurrency, event trust/timestamps, and Order confirmation ordering.
> See the supersession table at the end of this header.

### Phase 2.7 supersessions (events + commerce)

| Topic | Authoritative ADR |
|---|---|
| Event trust / PURCHASE authority | [011](./phase-2.7-decisions.md#adr-27-011--event-trust-levels) |
| Event timestamps / indexes / retention | [012](./phase-2.7-decisions.md#adr-27-012--event-timestamps--ordering)–[014](./phase-2.7-decisions.md#adr-27-014--event-retention-mvp) |
| Cart lifecycle & uniqueness | [015](./phase-2.7-decisions.md#adr-27-015--cart-lifecycle--uniqueness) |
| Order lifecycle | [016](./phase-2.7-decisions.md#adr-27-016--order-lifecycle) |
| OrderItem snapshots | [017](./phase-2.7-decisions.md#adr-27-017--orderitem-historical-snapshot) |
| PaymentAttempt 1:N | [018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt) |
| Inventory concurrency | [019](./phase-2.7-decisions.md#adr-27-019--inventory-concurrency) |
| GST / financial terms | [021](./phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed), [022](./phase-2.7-decisions.md#adr-27-022--revenue-terminology) |

### Phase 2.8 supersessions (events + commerce)

| Topic | Authoritative ADR |
|---|---|
| `Event.sessionId` stays NOT NULL; off-channel delivery is execution, not exposure | [2.8-007](./phase-2.8-platform-decisions.md#adr-28-007--notification-surface--off-session-exposure) |
| `OFFER_*` events gain no new types for extra surfaces; `AiAction.surface` is the source of truth for placement | [2.8-006](./phase-2.8-platform-decisions.md#adr-28-006--ai-action-surface-placement) |
| Cart/Order quantities stay integer — one purchasable pack is one Product | [2.8-004](./phase-2.8-platform-decisions.md#adr-28-004--catalogue-is-domain-agnostic-and-pack-based) |

## 1. Project Objective

Build an AI-powered merchant growth system that helps merchants increase revenue and makes their store more sellable to AI-driven buyers.

The intended system flow is:

```text
Customer Activity
      ↓
AI detects Revenue Opportunity
      ↓
AI reasons about possible actions
      ↓
Merchant Rules / Limits
      ↓
Action Executes
      ↓
Customer Response
      ↓
Payment / Order
      ↓
Revenue Impact
      ↓
Audit Trail
```

The system is **not** intended to be only a chatbot or a generic recommendation engine.

The project is being developed systematically in production-style phases. Phase 2 is architecture and domain modeling; PostgreSQL/Prisma implementation comes later.

---

# 2. Phase 2 Roadmap

| Phase | Area | Status |
|---|---|---|
| 2.1 | Merchant, Store & Customer Identity | ✅ Finalized (superseded in part by 2.7) |
| 2.2 | Product Catalog & Inventory | ✅ Finalized (superseded in part by 2.7) |
| 2.3 | Event & Customer Activity Tracking | ✅ Finalized (superseded in part by 2.7) |
| 2.4 | Cart, Checkout, Order & Payment | ✅ Finalized (superseded in part by 2.7) |
| 2.5 | AI Growth System | ✅ Finalized (superseded in part by 2.7) |
| 2.6 | Guardrails, Audit & Revenue Attribution | ✅ Finalized (superseded in part by 2.7) |
| 2.7 | Architecture Review & Freeze | ✅ Complete — [review](./phase-2.7-architecture-review.md) · [ADRs](./phase-2.7-decisions.md) |

**READY FOR PHASE 3** (PostgreSQL + Prisma). See [freeze checklist](./phase-2-freeze-checklist.md).

~~Prior roadmap showed 2.5–2.7 as Next while growth docs were already written — corrected.~~

---

# 3. Phase 2.1 — Merchant, Store & Customer Identity

## 3.1 Merchant

Merchant is the business owner/operator using the merchant dashboard.

## 3.2 Store

Store is the customer-facing commerce environment.

MVP relationship:

```text
Merchant 1 ─── 1 Store
```

Merchant and Store remain separate domain concepts even though MVP is one-to-one.

## 3.3 Customer

Customer is a person shopping/interacting with a Store.

Customer records are Store-scoped.

## 3.4 Anonymous Visitor

An anonymous visitor is **not an entity**.

Anonymous identity is represented through the Session.

## 3.5 Session

A Session represents a continuous interaction period.

Rules:

- Session belongs to exactly one Store.
- Session owns Events.
- Session has required `anonymousId`.
- Session has nullable `customerId`.
- Session ends after 30 minutes of inactivity or explicit logout.
- Login does not end the current Session.
- Once `customerId` is set, it is immutable.
- A different login identity requires a new Session.

## 3.6 Authentication Rules

Anonymous users may:

- Browse
- Search
- View products
- Generate behavioral events
- Receive eligible AI interventions

Authentication is required for:

- Add to cart
- Checkout
- Purchase
- Order history

There is no anonymous cart in MVP.

Merchant and customer identities are separate namespaces.

## 3.7 Anonymous → Authenticated Attribution

On login:

```text
Current Session.customerId = Customer
```

Previous anonymous sessions may be attributed when:

- Same `anonymousId`
- Within 30 days
- Never authenticated
- Not already attributed

They receive:

```text
attributedCustomerId = Customer
```

Events are never rewritten, moved, or deleted.

Meaning:

- `customerId` = contemporaneous authentication truth
- `attributedCustomerId` = later attribution inference

---

# 4. Phase 2.2 — Product Catalog & Inventory

## 4.1 Product Principle

One purchasable thing = one Product + one SKU.

Variants are deferred from MVP.

Product belongs to exactly one Store.

## 4.2 Product Facets

Product consists conceptually of:

1. Identity
2. Classification
3. Pricing
4. Inventory
5. Specifications
6. Images

## 4.3 Product Identity

Conceptual fields:

- `id`
- `storeId`
- `name`
- `slug`
- `description`
- `sku`
- `lifecycleStatus`
- optional `externalUrl`
- `createdAt`
- `updatedAt`

SKU is unique within a Store.

## 4.4 Lifecycle

Stored lifecycle:

```text
DRAFT
ACTIVE
ARCHIVED
```

Lifecycle is merchant intent.

Availability is derived.

A product may be:

```text
ACTIVE + OUT_OF_STOCK
```

and remain visible so it can be used for substitution.

## 4.5 Money

All monetary values are integer paise.

Example:

```text
₹2,500 → 250000
```

Product pricing:

- `mrpPaise`
- `sellingPricePaise`
- optional `costPricePaise`

Constraints:

```text
0 <= sellingPricePaise <= mrpPaise
costPricePaise >= 0 when present
```

Cost may exceed selling price.

Derived values:

- Discount amount
- Discount percentage
- Profit
- Profit margin

Do not duplicate derived values unless later architecture proves a specific need.

## 4.6 Cost Confidentiality

Cost, profit and margin are merchant-only.

They must never reach customer-facing APIs, UI, or messages.

AI may use these values internally but must not expose them.

## 4.7 Inventory

Stored:

- `stockQuantity`
- optional `lowStockThreshold`

If product threshold is null:

```text
Store.defaultLowStockThreshold
```

Derived availability:

```text
stock = 0                  → OUT_OF_STOCK
stock <= effectiveThreshold → LOW_STOCK
otherwise                   → IN_STOCK
```

Availability is never stored separately.

Purchasable iff:

```text
lifecycleStatus = ACTIVE
AND
stockQuantity > 0
```

This must be enforced server-side.

## 4.8 Inventory + AI

AI may use genuine inventory signals.

Allowed:

- Promote healthy/excess inventory
- Suggest substitutes for unavailable products
- Communicate genuine scarcity

Forbidden:

- Manufactured scarcity
- Invented stock quantities
- Recommending non-purchasable products

If AI communicates a stock count, it must equal the observed stock at generation time.

## 4.9 Classification

Classification uses Store-scoped lookup entities:

- Brand
- Category
- Subcategory

Category hierarchy is limited to two levels.

Product:

- `brandId` nullable
- `categoryId` required
- `subcategoryId` nullable

## 4.10 Flexible Specifications

Product has flexible JSON-style `specs`.

Rules:

- Flat object
- Primitive values only
- String, number, boolean
- No nested objects
- No arrays
- Canonical units encoded in keys where appropriate

Example:

```json
{
  "capacityGb": 1000,
  "batteryHours": 30,
  "voltage": 5
}
```

A category-specific Zod schema registry in application code should drive:

- Product form fields
- Write validation
- Storefront filters
- Machine-readable AI semantics

Unknown keys are rejected.

EAV is intentionally not used.

## 4.11 Images

Separate `ProductImage` relation:

- `id`
- `productId`
- `url`
- `altText`
- `position`

Primary image is the lowest position.

No `isPrimary` flag.

Cloudinary integration is deferred.

## 4.12 External URL

Optional `externalUrl`.

It is inert metadata only.

No marketplace integrations, scraping, external pricing, inventory, or AI dependency.

## 4.13 Derived Product Intelligence

Do not store these as Product fields:

- Total sales
- Demand score
- Sales velocity
- Days since last sale
- Conversion rate
- Inventory turnover
- Popularity
- AI-attributed revenue

These will later be derived from Events, Orders and AI Actions.

## 4.14 Deferred Product Scope

- Product variants
- Dynamic pricing
- Price history
- Cloudinary
- Warehouses
- Suppliers
- Multi-currency
- Global brand registry
- Marketplace integrations

## 4.15 Financial Decision (GST) — CLOSED

~~GST treatment was previously open.~~

**Resolved** by [ADR-2.7-021](./phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed):

- MRP and selling price are GST-inclusive; cost is GST-exclusive.
- `sellingPrice - costPrice` is **indicative contribution**, not accounting profit.
- Revenue terminology: [ADR-2.7-022](./phase-2.7-decisions.md#adr-27-022--revenue-terminology).

---

# 5. Phase 2.3 — Event & Customer Activity Tracking

## 5.1 Purpose

The event system is the behavioral foundation of the AI Growth engine.

It answers:

> What did the customer actually do?

The system should track meaningful business behavior rather than every browser interaction.

## 5.2 Event Ownership

Every Event belongs to exactly one Session.

```text
Merchant
   ↓
Store
   ↓
Session
   ↓
Event
```

Store ownership is inherited through Session.

## 5.3 Event Immutability

Events are historical facts.

Once created:

- Do not edit.
- Do not move between Sessions.
- Do not delete because a customer later logs in.
- Do not rewrite anonymous events as authenticated events.

Identity attribution happens at Session level.

**Phase 2.7 trust levels** ([ADR-2.7-011](./phase-2.7-decisions.md#adr-27-011--event-trust-levels)):

- `CLIENT_TELEMETRY` — validated browser events (SEARCH, PRODUCT_VIEW, OFFER_*, …)
- `SERVER_BUSINESS` — server-emitted outcomes; **PURCHASE** only after Order `PAID`

Timestamps: `receivedAt` (server, authoritative) + optional `clientOccurredAt`
([ADR-2.7-012](./phase-2.7-decisions.md#adr-27-012--event-timestamps--ordering)).
Indexes / retention: [ADR-2.7-013](./phase-2.7-decisions.md#adr-27-013--event-indexes-mvp)–[014](./phase-2.7-decisions.md#adr-27-014--event-retention-mvp).

## 5.4 Canonical MVP Events

### Discovery / Intent

```text
SEARCH
PRODUCT_VIEW
PRODUCT_CLICK
```

### Cart

```text
ADD_TO_CART
REMOVE_FROM_CART
CART_VIEW
```

### Checkout

```text
CHECKOUT_STARTED
```

### AI / Intervention Interaction

```text
OFFER_VIEWED
OFFER_CLICKED
OFFER_DISMISSED
```

### Commerce Outcome

```text
PURCHASE
```

Do not add generic events such as mouse movement, hover, scroll, page-load, or arbitrary UI clicks unless a later product requirement proves they are useful.

## 5.5 Event Semantics

### SEARCH

Captures meaningful search information such as:

- Query
- Result count

### PRODUCT_VIEW

Captures:

- `productId`

### PRODUCT_CLICK

Captures:

- `productId`
- source/context

Possible contexts:

- Search results
- Category
- AI Action
- Related products

This allows the system to distinguish independently discovered products from AI-driven interactions.

### ADD_TO_CART

Captures:

- `cartId`
- `productId`
- quantity
- price observed at the time

Cart remains authoritative for current state.

### REMOVE_FROM_CART

Captures:

- `cartId`
- `productId`
- quantity removed

### CART_VIEW

Captures:

- `cartId`
- useful cart context/snapshot where justified

Do not store full cart JSON unnecessarily.

### CHECKOUT_STARTED

Captures:

- `cartId`
- relevant checkout/order reference
- cart value snapshot where needed

### OFFER_VIEWED

Means the customer actually saw an AI intervention.

References the relevant AI Action.

### OFFER_CLICKED

Means the customer interacted with the intervention.

References the relevant AI Action.

### OFFER_DISMISSED

Means the customer explicitly rejected/dismissed the intervention.

References the relevant AI Action.

### PURCHASE

Represents a confirmed successful commerce outcome.

It must not be generated merely because the user clicked a payment button.

Purchase information is authoritative in Order/Payment.

## 5.6 Event vs Domain State

Event:

> Something happened.

Example:

```text
ADD_TO_CART
```

Domain state:

> What is true now?

Example:

```text
Cart currently contains:
SSD × 1
RAM × 2
```

Therefore:

- Cart is authoritative for current cart state.
- Order is authoritative for purchase history.
- Payment is authoritative for payment state.
- Events are behavioral history.

## 5.7 Event Structure

Architecturally use a common envelope with event-specific payload.

Conceptually:

```text
Event
├── id
├── sessionId
├── type
├── occurredAt
├── metadata/context
└── payload
```

Common fields:

- Event ID
- Session ID
- Event type
- Occurrence timestamp

Event-specific payload contains only relevant data.

Do not create one giant universal payload.

## 5.8 Event Timestamp

`occurredAt` represents when the action happened.

It is important for:

- Session logic
- Behavioral sequences
- Attribution
- AI recency
- Analytics

## 5.9 Duplicate Handling

MVP does not need a distributed event infrastructure.

However:

- Important commerce operations require strong idempotency.
- Analytics events may use client-generated event/request IDs where useful.
- Business outcomes must not be duplicated by client retries.

## 5.10 Event Metadata

Useful contextual metadata may include:

- Source/surface
- Referrer/context
- Relevant device/session context

Do not turn the event system into a fingerprinting/surveillance system.

## 5.11 Retention

Events are append-only historical data.

PostgreSQL is the initial source of truth.

A separate warehouse/event pipeline is deferred until scale justifies it.

## 5.12 Event Invariants

**EV-1** Every Event belongs to exactly one Session.

**EV-2** Events are immutable.

**EV-3** Events are never moved between Sessions.

**EV-4** Anonymous events are allowed.

**EV-5** Authentication does not rewrite historical events.

**EV-6** Event taxonomy remains intentionally limited.

**EV-7** Domain entities remain authoritative for current state.

**EV-8** AI Actions and customer Events are separate concepts.

**EV-9** Purchase represents confirmed commerce.

**EV-10** Event payload contains only data relevant to the event.

---

# 6. Phase 2.4 — Cart, Checkout, Order & Payment

## 6.1 Purpose

Phase 2.4 turns customer intent into actual commerce and creates the authoritative financial records needed for revenue attribution.

## 6.2 Cart

A Cart belongs to an authenticated Customer and a Store.

```text
Customer
   ↓
Cart
   ↓
CartItem
```

MVP does not support anonymous carts.

**Phase 2.7** ([ADR-2.7-015](./phase-2.7-decisions.md#adr-27-015--cart-lifecycle--uniqueness)):

- States: `ACTIVE | CONVERTED | ABANDONED | EXPIRED`
- Exactly one **ACTIVE** cart per `(storeId, customerId)` (partial unique)
- One CartItem row per `(cartId, productId)`
- Cart prices are not historical financial truth

~~Prior: “Exact persistence representation will be decided during schema implementation” for active-cart — superseded.~~

## 6.3 CartItem

Represents:

> Product X × quantity Y currently in the cart.

References Product.

Current Product state is authoritative for product information.

Cart is not permanent financial history.

## 6.4 Cart Rules

Server-side:

- Customer must be authenticated.
- Product must belong to the same Store.
- Product must be ACTIVE.
- Product must be purchasable.
- Quantity must be valid.
- Inventory must be revalidated before checkout.
- Client-provided prices are never trusted.

## 6.5 Inventory Reservation

MVP does not implement a sophisticated reservation system.

Expected behavior:

```text
Add to Cart
    ↓
No permanent inventory reservation

Checkout
    ↓
Revalidate inventory

Order / Purchase
    ↓
Validate again as required
```

This avoids locking inventory for abandoned carts.

## 6.6 Checkout

Checkout transitions:

```text
Cart
 ↓
Purchase attempt
```

At checkout the server must:

- Validate customer
- Validate product/store ownership
- Validate lifecycle
- Validate inventory
- Calculate authoritative totals
- Apply permitted offers/discounts
- Start payment flow

Frontend totals are never authoritative.

## 6.7 Order

Order is the historical commercial record.

Order belongs to:

- Store
- Customer

Order contains OrderItems and **PaymentAttempts** (1:N).

```text
Order
 ├── OrderItem
 ├── OrderItem
 └── PaymentAttempt (1:N)
```

**Phase 2.7** ([ADR-2.7-016](./phase-2.7-decisions.md#adr-27-016--order-lifecycle)): states `PENDING | PAID | CANCELLED`.
Order is created **PENDING** at checkout start; becomes **PAID** only after verified payment success and inventory decrement.

~~Prior nested singular `Payment` under Order — superseded by PaymentAttempt ([ADR-2.7-018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt)).~~

## 6.8 OrderItem Snapshot

OrderItems preserve purchase-time commercial facts ([ADR-2.7-017](./phase-2.7-decisions.md#adr-27-017--orderitem-historical-snapshot)).

At minimum, preserve:

- Product reference
- Product name snapshot
- SKU snapshot
- Unit selling price (GST-inclusive paise)
- Quantity
- Discount (paise)
- `taxPaise` when available
- Line total (GST-inclusive)
- Applied offer / action identity when applicable

Historical orders must not depend on mutable Product state.

Example:

```text
Purchase:
SSD = ₹5,000

Later Product price:
SSD = ₹4,500

Historical Order:
SSD = ₹5,000
```

## 6.9 Payment (PaymentAttempt)

Payment is separate from Order. The entity is **PaymentAttempt**:

```text
Order 1:N PaymentAttempt → Razorpay (external)
```

([ADR-2.7-018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt))

Conceptual payment attempt states:

```text
PENDING
PROCESSING
SUCCEEDED
FAILED
CANCELLED
```

At most one SUCCEEDED attempt per Order. Webhooks verified server-side and
idempotent on provider event/payment ids. Provider calls are **outside** DB
transactions.

~~Prior wording suggested a singular Payment under Order while also requiring
multiple attempts — contradiction resolved.~~

## 6.10 Payment Authority

Payment status must be determined by server-side/Razorpay-confirmed information.

The browser is never authoritative for successful payment.

## 6.11 Order vs Payment

Order answers:

> What did the customer purchase?

Payment answers:

> What happened to the financial transaction?

Keep these separate to support:

- Failed payment
- Retry
- Multiple payment attempts
- Future refunds

## 6.12 Purchase Event

The authoritative commerce flow is ([ADR-2.7-011](./phase-2.7-decisions.md#adr-27-011--event-trust-levels), [016](./phase-2.7-decisions.md#adr-27-016--order-lifecycle), [018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt)):

```text
Cart
 ↓
Checkout
 ↓
Order (PENDING) + pricing snapshot
 ↓
PaymentAttempt(s)
 ↓
Verified SUCCEEDED payment
 ↓
Order PAID + inventory decrement (same DB txn)
 ↓
PURCHASE Event (server-emitted only)
```

PURCHASE references the Order. Client-submitted PURCHASE is rejected.

This enables later revenue attribution.

## 6.13 Cart → Order

After successful checkout/purchase:

- Current Cart should no longer be treated as the active shopping cart.
- Order becomes the historical record.
- Cart history should not be blindly deleted.

A converted/historical cart may remain linked to the resulting Order.

Exact persistence representation will be decided during schema implementation.

## 6.14 Failed Checkout

Example:

```text
Cart
 ↓
CHECKOUT_STARTED
 ↓
Payment FAILED
```

Must not produce:

```text
PURCHASE
```

This failure can later become an AI signal for abandoned-checkout opportunities.

## 6.15 Successful Purchase

Authoritative server-side flow ([ADR-2.7-019](./phase-2.7-decisions.md#adr-27-019--inventory-concurrency)):

```text
PaymentAttempt SUCCEEDED (webhook verified, idempotent)
       ↓
DB transaction:
  conditional stock decrement (stockQuantity >= qty)
  Order → PAID
       ↓
commit
       ↓
PURCHASE event (server)
       ↓
Revenue attribution eligible
```

If decrement fails: **do not** mark Order PAID; no PURCHASE. External payment
success without stock is a compensation/ops path — fail closed on commerce
confirmation.

~~Prior: “Exact transactional ordering… later architecture review” — superseded.~~

## 6.16 Inventory Concurrency

Invariant: `stockQuantity >= 0` (CHECK). Add-to-cart does **not** reserve stock.

Concurrent buyers of the last unit: only one conditional `UPDATE … WHERE stockQuantity >= qty` succeeds inside the Order→PAID transaction.

Duplicate webhooks must not double-decrement (Order already PAID → no-op).

Full reservation system is not required for MVP.

([ADR-2.7-019](./phase-2.7-decisions.md#adr-27-019--inventory-concurrency))

~~Prior: “appropriate atomic inventory handling” without mechanism — superseded.~~

## 6.17 Revenue Concepts

Keep these separate ([ADR-2.7-022](./phase-2.7-decisions.md#adr-27-022--revenue-terminology)):

### Order value

Sum of OrderItem line totals for a PAID Order (GST-inclusive).

### Payment amount

Amount on SUCCEEDED PaymentAttempt.

### AI-attributed revenue

Sum of non-VOIDED AttributionRecords — **not** incremental or causal revenue.

These must not be collapsed into one field.

## 6.18 Commerce Invariants

**CO-1** Anonymous users cannot create commerce carts.

**CO-2** Cart belongs to an authenticated Customer.

**CO-3** Product must belong to the same Store as the Cart/Customer.

**CO-4** Product must be ACTIVE and purchasable before purchase.

**CO-5** Client-provided prices/totals are never authoritative.

**CO-6** Inventory is revalidated server-side during checkout/purchase.

**CO-7** Order is the historical commercial record.

**CO-8** OrderItems preserve purchase-time commercial facts.

**CO-9** Orders do not depend on mutable current Product pricing.

**CO-10** Payment and Order are separate domain concepts.

**CO-11** Payment success must be server-authoritative.

**CO-12** Failed payments never produce PURCHASE.

**CO-13** PURCHASE represents confirmed commerce.

**CO-14** Inventory changes must maintain basic concurrency correctness.

**CO-15** Order value, payment value, and AI-attributed revenue remain conceptually separate.

---

# 7. Combined Domain Architecture

After Phase 2.3 and 2.4:

```text
                         MERCHANT
                             │
                             ▼
                           STORE
                             │
              ┌──────────────┴──────────────┐
              │                             │
          PRODUCTS                       CUSTOMERS
              │                             │
              │                             ▼
              │                          SESSION
              │                             │
              │                             ▼
              │                           EVENTS
              │
              │
              ▼
            CART
              │
              ▼
          CHECKOUT
              │
              ▼
            ORDER
              │
              ▼
           PAYMENT
              │
              ▼
        PURCHASE EVENT
```

Behavior and commerce connect as:

```text
Customer Events
       │
       ▼
Opportunity Detection
       │
       ▼
AI Reasoning
       │
       ▼
AI Action
       │
       ▼
Customer Response Events
       │
       ▼
Order / Payment
       │
       ▼
Revenue Attribution
```

---

# 8. Explicitly Deferred From Phase 2

The following are not being implemented merely because they could be useful:

- PostgreSQL implementation
- Prisma implementation
- Dynamic pricing
- Product variants
- Advanced inventory reservation
- Event streaming infrastructure
- Data warehouse
- Multi-store architecture
- Multi-currency
- Complex refund system
- Marketplace integrations/scraping
- Supplier/warehouse management
- Advanced campaign infrastructure
- Cloudinary integration

---

# 9. Phase 2 Completion Criteria

Before moving to implementation, the architecture should answer:

- Who owns every entity?
- What is the relationship between entities?
- What is stored vs derived?
- What is authoritative?
- What is historical?
- What is mutable?
- What is immutable?
- How are anonymous users handled?
- How is customer attribution handled?
- How is product inventory handled?
- How is customer behavior captured?
- How does a cart become an order?
- How is payment confirmed?
- How is purchase represented?
- How can later AI actions be attributed to revenue?
- What must never be exposed to customers?
- What belongs in MVP vs later phases?

---

# 10. Next Phase

With 2.1–2.4 finalized, the next architecture task is:

## Phase 2.5 — AI Growth System

The key design problem becomes:

```text
Events
   ↓
Behavior / Intent Signals
   ↓
Revenue Opportunity
   ↓
Candidate Actions
   ↓
AI Reasoning
   ↓
Merchant Constraints
   ↓
Executable AI Action
```

Phase 2.5 must define the AI's actual decision architecture before any AI implementation begins.

---

# 11. Architecture Principle

The system should follow:

> **One fact, one authoritative home.**

Examples:

- Current product price → Product
- Current inventory → Product
- Current cart → Cart
- Historical purchase → Order
- Payment state → Payment
- Customer behavior → Event
- AI decision → AI Action
- Merchant constraint → Guardrail/Rule
- AI-attributed revenue → Attribution system

Avoid duplicating facts merely for convenience.
