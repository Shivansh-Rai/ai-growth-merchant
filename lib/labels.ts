import type {
  ActionResult,
  AuditActorType,
  AuditCategory,
  CustomerSegment,
  OpportunityStatus,
  OpportunityType,
  ProductStatus,
} from "@/types";
import type { BadgeTone } from "@/components/ui/badge";

/** Maps a domain enum to the label and badge tone the UI should show for it. */
export interface LabelSpec {
  label: string;
  tone: BadgeTone;
}

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, LabelSpec> = {
  alternative_product: { label: "Alternative product", tone: "brand" },
  cart_recovery: { label: "Cart recovery", tone: "brand" },
  cross_sell: { label: "Cross-sell", tone: "brand" },
  discount_nudge: { label: "Discount nudge", tone: "brand" },
  reorder_reminder: { label: "Reorder reminder", tone: "brand" },
  churn_risk: { label: "Churn risk", tone: "caution" },
};

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, LabelSpec> = {
  new: { label: "New", tone: "brand" },
  in_review: { label: "In review", tone: "caution" },
  approved: { label: "Approved", tone: "positive" },
  actioned: { label: "Actioned", tone: "positive" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

export const ACTION_RESULT_LABELS: Record<ActionResult, LabelSpec> = {
  pending: { label: "Pending", tone: "caution" },
  succeeded: { label: "Succeeded", tone: "positive" },
  no_response: { label: "No response", tone: "neutral" },
  failed: { label: "Failed", tone: "critical" },
};

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, LabelSpec> = {
  new: { label: "New", tone: "brand" },
  returning: { label: "Returning", tone: "neutral" },
  loyal: { label: "Loyal", tone: "positive" },
  at_risk: { label: "At risk", tone: "caution" },
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, LabelSpec> = {
  active: { label: "Active", tone: "positive" },
  draft: { label: "Draft", tone: "neutral" },
  out_of_stock: { label: "Out of stock", tone: "critical" },
};

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, LabelSpec> = {
  ai_decision: { label: "AI decision", tone: "brand" },
  money: { label: "Money", tone: "positive" },
  catalog: { label: "Catalog", tone: "neutral" },
  customer: { label: "Customer", tone: "neutral" },
  system: { label: "System", tone: "neutral" },
};

export const AUDIT_ACTOR_LABELS: Record<AuditActorType, string> = {
  ai_agent: "AI agent",
  merchant: "Merchant",
  system: "System",
};
