# The Next Gen Store — Phase 2.5 & 2.6 Architecture

## Phase 2.5 — AI Growth System

## Phase 2.6 — Guardrails, Audit & Revenue Attribution

---

# 1. Purpose

The AI Growth System is the core intelligence layer of The Next Gen Store.

It must not behave as a generic chatbot or simple recommendation engine.

Its job is to:

1. Observe customer behavior.
2. Detect a meaningful revenue opportunity.
3. Determine whether an intervention is appropriate.
4. Generate candidate actions.
5. Apply merchant-defined constraints.
6. Execute an allowed action.
7. Observe customer response.
8. Connect the action to eventual commerce.
9. Measure attributable revenue.

The overall flow is:

```text
Customer Activity
        ↓
Behavior / Intent Signals
        ↓
Revenue Opportunity
        ↓
Candidate Actions
        ↓
AI Reasoning
        ↓
Merchant Guardrails
        ↓
Approved AI Action
        ↓
Customer Response
        ↓
Order / Payment
        ↓
Revenue Attribution
        ↓
Audit Trail
```

---

# 2. Core Principle

The AI does not directly control the business.

It operates inside a bounded decision system.

```text
AI proposes
Merchant rules constrain
System validates
Action executes
```

The AI must never be the final authority over:

* Inventory truth
* Product existence
* Product purchasability
* Price truth
* Payment truth
* Merchant permissions
* Customer identity
* Revenue truth

---

# 3. Phase 2.5 — AI Growth System

## 3.1 AI Inputs

The AI can reason over information from established domain sources.

### Customer behavior

From Events:

* Searches
* Product views
* Product clicks
* Cart additions
* Cart removals
* Cart views
* Checkout starts
* AI offer interactions
* Purchases

### Customer context

From:

* Customer
* Session
* Historical attributed activity
* Previous purchases

### Product context

From:

* Product description
* Category
* Subcategory
* Brand
* Structured specifications
* Selling price
* MRP
* Inventory
* Availability
* Cost/margin where merchant-only reasoning is permitted

### Commerce context

From:

* Current Cart
* Checkout state
* Previous Orders
* Order history
* Payment state

### Merchant context

From:

* Merchant rules
* Product eligibility
* Discount constraints
* Inventory constraints
* Frequency limits
* Other guardrails

---

# 4. AI Must Not Use External Product URLs

`externalUrl` is inert metadata.

The AI must not:

* Scrape Amazon/Flipkart/Blinkit.
* Infer competitor pricing from an external URL.
* Present an external price it cannot verify.
* Make an action dependent on an external marketplace.

Product intelligence comes from the store's own catalog and behavioral data.

---

# 5. Revenue Opportunity

The AI should not directly jump from an Event to an action.

There is an intermediate concept:

> **Revenue Opportunity**

An Opportunity represents a situation where the system believes a commercially meaningful intervention may exist.

Examples:

```text
Customer repeatedly views SSDs
        ↓
Potential upsell opportunity
```

```text
Customer adds GPU
        ↓
Compatible power supply absent
        ↓
Potential cross-sell opportunity
```

```text
Customer's selected product is OUT_OF_STOCK
        ↓
Compatible alternative exists
        ↓
Potential substitution opportunity
```

```text
Customer reaches checkout
        ↓
Payment does not complete
        ↓
Potential abandoned-checkout opportunity
```

---

# 6. Opportunity ≠ AI Action

This distinction is mandatory.

### Opportunity

> There may be a revenue-growth situation.

### AI Action

> The system decided to do something about it.

Example:

```text
Opportunity:
Customer has SSD in cart and compatible RAM is relevant.

AI Action:
Show a RAM cross-sell intervention.
```

An opportunity may exist without an action being taken.

Reasons:

* No suitable action
* Guardrail violation
* Low confidence
* Customer already saw the intervention
* Frequency limit
* Inventory unavailable
* Margin constraint
* Merchant disabled the action type

---

# 7. Candidate Action Types

The MVP should support a small controlled action vocabulary.

## 7.1 Upsell

Move the customer toward a higher-value product.

Example:

```text
1TB SSD
      ↓
2TB SSD
```

---

## 7.2 Cross-sell

Suggest a complementary product.

Example:

```text
GPU
 ↓
Compatible power supply
```

---

## 7.3 Substitution

Suggest an alternative when the selected product is unavailable or unsuitable.

Example:

```text
SSD A → OUT_OF_STOCK
        ↓
Compatible SSD B
```

---

## 7.4 Personalized Offer

Provide a bounded offer to an eligible customer.

The AI may propose the intervention, but it cannot freely invent discount rules.

---

## 7.5 Cart Optimization

Identify an opportunity within the current cart.

Examples:

* Missing complementary item
* Better compatible product
* Quantity opportunity

---

## 7.6 Abandoned Checkout Intervention

Customer started checkout but did not complete the purchase.

Possible intervention:

* Reminder
* Relevant product information
* Permitted offer

Exact communication channels are deferred until implementation requirements are clear.

---

# 8. Action Selection

The AI should reason over candidate actions rather than freely inventing arbitrary actions.

Conceptually:

```text
Opportunity
    ↓
Candidate Actions
    ↓
AI evaluates:
    - relevance
    - customer intent
    - product compatibility
    - inventory
    - economics
    - recent interventions
    - merchant constraints
    ↓
Candidate Action
```

---

# 9. No-Action Is a Valid Decision

This is important.

The AI should be allowed to decide:

```text
NO_ACTION
```

if:

* Intent is weak.
* No relevant product exists.
* Intervention would be intrusive.
* Guardrails reject the action.
* Customer recently received an intervention.
* Inventory changed.
* Expected benefit is too low.
* Evidence is insufficient.

The system should optimize for **useful interventions**, not maximum intervention volume.

---

# 10. AI Action

An AI Action represents a concrete intervention proposed/generated by the system.

Conceptually:

```text
AIAction
├── id
├── opportunityId
├── actionType
├── target
├── reasoning metadata
├── decision context
├── guardrail result
├── status
├── createdAt
└── execution information
```

Exact database fields are deferred to implementation.

---

# 11. Action Lifecycle

The conceptual lifecycle is:

```text
GENERATED
    ↓
VALIDATING
    ↓
APPROVED / REJECTED
    ↓
EXECUTED
    ↓
CUSTOMER RESPONDED
    ↓
CONVERTED / EXPIRED / NO_CONVERSION
```

Not every action reaches execution.

Not every executed action results in a purchase.

---

# 12. AI Reasoning Must Be Traceable

We do not need to store the model's entire chain-of-thought.

Instead, store structured decision metadata sufficient to explain the action.

For example:

```text
Opportunity:
Customer viewed 1TB SSD three times.

Reason:
Strong repeated product intent.

Action:
Recommend compatible RAM.

Why:
Customer's current product interest makes the complementary product relevant.

Constraints:
Inventory available.
Merchant cross-sell enabled.
Frequency limit not exceeded.
```

The system should preserve **decision-relevant evidence**, not private chain-of-thought.

---

# 13. Structured AI Output

The AI should eventually produce a structured decision rather than uncontrolled prose.

Conceptually:

```text
{
  decision,
  opportunityType,
  actionType,
  targetProductId,
  rationale,
  confidence,
  proposedOffer,
  requiredConstraints
}
```

The application validates this output before anything executes.

The exact schema belongs to implementation planning.

---

# 14. AI Must Never Invent Business Facts

The model cannot invent:

* Product IDs
* Prices
* Inventory
* Discounts
* Customer identity
* Orders
* Payment status
* Revenue
* Compatibility facts not supported by catalog data

The application provides authoritative data.

The AI reasons over that data.

---

# 15. AI Pricing Boundary

Dynamic pricing is explicitly out of scope.

The AI cannot change:

```text
Product.sellingPricePaise
```

The base product price remains merchant-controlled.

A future AI action may propose a bounded offer/discount only when permitted by merchant rules.

---

# 16. Inventory Boundary

The AI cannot override:

```text
stockQuantity
availability
isPurchasable
```

If a product is not purchasable, it cannot be recommended as a purchasable action.

Scarcity claims must follow the previously accepted inventory rules:

1. Product must actually be LOW_STOCK.
2. The threshold comes from merchant configuration.
3. Any stated quantity must equal observed stock at generation time.
4. Observed stock must be recorded with the AI Action/audit record.

This preserves the product model's auditability.

---

# 17. Phase 2.6 — Guardrails

Guardrails are the boundary between:

> What the AI wants to do

and:

> What the business allows the AI to do.

---

# 18. Guardrail Categories

## 18.1 Product Guardrails

Validate:

* Product exists.
* Product belongs to Store.
* Product is ACTIVE.
* Product is purchasable.
* Product is relevant to the action.

---

## 18.2 Inventory Guardrails

Validate:

* Stock available.
* Low-stock claims are genuine.
* No recommendation of unavailable products.
* Stock has not materially changed before execution.

---

## 18.3 Discount Guardrails

If offers are enabled, validate:

* Maximum discount
* Eligible products
* Eligible customers
* Minimum selling price
* Minimum margin where applicable
* Offer expiration
* Maximum usage

The AI cannot bypass these rules.

---

# 19. Margin Guardrail

Cost/margin information is merchant-only.

AI may use it internally when evaluating an offer.

But:

```text
Customer
    ↓
must never see
    ↓
cost price / profit / margin
```

The customer should only see the resulting permitted offer.

---

# 20. Frequency Guardrails

Prevent excessive interventions.

Examples:

```text
Do not show the same action repeatedly.
Do not repeatedly target the same customer in a short period.
Do not spam multiple offers in one session.
```

Exact limits should be configurable later.

The architectural principle is that intervention frequency is a business constraint, not an AI preference.

---

# 21. Eligibility Guardrails

An action may be limited by:

* Customer state
* Product state
* Cart state
* Inventory
* Previous actions
* Previous purchases
* Merchant configuration

---

# 22. Guardrail Evaluation

Conceptually:

```text
AI proposes Action
        ↓
Guardrail Engine
        ↓
 ┌───────────────┐
 │               │
PASS           REJECT
 │               │
 ↓               ↓
Execute       Record reason
```

A rejected action should still be auditable.

---

# 23. Guardrail Result

Conceptually preserve:

```text
APPROVED
or
REJECTED
```

and the relevant reason.

Example:

```text
Action:
10% discount

Result:
REJECTED

Reason:
Merchant maximum discount = 5%
```

This is important for debugging and merchant trust.

---

# 24. Guardrails Are Not AI

The guardrail system should be deterministic wherever possible.

Bad architecture:

```text
AI:
"Is this discount allowed?"
```

Better:

```text
AI:
"I propose 10%."

Application:
"Merchant max = 5%."

Result:
REJECTED.
```

The AI proposes.

The system enforces.

---

# 25. Audit System

Every meaningful AI decision should leave an audit trail.

The audit system should allow the merchant to answer:

> What happened, why did the AI decide this, what rules were applied, and what happened afterward?

---

# 26. Audit Record

Conceptually:

```text
Audit Entry
├── action
├── actor
├── opportunity
├── decision
├── guardrail result
├── relevant context
├── observed inventory where relevant
├── timestamp
└── outcome
```

Exact schema is deferred.

---

# 27. Audit Immutability

Audit records represent historical system behavior.

They should be append-only or otherwise protected from destructive rewriting.

Historical truth must remain reconstructable.

This follows the same principle already established for identity attribution: later inference must not disguise what was known at the time.

---

# 28. Audit vs Event

They are different.

### Event

Customer behavior:

```text
PRODUCT_VIEW
ADD_TO_CART
PURCHASE
```

### Audit

System/AI behavior:

```text
AI generated action
Guardrail rejected action
Action executed
Action attributed revenue
```

Therefore:

```text
Customer Events ≠ AI Audit Records
```

---

# 29. Revenue Attribution

The ultimate purpose of the system is not to count AI actions.

It is to determine whether AI interventions contributed to merchant revenue.

The conceptual chain is:

```text
AI Action
   ↓
Customer sees action
   ↓
Customer interacts
   ↓
Customer purchases
   ↓
Order
   ↓
Payment
   ↓
Attributable revenue
```

---

# 30. Attribution Must Be Evidence-Based

An AI Action should not automatically receive credit simply because a customer eventually purchased.

The system needs an explicit attribution model.

For MVP, attribution should be conservative and deterministic.

A potential baseline:

```text
AI Action
   ↓
Customer was exposed
   ↓
Relevant interaction occurred
   ↓
Purchase occurred within defined attribution window
   ↓
Purchase is eligible
   ↓
Revenue attributed
```

The exact attribution window and rules should be finalized before implementation of analytics.

---

# 31. Exposure Matters

An action being generated is not equivalent to an action being seen.

Therefore:

```text
GENERATED
```

does not establish attribution.

We need:

```text
OFFER_VIEWED
```

before treating the customer as exposed to the intervention.

This is why OFFER_VIEWED is a first-class event.

---

# 32. Interaction Matters

For stronger attribution:

```text
OFFER_VIEWED
      ↓
OFFER_CLICKED
      ↓
PURCHASE
```

is stronger evidence than:

```text
AI Action generated
      ↓
PURCHASE
```

However, the exact attribution methodology should remain explicit rather than pretending correlation is causation.

---

# 33. Attribution Window

The system needs a defined time window connecting an AI intervention to a purchase.

Example concept:

```text
Action at T
        ↓
Attribution window
        ↓
Purchase at T + Δ
```

The exact duration should be decided during implementation planning based on the action type.

Different action types may eventually require different windows.

---

# 34. Attribution Scope

The system should be able to distinguish:

### Direct attribution

Customer interacted with an AI action and subsequently purchased the relevant product.

### Assisted attribution

AI intervention influenced a purchase but the exact purchased product differs or the relationship is indirect.

### No attribution

Purchase cannot reasonably be connected to the action under the defined rules.

MVP should keep the attribution model simple enough to explain.

---

# 35. Avoid Double Counting

This is critical.

Suppose:

```text
AI Action A
AI Action B
AI Action C
      ↓
One purchase
```

We cannot blindly claim the same revenue three times.

The attribution system must define how competing eligible actions share or receive attribution.

For MVP, use a deterministic attribution rule rather than allowing arbitrary AI judgment.

---

# 36. Revenue Attribution vs Causality

The system can measure:

> Revenue attributable under our defined rules.

It cannot honestly claim:

> The AI caused ₹X of revenue.

unless a stronger experimental methodology is later introduced.

Therefore dashboard language should distinguish:

```text
Attributed Revenue
```

from:

```text
Total Revenue
```

and avoid implying causal certainty.

---

# 37. Attribution Snapshot

Historical attribution must use the facts relevant at the time.

Examples:

* Action type
* Target product
* Observed inventory
* Offer/discount
* Customer/session relationship
* Action timestamp
* Relevant order
* Attribution rule/version

Later changes to Product or merchant configuration must not rewrite historical attribution.

---

# 38. AI Action + Audit + Attribution Relationship

The core model becomes:

```text
Opportunity
      │
      ▼
 AI Action
      │
      ├──────────► Audit
      │
      ▼
Customer Exposure
      │
      ▼
Customer Interaction
      │
      ▼
Order / Payment
      │
      ▼
Revenue Attribution
```

This is the backbone of the product.

---

# 39. Complete AI Growth Architecture

```text
                         CUSTOMER
                            │
                            ▼
                         SESSION
                            │
                            ▼
                          EVENTS
                            │
                            ▼
                  ┌────────────────────┐
                  │ Opportunity Engine │
                  └────────────────────┘
                            │
                            ▼
                      OPPORTUNITY
                            │
                            ▼
                   ┌─────────────────┐
                   │   AI Reasoning  │
                   └─────────────────┘
                            │
                            ▼
                    CANDIDATE ACTION
                            │
                            ▼
                  ┌──────────────────┐
                  │ Guardrail Engine │
                  └──────────────────┘
                       │          │
                    REJECT       PASS
                       │          │
                       ▼          ▼
                    AUDIT      AI ACTION
                                  │
                                  ▼
                          CUSTOMER EXPOSURE
                                  │
                                  ▼
                          CUSTOMER RESPONSE
                                  │
                                  ▼
                              CHECKOUT
                                  │
                                  ▼
                              PAYMENT
                                  │
                                  ▼
                               ORDER
                                  │
                                  ▼
                         REVENUE ATTRIBUTION
                                  │
                                  ▼
                                AUDIT
```

---

# 40. Important Separation of Responsibilities

| Responsibility         | Authoritative source |
| ---------------------- | -------------------- |
| Customer identity      | Customer / Session   |
| Behavioral history     | Event                |
| Product facts          | Product              |
| Current inventory      | Product              |
| Current cart           | Cart                 |
| Historical purchase    | Order                |
| Payment status         | Payment              |
| Revenue                | Order / Payment      |
| Opportunity            | Opportunity system   |
| AI decision            | AI Action            |
| Business constraints   | Guardrails           |
| Historical AI behavior | Audit                |
| AI-attributed revenue  | Attribution system   |

This follows the project's existing principle:

> **One fact, one authoritative home.**

---

# 41. Phase 2.5 Invariants

**AI-1** AI never becomes authoritative for business facts.

**AI-2** AI operates only on available domain data.

**AI-3** AI may propose actions but cannot bypass guardrails.

**AI-4** No-action is a valid AI decision.

**AI-5** Opportunity and AI Action are separate concepts.

**AI-6** AI Actions use a controlled action vocabulary.

**AI-7** AI cannot invent products, prices, stock, orders, payments, or revenue.

**AI-8** AI cannot modify base product pricing.

**AI-9** AI cannot recommend a non-purchasable product.

**AI-10** AI must not expose cost, profit, or margin to customers.

**AI-11** AI reasoning is represented through structured decision evidence, not stored chain-of-thought.

---

# 42. Phase 2.6 Invariants

**GR-1** Merchant guardrails are enforced outside the AI model.

**GR-2** Guardrails are deterministic wherever possible.

**GR-3** Rejected actions remain auditable.

**GR-4** Important AI decisions produce audit records.

**GR-5** Audit history must preserve historical truth.

**GR-6** AI Action generation does not imply customer exposure.

**GR-7** Customer exposure is represented separately.

**GR-8** Revenue attribution requires explicit attribution rules.

**GR-9** One purchase cannot be blindly counted multiple times as AI-attributed revenue.

**GR-10** Attributed revenue and total revenue remain separate concepts.

**GR-11** Historical attribution must preserve the relevant facts at the time.

**GR-12** Attribution must not be presented as causal proof unless supported by an appropriate experimental design.

---

# 43. Deferred

The following remain outside the current architecture implementation:

* Autonomous AI pricing
* Dynamic pricing
* Fully autonomous campaign creation
* Complex experimentation platform
* Multi-agent architecture
* Real-time event streaming
* Data warehouse
* Advanced causal inference
* Complex attribution algorithms
* Multi-channel marketing infrastructure
* Email/SMS/WhatsApp provider integrations
* Advanced customer segmentation
* Reinforcement learning
* AI fine-tuning

The MVP should first prove one complete, measurable growth loop.

---

# 44. Target MVP Growth Loop

The architecture should ultimately allow a demo like:

```text
Customer searches for SSD
        ↓
Views multiple SSDs
        ↓
Adds SSD to cart
        ↓
AI detects cross-sell opportunity
        ↓
AI identifies compatible RAM
        ↓
Merchant rules permit cross-sell
        ↓
AI Action approved
        ↓
Customer sees recommendation
        ↓
Customer clicks recommendation
        ↓
RAM added to cart
        ↓
Customer checks out
        ↓
Razorpay payment succeeds
        ↓
Order confirmed
        ↓
Purchase recorded
        ↓
Revenue attributed to AI action
        ↓
Merchant sees:
"AI-attributed revenue: ₹X"
```

That single loop is more important than building dozens of disconnected AI features.

---

# 45. Phase 2.5 + 2.6 Completion Criteria

Before implementation, the architecture must define:

* What constitutes an opportunity.
* Which opportunity types exist.
* Which AI action types exist.
* What information the AI can use.
* What the AI cannot decide.
* How AI output is structured.
* What merchant guardrails exist.
* How guardrails are enforced.
* How rejected actions are recorded.
* What constitutes customer exposure.
* What constitutes customer interaction.
* How actions connect to orders.
* How revenue attribution works.
* How duplicate attribution is prevented.
* How historical decisions remain auditable.
* How total revenue differs from AI-attributed revenue.

---

# 46. Phase 2 Status After These Phases

| Phase                                 | Status      |
| ------------------------------------- | ----------- |
| 2.1 Identity                          | ✅ Finalized |
| 2.2 Product + Inventory               | ✅ Finalized |
| 2.3 Events + Customer Activity        | ✅ Finalized |
| 2.4 Cart + Checkout + Order + Payment | ✅ Finalized |
| 2.5 AI Growth System                  | ✅ Finalized |
| 2.6 Guardrails + Audit + Attribution  | ✅ Finalized |
| 2.7 Architecture Review               | ⏳ Next      |

The next step is **not implementation yet**.

Phase **2.7 Architecture Review** should now challenge the entire model from 2.1–2.6, look for contradictions, duplicated facts, missing relationships, security boundaries, financial inconsistencies, and AI failure modes.

Only after 2.7 should we freeze Phase 2 and move to **Phase 3 — PostgreSQL + Prisma implementation**.
