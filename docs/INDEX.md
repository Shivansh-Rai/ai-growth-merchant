# Documentation index

Start here. Every active document in the project, and what it is for.

## If you are about to write code

1. [`STATUS.md`](./STATUS.md) — what is done, what is next
2. The phase spec in [`phases/`](./phases/README.md) — your instructions
3. The ADRs that phase links to — the rules you must not break

Asking an agent **"implement phase 3.7"** should need nothing else.

---

## Active documents

| Document | Owns | Read when |
|---|---|---|
| [`../README.md`](../README.md) | What the project is and why | First contact |
| [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md) | Orientation and the authority map | Getting oriented |
| [`ROADMAP.md`](./ROADMAP.md) | The plan and its ordering rationale | Deciding what comes next |
| [`STATUS.md`](./STATUS.md) | Progress and known debt | Every session |
| [`phases/README.md`](./phases/README.md) | How to read and execute a phase | Before your first phase |
| [`phases/`](./phases/) | One implementable spec per phase | Implementing |
| [`CHANGELOG.md`](./CHANGELOG.md) | Dated record of decisions and changes | Reconstructing history |
| [`architecture/`](./architecture/) | The frozen domain model | Before any domain work |
| [`archive/`](./archive/README.md) | Superseded documents | Almost never |

## Architecture

Ordered by authority. When two documents disagree, the higher one wins.

| Document | Scope |
|---|---|
| [`phase-2.8-platform-decisions.md`](./architecture/phase-2.8-platform-decisions.md) | **Highest.** Multi-merchant tenancy, storefront routing, catalogue unit model, AI surfaces, notification exposure, policy-absence semantics. ADR-2.8-001…010, PLT-1…10 |
| [`phase-2.7-decisions.md`](./architecture/phase-2.7-decisions.md) | Everything else. ADR-2.7-001…033 |
| [`phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md) | The 32 findings that produced the 2.7 ADRs. Rationale, not rules |
| [`identity-model.md`](./architecture/identity-model.md) | Merchant, Store, Customer, Session, Event ownership. INV-1…10 |
| [`product-catalog-model.md`](./architecture/product-catalog-model.md) | Product, pricing, inventory, classification, specs. PRD-1…19 |
| [`activity-tracking.md`](./architecture/activity-tracking.md) | Events and commerce. EV-1…10, CO-1…15 |
| [`growth-system-and-guardrails.md`](./architecture/growth-system-and-guardrails.md) | AI, guardrails, attribution, audit. AI-1…11, GR-1…12 |

Phase 2.8 **extends** 2.7 and reverses none of it. The four domain documents
predate both and carry supersession banners pointing at the ADRs.

---

## Numbering

Exactly two systems, told apart by their leading digit
([ADR-2.7-033](./architecture/phase-2.7-decisions.md#adr-27-033--phase-numbering-legend)):

| System | Range | Where |
|---|---|---|
| **Architecture** | `2.1` – `2.8` | [`architecture/`](./architecture/) |
| **Implementation** | `3.1` – `3.x` | [`phases/`](./phases/) |

Milestones `M0`–`M3` group implementation phases but are not part of a phase
number. The old 1–14 ladder is retired — see [`archive/`](./archive/README.md).

---

## Invariant prefixes

Cited throughout the phase specs. Each is a numbered, testable rule.

| Prefix | Domain | Source |
|---|---|---|
| `INV-*` | Identity and ownership | [identity-model §7](./architecture/identity-model.md) |
| `PRD-*` | Product and catalog | [product-catalog-model §13](./architecture/product-catalog-model.md) |
| `EV-*` | Events | [activity-tracking §5.12](./architecture/activity-tracking.md) |
| `CO-*` | Commerce | [activity-tracking §6.18](./architecture/activity-tracking.md) |
| `AI-*` | AI behaviour | [growth §41](./architecture/growth-system-and-guardrails.md) |
| `GR-*` | Guardrails and attribution | [growth §42](./architecture/growth-system-and-guardrails.md) |
| `PLT-*` | Platform and tenancy | [phase-2.8 §invariants](./architecture/phase-2.8-platform-decisions.md#platform-invariants) |
| `CFT-*` | Known UI/model conflicts | [product-catalog-model §14](./architecture/product-catalog-model.md#14-conflicts-with-the-current-implementation) |
| `D-*` | Implementation debt | [STATUS.md](./STATUS.md#known-debt) |

---

## The one rule

**One fact, one authoritative home.** Every document here owns something, and
nothing is owned twice. If you find the same fact stated authoritatively in two
places, that is a bug in the documentation — fix it rather than keeping both in
sync.
