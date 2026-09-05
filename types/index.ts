/**
 * Domain types for the merchant dashboard.
 *
 * These describe the shape of data the UI renders. They are deliberately
 * presentation-facing: when the database lands, its records should be mapped
 * into these types at the data-access boundary so components never change.
 *
 * All monetary values are whole Indian rupees (INR).
 */

/** A customer as referenced from an opportunity, action or log entry. */
export interface CustomerRef {
  id: string;
  name: string;
  email: string;
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export type CustomerSegment = "new" | "returning" | "loyal" | "at_risk";

export interface Customer extends CustomerRef {
  segment: CustomerSegment;
  orderCount: number;
  lifetimeValue: number;
  lastActiveAt: string;
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export type ProductStatus = "active" | "draft" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

/* -------------------------------------------------------------------------- */
/* AI Growth — Opportunities                                                  */
/* -------------------------------------------------------------------------- */

export type OpportunityType =
  | "alternative_product"
  | "cart_recovery"
  | "cross_sell"
  | "discount_nudge"
  | "reorder_reminder"
  | "churn_risk";

export type OpportunityStatus =
  | "new"
  | "in_review"
  | "approved"
  | "actioned"
  | "dismissed";

/**
 * A growth opportunity surfaced by the AI agent.
 *
 * Example: a customer has ₹2,500 earphones sitting in their cart, and an
 * equivalent product is available at ₹2,320 under an active discount.
 */
export interface Opportunity {
  id: string;
  customer: CustomerRef;
  type: OpportunityType;
  /** Short headline for the opportunity. */
  title: string;
  /** What the agent proposes doing. */
  recommendedAction: string;
  /** Why the agent believes this action is worth taking. */
  reason: string;
  /** Projected change in revenue, in rupees. May be negative. */
  expectedRevenueImpact: number;
  status: OpportunityStatus;
  detectedAt: string;
}

/* -------------------------------------------------------------------------- */
/* AI Growth — Actions                                                        */
/* -------------------------------------------------------------------------- */

export type ActionResult = "pending" | "succeeded" | "no_response" | "failed";

/** An action the AI agent has already carried out. */
export interface AgentAction {
  id: string;
  /** What the agent did. */
  action: string;
  customer: CustomerRef;
  /** Why the agent did it. */
  reason: string;
  timestamp: string;
  result: ActionResult;
  /** Revenue attributed to this action, in rupees. */
  revenueGenerated: number;
}

/* -------------------------------------------------------------------------- */
/* Audit Logs                                                                 */
/* -------------------------------------------------------------------------- */

export type AuditActorType = "ai_agent" | "merchant" | "system";

export interface AuditActor {
  type: AuditActorType;
  name: string;
}

export type AuditCategory =
  | "ai_decision"
  | "money"
  | "catalog"
  | "customer"
  | "system";

/** One immutable, chronological record of a decision or money movement. */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: AuditActor;
  category: AuditCategory;
  /** One-line description of what happened. */
  summary: string;
  /** Optional expanded context shown beneath the summary. */
  detail?: string;
  /** Present on money-related entries only, in rupees. */
  amount?: number;
}
