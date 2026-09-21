# Project Context — The Next Gen Store

**Repository:** `ai-merchant-growth`
**Product:** A multi-merchant commerce platform with an AI growth layer. Each
Merchant gets one hosted Store; the MVP hosts four (electronics, dairy, fruit &
vegetable, utensils). Store is the tenant boundary.

Full documentation map: [`INDEX.md`](./INDEX.md).
What the product is and why: [`../README.md`](../README.md).

---

## What this repo is

A Next.js merchant dashboard plus a storefront, over a PostgreSQL domain model
built from a frozen architecture: identity → catalog → events → cart / order /
payment → AI growth → guardrails → audit → revenue attribution.

The platform hosts several merchants. Every commerce and AI entity carries
`storeId`, and cross-entity references use composite `(storeId, id)` foreign
keys, so a child row structurally cannot point at another store's data
([ADR-2.7-003](./architecture/phase-2.7-decisions.md#adr-27-003--store-isolation--composite-ownership)).

---

## How the work is organised

| Concern | Document |
|---|---|
| Documentation map | [`INDEX.md`](./INDEX.md) |
| The plan | [`ROADMAP.md`](./ROADMAP.md) |
| Progress and debt | [`STATUS.md`](./STATUS.md) |
| Implementable specs | [`phases/`](./phases/README.md) |
| Frozen architecture | [`architecture/`](./architecture/) |
| Decision history | [`CHANGELOG.md`](./CHANGELOG.md) |
| Superseded documents | [`archive/`](./archive/README.md) |

**Rule:** one authoritative source per decision. If documents conflict, Phase 2.8
ADRs win, then Phase 2.7. Phase 2.8 extends 2.7 and reverses none of it.

Two numbering systems only — architecture `2.x`, implementation `3.x`
([ADR-2.7-033](./architecture/phase-2.7-decisions.md#adr-27-033--phase-numbering-legend)).

---

## Confirmed product decisions

**Phase 2.7**

- **GST:** MRP and selling price GST-inclusive; cost GST-exclusive; profit is *indicative contribution*.
- **Revenue attribution:** 7-day window from `OFFER_VIEWED`; last-touch; amount = matched OrderItem line total; VOIDED on cancel.

**Phase 2.8**

- **Tenancy:** many Merchants, one Store each. `Store.merchantId` stays UNIQUE.
- **Storefront routing:** path prefix `/s/[storeSlug]`; `storeId` derives from the route only.
- **Catalogue:** domain-agnostic and pack-based — one pack is one Product + one SKU, integer quantities, no unit of measure.
- **AI surfaces:** `AiAction.surface` set by the application, never the model. Cart and Checkout first, then Home; notifications are an in-app tray.
- **Guardrails:** an absent Policy applies no constraint; structural rules always apply; provisioning seeds a baseline policy set.

---

## Current state

M0 Foundation is complete: schema, migrations, product domain, four seeded
stores, 22 verification assertions.

**Nothing runs in a browser yet** — the dashboard renders empty arrays and there
are no API routes. Phase 3.6 changes that.

The work is ordered **vertical slice first**: one store runs the entire growth
loop, deployed, before anything is broadened. The reasoning is in
[`ROADMAP.md`](./ROADMAP.md#the-organising-decision).

**Next:** [phase 3.5 — Identity & Sessions](./phases/m1-growth-loop/3.5-identity-and-sessions.md).
