import type { ProductLifecycleStatus } from "@/lib/generated/prisma";

/** Derived, never stored (PRD-8). Distinct from lifecycle (catalog §6). */
export type Availability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

/**
 * catalog §5.2:
 *   stock == 0                  → OUT_OF_STOCK
 *   stock <= effectiveThreshold → LOW_STOCK
 *   otherwise                   → IN_STOCK
 * effectiveThreshold = product threshold ?? store default.
 */
export function availabilityOf(
  stockQuantity: number,
  lowStockThreshold: number | null,
  storeDefaultThreshold: number,
): Availability {
  if (stockQuantity <= 0) return "OUT_OF_STOCK";
  const threshold = lowStockThreshold ?? storeDefaultThreshold;
  return stockQuantity <= threshold ? "LOW_STOCK" : "IN_STOCK";
}

/**
 * catalog §5.3: ACTIVE and stock > 0. Display only here — the commerce
 * operation re-checks it server-side (phase 3.9 onward).
 */
export function isPurchasable(
  lifecycleStatus: ProductLifecycleStatus,
  stockQuantity: number,
): boolean {
  return lifecycleStatus === "ACTIVE" && stockQuantity > 0;
}
