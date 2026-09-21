# M0 — Foundation ✅

Database and domain groundwork. All phases complete; this is the record, not a
specification. Full evidence lives in [`STATUS.md`](../../STATUS.md).

| Phase | Name | Shipped |
|---|---|---|
| 3.0 | Merchant dashboard UI shell | 8 routes, component system, empty states. **Not wired to the database** — debt D-9 |
| 3.1 | PostgreSQL + Prisma foundation | 22 models, 5 partial unique indexes, ~30 CHECK constraints, deterministic seed |
| 3.2 | Prisma client / server DB layer | `lib/prisma.ts` |
| 3.3 | Product domain slice | create / update / archive / get / list, Zod validation, spec registry, typed domain errors |
| 3.4 | Platform delta + multi-store seed | `Store.slug`, `AiAction.surface`, 4 merchants × 1 store, 22-assertion `db:verify` |

## What M0 established that later phases rely on

These are load-bearing. Phases in M1 assume them and should not re-litigate them.

**Store isolation is structural, not conventional.** Every store-scoped entity
carries `storeId`, and cross-entity references use composite `(storeId, id)`
foreign keys, so a child row cannot point at another store's data even if the
application forgets to filter. Domain services take `storeId` as an explicit
required argument and look up through `storeId_id` composite keys.

**PostgreSQL holds the invariants the application cannot.** Partial unique
indexes (one ACTIVE cart per customer, one SUCCEEDED payment attempt per order,
one PURCHASE event per order, one OPEN opportunity per dedupe key, one live
attribution record per order) and CHECK constraints (non-negative stock,
`sellingPrice <= mrp`, surface matches decision, payload size) are the final
authority under concurrency. Zod gives good error messages; the constraint is
what makes the rule true.

**Derived facts are never stored.** No `availability` column, no order total, no
session-ended flag. Each is computed from its source every time.

**Money is integer paise**, INR only, no currency column.

## Known debt carried into M1

| # | Item | Clears in |
|---|---|---|
| D-4…D-7 | `types/index.ts` still carries the CFT conflicts: `ProductStatus` merges lifecycle with availability, money is rupee `number`, no `storeId`, no three prices | 3.19 |
| D-8 | Merchant identity hardcoded in `lib/merchant.ts` | 3.8 |
| D-9 | Dashboard renders `[]` — not wired to the database | 3.19 |
| D-10 | No API routes exist | 3.6 onward |
| D-11 | No test runner, no tests | 3.11 (critical races), 3.23 (breadth) |
| D-12 | Analytics metric definitions undocumented | before 3.22 |
| D-14 | Seed takes >2 min — hundreds of sequential upserts | when it becomes painful |
