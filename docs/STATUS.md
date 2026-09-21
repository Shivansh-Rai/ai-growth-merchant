# Status

**Last updated:** 2026-09-21
**Next phase:** [3.5 — Identity & Sessions](./phases/m1-growth-loop/3.5-identity-and-sessions.md)

The single home for build progress. [`ROADMAP.md`](./ROADMAP.md) owns the plan;
[`phases/`](./phases/) owns the specs; this file owns what is actually done.

---

## Where the project is

```text
M0  Foundation      ████████████████████  5/5   ✅
M1  Growth loop     ░░░░░░░░░░░░░░░░░░░░  0/13
M2  Depth           ░░░░░░░░░░░░░░░░░░░░  0/6
M3  Demo            ░░░░░░░░░░░░░░░░░░░░  0/3
```

**Nothing runs in a browser yet.** The dashboard renders empty arrays and there
are no API routes. That changes at phase 3.6, which is the first phase with a
visible result.

---

## M0 — Foundation ✅

Record and carried-forward debt: [`phases/m0-foundation/`](./phases/m0-foundation/README.md)

| Phase | Name | Evidence |
|---|---|---|
| 3.0 | Merchant dashboard UI shell | `app/(dashboard)/*`, `components/*` |
| 3.1 | PostgreSQL + Prisma foundation | `prisma/schema.prisma`, `prisma/migrations/20260920133705_init_phase3_domain_model/` · commit `c23e24c` |
| 3.2 | Prisma client / server DB layer | `lib/prisma.ts` · commit `5226094` |
| 3.3 | Product domain slice | `lib/products/*`, `lib/catalog/spec-registry.ts` · commits `ef51d64`, `19b1810`, `eac4aa3` |
| 3.4 | Platform delta + multi-store seed | `prisma/migrations/20260921120000_phase_2_8_platform_delta/`, `prisma/seed-data/*`, `lib/catalog/spec-registry-stores.ts`, `scripts/verify-db.ts` |

**Seeded state:** 4 merchants, 4 stores, 54 products, 11 customers, 10 orders,
15 policies. `npm run db:verify` — 22 passed, 0 failed.

| Store | Route | Products | Depth |
|---|---|---|---|
| The Next Gen Store | `/s/next-gen-electronics` | 15 | full growth loop (seeded) |
| Daily Dairy | `/s/daily-dairy` | 13 | catalog-depth |
| Fresh Harvest | `/s/fresh-harvest` | 13 | catalog-depth |
| Copper & Clay | `/s/copper-and-clay` | 13 | catalog-depth |

> The electronics store's growth-loop rows are **seeded, not generated**. No
> opportunity detector, model call, guardrail engine or attribution engine
> exists yet — phases 3.12–3.16 replace that fabricated data with real output.

---

## M1 — Growth loop

| Phase | Name | Spec | Status |
|---|---|---|---|
| [3.5](./phases/m1-growth-loop/3.5-identity-and-sessions.md) | Identity & sessions | READY | ⏳ **next** |
| [3.6](./phases/m1-growth-loop/3.6-store-context-and-storefront.md) | Store context + storefront shell | READY | ⏳ |
| [3.7](./phases/m1-growth-loop/3.7-event-ingestion.md) | Event ingestion | READY | ⏳ |
| [3.8](./phases/m1-growth-loop/3.8-authentication.md) | Authentication | READY | ⏳ |
| [3.9](./phases/m1-growth-loop/3.9-cart.md) | Cart | READY | ⏳ |
| [3.10](./phases/m1-growth-loop/3.10-checkout-and-order.md) | Checkout → Order | DRAFT | ⏳ |
| [3.11](./phases/m1-growth-loop/3.11-payment-inventory-purchase.md) | Payment, inventory, PURCHASE | DRAFT | ⏳ |
| [3.12](./phases/m1-growth-loop/3.12-opportunity-detection.md) | Opportunity detection | DRAFT | ⏳ |
| [3.13](./phases/m1-growth-loop/3.13-ai-action-generation.md) | AI action generation | DRAFT | ⏳ |
| [3.14](./phases/m1-growth-loop/3.14-guardrail-engine.md) | Guardrail engine | DRAFT | ⏳ |
| [3.15](./phases/m1-growth-loop/3.15-surface-rendering.md) | Surface rendering + exposure | DRAFT | ⏳ |
| [3.16](./phases/m1-growth-loop/3.16-attribution.md) | Attribution + dashboard figure | DRAFT | ⏳ |
| [3.17](./phases/m1-growth-loop/3.17-deploy.md) | Deploy + demo | DRAFT | ⏳ |

READY = implement directly. DRAFT = expand to READY first (see
[`phases/README.md`](./phases/README.md#spec-maturity)).

## M2 — Depth · M3 — Demo

Not started. [`m2-depth/`](./phases/m2-depth/README.md) ·
[`m3-demo/`](./phases/m3-demo/README.md)

---

## Known debt

| # | Item | Where | Clears in |
|---|---|---|---|
| ⚠️ D-4 | **CFT-1** `ProductStatus` merges lifecycle with availability | `types/index.ts:34` | 3.19 |
| ⚠️ D-5 | **CFT-2** `LOW_STOCK_THRESHOLD = 20` hardcoded in the view | `components/products/products-view.tsx:38` | 3.19 |
| ⚠️ D-6 | **CFT-3** money as rupee `number`, not integer paise | `types/index.ts:41`, `lib/format.ts` | 3.19 |
| ⚠️ D-7 | **CFT-4…8** UI types missing `storeId`, slug, three prices, lookups, images, specs | `types/index.ts` | 3.19 |
| ⚠️ D-8 | Merchant identity hardcoded | `lib/merchant.ts:14` | 3.8 |
| ⚠️ D-9 | Dashboard renders `[]` — not wired to the database | `app/(dashboard)/*/page.tsx` | 3.19 |
| ⚠️ D-10 | No API routes exist | `app/` | 3.6 onward |
| ⚠️ D-11 | No test runner, no tests | `package.json` | 3.11 (races), 3.23 (breadth) |
| ⚠️ D-12 | Analytics metric definitions undocumented | — | before 3.22 |
| ⚠️ D-14 | Seed takes >2 min — hundreds of sequential upserts | `prisma/seed.ts` | when it becomes painful |
| ⚠️ D-15 | README lists "Recommendation" as an AI action type; `AiActionType` has no such value | `README.md:271` | next README pass |
| ✅ D-1 | ~~2.8 schema delta not applied~~ | — | cleared in 3.4 |
| ✅ D-2 | ~~Seed is single-store~~ | — | cleared in 3.4 |
| ✅ D-3 | ~~Spec registry covers one store only~~ | — | cleared in 3.4 |
| ✅ D-13 | ~~`npm run lint` failed with 772 generated-client errors~~ | `eslint.config.mjs` | cleared in 3.4 |

CFT items are catalogued in
[`product-catalog-model.md` §14](./architecture/product-catalog-model.md#14-conflicts-with-the-current-implementation).

---

## Phase numbering change (2026-09-21)

The old three-level numbering was renumbered flat. Old commit messages and
CHANGELOG entries use the left column.

| Was | Now |
|---|---|
| Phase 1 | 3.0 |
| Phase 3.1 | 3.1 |
| Phase 3.2.1 | 3.2 |
| Phase 3.2.2 | 3.3 |
| Phase 3.2.3 | 3.4 |
| Phase 3.2.4 (planned) | 3.5 |

The old 1–14 implementation ladder is retired; its full mapping is in
[`archive/README.md`](./archive/README.md).

---

## Closing a phase

1. Run the phase's Acceptance section; paste real output
2. Flip its row here to ✅ with file evidence and the commit
3. Clear any debt rows it resolved
4. Add a [`CHANGELOG.md`](./CHANGELOG.md) entry
5. Bump **Last updated** and **Next phase**

If a phase surfaces a domain question the architecture does not answer, **stop
and raise an ADR** — do not decide it in the service (CLAUDE.md §21).
