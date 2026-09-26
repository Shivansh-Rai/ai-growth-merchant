import "server-only";

import { z } from "zod";

import type { Brand, Category, Product, ProductImage } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { ResolvedStore } from "@/lib/store/resolve-store";

import { availabilityOf, isPurchasable, type Availability } from "./availability";

/**
 * Customer-facing shape. The absence of costPricePaise, profit and margin is
 * STRUCTURAL, not a convention — this type is the boundary (PRD-6, F-28).
 * Never widen it to include merchant-only fields.
 */
export type StorefrontProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  mrpPaise: number;
  sellingPricePaise: number;
  discountPaise: number; // derived
  discountPercent: number; // derived, rounded for display only
  availability: Availability;
  isPurchasable: boolean;
  specs: Record<string, string | number | boolean> | null;
  primaryImage: { url: string; altText: string } | null;
  brandName: string | null;
  categoryName: string;
};

type ProductWithRelations = Product & {
  images: ProductImage[];
  brand: Brand | null;
  category: Category;
};

const storedSpecsSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .nullable();

/**
 * Builds the projection field by field. Never spread `product` here — a spread
 * would carry costPricePaise straight onto the wire.
 */
export function toStorefrontProduct(
  product: ProductWithRelations,
  storeDefaultThreshold: number,
): StorefrontProduct {
  const specs = storedSpecsSchema.safeParse(product.specs);
  if (!specs.success) {
    // Specs are validated at write time (ADR-2.7-006); reaching here is a bug.
    throw new Error(`Product ${product.id} has specs that are not a flat primitive object`);
  }

  const discountPaise = product.mrpPaise - product.sellingPricePaise;
  const discountPercent =
    product.mrpPaise > 0 ? Math.round((discountPaise * 100) / product.mrpPaise) : 0;

  // Primary image = lowest position (PRD-14); do not rely on query order.
  const primary = product.images.reduce<ProductImage | null>(
    (lowest, image) => (lowest === null || image.position < lowest.position ? image : lowest),
    null,
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    mrpPaise: product.mrpPaise,
    sellingPricePaise: product.sellingPricePaise,
    discountPaise,
    discountPercent,
    availability: availabilityOf(
      product.stockQuantity,
      product.lowStockThreshold,
      storeDefaultThreshold,
    ),
    isPurchasable: isPurchasable(product.lifecycleStatus, product.stockQuantity),
    specs: specs.data,
    primaryImage: primary ? { url: primary.url, altText: primary.altText } : null,
    brandName: product.brand?.name ?? null,
    categoryName: product.category.name,
  };
}

const withRelations = {
  images: { orderBy: { position: "asc" } },
  brand: true,
  category: true,
} as const;

/**
 * Storefront listing. Visibility = ACTIVE (catalog §6): DRAFT and ARCHIVED are
 * invisible; an out-of-stock ACTIVE product stays listed.
 */
export async function listStorefrontProducts(
  store: ResolvedStore,
): Promise<StorefrontProduct[]> {
  const products = await prisma.product.findMany({
    where: { storeId: store.id, lifecycleStatus: "ACTIVE" },
    include: withRelations,
    orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
  });
  return products.map((p) => toStorefrontProduct(p, store.defaultLowStockThreshold));
}

/** Detail by (storeId, slug) — never by id alone. Null unless ACTIVE. */
export async function getStorefrontProduct(
  store: ResolvedStore,
  productSlug: string,
): Promise<StorefrontProduct | null> {
  const product = await prisma.product.findFirst({
    where: { storeId: store.id, slug: productSlug, lifecycleStatus: "ACTIVE" },
    include: withRelations,
  });
  return product ? toStorefrontProduct(product, store.defaultLowStockThreshold) : null;
}
