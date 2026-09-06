# Plan 002 — Product Catalog & Inventory

## Objective

Define the product and inventory model for The Next Gen Store.

The goal is to create a product model that is:

* Rich enough for merchant operations and analytics
* Reliable enough for AI decision-making
* Flexible enough to support different electronics categories
* Simple enough for the MVP
* Structured so derived metrics are calculated rather than unnecessarily stored

This plan defines the domain and database requirements only.

Do not implement AI logic, event tracking, orders, payments, or dynamic pricing.

---

# 1. Product Definition

A **Product** is an electronics item sold through the Store.

The catalogue should support a broad range of electronics, including:

* Batteries
* Chargers
* USB cables
* Pendrives
* Speakers
* Headphones
* RAM
* SSDs
* Graphics cards
* Computer/laptop components
* Other electronics added later

Every Product belongs to exactly one Store.

```text
Merchant
   ↓ 1:1
Store
   ↓ 1:N
Product
```

---

# 2. Product Data

The Product model should contain the minimum structured information required for:

* Customer storefront
* Merchant product management
* Inventory management
* Sales analytics
* AI decision-making

## Core identity

* `id`
* `storeId`
* `name`
* `description`
* `brand`
* `category`
* `subcategory`
* `sku`
* product images
* `createdAt`
* `updatedAt`

### SKU

SKU should exist as a product identifier.

For the MVP:

* SKU must be unique within a Store.
* Do not build automatic SKU generation.
* Do not build advanced warehouse/SKU management.

---

# 3. Product Pricing

The product must support:

* MRP
* Current selling price
* Cost price

The distinction is important:

```text
MRP
↓
Reference/list price

Selling Price
↓
What the customer currently pays

Cost Price
↓
What the merchant pays/acquires the product for
```

These values allow the system to reason about both customer pricing and merchant economics.

---

# 4. Derived Financial Values

Do not unnecessarily store values that can reliably be calculated.

For example:

```text
Profit
= Selling Price - Cost Price
```

```text
Profit Margin
= Profit / Selling Price
```

Discount can similarly be calculated from MRP and selling price when appropriate.

The architecture should establish clear **sources of truth** rather than storing multiple values that can become inconsistent.

Example:

```text
MRP = ₹3,000
Selling Price = ₹2,400
Cost Price = ₹1,900

Discount = derived
Profit = derived
Profit Margin = derived
```

If a future requirement requires historical pricing, that should be introduced as a separate pricing/history concept rather than overwriting the current product data.

---

# 5. Inventory

Inventory is part of the MVP Product model.

The product should support:

* Current stock quantity
* Low-stock threshold
* Availability status

The system should be able to determine states such as:

```text
IN_STOCK
LOW_STOCK
OUT_OF_STOCK
```

Avoid creating contradictory states.

For example:

```text
stockQuantity = 0
```

must not result in the product being treated as available for purchase.

The exact implementation of availability should be decided during database design.

---

# 6. Inventory and AI

Inventory is an important signal for future AI decisions.

The AI may eventually use information such as:

```text
Product:
Sony Headphones

Stock:
7 units

Demand:
High

Margin:
Good
```

This can influence decisions such as:

* Recommend a product with healthy stock
* Promote a product with excess inventory
* Avoid recommending an unavailable product
* Create legitimate low-stock urgency

### Important constraint

The AI must **never manufacture scarcity**.

If the product has 7 units, the system can communicate genuine low-stock information.

It must not claim:

> "Only 7 left"

when the actual inventory is significantly higher.

---

# 7. Product Attributes / Specifications

Do not create a large Product table containing every possible electronics specification.

Different categories require different attributes.

For example:

### Headphones

```text
type: Over-ear
noiseCancellation: true
batteryLife: 30 hours
```

### SSD

```text
capacity: 1TB
interface: NVMe
formFactor: M.2
```

### Graphics Card

```text
memory: 12GB
memoryType: GDDR6
interface: PCIe
```

These should not require adding new database columns every time a new category is introduced.

The architecture should therefore support **flexible product specifications/attributes**.

The implementation must remain queryable and structured enough for future AI/product filtering.

Do not introduce an unnecessarily complicated attribute framework.

The final storage approach should be selected during database design based on:

* Flexibility
* Queryability
* Type safety where practical
* PostgreSQL compatibility
* Prisma compatibility
* Simplicity

---

# 8. Product Images

Products should support product imagery because the customer-facing store requires visual product presentation.

The architecture should support:

* One or multiple product images
* A predictable ordering/primary image concept

Image hosting itself is out of scope.

Do not implement Cloudinary in this plan.

---

# 9. External Product Links

Products may optionally contain an external product URL.

Examples:

* Amazon
* Flipkart
* Blinkit
* Other external destinations

This is optional metadata.

Important:

> External links are not part of the core commerce or AI architecture.

The product must work completely without an external URL.

Do not build integrations with Amazon, Flipkart, or Blinkit.

Do not scrape their data.

---

# 10. Categories and Brands

Products should support structured:

```text
Brand
Category
Subcategory
```

These should be useful for:

* Store navigation
* Product filtering
* Analytics
* AI product matching
* Cross-selling
* Substitution
* Upselling

Avoid creating an unnecessarily deep category hierarchy for the MVP.

The initial electronics catalogue should be enough to demonstrate the growth-agent workflow.

---

# 11. Derived Product Intelligence

Do not store the following as permanent Product fields simply because the AI may eventually use them:

* Total sales
* Demand score
* Sales velocity
* Days since last sale
* Conversion rate
* Inventory turnover
* Popularity score
* Revenue generated
* AI-attributed revenue

These are **derived from other system data**.

For example:

```text
Orders + Order Items
        ↓
Sales velocity
        ↓
Demand indicators
```

and:

```text
Events + Orders
        ↓
Product conversion rate
```

and:

```text
Inventory + Sales history
        ↓
Inventory turnover
```

The exact calculations will be defined in later phases when Orders and Events exist.

---

# 12. Discounts and Pricing Strategy

The MVP should support the concept of a product having a current selling price that may be lower than its MRP.

Potential future discount reasons include:

* Merchant promotion
* Seasonal sale
* Diwali
* Christmas
* Excess inventory
* Slow-moving inventory
* Customer-specific offers

However, this plan does **not** implement AI-driven dynamic pricing.

The AI must not directly change the product's base selling price.

Dynamic pricing is explicitly deferred.

Future AI actions may instead propose bounded discounts/offers subject to merchant rules.

---

# 13. Source of Truth

The architecture should clearly distinguish:

### Stored

Examples:

```text
Product name
Description
Brand
Category
MRP
Selling price
Cost price
Stock quantity
SKU
```

### Derived

Examples:

```text
Discount percentage
Profit
Profit margin
Demand
Sales velocity
Conversion rate
Inventory turnover
```

The implementation should avoid storing duplicate representations of the same fact unless there is a clear reason such as historical/audit requirements.

---

# 14. MVP Product Relationship

The intended relationship is:

```text
Store
  │
  └── Products
        ├── Identity
        ├── Pricing
        ├── Inventory
        ├── Images
        ├── Classification
        └── Flexible Specifications
```

Every Product must belong to exactly one Store.

A Product must never exist globally without a Store ownership relationship.

---

# 15. Out of Scope

Do not implement:

* Dynamic pricing
* AI pricing engine
* AI discounts
* Product recommendations
* Event tracking
* Orders
* Payments
* Cloudinary
* Amazon/Flipkart/Blinkit integrations
* Warehouse management
* Multiple warehouses
* Supplier management
* Purchase orders
* Advanced SKU management
* Complex product variants unless a later requirement requires them

---

# 16. Expected Output

This is primarily an architecture/data-modeling plan.

Claude should:

1. Review the existing project structure.
2. Review Plan 001 / Identity Model.
3. Define the final Product and Inventory domain model.
4. Identify relationships with Store.
5. Decide how flexible product specifications should be represented.
6. Clearly separate stored vs derived product data.
7. Identify any conflicts with the existing project.
8. Document implementation implications for the future database phase.

### Expected files

Update/create the relevant planning documentation under:

```text
docs/plans/
```

A finalized plan/documentation artifact is expected.

### Do not modify

* Application UI
* Components
* Authentication
* PostgreSQL
* Prisma schema
* Database migrations
* AI implementation
* Event tracking
* Payment implementation

Unless an existing implementation directly conflicts with the accepted architecture and must be documented as a required correction.

---

# 17. Completion Criteria

Plan 002 is complete when:

* Product is clearly defined.
* Product → Store ownership is defined.
* Required product fields are finalized.
* Pricing sources of truth are finalized.
* Inventory model is finalized.
* SKU decision is finalized.
* Brand/category/subcategory structure is finalized.
* Flexible product specifications approach is decided.
* External URL is confirmed as optional metadata.
* Stored vs derived values are clearly separated.
* Dynamic pricing is explicitly deferred.
* AI-relevant product data requirements are documented.
* No premature database implementation has been introduced.

The output of this plan becomes the product/catalog foundation for the Event Tracking, Commerce, AI Growth, and eventual Database phases.
