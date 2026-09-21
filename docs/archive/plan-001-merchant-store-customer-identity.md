> **ARCHIVED — NOT AUTHORITATIVE.** This document is kept for history only.
> Do not implement from it. See [`README.md`](./README.md) in this folder for
> what superseded it, and [`../INDEX.md`](../INDEX.md) for the active docs.

# Plan 001 — Merchant, Store & Customer Identity

## Objective

Define the identity and ownership model for The Next Gen Store before implementing the database or authentication.

This plan establishes how **Merchant, Store, Customer, Visitor, and Session** relate to each other.

Do not implement authentication or Prisma schema in this plan.

---

## 1. Merchant

A **Merchant** is the business owner/operator who uses the Merchant Dashboard.

For the MVP:

* A merchant can log into the Merchant Dashboard.
* A merchant owns exactly one store.
* Merchant access is restricted to approved merchant accounts for the demo.
* Merchant authentication will be implemented in a later phase.

The merchant is responsible for:

* Managing products
* Managing inventory
* Viewing sales
* Viewing customer/event analytics
* Reviewing AI opportunities
* Reviewing AI actions
* Viewing audit logs
* Configuring AI/merchant rules

---

## 2. Store

A **Store** represents the merchant's actual customer-facing electronics store.

For the MVP:

```text
Merchant 1 ──── 1 Store
```

The store contains/owns:

* Products
* Customer-facing storefront
* Customer activity
* Carts
* Orders
* AI growth activity related to that store

The customer interacts with the **Store**, not directly with the Merchant Dashboard.

---

## 3. Customer

A **Customer** represents a person who interacts with the store.

Important distinction:

> A Customer is not the same thing as a logged-in account.

A person may interact with the store before logging in.

A customer can:

* Browse products
* Search
* View products
* Generate behavioral events
* Receive AI interventions
* Log in
* Add products to cart
* Checkout
* Purchase

Customer behavior can be used by the AI to identify relevant growth opportunities.

---

## 4. Visitor / Anonymous User

The storefront must support browsing without login.

An anonymous visitor should be able to:

* Open the store
* Search products
* View products
* Generate tracked events
* Receive appropriate AI recommendations/interventions

However, certain commerce functionality can require authentication.

For the initial MVP:

```text
Browse → allowed without login

Search → allowed without login

Product viewing → allowed without login

Add to cart → login required

Checkout → login required
```

This rule can be changed later if product decisions require it.

---

## 5. Session

A **Session** represents a period of interaction between a visitor/customer and the store.

A session is important because the AI needs to understand short-term intent.

Example:

```text
Session S101

SEARCH:
"wireless headphones"

PRODUCT_VIEW:
Sony XM5

PRODUCT_VIEW:
JBL Live 770

PRODUCT_CLICK:
Sony XM5
```

The system should be able to associate these events with the same session.

If the visitor later logs in, their relevant pre-login activity should be capable of being associated with the authenticated customer where technically appropriate.

Do not implement the event system yet. This plan only defines the identity relationship required for future tracking.

---

## 6. Identity Relationship

The conceptual model should be:

```text
Merchant
   │
   │ 1:1
   ↓
Store
   │
   ├──────── Customers
   │
   └──────── Sessions
                  │
                  ↓
                Events
```

A visitor may begin as anonymous:

```text
Anonymous Visitor
       ↓
    Session
       ↓
   Event activity
       ↓
     Login
       ↓
   Customer identity
```

The architecture should avoid losing useful behavioral context when the visitor becomes authenticated.

---

## 7. Important Boundaries

Do not mix these concepts:

### Merchant

The business/operator using the dashboard.

### Store

The customer-facing commerce environment owned by the merchant.

### Customer

The person shopping/interacting with the store.

### Session

A specific interaction period.

### Event

A record of something that happened during a session.

These concepts should remain logically separate even if implementation details are optimized later.

---

## 8. MVP Scope

### In scope

* Merchant → Store 1:1 ownership
* Store → Customer relationship
* Anonymous browsing
* Customer authentication requirement for commerce actions
* Session concept
* Ability to associate anonymous activity with a customer after login
* Clear separation between merchant and customer experiences

### Out of scope

Do not implement:

* Multi-store merchants
* Merchant team members/roles
* Complex RBAC
* Authentication provider
* Prisma schema
* Database migrations
* Event tracking implementation
* AI logic
* Notifications
* Payments

Those will be handled in later plans.

---

## 9. Architectural Decision

For the MVP, use:

```text
1 Merchant
    ↓
1 Store
    ↓
Many Customers
    ↓
Many Sessions
    ↓
Many Events
```

Keep **Merchant and Store as separate domain concepts**, even though the relationship is currently 1:1.

This preserves a clean domain boundary and allows the architecture to evolve to multiple stores later without forcing that complexity into the MVP.

---

## 10. Completion Criteria

Plan 001 is complete when we have:

* A clear definition of Merchant
* A clear definition of Store
* A clear definition of Customer
* A clear distinction between Customer and anonymous Visitor
* A defined Session concept
* Defined ownership relationships
* Defined login boundaries
* Defined anonymous → authenticated identity transition
* No database/schema implementation yet

The output of this plan will be used as the foundation for the next architecture plan.
