import type {
  AgentAction,
  AuditLogEntry,
  Customer,
  Opportunity,
  Product,
} from "@/types";
import { MERCHANT_PROFILE } from "./merchant";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO DATA — NOT PRODUCTION DATA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Illustrative rows used to show the dashboard at realistic information density
 * while the database, AI agent and payment integration are still to be built.
 *
 * Nothing here is loaded unless "Demo data" is switched on in the header (see
 * components/demo/demo-data-provider.tsx). Every page already renders a real
 * empty state when handed an empty collection.
 *
 * To retire this layer: delete this file and the `components/demo` folder, then
 * remove the `<DemoDataProvider>` wrapper from app/(dashboard)/layout.tsx. The
 * page and section components need no changes — they take data as props.
 *
 * Timestamps are fixed ISO strings and are always rendered absolutely, so
 * server and client markup match exactly.
 */

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export const demoCustomers: Customer[] = [
  {
    id: "cus_01",
    name: "Ananya Iyer",
    email: "ananya.iyer@example.in",
    segment: "returning",
    orderCount: 4,
    lifetimeValue: 18_450,
    lastActiveAt: "2026-09-04T18:20:00+05:30",
  },
  {
    id: "cus_02",
    name: "Rohan Mehta",
    email: "rohan.mehta@example.in",
    segment: "new",
    orderCount: 1,
    lifetimeValue: 2_999,
    lastActiveAt: "2026-09-01T11:05:00+05:30",
  },
  {
    id: "cus_03",
    name: "Priya Nair",
    email: "priya.nair@example.in",
    segment: "loyal",
    orderCount: 17,
    lifetimeValue: 96_780,
    lastActiveAt: "2026-09-05T09:47:00+05:30",
  },
  {
    id: "cus_04",
    name: "Vikram Shetty",
    email: "vikram.shetty@example.in",
    segment: "at_risk",
    orderCount: 9,
    lifetimeValue: 41_200,
    lastActiveAt: "2026-06-29T15:32:00+05:30",
  },
  {
    id: "cus_05",
    name: "Sneha Kulkarni",
    email: "sneha.kulkarni@example.in",
    segment: "loyal",
    orderCount: 12,
    lifetimeValue: 58_340,
    lastActiveAt: "2026-09-05T20:14:00+05:30",
  },
  {
    id: "cus_06",
    name: "Arjun Desai",
    email: "arjun.desai@example.in",
    segment: "returning",
    orderCount: 3,
    lifetimeValue: 12_060,
    lastActiveAt: "2026-09-03T13:58:00+05:30",
  },
];

/** Trimmed reference used by opportunities, actions and log entries. */
const ref = (id: string) => {
  const customer = demoCustomers.find((c) => c.id === id);
  if (!customer) throw new Error(`Unknown demo customer: ${id}`);
  return { id: customer.id, name: customer.name, email: customer.email };
};

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export const demoProducts: Product[] = [
  {
    id: "prd_01",
    name: "Aeris Wireless Earphones",
    sku: "NGS-AUD-2500",
    category: "Audio",
    price: 2_500,
    stock: 64,
    status: "active",
  },
  {
    id: "prd_02",
    name: "Aeris Wireless Earphones Lite",
    sku: "NGS-AUD-2320",
    category: "Audio",
    price: 2_320,
    stock: 128,
    status: "active",
  },
  {
    id: "prd_03",
    name: "Pulse Fitness Smartwatch",
    sku: "NGS-WER-4999",
    category: "Wearables",
    price: 4_999,
    stock: 22,
    status: "active",
  },
  {
    id: "prd_04",
    name: "Guardian Tempered Screen Guard",
    sku: "NGS-ACC-0399",
    category: "Accessories",
    price: 399,
    stock: 0,
    status: "out_of_stock",
  },
  {
    id: "prd_05",
    name: "Orbit 65W GaN Charger",
    sku: "NGS-PWR-1899",
    category: "Power",
    price: 1_899,
    stock: 47,
    status: "active",
  },
  {
    id: "prd_06",
    name: "Nimbus Laptop Sleeve 14\"",
    sku: "NGS-BAG-1299",
    category: "Accessories",
    price: 1_299,
    stock: 15,
    status: "draft",
  },
];

/* -------------------------------------------------------------------------- */
/* AI Growth — Opportunities                                                  */
/* -------------------------------------------------------------------------- */

export const demoOpportunities: Opportunity[] = [
  {
    id: "opp_01",
    customer: ref("cus_01"),
    type: "alternative_product",
    title: "Cheaper equivalent available for an item sitting in cart",
    recommendedAction:
      "Offer Aeris Wireless Earphones Lite at ₹2,320 as an alternative to the ₹2,500 pair in cart.",
    reason:
      "Cart has been idle for 2 days. An equivalent product from the same range is ₹180 cheaper under an active discount and is in stock.",
    expectedRevenueImpact: 2_320,
    status: "new",
    detectedAt: "2026-09-06T09:12:00+05:30",
  },
  {
    id: "opp_02",
    customer: ref("cus_03"),
    type: "cross_sell",
    title: "Complementary accessory fits a recent purchase",
    recommendedAction:
      "Suggest the Orbit 65W GaN Charger alongside the smartwatch bought last week.",
    reason:
      "Customer bought a device with no fast charger in the same order, and has purchased accessories on 3 of their last 5 orders.",
    expectedRevenueImpact: 1_899,
    status: "in_review",
    detectedAt: "2026-09-06T08:41:00+05:30",
  },
  {
    id: "opp_03",
    customer: ref("cus_02"),
    type: "cart_recovery",
    title: "High-value cart abandoned five days ago",
    recommendedAction:
      "Send a single cart reminder covering the ₹4,999 Pulse Fitness Smartwatch.",
    reason:
      "First-time customer reached checkout and stopped at the payment step. No reminder has been sent for this cart.",
    expectedRevenueImpact: 4_999,
    status: "new",
    detectedAt: "2026-09-05T19:26:00+05:30",
  },
  {
    id: "opp_04",
    customer: ref("cus_04"),
    type: "churn_risk",
    title: "Loyal customer inactive for 68 days",
    recommendedAction:
      "Queue a win-back offer on the Audio category this customer buys most.",
    reason:
      "Nine lifetime orders with a 24-day average gap. The current gap is 2.8× that, and the last two sessions ended without a cart.",
    expectedRevenueImpact: 3_400,
    status: "approved",
    detectedAt: "2026-09-05T14:03:00+05:30",
  },
  {
    id: "opp_05",
    customer: ref("cus_05"),
    type: "reorder_reminder",
    title: "Consumable is due for reorder",
    recommendedAction:
      "Remind the customer to reorder their regular accessory bundle.",
    reason:
      "The customer has reordered this bundle every 7-9 weeks for the last four cycles. The current cycle is at week 9.",
    expectedRevenueImpact: 1_650,
    status: "actioned",
    detectedAt: "2026-09-04T10:55:00+05:30",
  },
  {
    id: "opp_06",
    customer: ref("cus_06"),
    type: "discount_nudge",
    title: "Repeat viewer has not converted across four sessions",
    recommendedAction:
      "Do not discount. Surface stock levels and delivery date on the product page instead.",
    reason:
      "Product was viewed 4 times in 6 days without a cart add. Margin on this SKU is 11%, so a discount would not clear the threshold.",
    expectedRevenueImpact: -320,
    status: "dismissed",
    detectedAt: "2026-09-03T16:39:00+05:30",
  },
];

/* -------------------------------------------------------------------------- */
/* AI Growth — Actions                                                        */
/* -------------------------------------------------------------------------- */

export const demoActions: AgentAction[] = [
  {
    id: "act_01",
    action: "Sent alternative product recommendation",
    customer: ref("cus_01"),
    reason:
      "Cheaper equivalent in stock for an idle cart item under an active discount.",
    timestamp: "2026-09-06T09:18:00+05:30",
    result: "succeeded",
    revenueGenerated: 2_320,
  },
  {
    id: "act_02",
    action: "Sent cart recovery reminder",
    customer: ref("cus_02"),
    reason: "Checkout abandoned at the payment step with no prior reminder.",
    timestamp: "2026-09-05T19:30:00+05:30",
    result: "no_response",
    revenueGenerated: 0,
  },
  {
    id: "act_03",
    action: "Applied loyalty discount at checkout",
    customer: ref("cus_03"),
    reason:
      "Seventeenth order crossed the loyalty threshold configured by the merchant.",
    timestamp: "2026-09-05T11:02:00+05:30",
    result: "succeeded",
    revenueGenerated: 6_480,
  },
  {
    id: "act_04",
    action: "Queued win-back offer",
    customer: ref("cus_04"),
    reason: "Inactive for 2.8× the customer's usual purchase gap.",
    timestamp: "2026-09-05T14:10:00+05:30",
    result: "pending",
    revenueGenerated: 0,
  },
  {
    id: "act_05",
    action: "Sent reorder reminder",
    customer: ref("cus_05"),
    reason: "Reorder cycle reached week 9 of a consistent 7-9 week pattern.",
    timestamp: "2026-09-04T11:00:00+05:30",
    result: "succeeded",
    revenueGenerated: 1_650,
  },
  {
    id: "act_06",
    action: "Held back discount nudge",
    customer: ref("cus_06"),
    reason: "Margin on the viewed SKU was below the merchant's floor.",
    timestamp: "2026-09-03T16:44:00+05:30",
    result: "failed",
    revenueGenerated: 0,
  },
];

/* -------------------------------------------------------------------------- */
/* Audit Logs                                                                 */
/* -------------------------------------------------------------------------- */

const AGENT = { type: "ai_agent", name: "Growth Agent" } as const;
const MERCHANT = { type: "merchant", name: MERCHANT_PROFILE.name } as const;
const SYSTEM = { type: "system", name: "Platform" } as const;

export const demoAuditLog: AuditLogEntry[] = [
  {
    id: "log_01",
    timestamp: "2026-09-06T09:18:22+05:30",
    actor: AGENT,
    category: "money",
    summary: "Order placed after alternative product recommendation",
    detail:
      "Ananya Iyer completed checkout on the ₹2,320 alternative. Revenue attributed to opportunity opp_01.",
    amount: 2_320,
  },
  {
    id: "log_02",
    timestamp: "2026-09-06T09:12:04+05:30",
    actor: AGENT,
    category: "ai_decision",
    summary: "Opportunity created — alternative product",
    detail:
      "Idle cart detected for Ananya Iyer. Equivalent SKU NGS-AUD-2320 matched at ₹180 below the cart item.",
  },
  {
    id: "log_03",
    timestamp: "2026-09-05T19:30:11+05:30",
    actor: AGENT,
    category: "ai_decision",
    summary: "Cart recovery reminder dispatched",
    detail: "First reminder for Rohan Mehta's ₹4,999 cart. Send limit: 1 of 2.",
  },
  {
    id: "log_04",
    timestamp: "2026-09-05T14:22:47+05:30",
    actor: MERCHANT,
    category: "system",
    summary: "Approval required for win-back offers",
    detail:
      "Merchant set win-back offers above ₹2,000 to require manual approval before dispatch.",
  },
  {
    id: "log_05",
    timestamp: "2026-09-05T11:02:35+05:30",
    actor: AGENT,
    category: "money",
    summary: "Loyalty discount applied at checkout",
    detail: "₹720 discount applied to Priya Nair's order of ₹7,200.",
    amount: -720,
  },
  {
    id: "log_06",
    timestamp: "2026-09-04T17:41:09+05:30",
    actor: MERCHANT,
    category: "catalog",
    summary: "Product moved to draft",
    detail: "Nimbus Laptop Sleeve 14\" (NGS-BAG-1299) unpublished pending photos.",
  },
  {
    id: "log_07",
    timestamp: "2026-09-04T08:15:00+05:30",
    actor: SYSTEM,
    category: "catalog",
    summary: "Stock reached zero",
    detail: "Guardian Tempered Screen Guard (NGS-ACC-0399) is out of stock.",
  },
  {
    id: "log_08",
    timestamp: "2026-09-03T16:44:52+05:30",
    actor: AGENT,
    category: "ai_decision",
    summary: "Discount nudge withheld",
    detail:
      "Margin of 11% on the viewed SKU fell below the merchant's 15% discount floor.",
  },
];

/* -------------------------------------------------------------------------- */
/* Overview metrics                                                           */
/* -------------------------------------------------------------------------- */

export interface OverviewMetrics {
  revenue: number;
  aiAttributedRevenue: number;
  openOpportunities: number;
  conversionRate: number;
  /** Percentage change against the previous 30 days. */
  deltas: {
    revenue: number;
    aiAttributedRevenue: number;
    openOpportunities: number;
    conversionRate: number;
  };
}

export const demoOverviewMetrics: OverviewMetrics = {
  revenue: 842_150,
  aiAttributedRevenue: 196_480,
  openOpportunities: 12,
  conversionRate: 3.4,
  deltas: {
    revenue: 12.4,
    aiAttributedRevenue: 28.1,
    openOpportunities: 9.1,
    conversionRate: -0.6,
  },
};
