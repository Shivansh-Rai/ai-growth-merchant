# Project Context — The Next Gen Store

**Repository:** `ai-merchant-growth`  
**Product:** A multi-merchant commerce platform with an AI growth layer. Each
Merchant gets one hosted Store; the MVP hosts a handful (electronics, dairy,
fruit & vegetable, utensils). Store is the tenant boundary.

---

## What this repo is

A Next.js merchant dashboard (Phase 1 UI shell exists) plus architecture for an
agentic commerce system: identity → catalog → events → cart/order/payment →
AI growth → guardrails → audit → revenue attribution.

The platform hosts several merchants. Every commerce and AI entity carries
`storeId`, and cross-entity references use composite `(storeId, id)` foreign
keys, so a child row structurally cannot point at another store's data
([ADR-2.7-003](./architecture/phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership)).

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
| Platform & AI surfaces (2.8) | [`architecture/phase-2.8-platform-decisions.md`](./architecture/phase-2.8-platform-decisions.md) |
| Review / findings | [`architecture/phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md) |
| Freeze checklist | [`architecture/phase-2-freeze-checklist.md`](./architecture/phase-2-freeze-checklist.md) |
| Identity (2.1) | [`architecture/identity-model.md`](./architecture/identity-model.md) |
| Catalog (2.2) | [`architecture/product-catalog-model.md`](./architecture/product-catalog-model.md) |
| Events + commerce (2.3–2.4) | [`architecture/activity-tracking.md`](./architecture/activity-tracking.md) |
| AI + guardrails + attribution (2.5–2.6) | [`architecture/growth-system-and-guardrails.md`](./architecture/growth-system-and-guardrails.md) |
| Intent plans | [`plans/`](./plans/) — superseded where Accepted/2.7 docs decide |
| Build progress | [`IMPLEMENTATION-STATUS.md`](./IMPLEMENTATION-STATUS.md) |
| Build order | [`Phase-track.md`](./Phase-track.md) |
| Change log | [`CHANGELOG.md`](./CHANGELOG.md) |

**Rule:** one authoritative source per decision. If documents conflict, Phase 2.8
ADRs win, then Phase 2.7. Phase 2.8 **extends** 2.7 and reverses none of it.

---

## Confirmed product decisions (2.7)

- **GST:** MRP & selling GST-inclusive; cost GST-exclusive; profit = indicative contribution.
- **Revenue attribution:** 7-day window from `OFFER_VIEWED`; last-touch; amount = matched OrderItem line total; VOIDED on cancel.

## Confirmed product decisions (2.8)

- **Tenancy:** many Merchants, one Store each. `Store.merchantId` stays UNIQUE.
- **Storefront routing:** path prefix `/s/[storeSlug]`; `storeId` derives from the route only.
- **Catalogue:** domain-agnostic and pack-based — one pack is one Product + one SKU, integer quantities, no unit of measure.
- **AI surfaces:** `AiAction.surface` set by the application, never the model. Cart and Checkout first, then Home; notifications are an in-app tray.
- **Guardrails:** an absent Policy applies no constraint; structural rules always apply; provisioning seeds a baseline policy set.

---

## Next implementation work

1. Phase 3 — PostgreSQL + Prisma. Schema exists and is multi-tenant-safe; the
   2.8 delta is `Store.slug`, `AiAction.surface` and its index.
2. Rework the seed into several stores per
   [ADR-2.8-010](./architecture/phase-2.8-platform-decisions.md#adr-28-010--demo-depth-per-store):
   one full growth loop, the rest catalog-depth.
3. Do **not** invent domain rules during schema work — escalate gaps as ADRs.
4. Later: auth (Phase 4), catalogue UI, storefront, events, AI, Razorpay, etc. per Phase-track.
