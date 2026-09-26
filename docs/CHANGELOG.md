# Changelog

Notable decisions and changes, newest first. Architecture entries link to the
document that holds the decision; the document, not this file, is authoritative.

---

## 2026-09-27

### Implementation — Phase 3.7: Event ingestion

Behaviour is now recorded: immutable, per-type-validated Events with server
`receivedAt`, and no way for a browser to create a `PURCHASE`.

**Created**

- `lib/events/payload-schemas.ts` — one `.strict()` Zod schema per type
  (activity-tracking §5.5, EV-10); string lengths bounded so no payload nears
  16 KiB. `CLIENT_SUBMITTABLE` = SEARCH, PRODUCT_VIEW, PRODUCT_CLICK, CART_VIEW,
  OFFER_*. **Also excluded besides PURCHASE:** ADD_TO_CART, REMOVE_FROM_CART,
  CHECKOUT_STARTED — they are consequences of server-side commerce mutations
  (ADR-2.7-011) emitted by 3.9/3.10 with server-known ids and prices
- `lib/events/record-event.ts` — `recordEvent`, the single write path for all
  types but PURCHASE. Server `receivedAt` only; 16 KiB check before the DB
  CHECK; `aiActionId` required exactly on OFFER_*; `orderId` only on
  CHECKOUT_STARTED; Session must be in the store and ACTIVE (ADR-2.7-008);
  every referenced id must be in the store (PLT-10), and a `cartId` must belong
  to the session's own customer (INV-10). Repeated `(sessionId, clientEventId)`
  returns the original row (soft dedupe)
- `lib/events/record-purchase.ts` — `recordPurchaseEvent`: Order must exist in
  the store and be PAID; idempotent on the one-PURCHASE-per-Order index. The
  session need not be ACTIVE (payment can confirm after the customer leaves).
  3.11 derives value/count from the OrderItems
- `app/api/s/[storeSlug]/events/route.ts` — store from the slug; body is a
  non-strict envelope, so `storeId` etc. are dropped, never honoured; JSON
  content-type required (415), body ≤ 32 KiB (413). Type and payload are
  checked **before** the session is resolved, so a rejected event never counts
  as activity. `ensureStorefrontSession` provides the touch (and opens a new
  Session on the same token after 30 idle minutes)
- `lib/storefront/track.ts`, `components/storefront/track-product-view.tsx` —
  fire-and-forget `fetch` with `keepalive`; one PRODUCT_VIEW per detail view,
  ref-guarded against the React dev double effect
- `lib/db/prisma-errors.ts` — `isPrismaErrorCode()`. **Bug found:** inside the
  Next.js bundle `instanceof Prisma.PrismaClientKnownRequestError` is false for
  a genuine P2002, so the dedupe path returned 500. Now matched by `name` +
  `code`; `createCustomer` (3.5) switched too. Products still use instanceof —
  D-20

**Modified**

- `app/s/[storeSlug]/p/[productSlug]/page.tsx` — mounts `TrackProductView`
  (outside 3.7's file list; needed for its acceptance criterion)
- `scripts/verify-db.ts` — `checkEvents()`: every Event has a Session, every
  OFFER_* has an `aiActionId`, no Event/Session store mismatch. 27 passed

**Verification.** `tsc --noEmit` clean, `npm run lint` clean, `db:verify` 27/0.

```text
1. valid PRODUCT_VIEW        HTTP/1.1 202 Accepted  {"id":"cmuite3w60005ogk4a64oz4od"}
2. client PURCHASE           HTTP/1.1 403 Forbidden {"error":"PURCHASE cannot be submitted by a client","field":"type"}
3. unknown payload key       HTTP/1.1 400 Bad Request {"error":"Unrecognized key: \"evil\"","field":"payload"}
4. body storeId=dairy        HTTP/1.1 202 Accepted  {"id":"cmuite78d0007ogk4qcevl0gy"}
   stored row: storeId "seed_store_nextgen", session.storeId "seed_store_nextgen",
               payload {"productId":"seed_prod_vtx_rpd1tb"}, clientOccurredAt null

extra: client ADD_TO_CART            403
extra: productId not in this store   400 "Product not found in this store"
extra: no session cookie             400
extra: OFFER_VIEWED w/o aiActionId   400
extra: same clientEventId twice      202, 202 — same id both times
extra: text/plain body               415
extra: unknown store slug            404
```

Browser: product detail (hard load) → exactly 1 `POST /events` 202; list →
second product via client navigation → exactly 1 more. Both rows on the same
session with a `clientEventId`.

---

## 2026-09-26

### Implementation — Phase 3.6: Store context & storefront shell

First phase with a running result: `/s/[storeSlug]` serves each store's live
catalogue, anonymously browsable, with a per-store session cookie.

**Deviation — `proxy.ts` added (approved).** Next.js 16 does not allow setting
cookies during Server Component render, so the spec's "layout establishes the
session" cannot write the cookie. `proxy.ts` (matcher `/s/:storeSlug/:path*`)
resolves the store from the path, mints a token when the per-store cookie is
missing or malformed, and writes it to both the forwarded request and the
response. The layout then resolves the Session row. Recorded in the phase
spec's Files table.

**Created**

- `lib/store/resolve-store.ts` — `resolveStoreBySlug`, the single tenant entry
  point (PLT-3); malformed slugs resolve to null
- `lib/store/store-context.ts` — per-request memoised lookup
  (`findStoreContext`) plus `requireStoreContext` → `notFound()`. The layout
  never throws `notFound()` itself: thrown from a layout it would skip its own
  segment's `not-found.tsx`
- `lib/storefront/session-cookie.ts` — `anonymousCookieName(storeId)` →
  `ngs_anon_<storeId>` (PLT-4, ADR-2.8-003); httpOnly, SameSite=Lax, 90-day
  max-age aligned with Event retention (ADR-2.7-010 → 2.7-014).
  `ensureStorefrontSession` resumes the most recent ACTIVE Session on
  (store, token) and touches it, or opens a new one on the same token
  (ADR-2.7-008) — the resume decision 3.5 left to this phase
- `lib/storefront/availability.ts` — `availabilityOf`, `isPurchasable`
  (catalog §5.2–5.3, PRD-8)
- `lib/storefront/product-projection.ts` — `StorefrontProduct`, built field by
  field with no spread; also owns the ACTIVE-only listing and
  `(storeId, slug)` detail queries, so raw `Product` rows never leave the module
- `app/s/[storeSlug]/{layout,page,not-found}.tsx`,
  `app/s/[storeSlug]/p/[productSlug]/page.tsx`
- `components/storefront/*` — shell, product card, price (paise → ₹ at the
  display edge only), availability badge (never a stock count), spec list,
  image with text fallback

**Recorded as debt**

- D-18 — no product image files exist; seeded URLs 404, text fallback shown
- D-19 — each cookieless request (bots, `curl`) opens a Session row

**Verification.** `tsc --noEmit` clean, `npm run lint` clean, `db:verify` 24/0.

| Check | Result |
|---|---|
| `/s/next-gen-electronics` | 200 · 13 of 15 products (DRAFT desk mat, ARCHIVED speaker hidden) |
| `/s/daily-dairy` | 200 · 12 dairy products (DRAFT lassi hidden) |
| `/s/fresh-harvest` | 200 · 12 products; unbranded produce labelled by category |
| `/s/copper-and-clay` | 200 · 12 products |
| `/s/no-such-store`, `/s/Bad_Slug!` | 404, storefront not-found UI |
| Out-of-stock `vertex-rapid-512gb-nvme-ssd` | 200 · "Out of stock", "Currently unavailable to buy" |
| DRAFT `lumen-arc-desk-mat`, ARCHIVED `aeris-echo-bluetooth-speaker` | 404 |
| Electronics product slug under `/s/daily-dairy` | 404 |
| Leak check | HTML + a client-navigation RSC payload: no `costPrice*`, `profit*`, `stockQuantity`, `lowStockThreshold`, `lifecycleStatus`; none of the 12 electronics cost values present. Only client-component props on the wire are the image `{url, altText}` and label. (`margin` matches are inline CSS in Next's error template) |
| Reload ×3 + product page, same cookie jar | No new `Set-Cookie`; still 1 Session on the token, `lastActivityAt` advanced |
| Two stores, one jar | `ngs_anon_seed_store_nextgen` and `ngs_anon_dairy_store_daily`, different tokens |
| Malformed token `aaa` | Replaced with a fresh 22-char token |
| Unknown store | No cookie set |

### Implementation — Phase 3.5: Identity & Sessions

Server-side Customer and Session services. No routes, cookies or Event writes —
those are 3.6–3.8.

**Created — `lib/identity/`**

- `errors.ts` — `IdentityDomainError` (`VALIDATION | NOT_FOUND | CONFLICT`) and
  the shared Zod boundary helper
- `anonymous-id.ts` — `mintAnonymousId()`: 16 bytes of `crypto.randomBytes`,
  base64url (ADR-2.7-010). `anonymousIdSchema` rejects any supplied token that
  is not in minted shape, so a client cannot choose a low-entropy token
- `create-customer.ts`, `get-customer.ts` — store-scoped; email trimmed and
  lowercased at the boundary so `(storeId, email)` uniqueness is
  case-insensitive; duplicate → `CONFLICT` from the UNIQUE (INV-2)
- `start-session.ts` — always a new row; mints or reuses the per-store token
  (ADR-2.8-003)
- `touch-session.ts`, `end-session.ts` — conditional writes that match only an
  ACTIVE session, so a touch never revives a >30-min idle session and logout
  never stamps `endedAt` onto one that already ended by inactivity
  (ADR-2.7-008). Unknown session → `NOT_FOUND`; ended → documented no-op
- `session-state.ts` — derived `ACTIVE | ENDED`, `SESSION_INACTIVITY_MS`;
  nothing stored
- `attach-customer.ts` — one transaction: conditional `customerId` write (only
  where null, so concurrent logins serialise and the loser gets `CONFLICT`,
  INV-5), then the ADR-2.7-009 backfill verbatim via `$executeRaw`. Same
  customer twice is idempotent and re-runs the backfill, which claims nothing

`mapPrismaWriteError` was not reused: it is Product-specific (messages, error
class, `INVALID_REFERENCE`). `createCustomer` handles its single P2002 case
inline instead of generalising it.

**Modified**

- `scripts/verify-db.ts` — `checkIdentity()`: INV-8 and INV-4 (non-empty
  token). PLT-4 stays in Store isolation. 24 passed, 0 failed

**Recorded as debt**

- D-16 (open question) — login into a Session already identity-attributed to a
  customer. The CHECK for INV-8 forbids setting `customerId` there; 3.5 refuses
  with `CONFLICT` rather than clearing the attribution. Settle before 3.8
- D-17 — seeded `anonymousId`s are hand-written strings, not minted tokens

**Verification.** `tsc --noEmit` clean, `npm run lint` clean, `db:verify` 24/0.
Harness `scripts/_check-identity.ts` (deleted before commit) needed
`npx tsx --conditions=react-server --env-file=.env …` — without the
`react-server` condition, `server-only` throws under plain Node. Output:

```text
Setup
  PASS  createCustomer lowercases email
  PASS  getCustomerByEmail is case-insensitive
  PASS  getCustomer is store-scoped
  PASS  duplicate (storeId, email) throws CONFLICT
1. startSession with no token mints a fresh anonymousId
  PASS  token is 22-char base64url (128 bits) — Lc5Z1RsdTfYMMaUKtN8DHQ
  PASS  two calls give different tokens — Lc5Z1RsdTfYMMaUKtN8DHQ vs L1alfoC0WDgag-tOflbEPA
2. startSession with an existing token reuses it, new row
  PASS  token reused
  PASS  second Session row created — rows on token: 2
  PASS  non-minted token rejected with VALIDATION
3. sessionState is derived from server time
  PASS  31 min idle -> ENDED
  PASS  29 min idle -> ACTIVE
  PASS  endedAt set -> ENDED
  PASS  touchSession does not revive a 31-min idle session
  PASS  endSession does not stamp endedAt on an inactivity-ended session
  PASS  endSession ends an active session, second call is a no-op
4. attachCustomerToSession sets customerId and backfills
  PASS  running session customerId = A
  PASS  running session not attributed (INV-8)
  PASS  attributedSessionCount >= 1 — count = 1
  PASS  prior anonymous session attributed to A, customerId still null
5. Running it twice attributes the second time zero
  PASS  second call attributedSessionCount = 0 — count = 0
  PASS  B logging in on the same device claims nothing already claimed — count = 0
6. A different customerId on an authenticated session throws CONFLICT
  PASS  CONFLICT thrown (INV-5)
  PASS  customerId unchanged
7. daily-dairy session on the same token string is untouched
  PASS  dairy session customerId null
  PASS  dairy session attributedCustomerId null
  PASS  electronics customer cannot log into a dairy session (NOT_FOUND)
Teardown: removed 6 sessions, 2 customers.
ALL CHECKS PASSED
```

---

## 2026-09-21

### Process — documentation and roadmap restructure

Reorganised so that **"implement phase 3.X"** is a complete instruction.

**Roadmap reordered — vertical slice first.** The breadth-first 1–14 ladder is
retired. The project now builds the growth loop end-to-end on one store,
deployed, before broadening. The reason was measurable: 5,588 lines of
architecture docs and 3,936 lines of fabricated seed data against 1,112 lines of
domain logic, zero API routes, and nothing that ran. The seed manufactured AI
actions and attribution records no engine had produced.

**Numbering collapsed from three systems to two.** Architecture is `2.x`,
implementation is `3.x`. The three-level `3.2.1` form is gone; mapping tables in
[`STATUS.md`](./STATUS.md) and [`archive/README.md`](./archive/README.md) keep
old references readable.

**Created**

- [`INDEX.md`](./INDEX.md) — documentation map, authority order, invariant prefixes
- [`ROADMAP.md`](./ROADMAP.md) — milestones M0–M3, all phases, ordering rationale
- [`phases/README.md`](./phases/README.md) — the phase contract, rules for the implementing agent, inherited definition of done
- 13 phase specs for M1 — 3.5–3.9 READY with full contracts, 3.10–3.17 DRAFT with scope and acceptance
- Milestone records for [M0](./phases/m0-foundation/README.md), [M2](./phases/m2-depth/README.md), [M3](./phases/m3-demo/README.md)
- [`archive/README.md`](./archive/README.md) — what was superseded and by what

**Moved**

- `IMPLEMENTATION-STATUS.md` → [`STATUS.md`](./STATUS.md), rewritten
- `Phase-track.md`, `phase-2-freeze-checklist.md`, `plans/plan-001`, `plans/plan-002` → [`archive/`](./archive/README.md)

**Updated**

- [`PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md) — rewritten around the new map
- `CLAUDE.md` §16–17 — phase workflow replaces the database-order section

**Recorded as debt**

- D-15: README lists "Recommendation" as an AI action type; `AiActionType` has no such value

### Implementation — Phase 3.4 (was 3.2.3): platform schema delta + multi-store seed

First code for the Phase 2.8 decisions.

**Schema**

- `Store.slug` — platform-unique, resolves `/s/[storeSlug]` (ADR-2.8-002)
- `enum Surface { HOME PRODUCT_DETAIL CART CHECKOUT NOTIFICATION }` and
  `AiAction.surface`, plus `@@index([storeId, surface, status])` (ADR-2.8-006)
- CHECK `(decision = 'ACT') = (surface IS NOT NULL)` — `surface` is null exactly
  when the decision was `NO_ACTION`, mirroring the existing `actionType` rule
- Migration `20260921120000_phase_2_8_platform_delta`, hand-written: the
  generated form would have added a NOT NULL column to a populated table, and
  the CHECK is not expressible in Prisma (ADR-2.7-031)

**Seed**

- Four merchants, one store each (ADR-2.8-001). Electronics keeps the full
  growth loop; Daily Dairy, Fresh Harvest and Copper & Clay are catalog-depth
  (ADR-2.8-010)
- Per-store data extracted to `prisma/seed-data/`
- Deterministic store-prefixed category ids; spec schemas for all three new
  stores in `lib/catalog/spec-registry-stores.ts` (ADR-2.8-005)
- The seed now runs every product through `validateProductSpecs`, so an
  unregistered category fails loudly at seed time instead of silently rejecting
  specs later
- Baseline `Policy` set per store, so no store runs unconstrained (ADR-2.8-008)
- Surfaces assigned intentionally per scenario; all five values exercised

**Verification**

- `scripts/verify-db.ts` replaced its `SELECT 1` with 22 assertions covering
  tenancy, store isolation, spec coverage, platform invariants, commerce
  invariants and money. 22 passed, 0 failed
- Isolation negative-controlled: a dairy product is reachable by its own
  `(storeId, id)` and unreachable with the electronics `storeId`

**Also**

- `eslint.config.mjs` now ignores `lib/generated/**`. `npm run lint` had been
  failing with 772 errors from the generated Prisma client since Phase 3.1

### Architecture — Phase 2.8 Platform & Growth Surfaces

Documentation only — no schema, migrations or application code.

**Created**

- [`docs/architecture/phase-2.8-platform-decisions.md`](./architecture/phase-2.8-platform-decisions.md) — ADR-2.8-001…010, invariants PLT-1…PLT-10

**Renamed**

- `architecture-review.md` → [`phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md) — six documents already linked to that name; the file did not exist

**Updated**

- PROJECT-CONTEXT (product statement, authority map, 2.8 decisions), freeze checklist, 2.7 review §5
- Supersession banners: identity, product-catalog, activity-tracking, growth-system

**Major decisions**

- Multi-**merchant** is in scope; multi-store **per merchant** stays deferred. `Store.merchantId` UNIQUE unchanged
- Tenant resolution: `Store.slug` (platform-unique) + path prefix `/s/[storeSlug]`; `storeId` derives from the route only
- `anonymousId` is minted per Store; never queried without `storeId`
- Catalogue is domain-agnostic and **pack-based** — one pack = one Product + one SKU, integer quantities, no unit of measure
- `AiAction.surface` (HOME / PRODUCT_DETAIL / CART / CHECKOUT / NOTIFICATION), set by the application and write-once. No new action type, no new event type
- Notifications are an in-app tray for the MVP; off-channel delivery is execution, **not** exposure
- Absent Policy = constraint not applied; structural rules always apply; provisioning seeds a baseline policy set
- Non-goals recorded: no platform-admin actor, no merchant settlement/payouts/Route, no cross-store analytics or identity, no GST rate engine
- Demo depth: electronics carries the full growth loop; dairy / produce / utensils are catalog-depth

**Schema delta:** two columns, one enum, one index. No new tables.

**Status:** `READY FOR PHASE 3 (multi-merchant)`

### Process — implementation progress tracker

**Created**

- [`docs/IMPLEMENTATION-STATUS.md`](./STATUS.md) — single home
  for build progress: done slices with file/commit evidence, remaining 3.2.x
  domain slices with scope + authority + done-when, application phases 4–14,
  and a numbered known-debt register (D-1…D-12)

**Updated**

- [`Phase-track.md`](./archive/Phase-track.md) — now owns the build **order** only;
  status marks removed so progress has one home
- PROJECT-CONTEXT authority map

---

## 2026-09-19

### Architecture — Phase 2.7 Resolution & Freeze

Documentation only — no Prisma schema, migrations, or application code.

**Created**

- [`docs/architecture/phase-2.7-decisions.md`](./architecture/phase-2.7-decisions.md) — ADR-2.7-001…033
- [`docs/architecture/phase-2.7-architecture-review.md`](./architecture/phase-2.7-architecture-review.md)
- [`docs/architecture/phase-2-freeze-checklist.md`](./archive/phase-2-freeze-checklist.md)
- [`docs/PROJECT-CONTEXT.md`](./PROJECT-CONTEXT.md)

**Updated**

- Identity, product-catalog, activity-tracking, growth-system docs — supersession banners + conflicting sections
- [`Phase-track.md`](./archive/Phase-track.md) — dual numbering note; Phase 2 marked done for architecture

**Major decisions**

- Merchant↔Store 1:1 database-enforced; store isolation composites & slug uniqueness
- GST-A: MRP/selling inclusive, cost exclusive; indicative contribution
- Order 1:N PaymentAttempt; inventory conditional decrement in Order→PAID txn
- Event trust classes; server-only PURCHASE; cart/order lifecycles
- Opportunity = deterministic → AI; Action lifecycle without response/conversion states
- Policy/guardrail versioning + frequency ledger; attribution 7d last-touch
- Historical truth principle; Prisma gaps → raw SQL OK

**Status:** `READY FOR PHASE 3`

**Closed:** OPEN-1 (GST).

---

## 2026-09-06

### Architecture — Plan 002: Product & Catalog Model

Accepted [`docs/architecture/product-catalog-model.md`](./architecture/product-catalog-model.md).
Documentation only — no code, schema or migrations.

**Decided**

- **D-1 — Money is integer paise, system-wide.** ₹2,500 is `250000`. Field names
  carry the unit (`sellingPricePaise`). Exact under profit/margin arithmetic,
  JSON-safe across the Server → Client boundary, and matches the Razorpay
  amount format used in Phase 10.
- **D-2 — Flexible specs are one JSONB column** validated at write time against
  per-category Zod schemas held in app code. Flat, primitives only, numeric
  magnitudes in the canonical unit named by the key (`batteryHours: 30`). GIN
  indexed. EAV rejected.
- **D-3 — Brand, Category and Subcategory become lookup entities**, two levels
  deep, store-scoped. Reliable equality is what makes AI substitution and
  cross-sell work as joins rather than string comparisons.
- Three stored prices (MRP, selling, cost); discount, profit and margin are
  always derived. Cost price is optional — when absent, profit and margin are
  *unavailable*, never zero.
- Lifecycle (`DRAFT`/`ACTIVE`/`ARCHIVED`, stored) is separated from availability
  (`IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`, derived).
- Cost, profit and margin are merchant-only and must never reach a customer
  surface or AI output.
- AI scarcity claims must match observed stock, and that observed figure is
  recorded with the action so the claim stays auditable.

**Recorded, not applied** — eight conflicts between the accepted model and the
Phase 1 UI code (`product-catalog-model.md` §14). Two are contradictions worth
noting here:

- Product `status` merges lifecycle with stock availability and stores
  `out_of_stock` alongside `stock` — two homes for one fact.
- Money is currently plain JS numbers in whole rupees, which conflicts with D-1.
  Conversion is system-wide, not just Product.

**Open** — ~~OPEN-1: GST treatment~~ → **Closed 2026-09-19** in Phase 2.7
([ADR-2.7-021](./architecture/phase-2.7-decisions.md#adr-27-021--gst-treatment-open-1-closed)).

### Architecture — Plan 001: Identity Model

Accepted [`docs/architecture/identity-model.md`](./architecture/identity-model.md).
Documentation only.

- No `Visitor` entity. A Session carries a required durable `anonymousId`
  (device token) and a nullable `customerId`; "visitor" is a *state* of a
  Session.
- On login, prior anonymous sessions on the same device token within 30 days are
  attributed to the customer, guarded so a shared device cannot leak one
  person's browsing into another's profile.
- `customerId` (authenticated at the time) is kept distinct from
  `attributedCustomerId` (inferred afterwards), so the audit trail can always
  answer what was actually known at the time.
- Merchant and Customer are separate identity namespaces.
- Store stays a separate domain concept from Merchant despite the 1:1
  relationship, making multi-store a later cardinality change rather than a
  migration. *(1:1 is now DB-enforced — ADR-2.7-002.)*

---

## Earlier

- **Phase 1 — Merchant UI shell.** Next.js 16 App Router, Tailwind v4, eight
  dashboard routes, component system, demo-data layer. See
  [`README.md`](../README.md).
