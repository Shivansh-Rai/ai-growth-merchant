/**
 * Shape of a catalog-depth store seed.
 *
 * ADR-2.8-010: only the electronics store carries the full growth loop. The
 * other stores exist to demonstrate **tenancy and catalogue generality**, so
 * they stop at merchant → store → catalogue → customers → sessions → a couple
 * of PAID orders. No opportunities, AI actions, guardrails or attribution.
 *
 * Every id is explicit and store-prefixed so the spec registry can key on it
 * without depending on generated cuids (ADR-2.8-005).
 */

export type CatalogSeedProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  lifecycleStatus: "DRAFT" | "ACTIVE" | "ARCHIVED";
  /** Nullable — unbranded goods are legitimate (catalog §7). */
  brandId: string | null;
  categoryId: string;
  subcategoryId: string | null;
  /** GST-inclusive integer paise (ADR-2.7-020 / 021). */
  mrpPaise: number;
  sellingPricePaise: number;
  /** GST-exclusive. Null where the merchant has not recorded it (PRD-5). */
  costPricePaise: number | null;
  /** Already reflects the orders seeded for this store. */
  stockQuantity: number;
  lowStockThreshold: number | null;
  specs: Record<string, string | number | boolean>;
  imageAlt: string;
};

export type CatalogSeedSession = {
  id: string;
  anonymousId: string;
  /** Null for a session that was never authenticated. */
  customerId: string | null;
  /** Days into the seeded timeline. */
  day: number;
  minutes: number;
  /** Minutes of activity before the session went quiet. */
  durationMinutes: number;
};

export type CatalogSeedOrder = {
  id: string;
  customerId: string;
  sessionId: string;
  idempotencyKey: string;
  day: number;
  minutes: number;
  /** Line items are resolved against `products` at write time. */
  lines: Array<{ productId: string; quantity: number }>;
  providerOrderId: string;
  providerPaymentId: string;
};

export type CatalogStoreSeed = {
  /** Id prefix and log label, e.g. "dairy". */
  key: string;
  merchant: { id: string; email: string; name: string };
  store: {
    id: string;
    name: string;
    /** Platform-unique; resolves /s/[storeSlug] (ADR-2.8-002). */
    slug: string;
    defaultLowStockThreshold: number;
  };
  brands: Array<{ id: string; name: string; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string; position: number }>;
  subcategories: Array<{
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    position: number;
  }>;
  products: CatalogSeedProduct[];
  customers: Array<{ id: string; email: string; name: string; phone: string | null }>;
  sessions: CatalogSeedSession[];
  orders: CatalogSeedOrder[];
};
