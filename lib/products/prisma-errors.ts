import "server-only";

import { Prisma, type Product } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

import { ProductDomainError } from "./errors";

/**
 * Map expected Prisma write failures to ProductDomainError.
 * Unexpected errors are rethrown unchanged.
 */
export function mapPrismaWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = uniqueTargetField(error.meta?.target);
      throw new ProductDomainError(
        "CONFLICT",
        target
          ? `A product with this ${target} already exists in the store`
          : "A product with a conflicting unique field already exists in the store",
        { field: target, cause: error },
      );
    }

    if (error.code === "P2003") {
      throw new ProductDomainError(
        "INVALID_REFERENCE",
        "Referenced store, brand, category, or subcategory is invalid",
        { cause: error },
      );
    }
  }

  throw error;
}

function uniqueTargetField(target: unknown): string | undefined {
  const fields = Array.isArray(target)
    ? target.filter((value): value is string => typeof value === "string")
    : typeof target === "string"
      ? [target]
      : [];

  if (fields.includes("sku") || fields.some((f) => f.endsWith("_sku"))) {
    return "sku";
  }
  if (fields.includes("slug") || fields.some((f) => f.endsWith("_slug"))) {
    return "slug";
  }
  return undefined;
}

/**
 * Load a Product by composite store ownership. Never looks up by productId alone.
 */
export async function findProductInStore(
  storeId: string,
  productId: string,
): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: {
      storeId_id: { storeId, id: productId },
    },
  });

  if (!product) {
    throw new ProductDomainError(
      "NOT_FOUND",
      "Product not found in this store",
      { field: "productId" },
    );
  }

  return product;
}
