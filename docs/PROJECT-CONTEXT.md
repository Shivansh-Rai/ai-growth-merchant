# Project Context — The Next Gen Store

**Repository:** `ai-merchant-growth`  
**Product:** AI-powered merchant growth platform for a single electronics storefront (MVP).

---

## What this repo is

A Next.js merchant dashboard (Phase 1 UI shell exists) plus architecture for an
agentic commerce system: identity → catalog → events → cart/order/payment →
AI growth → guardrails → audit → revenue attribution.

---

## Two phase numbering systems

Do **not** conflate these ([ADR-2.7-033](./architecture/phase-2.7-decisions.md#adr-27-033--phase-numbering-legend)):

| System | Where | Meaning |
|---|---|---|
| **Architecture 2.1–2.7** | `docs/architecture/*` | Domain design freeze |
| **Implementation 1–14** | [`Phase-track.md`](./Phase-track.md) | Build order |

After Architecture 2.7: **READY FOR PHASE 3** on the implementation track =
**Database + Prisma**.

---

## Authoritative architecture map

| Concern | Document |
|---|---|
| Decisions (ADRs) | [`architecture/phase-2.7-decisions.md`](./architecture/phase-2.7-decisions.md) |
| Review / findings | [`architecture/phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md) |
| Freeze checklist | [`architecture/phase-2-freeze-checklist.md`](./architecture/phase-2-freeze-checklist.md) |
| Identity (2.1) | [`architecture/identity-model.md`](./architecture/identity-model.md) |
| Catalog (2.2) | [`architecture/product-catalog-model.md`](./architecture/product-catalog-model.md) |
| Events + commerce (2.3–2.4) | [`architecture/activity-tracking.md`](./architecture/activity-tracking.md) |
| AI + guardrails + attribution (2.5–2.6) | [`architecture/growth-system-and-guardrails.md`](./architecture/growth-system-and-guardrails.md) |
| Intent plans | [`plans/`](./plans/) — superseded where Accepted/2.7 docs decide |
| Change log | [`CHANGELOG.md`](./CHANGELOG.md) |

**Rule:** one authoritative source per decision. If documents conflict, Phase 2.7 ADRs win.

---

## Confirmed product decisions (2.7)

- **GST:** MRP & selling GST-inclusive; cost GST-exclusive; profit = indicative contribution.
- **Revenue attribution:** 7-day window from `OFFER_VIEWED`; last-touch; amount = matched OrderItem line total; VOIDED on cancel.

---

## Next implementation work

1. Phase 3 — PostgreSQL + Prisma schema/migrations aligned to ADRs (including raw SQL for partial uniques / CHECKs where needed).
2. Do **not** invent domain rules during schema work — escalate gaps as ADRs.
3. Later: auth (Phase 4), catalogue UI, storefront, events, AI, Razorpay, etc. per Phase-track.
