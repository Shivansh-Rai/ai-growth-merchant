import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/generated/prisma";

import { ProductDomainError } from "./errors";
import { findProductInStore, mapPrismaWriteError } from "./prisma-errors";

const archiveProductInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    productId: z.string().trim().min(1),
  })
  .strict();

export type ArchiveProductInput = z.infer<typeof archiveProductInputSchema>;

/**
 * Soft-withdraw a store-scoped Product (ADR-2.7-004).
 *
 * Idempotent: already-ARCHIVED products are returned unchanged.
 * Never hard-deletes.
 */
export async function archiveProduct(input: unknown): Promise<Product> {
  const parsed = archiveProductInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ProductDomainError(
      "VALIDATION",
      first?.message ?? "Invalid archive product input",
      { field: first?.path.join(".") || undefined },
    );
  }

  const { storeId, productId } = parsed.data;
  const product = await findProductInStore(storeId, productId);

  if (product.lifecycleStatus === "ARCHIVED") {
    return product;
  }

  try {
    return await prisma.product.update({
      where: {
        storeId_id: { storeId, id: productId },
      },
      data: {
        lifecycleStatus: "ARCHIVED",
      },
    });
  } catch (error) {
    throw mapPrismaWriteError(error);
  }
}
