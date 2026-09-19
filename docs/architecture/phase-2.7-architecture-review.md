# Phase 2.7 — Architecture Review

**Status:** Complete
**Date:** 2026-09-19
**Authority:** Resolutions live in [`phase-2.7-decisions.md`](./phase-2.7-decisions.md). This document records findings and maps them to ADRs. It does not introduce a second source of truth.

---

## 1. Scope

Challenge the full system as one chain:

```text
Merchant → Store → Customer → Session → Event → Opportunity → AI Action
  → Guardrail → Exposure → Cart → Checkout → Order → PaymentAttempt
  → Inventory → PURCHASE Event → Attribution → Audit
```

For every link, verify ownership, identity, authorization, lifecycle, source of truth, mutability, snapshots, idempotency, and concurrency.

**Out of scope:** Prisma schema, migrations, application code, auth implementation, payment provider integration, UI.

---

## 2. Reviewed documents

| Document | Prior status | Role in review |
|---|---|---|
| [`identity-model.md`](./identity-model.md) | Accepted | 2.1 Identity |
| [`product-catalog-model.md`](./product-catalog-model.md) | Accepted | 2.2 Catalog |
| [`activity-tracking.md`](./activity-tracking.md) | Finalized 2.1–2.4 rollup | Events + Commerce |
| [`growth-system-and-guardrails.md`](./growth-system-and-guardrails.md) | Finalized 2.5–2.6 | AI + Guardrails + Attribution |
| [`plan-001-…`](../plans/plan-001-merchant-store-customer-identity.md) | Intent | Superseded where Accepted docs decide |
| [`plan-002-…`](../plans/plan-002-product-catalog-inventory.md) | Intent | Superseded where Accepted docs decide |
| [`Phase-track.md`](../Phase-track.md) | Implementation ladder | Orthogonal numbering |
| [`CHANGELOG.md`](../CHANGELOG.md) | Decision log | OPEN-1 recorded |
| [`PROJECT-CONTEXT.md`](../PROJECT-CONTEXT.md) | Empty | Filled in 2.7 |
| `types/index.ts` (skim) | Demo UI types | CFT conflicts only; not normative |

---

## 3. Findings → resolutions

Severity reflects risk to Phase 3 inventing domain rules or shipping incorrect money/security.

| ID | Severity | Issue | Affected domains | Resolution | ADR |
|---|---|---|---|---|---|
| F-01 | CRITICAL | Merchant↔Store 1:1 policy-only | Identity, tenancy | DB UNIQUE on `Store.merchantId` | [002](./phase-2.7-decisions.md#adr-27-002--merchant--store-11-is-database-enforced) |
| F-02 | CRITICAL | OPEN-1 GST unresolved while profit formulas normative | Catalog, Finance, Orders | GST-A closed; contribution labeled indicative | [021](./phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed) |
| F-03 | CRITICAL | Payment diagram 1:1 vs “multiple attempts” | Commerce | Order 1:N PaymentAttempt | [018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt) |
| F-04 | CRITICAL | Inventory “atomic” + ordering deferred | Inventory, Payment | Conditional decrement in Order→PAID txn | [019](./phase-2.7-decisions.md#adr-27-019--inventory-concurrency) |
| F-05 | CRITICAL | No webhook/idempotency protocol for Razorpay | Payment | Provider ids + idempotent webhook handling | [018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt) |
| F-06 | CRITICAL | Attribution window / multi-action TBD | Attribution | 7-day window; last-touch 100% | [028](./phase-2.7-decisions.md#adr-27-028--attribution-model-mvp) |
| F-07 | CRITICAL | Action lifecycle mixes response/conversion with decision states | AI, Events | Strip response/conversion; Events + Attribution own outcomes | [025](./phase-2.7-decisions.md#adr-27-025--ai-action-lifecycle--output-boundary) |
| F-08 | CRITICAL | Opportunity detection ownership unclear (LLM vs engine) | AI | Deterministic signals → Opportunity; LLM reasons after | [024](./phase-2.7-decisions.md#adr-27-024--opportunity-model) |
| F-09 | CRITICAL | Frequency guardrails race under concurrency | Guardrails | Unique ledger / transactional lease | [027](./phase-2.7-decisions.md#adr-27-027--guardrail-frequency-concurrency) |
| F-10 | CRITICAL | `requiredConstraints` lets model define guardrails | AI, Guardrails | Removed; Policy engine owns constraints | [025](./phase-2.7-decisions.md#adr-27-025--ai-action-lifecycle--output-boundary), [026](./phase-2.7-decisions.md#adr-27-026--guardrail--policy-model) |
| F-11 | CRITICAL | 2.5/2.6 marked Finalized while §45 gaps open | Process | Superseded by 2.7 freeze | [033](./phase-2.7-decisions.md#adr-27-033--phase-numbering-legend) |
| F-12 | HIGH | Slug uniqueness unspecified | Catalog | `(storeId, slug)` (+ subcategory composite) | [003](./phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership) |
| F-13 | HIGH | Subcategory may not belong to Product.category | Catalog | Composite FK / SQL | [003](./phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership) |
| F-14 | HIGH | Product hard-delete incomplete | Catalog | Archive if referenced by Order/Event/Action/Opportunity/Cart | [004](./phase-2.7-decisions.md#adr-27-004--product-deletion-is-archival) |
| F-15 | HIGH | Cart states / active uniqueness / CartItem uniqueness TBD | Commerce | States + partial unique + one row per product | [015](./phase-2.7-decisions.md#adr-27-015--cart-lifecycle--uniqueness) |
| F-16 | HIGH | Order↔Payment flow contradiction across docs | Commerce | PENDING at checkout; PAID after verified payment | [016](./phase-2.7-decisions.md#adr-27-016--order-lifecycle), [018](./phase-2.7-decisions.md#adr-27-018--payment-order-1n-paymentattempt) |
| F-17 | HIGH | Event trust / PURCHASE client risk | Events | Trust classes; server-only PURCHASE | [011](./phase-2.7-decisions.md#adr-27-011--event-trust-levels) |
| F-18 | HIGH | Event timestamps / indexes / retention vague | Events | receivedAt authority; indexes; ≥90d | [012](./phase-2.7-decisions.md#adr-27-012--event-timestamps--ordering)–[014](./phase-2.7-decisions.md#adr-27-014--event-retention-mvp) |
| F-19 | HIGH | Guardrail entity / versioning missing | Guardrails | Policy model + version + evaluation snapshot | [026](./phase-2.7-decisions.md#adr-27-026--guardrail--policy-model) |
| F-20 | HIGH | Execution revalidation underspecified | AI | Hard revalidation at execute | [025](./phase-2.7-decisions.md#adr-27-025--ai-action-lifecycle--output-boundary) |
| F-21 | HIGH | Attribution amount / refunds / causality | Attribution | Line total; VOIDED on cancel; no causality | [028](./phase-2.7-decisions.md#adr-27-028--attribution-model-mvp), [022](./phase-2.7-decisions.md#adr-27-022--revenue-terminology) |
| F-22 | HIGH | Model reproducibility metadata absent | AI, Audit | Retain provider/model/schema/policy/snapshots; no CoT | [025](./phase-2.7-decisions.md#adr-27-025--ai-action-lifecycle--output-boundary) |
| F-23 | HIGH | Phase numbering conflict (2.x vs Phase-track) | Process | Dual legend | [033](./phase-2.7-decisions.md#adr-27-033--phase-numbering-legend) |
| F-24 | HIGH | Identity attribution concurrency / store scope | Identity | Atomic UPDATE + storeId | [009](./phase-2.7-decisions.md#adr-27-009--identity-attribution-concurrency) |
| F-25 | MEDIUM | Session 30m “tunable” vs hard rule | Identity | Fixed MVP constant | [008](./phase-2.7-decisions.md#adr-27-008--session-lifecycle-server-time) |
| F-26 | MEDIUM | Specs registry category vs subcategory key | Catalog | `(categoryId, subcategoryId\|null)` | [006](./phase-2.7-decisions.md#adr-27-006--specs-registry-key--validation-ownership) |
| F-27 | MEDIUM | Offer proposed/approved/redeemed conflation risk | AI, Commerce | Four distinct facts | [023](./phase-2.7-decisions.md#adr-27-023--offer-fact-separation) |
| F-28 | MEDIUM | Customer-facing AI leakage relies on prompts | Security | Structural projection boundary | [007](./phase-2.7-decisions.md#adr-27-007--domain-authorization-boundaries), [025](./phase-2.7-decisions.md#adr-27-025--ai-action-lifecycle--output-boundary) |
| F-29 | MEDIUM | Word collision “attribution” | Identity, Revenue | Qualified terms | [028](./phase-2.7-decisions.md#adr-27-028--attribution-model-mvp) |
| F-30 | MEDIUM | Prisma cannot express all invariants | Schema | Raw SQL migrations allowed | [031](./phase-2.7-decisions.md#adr-27-031--prisma-compatibility) |
| F-31 | MEDIUM | PROJECT-CONTEXT empty | Process | Filled | meta |
| F-32 | LOW | Accepted vs Finalized label variance | Process | 2.7 supersession banners | — |

---

## 4. Cross-cutting principle

[`ADR-2.7-001`](./phase-2.7-decisions.md#adr-27-001--historical-truth-principle) (Historical Truth) is the lens used to resolve snapshot questions across Product, OrderItem, Opportunity, and Attribution.

---

## 5. Unresolved / deferred (non-critical)

These do **not** block Phase 3 schema design:

| Item | Notes |
|---|---|
| Full refund / chargeback accounting | Deferred; CANCELLED → VOID attribution is enough for MVP |
| Net revenue after fees | Deferred ([ADR-2.7-022](./phase-2.7-decisions.md#adr-27-022--revenue-terminology)) |
| Event retention beyond 90 days / legal anonymization UX | Deferred ([ADR-2.7-014](./phase-2.7-decisions.md#adr-27-014--event-retention-mvp)) |
| Guest checkout / anonymous cart | Explicitly out of MVP |
| Multi-store | Deferred; unique merchantId remains |
| Spec registry in DB | Still app Zod ([ADR-2.7-006](./phase-2.7-decisions.md#adr-27-006--specs-registry-key--validation-ownership)) |
| Abandoned-checkout notification channels | Still deferred from 2.5 |
| Incremental / causal revenue methodology | Explicitly out of scope |

---

## 6. Final resolution table

| ID | Issue | Resolution | Status |
|---|---|---|---|
| F-01 | Merchant↔Store 1:1 policy-only | DB unique | RESOLVED |
| F-02 | GST OPEN-1 | GST-A; indicative contribution | RESOLVED |
| F-03 | Payment 1:1 vs N attempts | PaymentAttempt 1:N | RESOLVED |
| F-04 | Inventory concurrency vague | Conditional decrement in PAID txn | RESOLVED |
| F-05 | Webhook/idempotency missing | Provider event idempotency | RESOLVED |
| F-06 | Attribution window/multi-action | 7d + last-touch | RESOLVED |
| F-07 | Action lifecycle pollution | Decision-only states | RESOLVED |
| F-08 | Opportunity detection | Deterministic → Opportunity | RESOLVED |
| F-09 | Frequency races | DB unique ledger | RESOLVED |
| F-10 | requiredConstraints | Removed | RESOLVED |
| F-11 | Premature Finalized | Superseded by 2.7 | RESOLVED |
| F-12 | Slug uniqueness | Per-store unique | RESOLVED |
| F-13 | Subcategory/category mismatch | Composite ownership | RESOLVED |
| F-14 | Product delete | Archive if referenced | RESOLVED |
| F-15 | Cart invariants | States + uniques | RESOLVED |
| F-16 | Order/Payment ordering | PENDING then PAID | RESOLVED |
| F-17 | Event trust / PURCHASE | Trust classes | RESOLVED |
| F-18 | Event time/index/retention | Defined | RESOLVED |
| F-19 | Guardrail versioning | Policy + snapshot | RESOLVED |
| F-20 | Execute revalidation | Mandatory hard checks | RESOLVED |
| F-21 | Attribution amount/refunds | Line total; VOIDED | RESOLVED |
| F-22 | Model metadata | Retained; no CoT | RESOLVED |
| F-23 | Phase numbering | Dual legend | RESOLVED |
| F-24 | Identity attribution races | Atomic + storeId | RESOLVED |
| F-25–F-32 | Medium/low items | See ADRs / meta | RESOLVED |

**Critical unresolved issues: none.**

---

## 7. Architecture status

```text
READY FOR PHASE 3
```

Phase 3 may translate this freeze into PostgreSQL + Prisma without inventing critical domain rules. Remaining deferred items are explicitly non-blocking.

See also: [`phase-2-freeze-checklist.md`](./phase-2-freeze-checklist.md).
