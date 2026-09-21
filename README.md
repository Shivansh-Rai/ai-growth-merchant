
# The Next Gen Store

## Project Context

The Next Gen Store is a **multi-merchant commerce platform with AI-powered growth capabilities**.

The platform allows merchants to create and operate their own online stores without having to build the underlying commerce infrastructure themselves.

A merchant joins the platform, manages their products and inventory, and gets a hosted storefront with the core commerce capabilities required to sell products online.

The platform provides:

- Storefront infrastructure
- Product catalog management
- Inventory management
- Customer and session management
- Cart and checkout
- Payment processing
- Order management
- Customer activity tracking
- AI-powered growth suggestions
- Guardrails for AI actions
- Exposure and attribution tracking
- Merchant analytics and growth insights

The main idea is to make **AI a growth layer on top of the merchant's commerce system**.

### Core Platform Model

The platform is multi-merchant.

Each merchant owns a store, and the store is the primary tenant boundary for commerce data.

```text
Merchant
   │
   └── Store
        │
        ├── Products
        ├── Categories
        ├── Inventory
        ├── Customers
        ├── Sessions
        ├── Events
        ├── Carts
        ├── Orders
        └── Growth / AI System
````

A merchant's data must remain isolated from other merchants' data.

The platform itself provides the infrastructure and capabilities, while the merchant owns the business data associated with their store.

### Customer Commerce Flow

A typical customer journey is:

```text
Visit Store
    ↓
Browse Products
    ↓
Product Interaction
    ↓
Cart
    ↓
Checkout
    ↓
Payment
    ↓
Order
```

Customer activity during this journey generates events that can be used by the growth system.

### AI Growth Loop

The core differentiator of the platform is the AI growth system.

```text
Customer Activity
       ↓
Revenue Opportunity
       ↓
AI Action
       ↓
Deterministic Guardrails
       ↓
Customer Exposure
       ↓
Purchase
       ↓
Revenue Measurement
```

The AI does not directly control the commerce system.

Instead, the platform separates:

* **AI reasoning**
* **Business rules**
* **Guardrails**
* **Commerce execution**
* **Revenue measurement**

This means AI can suggest an action, but the platform remains responsible for validating whether that action is allowed and safe to execute.

For example:

```text
Customer shows buying intent
        ↓
Platform detects an opportunity
        ↓
AI proposes a cross-sell action
        ↓
Guardrails validate the action
        ↓
Customer sees the recommendation
        ↓
Customer purchases
        ↓
Platform records the resulting revenue attribution
```

### Important Architectural Principle

The platform treats **commerce truth and AI inference as different things**.

The database remains the source of truth for facts such as:

* Product information
* Prices
* Inventory
* Orders
* Payments
* Customer identity
* Store ownership

AI-generated information is treated as a proposal or inference and must not become authoritative merely because an AI model produced it.

This separation is important because AI can make mistakes, while commerce operations require deterministic behavior.

### Store Isolation

The system is designed around store-level tenancy.

Entities that belong to a merchant's store are scoped by `storeId`.

For example:

```text
Store A
 ├── Products
 ├── Customers
 ├── Orders
 └── Events

Store B
 ├── Products
 ├── Customers
 ├── Orders
 └── Events
```

Data belonging to Store A must never accidentally interact with Store B.

This isolation is enforced through application logic as well as database constraints wherever possible.

### Commerce Truth

The platform distinguishes between different types of information.

Some information is historical truth, such as:

* What product was ordered
* The price recorded on an order
* Whether a payment succeeded
* How much inventory was available
* When an event was received

Other information is derived or inferred, such as:

* Customer opportunities
* AI recommendations
* AI confidence
* Revenue attribution

Derived and inferred information must not overwrite historical commerce facts.

### Product System

Products are store-scoped and contain information such as:

* Product identity
* SKU
* Category
* Subcategory
* Brand
* Pricing
* Cost
* Inventory
* Specifications
* Images
* Lifecycle status

Money is represented using integer **paise**, rather than floating-point values.

Products also have lifecycle states so that products that have participated in historical commerce activity can be archived instead of being physically deleted.

### Order and Payment Model

Orders preserve the historical state of the purchase.

An `OrderItem` stores a snapshot of important product information at the time of purchase, including:

* Product ID
* Product name
* SKU
* Unit price
* Quantity
* Discount
* Line total
* Tax information where available

This prevents later product changes from changing historical order information.

Payments are represented separately through `PaymentAttempt`.

A successful payment does not rely only on the client. Payment completion and important commerce events are verified and processed on the server.

### Inventory

Inventory is treated as a commerce invariant.

The platform prevents stock from becoming negative and updates inventory transactionally when a verified payment succeeds.

A successful payment must not automatically mean that an order is marked as paid if the corresponding inventory update cannot be completed safely.

### Events and Activity Tracking

Customer activity is captured through events.

Events are separated into:

* **Client telemetry**
* **Server business events**

Client telemetry can describe customer behavior, while important business events such as a purchase are generated by trusted server-side flows.

This prevents the client from being treated as the authority for important financial or commerce facts.

### AI Safety and Guardrails

AI actions go through deterministic validation before execution.

The AI may propose:

```text
ACT
NO_ACTION
```

and, when appropriate, a structured action such as:

```text
Cross-sell
Upsell
Offer
Recommendation
```

The platform then validates the proposal against deterministic rules such as:

* Product eligibility
* Product availability
* Inventory
* Offer limits
* Policy configuration
* Expiry
* Frequency limits
* Store ownership
* Current product state

The AI cannot directly modify authoritative commerce data such as inventory, prices, payments, identity, or merchant permissions.

### Attribution

The platform records when an AI-driven action is exposed to a customer and can later associate eligible purchases with that exposure.

The system distinguishes:

```text
Attributed Revenue
      ≠
Incremental Revenue
      ≠
Causal Revenue
```

The MVP measures attribution rather than claiming that an AI action caused a purchase.

### Current Architecture Philosophy

This project intentionally avoids unnecessary infrastructure complexity in the MVP.

The current architecture uses:

* PostgreSQL as the primary source of truth
* Prisma for database access
* Next.js and TypeScript
* Deterministic application-level business rules
* PostgreSQL constraints for important invariants

The MVP intentionally does not introduce systems such as Kafka, Redis, Elasticsearch, a separate data warehouse, or multi-region infrastructure unless the project later has a clear reason to require them.

The goal is to build a system that is **simple enough to understand but architecturally correct enough to grow**.

### Learning Goal

This project is also a learning project.

The goal is not only to build a working application, but to understand how a real software system is designed and implemented from the ground up.

The project is being developed incrementally, with particular focus on understanding:

* Domain modeling
* Multi-tenant architecture
* PostgreSQL data modeling
* Prisma
* Database constraints
* Transactions
* State machines
* Validation
* Authentication and authorization boundaries
* Event-driven thinking
* AI integration
* AI guardrails
* Financial data correctness
* Attribution
* Error handling
* Scalability trade-offs
* Separation of concerns

The implementation follows the architecture decisions established during the architecture phase rather than adding abstractions or infrastructure without a concrete need.

---

## High-Level Architecture

```text
                    ┌──────────────────────┐
                    │      Merchant        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │        Store         │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Product/Catalog    Customers         Commerce
             │                 │                 │
             │              Sessions       Cart / Checkout
             │                 │                 │
             └────────────┬────┘                 ▼
                          │                  Orders
                          ▼                     │
                       Events              Payments
                          │                     │
                          └──────────┬──────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Growth System  │
                            └────────┬────────┘
                                     │
                                     ▼
                              Opportunities
                                     │
                                     ▼
                                AI Actions
                                     │
                                     ▼
                                Guardrails
                                     │
                                     ▼
                                Exposure
                                     │
                                     ▼
                                 Purchase
                                     │
                                     ▼
                                Attribution
```



```

This version is intentionally **project-context focused**, rather than turning the README into a full architecture document. The detailed architecture decisions should remain in the architecture docs, while the README explains **what the project is, why it exists, and how the major pieces fit together**.
```
