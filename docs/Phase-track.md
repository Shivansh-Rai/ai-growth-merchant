# Phase Track — the build ladder

This file owns the **order** phases happen in. It does **not** track progress:
[`IMPLEMENTATION-STATUS.md`](./IMPLEMENTATION-STATUS.md) is the single home for
what is done, in progress and outstanding. Keeping status in two places would
give one fact two homes.

> **Numbering note (Phase 2.7):** Architecture phases **2.1–2.8** (domain design)
> are separate from this implementation ladder. Architecture Phase 2 is
> **frozen and READY FOR PHASE 3** (this file’s Phase 3 = Database + Prisma).
> See [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md) and
> [`architecture/phase-2.7-decisions.md`](./architecture/phase-2.7-decisions.md)
> (ADR-2.7-033).
>
> **Phase 2.8 (2026-09-21)** extends the freeze for the multi-merchant platform
> and AI surfaces — [`architecture/phase-2.8-platform-decisions.md`](./architecture/phase-2.8-platform-decisions.md).
> It reverses no ADR. The ladder below is unchanged; the storefront (Phase 6)
> is now served under `/s/[storeSlug]`, and AI surfaces (Phase 9) ship Cart and
> Checkout before Home.

```text
PHASE 1  → Merchant UI shell
PHASE 2  → Product + Customer data model      (architecture freeze via 2.1–2.8)
PHASE 3  → Database + Prisma                  (domain slices numbered 3.x)
PHASE 4  → Authentication + merchant accounts
PHASE 5  → Product catalogue
PHASE 6  → Customer storefront                 /s/[storeSlug]
PHASE 7  → Customer activity tracking
PHASE 8  → AI Growth Agent
PHASE 9  → Agent actions + rules/gating        Cart + Checkout, then Home
PHASE 10 → Razorpay test payments
PHASE 11 → Notifications                       in-app tray for MVP
PHASE 12 → Audit trail + analytics
PHASE 13 → Testing + evaluation
PHASE 14 → Production polish/demo
```

**Current status:** [`IMPLEMENTATION-STATUS.md`](./IMPLEMENTATION-STATUS.md)
