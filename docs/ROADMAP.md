# Roadmap

**What order the work happens in, and why.**
Progress lives in [`STATUS.md`](./STATUS.md). Phase specs live in
[`phases/`](./phases/). This file owns the *plan*, nothing else.

---

## The organising decision

The project is built **vertical slice first**: one store runs the entire growth
loop, deployed and demonstrable, before anything is broadened.

This replaces the original breadth-first 1–14 ladder ([archived](./archive/Phase-track.md)),
which finished each layer before starting the next and left the AI growth loop —
the thing the project is named after — until very late.

The reason is concrete. As of the reorder the repository held **5,588 lines of
architecture docs, 3,936 lines of fabricated seed data, and 1,112 lines of
domain logic**, with zero API routes and nothing that ran. The seed manufactured
AI actions, guardrail evaluations and attribution records that no engine had
ever produced. Architecture that has never executed is a hypothesis, and three
of the project's strongest technical stories — inventory concurrency, webhook
idempotency, the frequency ledger — were designed but never run.

**M1 exists to convert those hypotheses into evidence.** Everything else waits.

---

## Milestones

| | Milestone | Goal | Exit condition |
|---|---|---|---|
| **M0** | Foundation | Database and domain groundwork | ✅ Complete |
| **M1** | **Growth loop** | One store runs browse → cart → AI cross-sell → guardrail → exposure → pay → attribution | A deployed URL where the loop can be walked end-to-end, and the merchant dashboard shows a real attributed-revenue figure |
| **M2** | Depth | Broaden what M1 proved | More action types and surfaces, merchant catalogue UI, analytics, test coverage |
| **M3** | Demo | Hardening and presentation | README with a demo GIF, error handling, evaluation notes |

---

## M0 — Foundation ✅

Record: [`phases/m0-foundation/`](./phases/m0-foundation/README.md)

| Phase | Name | Status |
|---|---|---|
| 3.0 | Merchant dashboard UI shell | ✅ |
| 3.1 | PostgreSQL + Prisma foundation | ✅ |
| 3.2 | Prisma client / server DB layer | ✅ |
| 3.3 | Product domain slice | ✅ |
| 3.4 | Platform delta + multi-store seed | ✅ |

---

## M1 — Growth loop

The order is chosen so something **runs in a browser as early as possible**
(phase 3.6) and every phase after that adds a visible capability.

| Phase | Name | Spec | Why here |
|---|---|---|---|
| [3.5](./phases/m1-growth-loop/3.5-identity-and-sessions.md) | Identity & sessions | READY | Everything downstream needs a Session to hang events off |
| [3.6](./phases/m1-growth-loop/3.6-store-context-and-storefront.md) | Store context + storefront shell | READY | First phase where the app *runs*. Anonymous browsing at `/s/[storeSlug]` |
| [3.7](./phases/m1-growth-loop/3.7-event-ingestion.md) | Event ingestion | READY | Behaviour must be recorded before opportunities can be detected |
| [3.8](./phases/m1-growth-loop/3.8-authentication.md) | Authentication | READY | Cart requires an authenticated Customer (CO-1, CO-2) |
| [3.9](./phases/m1-growth-loop/3.9-cart.md) | Cart | READY | |
| [3.10](./phases/m1-growth-loop/3.10-checkout-and-order.md) | Checkout → Order (PENDING) | DRAFT | |
| [3.11](./phases/m1-growth-loop/3.11-payment-inventory-purchase.md) | Payment, inventory decrement, PURCHASE | DRAFT | The correctness-critical phase. Carries the race and idempotency tests |
| [3.12](./phases/m1-growth-loop/3.12-opportunity-detection.md) | Opportunity detection | DRAFT | Deterministic, no model involved |
| [3.13](./phases/m1-growth-loop/3.13-ai-action-generation.md) | AI action generation | DRAFT | First actual model call |
| [3.14](./phases/m1-growth-loop/3.14-guardrail-engine.md) | Guardrail engine + frequency ledger | DRAFT | |
| [3.15](./phases/m1-growth-loop/3.15-surface-rendering.md) | Surface rendering + OFFER_* events | DRAFT | CART and CHECKOUT only |
| [3.16](./phases/m1-growth-loop/3.16-attribution.md) | Attribution + dashboard figure | DRAFT | Closes the loop |
| [3.17](./phases/m1-growth-loop/3.17-deploy.md) | Deploy + demo walkthrough | DRAFT | The exit condition |

**M1 deliberately builds the thinnest real version of each step.** One action
type (`CROSS_SELL`), two surfaces (`CART`, `CHECKOUT`), one store
(`next-gen-electronics`), one opportunity rule. Minimal is not fake — every
piece is real code running against real constraints.

---

## M2 — Depth

Expanded to READY when reached. Scope is set; contracts are not.

| Phase | Name | Scope |
|---|---|---|
| 3.18 | Catalog lookup services | `createCategory` / `createSubcategory` / `createBrand` + list/archive. Only the seed writes these today |
| 3.19 | Merchant catalogue UI | Wire the dashboard to the product domain; clears debt D-4…D-7 (the CFT conflicts in `types/index.ts`) |
| 3.20 | More action types + surfaces | `UPSELL`, `SUBSTITUTION`; `HOME` and `PRODUCT_DETAIL` surfaces |
| 3.21 | In-app notification tray | The `NOTIFICATION` surface ([ADR-2.8-007](./architecture/phase-2.8-platform-decisions.md#adr-28-007--notification-surface--off-session-exposure)) |
| 3.22 | Analytics + audit UI | Postgres queries over indexed data only — no materialized metric columns ([ADR-2.7-032](./architecture/phase-2.7-decisions.md#adr-27-032--scalability-boundaries-not-built)). Needs the metric-definitions doc first (debt D-12) |
| 3.23 | Test coverage | Beyond the critical races already covered in 3.11: guardrails, attribution, isolation |

---

## M3 — Demo

| Phase | Name | Scope |
|---|---|---|
| 3.24 | Seed depth | Grow the three catalog-depth stores if the demo needs it |
| 3.25 | README + demo GIF | The 30-second version of the loop |
| 3.26 | Hardening | Error boundaries, empty states, rate limits, final pass |

---

## What is deliberately not on this roadmap

From [ADR-2.8-009](./architecture/phase-2.8-platform-decisions.md#adr-28-009--platform-boundaries-and-non-goals)
and the Phase 2 deferrals. Listed so nobody re-proposes them as "quick wins":

Merchant settlement, payouts, Razorpay Route, platform commission · platform-admin
actor · cross-store analytics or identity · multi-store per merchant ·
unit-of-measure pricing · expiry / perishability · GST rate engine · guest
checkout · email / SMS / push channels · Kafka, Redis, Elasticsearch, a
warehouse, event sourcing, microservices · incremental or causal revenue
methodology · delivery slots, riders, serviceability.
