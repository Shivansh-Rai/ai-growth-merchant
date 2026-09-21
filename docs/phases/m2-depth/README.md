# M2 — Depth

**Not started.** Begins only when M1's exit condition is met: the growth loop
runs end-to-end on a deployed URL.

Phases 3.18–3.23. Scope is set in [`ROADMAP.md`](../../ROADMAP.md#m2--depth);
contracts are written when each phase is reached.

## The rule for this milestone

M2 broadens what M1 proved. If a phase here cannot name the M1 phase it extends,
it does not belong in M2.

| Phase | Extends |
|---|---|
| 3.18 Catalog lookup services | 3.3 product domain |
| 3.19 Merchant catalogue UI | 3.3, and clears debt D-4…D-7, D-9 |
| 3.20 More action types + surfaces | 3.13, 3.15 |
| 3.21 In-app notification tray | 3.15 |
| 3.22 Analytics + audit UI | 3.16 |
| 3.23 Test coverage | 3.11's test runner |

## Before 3.22

Debt D-12: the analytics metric definitions are undocumented. Write them — what
each dashboard number means and which query produces it — before building the UI
that displays them. Otherwise the definitions end up living in JSX, which is the
second-source-of-truth failure the architecture exists to prevent.
