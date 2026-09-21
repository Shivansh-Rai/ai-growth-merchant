# Phases — how to read and execute one

A **phase** is one implementable slice. One phase = one file = one session of
work = one commit.

Asking an agent **"implement phase 3.7"** should require no other instruction.
Everything it needs is in that phase's file, or linked from it.

---

## Numbering

There are exactly **two** numbering systems in this project, and their leading
digit tells them apart ([ADR-2.7-033](../architecture/phase-2.7-decisions.md#adr-27-033--phase-numbering-legend)):

| System | Range | Meaning |
|---|---|---|
| **Architecture** | `2.1` – `2.8` | Domain design documents in [`architecture/`](../architecture/) |
| **Implementation** | `3.1` – `3.x` | Build phases in this folder |

The old 1–14 implementation ladder is retired; its mapping lives in
[`archive/README.md`](../archive/README.md).

**Milestones** (`m0`–`m3`) are folders that group phases. They are not part of a
phase number — phase `3.7` is phase `3.7` wherever it sits.

| Milestone | Folder | Goal |
|---|---|---|
| M0 Foundation | [`m0-foundation/`](./m0-foundation/) | Database and domain groundwork |
| M1 Growth loop | [`m1-growth-loop/`](./m1-growth-loop/) | **One store runs the whole loop, deployed** |
| M2 Depth | [`m2-depth/`](./m2-depth/) | Broaden what M1 proved |
| M3 Demo | [`m3-demo/`](./m3-demo/) | Hardening and presentation |

Filename: `<number>-<kebab-name>.md`, e.g. `3.7-event-ingestion.md`.

---

## Spec maturity

Not every phase is specified to the same depth, and pretending otherwise would
mean inventing contracts for code whose dependencies do not exist yet.

| Marker | Meaning |
|---|---|
| **READY** | Full contracts. Implement directly |
| **DRAFT** | Scope, authority and acceptance are set; contracts are finalised just before implementation |

Implementing a DRAFT phase has one extra first step: expand it to READY, then
implement. That expansion is a legitimate part of the work, not a detour.

---

## The contract

Every phase file carries these sections, in this order.

| Section | What it answers |
|---|---|
| **Status** | READY or DRAFT, and which phases must be done first |
| **Goal** | One sentence. What is true after this phase that was not before |
| **Authority** | The exact ADRs and invariants that govern this phase |
| **Files** | Every path to create or modify. No others |
| **Contracts** | Exact TypeScript signatures for the public surface |
| **Invariants to enforce** | Numbered rules this code must uphold |
| **Out of scope** | What this phase explicitly does not build |
| **Acceptance** | Commands to run and what they must print |
| **Done when** | The checklist that closes the phase |

---

## Rules for the implementing agent

These are not style preferences. Each one exists because breaking it has a
specific cost.

1. **Read the Authority links before writing code.** The architecture is frozen
   and it already answers most design questions. Re-deriving them produces
   different answers each time.

2. **Touch only the files listed.** If the work genuinely needs another file,
   stop and say so — an unplanned file is usually a sign the phase boundary was
   drawn wrong.

3. **Never invent domain behaviour.** If the architecture does not answer a
   question the phase needs, stop, state the options, and ask. Then record the
   answer as an ADR amendment before continuing (CLAUDE.md §21). Silent
   invention is how a second source of truth is born.

4. **`storeId` comes from the route or the authenticated merchant. Never from
   client input.** ([PLT-3](../architecture/phase-2.8-platform-decisions.md#platform-invariants))

5. **Zod at the boundary, PostgreSQL as final authority.** Application
   validation gives good errors; the database constraint is what makes the
   invariant true under concurrency.

6. **Money is integer paise everywhere.** No floats, no rupees, no exceptions.

7. **Run the Acceptance section before claiming the phase is done.** Paste the
   real output. If something fails, say so with the output rather than
   describing it as working.

8. **Close the phase properly**: tick it in [`STATUS.md`](../STATUS.md), add a
   [`CHANGELOG.md`](../CHANGELOG.md) entry, and clear any debt rows it resolved.

---

## Definition of done (every phase)

Inherited by all phases; individual phases add to it, never subtract.

- [ ] Behaviour traces to a named ADR or invariant — nothing invented
- [ ] Zod at the boundary; database constraints for concurrency-safe invariants
- [ ] Store isolation: `storeId` explicit, composite lookups, no cross-store read
- [ ] Typed domain errors — no silent fallbacks that hide bugs
- [ ] Merchant-only fields (cost, margin, contribution, rationale, confidence)
      absent from every customer-facing projection
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run db:verify` passes
- [ ] Phase Acceptance section passes, with output pasted
- [ ] `STATUS.md` and `CHANGELOG.md` updated

---

## Template

```markdown
# Phase 3.X — <Name>

**Status:** DRAFT | READY
**Milestone:** M<n> <name>
**Requires:** 3.a, 3.b
**Unlocks:** 3.c

## Goal
<One sentence.>

## Authority
| Rule | Source |
|---|---|
| <what it governs> | [ADR-2.7-0XX](...) |

## Files
| Path | Action | Purpose |
|---|---|---|
| `lib/...` | create | ... |

## Contracts
​```ts
export async function doThing(input: DoThingInput): Promise<Thing>;
​```

## Invariants to enforce
| # | Rule | Enforced by |
|---|---|---|

## Out of scope
- ...

## Acceptance
​```bash
npm run db:verify
​```
Must print: ...

## Done when
- [ ] ...
```
