# Phase 2.7 — Architecture Decisions

**Status:** Accepted (authoritative for Phase 2 freeze)
**Date:** 2026-09-19
**Scope:** Resolve contradictions and gaps across Phases 2.1–2.6 so Phase 3 (PostgreSQL + Prisma) does not invent domain rules.

This file is the **single authoritative source** for every decision listed below. Where older architecture documents conflict, those documents are superseded and must point here.

**Confirmed product inputs**

- GST treatment: Option A (MRP & selling GST-inclusive; cost GST-exclusive; profit = indicative contribution).
- Attribution multi-action: Option A (last-touch, 100% to most recent eligible exposed action).

---

## How to read an ADR

```text
Decision
Context
Options considered
Chosen resolution
Why
Impact
Implementation implications
```

Trivial details that do not affect schema or system behavior are omitted.

---

## ADR-2.7-001 — Historical Truth Principle

**Decision.** Every domain fact is classified as one of:

| Class | Meaning | Examples |
|---|---|---|
| CURRENT STATE | Mutable live value | `Product.stockQuantity`, `CartItem.quantity`, `lifecycleStatus` |
| HISTORICAL FACT | Immutable record of what was true | `OrderItem.unitPricePaise`, Event rows, Audit entries |
| DERIVED FACT | Computed from CURRENT or HISTORICAL | `availability`, `discountPercent`, contribution margin |
| INFERENCE | System belief that may be wrong | Opportunity, `attributedCustomerId` |
| HISTORICAL INFERENCE | Materialized, versioned inference | AttributionRecord (VOIDED if later invalidated) |

**Context.** Snapshot vs live-state confusion caused Order/AI/Attribution ambiguity.

**Options.** Leave implicit; formalize as architecture principle.

**Chosen.** Formalize; apply across all Phase 2 entities.

**Why.** Prevents “one fact, two homes” and clarifies mutability / delete behavior.

**Impact.** Normative docs must label sources of truth accordingly.

**Implementation.** Phase 3 schemas and services preserve class: never overwrite HISTORICAL FACT to “fix” CURRENT STATE.

---

## ADR-2.7-002 — Merchant ↔ Store 1:1 Is Database-Enforced

**Decision.** MVP enforces Merchant → Store **1:1 structurally** via a **UNIQUE** constraint on `Store.merchantId` (or equivalent unique owner reference). Store remains a separate domain entity.

**Context.** Identity Model said 1:1 was “policy, not structure.”

**Options.** Policy-only; DB unique; merge Merchant and Store.

**Chosen.** DB unique on `Store.merchantId`. Keep entities separate.

**Why.** Accidental multi-store creation would break every store-scoped invariant. Separation still allows post-MVP multi-store as a cardinality change.

**Impact.** Supersedes Identity Model §3 / §6 policy-only wording.

**Implementation.** Prisma `@unique` on `merchantId`. Multi-store deferred (drop/relax unique later).

**Enforcement class:** database-enforced.

---

## ADR-2.7-003 — Store Isolation & Composite Ownership

**Decision.** Every commerce and AI entity that can participate in a relationship carries `storeId`. Cross-store FKs are forbidden. Where a child references a parent that itself is store-scoped, Phase 3 uses composite relationships or application + DB checks so both share the same `storeId`.

Required uniqueness (database-enforced unless noted):

| Constraint | Enforcement |
|---|---|
| `(storeId, sku)` on Product | DB UNIQUE |
| `(storeId, slug)` on Product | DB UNIQUE |
| `(storeId, slug)` on Brand | DB UNIQUE |
| `(storeId, slug)` on Category | DB UNIQUE |
| `(storeId, categoryId, slug)` on Subcategory | DB UNIQUE |
| Product.categoryId / brandId / subcategoryId same Store as Product | DB composite FK and/or CHECK + app validate |
| Product.subcategoryId belongs to Product.categoryId | DB composite FK `(categoryId, subcategoryId)` → Subcategory, or SQL migration if Prisma cannot express |
| Customer, Session, Cart, Order, Opportunity, AI Action, Policy, Audit, Attribution | all carry `storeId`; FKs must not cross stores |

**Context.** Isolation was claimed but not fully constrained (especially subcategory↔category and slugs).

**Chosen.** Structural uniqueness + composite ownership where practical.

**Why.** “Application validates” alone is insufficient for tenant safety.

**Implementation.** Prefer DB constraints; document Prisma gaps → raw SQL migrations.

---

## ADR-2.7-004 — Product Deletion Is Archival

**Decision.** Once a Product is referenced by any of OrderItem, Event payload (product id), AI Action target, Opportunity evidence, or CartItem, it **must not be hard-deleted**. Withdrawal = `lifecycleStatus = ARCHIVED`. Unreferenced DRAFT products may be hard-deleted. Historical FKs use **ON DELETE RESTRICT** (or equivalent).

**Context.** PRD-16 covered orders only.

**Chosen.** Expand archival to all historical/commerce references; allow hard-delete only for unused DRAFT.

**Why.** Events, AI, and carts create historical meaning too.

**Implementation.** Soft-archive path in product service; RESTRICT on FKs.

---

## ADR-2.7-005 — Lookup Entity Lifecycle

**Decision.** Brand / Category / Subcategory that are referenced by Products use **RESTRICT** on delete. Merchants retire unused lookups by marking inactive/archived (store-scoped flag) or by leaving them unused. No cascade delete into Products.

**Why.** Cascading would corrupt catalog history and AI evidence.

---

## ADR-2.7-006 — Specs Registry Key & Validation Ownership

**Decision.** Spec schemas are keyed by `(categoryId, subcategoryId | null)` in application Zod registries. JSONB on Product; unknown keys rejected at write. Database does **not** validate key shapes. Optional GIN index for future query; not required for MVP writes.

**Context.** “category/subcategory” wording was ambiguous.

**Chosen.** Explicit composite key; subcategory null uses category-level schema.

**Enforcement:** application (Zod). DB stores opaque JSONB.

---

## ADR-2.7-007 — Domain Authorization Boundaries

**Decision.** Phase 4 implements authentication. Phase 2.7 freezes **authorization boundaries**:

| Actor | May access |
|---|---|
| Merchant | Only resources where `storeId` = merchant’s Store |
| Customer | Own Customer record; own Carts/Orders; own Sessions; own Events via those Sessions |
| AI / Growth worker | Read store-scoped inputs; propose Actions; **never** mutate inventory, prices, payments, identity, or merchant permissions as authority |

Additional boundaries:

- `anonymousId` is **not** an authorization credential.
- Cost / margin / contribution / internal AI rationale / prompts never appear on customer-facing surfaces (structural projection, not prompt-only).
- `externalUrl` remains inert — never fetched by server or AI.
- Event payloads validated against per-type schemas; hard size limit **16 KiB** serialized JSON for MVP.
- Audit rows are append-only; no update/delete APIs.
- Business timestamps that gate lifecycle use **server UTC** (`receivedAt` / server `now()`), never untrusted client clocks alone.

**Enforcement:** application server (with DB store scoping). Auth mechanisms deferred to Phase 4.

---

## ADR-2.7-008 — Session Lifecycle (Server Time)

**Decision.**

| Concern | Rule |
|---|---|
| Start | First storefront contact creates Session with new or existing `anonymousId` |
| Activity | Server updates `lastActivityAt` on each accepted Event or authenticated mutation using server time |
| Inactivity end | If `now() - lastActivityAt > 30 minutes`, Session is **ENDED**; further activity opens a **new** Session (same `anonymousId`) |
| Logout | Ends current Session |
| Login | Does **not** end Session; sets `customerId` (immutable thereafter per INV-5) |
| Different customer on same device | Ends prior Session if needed; new Session; never overwrite `customerId` |

The 30-minute window is a **fixed MVP constant** (no longer “tunable without notice”). Changing it is a product decision recorded in changelog.

**Supersedes.** Identity Model note that 30 minutes is “not a structural commitment.”

---

## ADR-2.7-009 — Identity Attribution Concurrency

**Decision.** On login of Customer `C` with token `T` at server time `t`, attribution backfill is:

```sql
UPDATE "Session"
SET "attributedCustomerId" = :C
WHERE "anonymousId" = :T
  AND "storeId" = :storeId
  AND "startedAt" >= :t - interval '30 days'
  AND "customerId" IS NULL
  AND "attributedCustomerId" IS NULL;
```

First claim wins atomically. Concurrent logins cannot double-attribute. Always filter by `storeId`.

**Why.** Prior rule omitted store scope and concurrency.

---

## ADR-2.7-010 — Anonymous Token Requirements

**Decision.** `anonymousId`:

- Generated server-side (or sealed client mint verified server-side) with ≥ 128 bits entropy (UUID v4 or equivalent).
- Unique per issuance; stored as opaque string.
- Not rotated on every request; may rotate on explicit privacy reset (clears linkage expectation).
- Retention: align with Event retention (ADR-2.7-014); not treated as PII auth secret.
- Never used alone to authorize cart, checkout, order history, or merchant APIs.
- Attribution abuse mitigated by store scope, 30-day window, first-claim-wins, and never rewriting Events.

---

## ADR-2.7-011 — Event Trust Levels

**Decision.** Events have a trust class:

| Class | Origin | Examples | Authority |
|---|---|---|---|
| CLIENT_TELEMETRY | Browser/app, validated schema | SEARCH, PRODUCT_VIEW, OFFER_VIEWED | Behavioral signal only |
| SERVER_BUSINESS | Server after domain success | PURCHASE | Authoritative outcome signal |

**PURCHASE** is emitted **only** by the server after Order reaches `PAID`. Client-submitted PURCHASE is rejected.

Commerce mutations (cart, checkout, payment confirm) require **idempotency keys**. Telemetry may include optional `clientEventId` with soft dedupe unique per `(sessionId, clientEventId)` when present.

---

## ADR-2.7-012 — Event Timestamps & Ordering

**Decision.**

| Field | Role |
|---|---|
| `receivedAt` | Server UTC receipt time — **authoritative** for ordering, session activity, attribution windows |
| `clientOccurredAt` | Optional client claim — retained for analytics, never authoritative for money or session end |

All stored timestamps are UTC.

---

## ADR-2.7-013 — Event Indexes (MVP)

**Decision.** Conceptual PostgreSQL indexes:

- `(sessionId, receivedAt)`
- `(storeId, type, receivedAt)`
- `(storeId, receivedAt)` for store timelines
- Unique partial on `(sessionId, clientEventId)` WHERE `clientEventId IS NOT NULL`
- For PURCHASE: `(orderId)` unique (one PURCHASE Event per Order)

---

## ADR-2.7-014 — Event Retention (MVP)

**Decision.** PostgreSQL is SoT. No warehouse/Kafka for MVP. Retain Events ≥ **90 days**. Longer retention / anonymization is deferred (non-critical). Partitioning is a future boundary when volume demands it.

---

## ADR-2.7-015 — Cart Lifecycle & Uniqueness

**Decision.** Cart states:

```text
ACTIVE | CONVERTED | ABANDONED | EXPIRED
```

- Exactly **one ACTIVE** Cart per `(storeId, customerId)` — **partial UNIQUE** index (SQL migration if Prisma limited).
- One CartItem per `(cartId, productId)` — UNIQUE; quantity adjusted on that row.
- Cart / CartItem prices are **not** historical financial truth. Display may cache observed selling price; checkout recalculates from Product.
- On successful PAID Order: Cart → CONVERTED and linked to Order.
- Abandonment/expiry rules: ACTIVE cart with no activity beyond configurable TTL (default 7 days) → ABANDONED/EXPIRED (implementation may batch).

---

## ADR-2.7-016 — Order Lifecycle

**Decision.** Order states:

```text
PENDING → PAID
PENDING → CANCELLED
PAID → CANCELLED   (MVP cancel path; full refunds deferred)
```

- Order is created at checkout start as **PENDING** (authoritative pricing snapshot begins here).
- Order becomes **PAID** only after a PaymentAttempt reaches SUCCEEDED and inventory decrement succeeds (ADR-2.7-018).
- Refunds as a first-class Payment/Refund concept are deferred; if Order is CANCELLED after attribution, AttributionRecords are VOIDED (ADR-2.7-028).

---

## ADR-2.7-017 — OrderItem Historical Snapshot

**Decision.** OrderItem stores immutable purchase-time fields:

- `productId`, `productName`, `sku`
- `unitPricePaise` (GST-inclusive selling unit price)
- `quantity`
- `discountPaise` (line discount applied)
- `lineTotalPaise` (GST-inclusive)
- `taxPaise` (nullable until line tax known; when present, part of inclusive total semantics)
- `appliedOfferId` / `appliedActionId` (nullable)
- Store and Order FKs

Must not depend on mutable Product for historical meaning.

---

## ADR-2.7-018 — Payment: Order 1:N PaymentAttempt

**Decision.** Model is:

```text
Order 1:N PaymentAttempt
```

Not Order 1:1 Payment. Diagram language “Payment” means the payment **subsystem**; the entity is **PaymentAttempt**.

PaymentAttempt fields (conceptual): internal id, `orderId`, `storeId`, status, amountPaise, provider (`RAZORPAY`), `providerOrderId` / `providerPaymentId`, `providerEventId` (webhook idempotency), idempotency key, timestamps, failure reason.

Lifecycle: `PENDING → PROCESSING → SUCCEEDED | FAILED | CANCELLED`.

Rules:

- Multiple attempts allowed per Order while Order is PENDING.
- At most one SUCCEEDED attempt per Order (unique partial index).
- Browser never authorizes success.
- Razorpay webhooks verified server-side (signature); processed idempotently by `providerEventId` / `providerPaymentId`.
- **External provider calls are outside PostgreSQL transactions.** Pattern: verify webhook → begin DB transaction → confirm Order/inventory → commit; retries are idempotent.

**Supersedes.** Activity-tracking nested singular Payment under Order without PaymentAttempt.

---

## ADR-2.7-019 — Inventory Concurrency

**Decision.**

Invariant: `stockQuantity >= 0` (DB CHECK). Add-to-cart does **not** reserve stock.

On payment success confirmation (same DB transaction as Order → PAID):

1. Re-read OrderItems.
2. For each line: `UPDATE Product SET stockQuantity = stockQuantity - :qty WHERE id = :id AND storeId = :storeId AND stockQuantity >= :qty AND lifecycleStatus = 'ACTIVE'`.
3. If any update affects 0 rows → abort transaction; Order remains PENDING (or moves to a documented failure handling path that does not emit PURCHASE); PaymentAttempt may be SUCCEEDED externally — record compensation/ops flag for manual/automated reconcile (MVP: mark attempt `SUCCEEDED_STOCK_CONFLICT` or fail closed and alert — **fail closed: do not mark Order PAID**).
4. On full success: Order PAID, emit PURCHASE Event, run attribution.

Duplicate webhooks must not double-decrement (idempotent Order already PAID → no-op).

**Supersedes.** “Appropriate atomic inventory handling” and deferred transactional ordering.

---

## ADR-2.7-020 — Money Remains Integer Paise

**Decision.** Affirm D-1. All money fields are integer paise. No currency field (INR only). UI types that use whole rupees remain known conflicts (CFT-3) for Phase 3/5 conversion — not architecture reopen.

---

## ADR-2.7-021 — GST Treatment (OPEN-1 Closed)

**Decision.**

| Price | GST treatment |
|---|---|
| `mrpPaise` | GST-inclusive |
| `sellingPricePaise` | GST-inclusive |
| `costPricePaise` | GST-exclusive (as recorded by merchant) |

Merchant-facing **profit** / **margin** = `sellingPricePaise - costPricePaise` when cost present, labeled **indicative contribution** — **not** accounting profit / net profit. Do not claim GST-accurate P&L.

OrderItem line totals are GST-inclusive; `taxPaise` optional breakdown when available.

**Supersedes.** OPEN-1 in product-catalog-model and activity-tracking §4.15.

---

## ADR-2.7-022 — Revenue Terminology

**Decision.** Exact meanings:

| Term | Meaning |
|---|---|
| Order Value | Sum of OrderItem `lineTotalPaise` for a PAID Order (GST-inclusive) |
| Gross Revenue / Sales | Sum of Order Values over a period (PAID only) |
| Payment Amount | Amount on SUCCEEDED PaymentAttempt (`amountPaise`) |
| Net Revenue | Deferred (refunds/fees not modeled in MVP) |
| AI-attributed revenue | Sum of non-VOIDED AttributionRecord amounts |
| Incremental revenue | **Out of scope** — requires counterfactual/experimentation; never alias of attributed |

Attributed ≠ Incremental ≠ Causal.

---

## ADR-2.7-023 — Offer Fact Separation

**Decision.** Four distinct facts:

1. **AI proposed offer** — on Action proposal
2. **Approved offer** — passed guardrails (may still expire)
3. **Redeemed / applied offer** — attached at checkout to Order/OrderItem
4. **OrderItem discount** — immutable paise on the line

Never collapse these into one field.

---

## ADR-2.7-024 — Opportunity Model

**Decision.**

```text
Events → Deterministic signals / eligibility → Opportunity → AI reasoning (optional)
```

LLM does **not** rediscover obvious DB facts as the opportunity detector.

Opportunity lifecycle:

```text
OPEN | SUPPRESSED | RESOLVED | EXPIRED
```

Fields (conceptual): `storeId`, optional `customerId`, optional `sessionId`, `type`, `status`, `dedupeKey`, `evidence` (structured refs to Events/Products), `expiresAt`, timestamps.

- Dedup: unique `(storeId, dedupeKey)` among OPEN opportunities (or upsert).
- Default TTL: **24 hours** unless type overrides.
- Resolution: linked Action executed / merchant suppress / expiry / ineligibility.

---

## ADR-2.7-025 — AI Action Lifecycle & Output Boundary

**Decision.** Action lifecycle (**supersedes** growth §11 response/conversion states):

```text
GENERATED → VALIDATING → APPROVED | REJECTED
APPROVED → EXECUTED | EXPIRED | CANCELLED
```

Customer response and conversion are **not** Action states. They are Events (`OFFER_*`, `PURCHASE`) and AttributionRecords.

Identity: Action always has `storeId`, `opportunityId`, optional `customerId`, optional `sessionId`, optional `targetProductId` from **application-supplied candidate set**.

Structured output (conceptual; validated by app):

```text
{
  decision: "ACT" | "NO_ACTION",
  actionType,
  targetProductId,          // must be ∈ candidateProductIds
  rationale,                // internal
  confidence,               // informational only — not a hard business rule
  proposedOffer             // optional structured offer
}
```

**Removed:** model-owned `requiredConstraints`. Constraints come from Policy/Guardrail engine only.

Compatibility: only catalog-supported relations (Brand/Category/Subcategory/specs). AI-inferred compatibility without catalog support → action ineligible.

Execution: **Approved is not permanent authorization.** At execute time revalidate: product ACTIVE & purchasable, stock, policy version hard constraints, action not expired, candidate still eligible, offer bounds.

Customer-facing presentation is a **separate projection** that excludes cost, margin, contribution, internal rationale, confidence, policy internals, and private evidence.

Model reproducibility metadata retained on Action/Audit: provider, model id/version, decision schema version, policy version, timestamp, input snapshot ids (opportunity id, candidate set hash/version). **No chain-of-thought storage.**

---

## ADR-2.7-026 — Guardrail / Policy Model

**Decision.** First-class store-scoped **Policy** (guardrail) entities:

Conceptual types: `MAX_DISCOUNT`, `MIN_MARGIN`, `PRODUCT_ELIGIBILITY`, `CUSTOMER_ELIGIBILITY`, `FREQUENCY_LIMIT`, `INVENTORY_REQUIREMENT`, …

Each Policy: `storeId`, `type`, `enabled`, `scope`, `value` (JSONB), `effectiveFrom`/`effectiveTo`, **`version`**, timestamps.

Flow:

```text
AI proposes → Guardrail engine (deterministic) → APPROVE | REJECT + reason
```

Evaluation produces **GuardrailEvaluation** snapshot (rules touched, versions, results) attached to Action and Audit. Merchant rule changes bump version; historical evaluations remain explainable.

At execution, hard constraints are **re-evaluated** against current Policy versions (fresh check), while the original evaluation snapshot remains for audit.

---

## ADR-2.7-027 — Guardrail Frequency Concurrency

**Decision.** Frequency limits (e.g. max 1 offer/hour/customer) are enforced with a **database transactional counter or unique lease row**, e.g. insert into `FrequencyLedger(storeId, customerId, actionType, bucketStart)` with UNIQUE constraint; conflict → REJECT. Evaluated inside the same transaction as APPROVE when possible.

No Redis required for MVP. Concurrent workers must not both approve.

---

## ADR-2.7-028 — Attribution Model (MVP)

**Decision.** Deterministic MVP attribution:

| Rule | Value |
|---|---|
| Exposure required | `OFFER_VIEWED` Event referencing the Action (generation alone is insufficient) |
| Window | **7 days** from exposure `receivedAt` |
| Qualifying purchase | Order `PAID` (not PENDING; not client PURCHASE) |
| Product match | Target product appears as an OrderItem line; cart-level actions attribute if any line matches `targetProductId` |
| Multi-action | **Last-touch** — most recent eligible exposed Action in window gets 100%; others get none for that Order |
| Amount | Matched OrderItem `lineTotalPaise` (GST-inclusive); if multiple matching lines for same target, sum those lines once for the winning Action |
| Materialization | Immutable **AttributionRecord**; do not recalculate indefinitely for dashboards |
| Cancel / later refund | Order CANCELLED (or future refund covering attributed lines) → AttributionRecord status **VOIDED** |
| Causality | Never claimed. Attributed ≠ Incremental ≠ Causal |

Identity linkage: prefer Action.`customerId`; else Session customer; anonymous exposure may attribute only after identity resolution ties Session to Customer **and** Order Customer matches — otherwise no revenue attribution.

**Terminology collision:** Identity “attribution” (`attributedCustomerId`) ≠ revenue AttributionRecord. Docs must say “identity attribution” vs “revenue attribution.”

---

## ADR-2.7-029 — Audit Model

**Decision.** Distinct concepts (do not merge tables to save space):

| Concept | Authority |
|---|---|
| Event | Customer/system behavioral history |
| AI Action | Intervention decision/execution record |
| GuardrailEvaluation | Policy check snapshot |
| AuditEntry | Append-only system trail (actor, action type, decision, refs, timestamps, snapshots) |
| AttributionRecord | Historical inference linking Action → Order money |

AuditEntry created for: Action generated/validated/approved/rejected/executed, policy changes (optional), payment confirmation side-effects of interest, attribution create/void. Immutable; server timestamps; store-scoped.

---

## ADR-2.7-030 — PostgreSQL Integrity Defaults

**Decision.** Default delete behaviors:

| Relation | ON DELETE |
|---|---|
| Merchant → Store | RESTRICT |
| Store → children | RESTRICT (prefer soft-archive parents) |
| Order → OrderItem | CASCADE (items exist only for order) |
| Cart → CartItem | CASCADE |
| Order → PaymentAttempt | CASCADE |
| Product → OrderItem | RESTRICT |
| Session → Event | RESTRICT or CASCADE-with-care; prefer RESTRICT + archive Session |
| Opportunity → Action | RESTRICT |

Check constraints: `stockQuantity >= 0`; money non-negative where applicable; `sellingPricePaise <= mrpPaise`.

---

## ADR-2.7-031 — Prisma Compatibility

**Decision.** Do not distort domain for Prisma convenience. Where Prisma cannot express:

- Partial unique (one ACTIVE cart; one SUCCEEDED PaymentAttempt)
- Composite FK subcategory∈category
- Some CHECKs

…Phase 3 **must** add raw SQL migrations. Document each in schema notes.

---

## ADR-2.7-032 — Scalability Boundaries (Not Built)

**Decision.** MVP intentionally excludes: Kafka, warehouse, Redis, Elasticsearch, event partitioning, multi-region. Future boundaries: partition Events by time; warehouse for analytics; background workers for opportunity detection and attribution; bounded AI context windows (app-assembled, not full Event history dump).

Analytics for MVP = Postgres queries over indexed Events/Orders/AttributionRecords.

---

## ADR-2.7-033 — Phase Numbering Legend

**Decision.** Two numbering systems coexist and must not be conflated:

| System | Meaning |
|---|---|
| Architecture 2.1–2.7 | Domain design documents (this freeze) |
| Implementation Phase-track 1–14 | Build order; **Phase 3 = PostgreSQL + Prisma** |

After this freeze: Architecture Phase 2 is ready for Implementation Phase 3.

---

## Index of ADRs

| ID | Title |
|---|---|
| ADR-2.7-001 | Historical Truth Principle |
| ADR-2.7-002 | Merchant ↔ Store 1:1 DB-enforced |
| ADR-2.7-003 | Store isolation & composite ownership |
| ADR-2.7-004 | Product deletion = archival |
| ADR-2.7-005 | Lookup entity lifecycle |
| ADR-2.7-006 | Specs registry key & validation |
| ADR-2.7-007 | Domain authorization boundaries |
| ADR-2.7-008 | Session lifecycle (server time) |
| ADR-2.7-009 | Identity attribution concurrency |
| ADR-2.7-010 | Anonymous token requirements |
| ADR-2.7-011 | Event trust levels |
| ADR-2.7-012 | Event timestamps & ordering |
| ADR-2.7-013 | Event indexes (MVP) |
| ADR-2.7-014 | Event retention (MVP) |
| ADR-2.7-015 | Cart lifecycle & uniqueness |
| ADR-2.7-016 | Order lifecycle |
| ADR-2.7-017 | OrderItem historical snapshot |
| ADR-2.7-018 | PaymentAttempt 1:N |
| ADR-2.7-019 | Inventory concurrency |
| ADR-2.7-020 | Money = integer paise |
| ADR-2.7-021 | GST treatment (OPEN-1 closed) |
| ADR-2.7-022 | Revenue terminology |
| ADR-2.7-023 | Offer fact separation |
| ADR-2.7-024 | Opportunity model |
| ADR-2.7-025 | AI Action lifecycle & output |
| ADR-2.7-026 | Guardrail / Policy model |
| ADR-2.7-027 | Guardrail frequency concurrency |
| ADR-2.7-028 | Attribution model (MVP) |
| ADR-2.7-029 | Audit model |
| ADR-2.7-030 | PostgreSQL integrity defaults |
| ADR-2.7-031 | Prisma compatibility |
| ADR-2.7-032 | Scalability boundaries |
| ADR-2.7-033 | Phase numbering legend |
