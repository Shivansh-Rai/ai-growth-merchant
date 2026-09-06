# Identity Model

**Status:** Accepted
**Source:** [Plan 001 — Merchant, Store & Customer Identity](../plans/plan-001-merchant-store-customer-identity.md)
**Phase:** Groundwork for Phase 2 (Product + Customer data model)

This document is the normative identity and ownership model for The Next Gen
Store. Where the plan describes intent, this document decides.

It defines **who exists**, **what owns what**, **what requires a login**, and
**how anonymous activity becomes attributed activity**. It contains no database
schema, no migrations and no authentication implementation — those are Phases 3
and 4. Conceptual attributes are named here only where they carry identity
meaning, because that is the substance of the model.

---

## 1. Entities

Five concepts exist. They stay logically separate even where implementation
later optimises across them.

### 1.1 Merchant

The business owner/operator who uses the Merchant Dashboard.

| | |
|---|---|
| **Is** | The operator of the business |
| **Identity** | A merchant account, authenticated against the dashboard |
| **Owns** | Exactly one Store |
| **Lives in** | The Merchant Dashboard |
| **Never** | Shops, browses the storefront, holds a cart, or places an order |

Responsibilities: managing products and inventory, viewing sales and
customer/event analytics, reviewing AI opportunities and AI actions, viewing
audit logs, configuring AI and merchant rules.

Access is restricted to approved merchant accounts for the demo.

### 1.2 Store

The merchant's customer-facing electronics store — the commerce environment
itself, not the business that runs it.

| | |
|---|---|
| **Is** | The commerce environment customers interact with |
| **Identity** | A store record, owned by exactly one Merchant |
| **Owns** | Products, the storefront, Customers, Sessions, Carts, Orders, and all AI growth activity for that store |
| **Lives in** | The public storefront |

Store is kept as a domain concept distinct from Merchant even though the
relationship is currently 1:1. See [§6](#6-why-merchant-and-store-stay-separate).

### 1.3 Customer

A person who interacts with the store.

| | |
|---|---|
| **Is** | A person shopping the store |
| **Identity** | A customer account, scoped to one Store |
| **Owns** | Their carts, orders, and authenticated session history |
| **Lives in** | The storefront |
| **Never** | Accesses the Merchant Dashboard |

A Customer is **not** the same thing as a logged-in account holder in the
narrow sense: a person interacts with the store before they log in. The
Customer *record* comes into existence at registration; the *person* existed —
and generated behaviour — before that. Bridging that gap is [§5](#5-identity-resolution-anonymous--authenticated).

### 1.4 Session

A single continuous period of interaction between a person and the Store.

| | |
|---|---|
| **Is** | One period of interaction |
| **Identity** | A session record, always carrying a device token; optionally carrying a customer |
| **Owns** | The Events recorded during it |
| **Belongs to** | Exactly one Store |

A session exists because the AI needs **short-term intent**. The value of

```text
Session S101
  SEARCH        "wireless headphones"
  PRODUCT_VIEW  Sony XM5
  PRODUCT_VIEW  JBL Live 770
  PRODUCT_CLICK Sony XM5
```

is that these four events are known to belong to *one* stretch of attention.
That is the unit the growth agent reasons over.

**Session boundary rule.** A session ends at whichever comes first:

- 30 minutes of inactivity, or
- explicit logout.

Logging *in* does not end a session — it authenticates the one already running.
That distinction is what makes attribution ([§5](#5-identity-resolution-anonymous--authenticated)) possible.

> The 30-minute figure is the conventional analytics window and is a tunable
> constant, not a structural commitment.

### 1.5 Event

A record of something that happened during a Session. Defined here only as far
as ownership requires: **an Event belongs to exactly one Session**, and through
it to exactly one Store.

The event taxonomy, payloads and tracking implementation are out of scope. See
[§8](#8-deferred).

---

## 2. Visitor is a state, not an entity

There is **no Visitor entity**.

"Anonymous visitor" describes a Session whose `customerId` is null. The same
session becomes an authenticated one the moment a customer logs in, without
changing identity or losing its events.

```text
Session (customerId = null)   →   "anonymous visitor"
Session (customerId = C42)    →   "customer C42"
```

Every Session nonetheless carries a **durable anonymous token** (`anonymousId`)
held in a first-party cookie that survives beyond the session. This token is a
*device signal*, not a person:

- It is minted on first contact with the storefront and reused on return.
- It is what makes cross-session behavioural context recoverable at login.
- It never confers any capability. It authenticates nothing.

This gives cross-visit continuity without introducing an entity the ownership
model does not need, and without a migration if a first-class `Visitor` is ever
warranted.

---

## 3. Ownership relationships

```text
Merchant
   │
   │ 1:1  (MVP; modelled as a Store-side owner reference)
   ↓
Store
   │
   ├──── 1:N ──── Customer
   │
   └──── 1:N ──── Session ──── 1:N ──── Event
                     │
                     └── anonymousId  (device token, required)
                     └── customerId   (nullable — set on login)
```

Cardinalities:

| Relationship | Cardinality | Notes |
|---|---|---|
| Merchant → Store | 1 : 1 | Enforced by policy in the MVP, not by structure |
| Store → Customer | 1 : N | Customers are scoped to a store |
| Store → Session | 1 : N | Sessions are scoped to a store |
| Customer → Session | 1 : N | Only the sessions in which they were logged in |
| Session → Event | 1 : N | |

**Everything customer-facing carries a store reference.** Customers, Sessions
and Events all name their Store directly, even though there is only one store
today. This is the concrete payoff of keeping Store separate: multi-store
becomes a policy change, not a data migration.

---

## 4. Capability boundary

Browsing is open. Commerce requires a Customer.

| Capability | Anonymous | Authenticated Customer |
|---|:---:|:---:|
| Open the store | ✅ | ✅ |
| Search products | ✅ | ✅ |
| View a product | ✅ | ✅ |
| Generate tracked events | ✅ | ✅ |
| Receive AI recommendations/interventions | ✅ | ✅ |
| Add to cart | ❌ | ✅ |
| Checkout | ❌ | ✅ |
| Purchase | ❌ | ✅ |
| View order history | ❌ | ✅ |

Two rules govern this boundary:

1. **It is enforced on the server**, at the commerce operation itself — not by
   hiding buttons. UI gating is a courtesy; the boundary is the check.
2. **It is a product decision, not a structural one.** Relaxing it later (guest
   checkout, say) must not require reshaping identity.

**Consequence — no anonymous cart.** Because add-to-cart requires a login, a
Cart always belongs to an authenticated Customer. The MVP needs no anonymous
cart concept and no cart-merge-on-login logic.

**Merchant capabilities are a separate surface entirely.** A merchant session
grants nothing on the storefront, and a customer session grants nothing in the
dashboard. See [§7](#7-invariants), INV-7.

---

## 5. Identity resolution: anonymous → authenticated

The plan's requirement is that behavioural context survives the transition to a
logged-in identity. This section defines exactly how.

### 5.1 Two distinct kinds of link

A Session records the customer link in **two separate ways**, and conflating
them would corrupt the audit trail:

| Field | Meaning | Set when |
|---|---|---|
| `customerId` | **The person was authenticated during this session.** A statement about what was true at the time. | Login occurs in that session |
| `attributedCustomerId` | **We later concluded this anonymous activity belongs to this customer.** An inference made after the fact. | Backfill at login |

This separation matters because the product ships an audit log. The system must
always be able to answer *"was this actor authenticated when this happened?"*
truthfully, even after attribution. Retroactive linkage must never be able to
disguise itself as contemporaneous knowledge.

### 5.2 The attribution rule

On successful login of Customer `C` in Session `S` carrying token `T` at time
`t`:

1. Set `S.customerId = C`. The running session is now authenticated.
2. Select every prior Session where **all** of the following hold:
   - `anonymousId == T`
   - `startedAt >= t − 30 days`
   - `customerId IS NULL` — never authenticated
   - `attributedCustomerId IS NULL` — not already claimed
3. Set `attributedCustomerId = C` on that set.

Attribution is **additive and non-destructive**: no event is rewritten, moved
or deleted. It can be undone by clearing the field.

### 5.3 Why the guards exist

The device token is a weak signal, and each condition defends against a
specific way it misleads:

- **`customerId IS NULL`** — a session where someone else was logged in is
  never reassigned. A household device does not leak one person's browsing to
  another's profile.
- **`attributedCustomerId IS NULL`** — first claim wins. Two people sharing a
  device do not repeatedly steal each other's anonymous history.
- **30-day window** — pre-login behaviour is not retained against a person
  indefinitely, and stale intent does not pollute the agent's reasoning.
- **Post-logout activity is never attributed** — logout ends the session, and
  subsequent anonymous sessions are new claims subject to the same rules.

An `anonymousId` therefore has **no owner**. Over time it may be associated
with several customers, or none. It is evidence, not identity.

### 5.4 The full picture

```text
Anonymous Visitor
       ↓
   Session  (anonymousId = T, customerId = null)
       ↓
   Event activity  ─── recorded as anonymous, permanently
       ↓
     Login as C
       ↓
   Session.customerId = C                    ← contemporaneous truth
   Prior eligible sessions on T:
       attributedCustomerId = C              ← retroactive inference
```

---

## 6. Why Merchant and Store stay separate

The relationship is 1:1 and will be for the whole MVP. Collapsing them into one
record would be smaller. It is still the wrong call:

- **They are different things.** A Merchant is a party with credentials and
  responsibilities. A Store is an environment with inventory and traffic.
  Merging them makes "who owns this order" and "who logged in" the same
  question, and they are not.
- **They have different lifetimes.** A store can be suspended, renamed or
  re-platformed without the merchant account changing, and vice versa.
- **Evolution is free.** Multi-store, or a store transferred between merchants,
  becomes a cardinality change rather than a rewrite of every foreign key that
  currently means "the business" and would need to start meaning "the shop".

The 1:1 constraint is a **policy** enforced in the MVP, not a structural
assumption baked into everything downstream.

---

## 7. Invariants

Testable rules. Later phases must not violate these without amending this
document.

| # | Invariant |
|---|---|
| INV-1 | Every Store is owned by exactly one Merchant. In the MVP a Merchant owns exactly one Store. |
| INV-2 | Every Customer belongs to exactly one Store. |
| INV-3 | Every Session belongs to exactly one Store. |
| INV-4 | Every Session has a non-null `anonymousId`. `customerId` is nullable. |
| INV-5 | A Session's `customerId`, once set, is never changed to a different Customer. A different login means a new Session. |
| INV-6 | Every Event belongs to exactly one Session, and inherits that Session's Store. |
| INV-7 | Merchant identities and Customer identities are separate namespaces. A merchant credential never authenticates a customer, or the reverse. The same human may hold both, as two unrelated records. |
| INV-8 | `attributedCustomerId` is only ever set on a Session whose `customerId` is null. |
| INV-9 | Attribution never modifies, moves or deletes an Event, and never alters what the record says was known at the time. |
| INV-10 | Commerce capabilities (cart, checkout, purchase, order history) require a non-null `customerId` on the current Session, verified server-side. |

---

## 8. Deferred

Explicitly **not** decided here. Each belongs to a later plan or phase:

| Deferred | Phase |
|---|---|
| Prisma schema and migrations | 3 |
| Authentication provider, credential storage, session transport | 4 |
| Merchant approval/onboarding mechanics | 4 |
| Event taxonomy, payload shapes, tracking implementation | 7 |
| Consent, privacy notice and data-retention UX for the anonymous token | later |
| Cart and Order modelling beyond ownership | 5–6 |
| Multi-store merchants, merchant team members, RBAC | post-MVP |
| Whether a first-class `Visitor` entity is ever warranted | revisit if cross-device identity is needed |

---

## 9. Terminology

Use these words exactly, in code, in the UI and in conversation. The boundaries
in this document only hold if the vocabulary holds.

| Use | Not | Because |
|---|---|---|
| **Merchant** | user, admin, owner | "User" is ambiguous across both surfaces |
| **Store** | shop, tenant, site | "Tenant" implies multi-tenancy we have not built |
| **Customer** | user, shopper, buyer | The record is a Customer whether or not they have bought |
| **Visitor** | anonymous user, guest | It is a *state* of a Session, never an entity |
| **Session** | visit, journey | Has a precise boundary rule (§1.4) |
| **Event** | activity, action | "Action" is reserved for AI agent actions |

Note the last row: **AI Action** already means something specific in this
product — a thing the growth agent did. Never use "action" for customer
behaviour.

---

## 10. Traceability

Plan 001's completion criteria, and where each is met:

| Completion criterion | Section |
|---|---|
| Clear definition of Merchant | §1.1 |
| Clear definition of Store | §1.2 |
| Clear definition of Customer | §1.3 |
| Distinction between Customer and anonymous Visitor | §1.3, §2 |
| Defined Session concept | §1.4 |
| Defined ownership relationships | §3 |
| Defined login boundaries | §4 |
| Defined anonymous → authenticated transition | §5 |
| No database/schema implementation | Whole document — §8 defers it to Phase 3 |
