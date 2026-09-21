# Archive

Documents that are no longer current. Kept for history, **not** for guidance.

> **For agents and readers:** nothing in this folder is authoritative. Do not
> implement from these documents. If one of them contradicts an active document,
> the active document wins without discussion.

| Document | Why it is here | Superseded by |
|---|---|---|
| [`plan-001-merchant-store-customer-identity.md`](./plan-001-merchant-store-customer-identity.md) | Intent doc written before the identity model was decided | [`identity-model.md`](../architecture/identity-model.md) + [ADR-2.7-008…010](../architecture/phase-2.7-decisions.md) |
| [`plan-002-product-catalog-inventory.md`](./plan-002-product-catalog-inventory.md) | Intent doc written before the catalog model was decided | [`product-catalog-model.md`](../architecture/product-catalog-model.md) + [ADR-2.7-003…006](../architecture/phase-2.7-decisions.md) |
| [`phase-2-freeze-checklist.md`](./phase-2-freeze-checklist.md) | One-time gate confirming Architecture Phase 2 was frozen. The gate passed on 2026-09-19 and cannot be un-passed | [`phase-2.7-architecture-review.md`](../architecture/phase-2.7-architecture-review.md) §6 |
| [`Phase-track.md`](./Phase-track.md) | The original breadth-first 1–14 ladder. Replaced by a milestone roadmap that builds the growth loop end-to-end first | [`ROADMAP.md`](../ROADMAP.md) |

The old 1–14 ladder maps onto the new phases as follows. It is recorded here
only so references in old commit messages stay readable.

| Old ladder | Now |
|---|---|
| 1 Merchant UI shell | Phase 3.0 (done) |
| 2 Data model | Architecture 2.1–2.8 (done) |
| 3 Database + Prisma | Phases 3.1–3.4 (done) |
| 4 Authentication | Phase 3.8 |
| 5 Product catalogue | Phases 3.3 (domain, done) + 3.19 (UI) |
| 6 Customer storefront | Phases 3.6, 3.9, 3.10 |
| 7 Activity tracking | Phase 3.7 |
| 8 AI Growth Agent | Phase 3.13 |
| 9 Agent actions + gating | Phases 3.12, 3.14, 3.15 |
| 10 Razorpay test payments | Phase 3.11 |
| 11 Notifications | Phase 3.21 |
| 12 Audit + analytics | Phases 3.16, 3.22 |
| 13 Testing + evaluation | Phases 3.11 (critical races) + 3.23 |
| 14 Production polish/demo | Phases 3.17, 3.25, 3.26 |
