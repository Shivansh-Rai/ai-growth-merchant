# CLAUDE.md — The Next Gen Store

## 1. Project

The Next Gen Store is a personal SDE portfolio project built for
Razorpay Track 01 — AI Growth & Agentic Commerce.

The goal is to build a merchant-facing AI growth system that can:

Customer Activity
→ Detect Revenue Opportunity
→ Generate/Reason about Candidate Action
→ Apply Merchant Guardrails
→ Execute Action
→ Observe Customer Response
→ Process Order/Payment
→ Attribute Revenue
→ Maintain Audit Trail

This is NOT a generic chatbot or simple recommendation engine.

The project is intentionally an MVP/personal project.
Prefer simple, understandable engineering over enterprise over-engineering.

---

## 2. Technology

Current stack:

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
- Satoshi font

Database:

- PostgreSQL is the primary database.
- Prisma is the ORM.
- PostgreSQL is the source of truth for persistent domain state.

Do not introduce Redis, Kafka, microservices, warehouses, or other
infrastructure unless explicitly requested.

---

# 3. SOURCE OF TRUTH

The Phase 2 architecture documents are the authoritative specification
for the backend/domain model.

Before implementing a domain feature, read the relevant architecture
documents in the repository.

Important documents include:

- phase-2.8-platform-decisions.md
- phase-2.7-decisions.md
- phase-2.7-architecture-review.md
- phase-2-freeze-checklist.md
- identity-model.md
- product-catalog-model.md
- activity-tracking.md
- growth-system-and-guardrails.md

The Phase 2.8 decisions document has authority for multi-merchant tenancy,
storefront routing, catalogue unit model, AI surfaces, notification exposure
and policy-absence semantics. The Phase 2.7 decisions document has authority
everywhere else when earlier documents contain superseded wording. Phase 2.8
extends Phase 2.7 and reverses none of it.

Do NOT invent domain behavior when the architecture already defines it.

If an implementation requirement conflicts with the architecture:

1. Stop.
2. Identify the conflict.
3. Explain it.
4. Do not silently change the architecture.

---

# 4. CORE ARCHITECTURAL PRINCIPLE

## One fact, one authoritative home.

Examples:

- Current product price → Product
- Current inventory → Product
- Current cart → Cart
- Historical purchase → Order / OrderItem
- Payment state → PaymentAttempt
- Customer behavior → Event
- AI decision → AI Action
- Merchant constraint → Policy / Guardrail
- AI-attributed revenue → AttributionRecord

Do not duplicate authoritative business facts across unrelated models.

Derived analytics should be calculated from authoritative domain data
rather than becoming a second source of truth.

---

# 5. CORE DOMAIN

The major domain relationships are:

Merchant
→ Store

Store
→ Customer
→ Session
→ Event

Store
→ Product

Customer + Store
→ Cart
→ CartItem

Cart
→ Order
→ OrderItem
→ PaymentAttempt

Behavior / Commerce
→ Opportunity
→ AI Action
→ Guardrail Evaluation
→ Audit Entry
→ Attribution Record

Policies and frequency controls constrain AI actions.

Every model must have a clear purpose and meaningful relationship to
the domain.

Do not create tables merely because they might be useful someday.

---

# 6. IDENTITY RULES

- Merchant owns exactly one Store in the MVP.
- Store isolation is mandatory.
- Customer is store-scoped.
- Session belongs to exactly one Store.
- Session owns Events.
- Anonymous visitors are NOT Customers.
- Anonymous identity is represented through Session.anonymousId.
- customerId represents authenticated identity.
- attributedCustomerId represents later eligible identity attribution.
- Events are immutable.
- Customer identity must never be inferred from arbitrary client data.
- Anonymous tokens are opaque and are never authorization credentials.

Authentication and authorization boundaries defined in Phase 2 must
not be weakened for convenience.

---

# 7. PRODUCT RULES

A purchasable thing is one Product + one SKU in the MVP.

This includes goods normally sold by weight or volume: one purchasable **pack**
is one Product ("Tomatoes 500 g" and "Tomatoes 1 kg" are two Products).
`stockQuantity` counts packs. No unit of measure, no price-per-unit, no
fractional quantity (ADR-2.8-004).

Product belongs to exactly one Store.

The catalogue is domain-agnostic. Electronics examples in the architecture
documents are illustrative, not normative.

Product lifecycle:

DRAFT
ACTIVE
ARCHIVED

Availability is derived from lifecycle + inventory.

Do NOT create a combined Product status such as:

ACTIVE / OUT_OF_STOCK

Money:

- INR only for MVP.
- Store money as integer paise.
- Never use floating-point values for monetary persistence.
- sellingPrice <= MRP
- monetary values must respect the Phase 2 GST definitions.

Merchant-only cost/profit/margin information must never leak into
customer-facing responses.

External product URLs are metadata only.

Do not scrape Amazon, Flipkart, Blinkit, etc.

Product deletion rules from Phase 2 must be respected.

---

# 8. EVENT RULES

Events are behavioral history.

Events are immutable.

Canonical MVP events include:

- SEARCH
- PRODUCT_VIEW
- PRODUCT_CLICK
- ADD_TO_CART
- REMOVE_FROM_CART
- CART_VIEW
- CHECKOUT_STARTED
- OFFER_VIEWED
- OFFER_CLICKED
- OFFER_DISMISSED
- PURCHASE

Do not add generic tracking such as:

- mouse movement
- hover
- scrolling
- arbitrary page-load events

unless explicitly required.

Event timestamps:

- receivedAt = authoritative server timestamp
- clientOccurredAt = optional untrusted client timestamp

PURCHASE is a trusted server-side business event.

The client must never be allowed to directly create a PURCHASE event.

---

# 9. COMMERCE RULES

Cart:

- authenticated customers only
- one ACTIVE cart per store/customer
- cart does not reserve inventory
- cart price is not historical financial truth

Checkout:

- server validates ownership
- server validates product lifecycle
- server validates inventory
- server calculates authoritative prices/totals

Order:

- PENDING
- PAID
- CANCELLED

OrderItem stores historical product/price information.

Payment:

- PaymentAttempt is the payment entity.
- Order has 1:N PaymentAttempts.
- At most one successful payment exists for an Order.
- Payment provider webhooks are trusted only after server-side verification.
- Payment processing must be idempotent.

Inventory changes must be concurrency-safe.

Never trust client-provided prices, totals, inventory,
payment state, or order state.

---

# 10. AI GROWTH RULES

AI is NOT the business authority.

The system follows:

AI proposes
→ deterministic validation
→ merchant guardrails
→ execution

AI cannot determine:

- inventory truth
- product existence
- product purchasability
- price truth
- payment truth
- customer identity
- merchant permissions
- revenue truth

AI may propose an action but the application decides whether it is valid.

Valid action types include:

- UPSELL
- CROSS_SELL
- SUBSTITUTION
- PERSONALIZED_OFFER
- CART_OPTIMIZATION
- ABANDONED_CHECKOUT_INTERVENTION

NO_ACTION is valid.

AI output must be structured.

AI must not invent:

- product IDs
- prices
- inventory
- discounts
- orders
- payments
- revenue

AI must not modify base product selling price.

---

# 11. GUARDRAILS

Merchant rules are first-class domain data.

Policies are store-scoped and versioned.

Examples:

- MAX_DISCOUNT
- MIN_MARGIN
- PRODUCT_ELIGIBILITY
- CUSTOMER_ELIGIBILITY
- FREQUENCY_LIMIT
- INVENTORY_REQUIREMENT

Guardrail evaluation must be deterministic.

AI cannot override merchant policies.

Important hard constraints must be revalidated at execution time,
not only when the AI action was generated.

---

# 12. AI ACTION LIFECYCLE

Authoritative lifecycle:

GENERATED
→ VALIDATING
→ APPROVED / REJECTED

APPROVED
→ EXECUTED / EXPIRED / CANCELLED

Customer response is NOT an AI Action state.

Customer behavior belongs in Events.

Revenue attribution belongs in AttributionRecord.

Do not merge these concepts.

Do not store chain-of-thought.

Store concise rationale and reproducibility metadata where defined
by the architecture.

---

# 13. AUDIT + ATTRIBUTION

Keep these concepts separate:

Event
= behavioral history

AI Action
= intervention decision/execution

Guardrail Evaluation
= policy decision snapshot

Audit Entry
= system audit trail

Attribution Record
= historical AI-to-order revenue linkage

Attribution:

- exposure is required
- default window is 7 days
- qualifying purchase is PAID Order
- last eligible exposure receives attribution
- attributed revenue is NOT causal revenue
- attributed revenue is NOT incremental revenue

Never describe attribution as proof that AI caused the purchase.

---

# 14. DATABASE ENGINEERING

Prefer database-enforced integrity where appropriate.

Important constraints include:

- Merchant ↔ Store 1:1
- store-scoped SKU uniqueness
- store-scoped slug uniqueness
- cart item uniqueness
- active cart uniqueness
- foreign-key ownership
- non-negative inventory
- valid monetary values

Use PostgreSQL constraints/indexes when Prisma alone cannot express
the required invariant cleanly.

Do not weaken a domain invariant simply because it is inconvenient
to represent.

---

# 15. TYPESCRIPT / CODE QUALITY

Use strict TypeScript.

Prefer:

- small focused functions
- explicit domain types
- clear naming
- predictable error handling
- server-side validation
- Zod where appropriate
- reusable utilities only when actually reused

Avoid:

- `any`
- giant functions
- giant generic abstractions
- unnecessary design patterns
- speculative infrastructure
- duplicate business logic
- silent fallbacks that hide bugs

Keep code understandable to a strong junior/intermediate SDE reviewing
the project.

---

# 16. IMPLEMENTATION WORKFLOW

Implement the project incrementally.

Never implement the entire architecture in one step.

Each task should follow:

1. Understand the relevant architecture.
2. Inspect the existing implementation.
3. Create a short implementation plan.
4. Implement only that scope.
5. Run validation/tests.
6. Review the resulting changes.
7. Report any architectural issue.
8. Move to the next task only after validation.

Do not modify unrelated parts of the application.

Do not rewrite working code without a reason.

---

# 17. DATABASE IMPLEMENTATION ORDER

The database foundation should be implemented in this order:

Phase 3.1
1. PostgreSQL setup
2. Prisma setup
3. Prisma schema
4. Migration
5. Seed/demo data
6. Database verification

Then proceed to later implementation phases.

Do not build APIs, authentication, Razorpay, or the AI engine while
working only on database foundation unless explicitly requested.

---

# 18. SEED DATA

Seed data must represent a realistic connected system.

Prefer:

Merchant
→ Store
→ Products
→ Customers
→ Sessions
→ Events
→ Cart
→ Orders
→ Payments
→ Opportunities
→ AI Actions
→ Guardrails
→ Audit
→ Attribution

Do not create random disconnected records.

Seed data should be deterministic and easy to reset.

Seed several merchants, each with one store (electronics, dairy, fruit &
vegetable, utensils). Only the electronics store carries the full growth loop;
the others are catalog-depth (merchant, store, catalogue, customers, a few paid
orders) — ADR-2.8-010.

Categories and subcategories use deterministic store-prefixed ids so the spec
registry can key on them (ADR-2.8-005).

Use realistic products for each store's domain.

Use integer paise.

Never create impossible states merely to make a dashboard look populated.

---

# 19. SECURITY

Never:

- commit secrets
- hardcode credentials
- trust client prices
- trust client inventory
- trust client payment status
- expose merchant-only financial fields
- allow cross-store data access
- treat anonymous IDs as authorization
- allow client-created PURCHASE events

All sensitive business decisions must be validated server-side.

---

# 20. SIMPLICITY RULE

This is a personal project, not a distributed enterprise platform.

Choose the simplest implementation that correctly satisfies the
frozen architecture.

Do not add infrastructure because it sounds impressive.

Complexity must be justified by an actual project requirement.

Correctness > abstraction.

Understandability > cleverness.

---

# 21. WHEN UNCERTAIN

Do not guess about architecture.

If the answer is already defined in the Phase 2 documents,
follow the documents.

If it is not defined:

1. identify the missing decision,
2. explain the options briefly,
3. ask before introducing a new architectural rule.

Never silently create a new source of truth.