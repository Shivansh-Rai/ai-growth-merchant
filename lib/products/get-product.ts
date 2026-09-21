import "server-only";

import { z } from "zod";

import type { Product } from "@/lib/generated/prisma";

import { ProductDomainError } from "./errors";
import { findProductInStore } from "./prisma-errors";

const getProductInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    productId: z.string().trim().min(1),
  })
  .strict();

export type GetProductInput = z.infer<typeof getProductInputSchema>;

/**
 * Store-scoped Product read. Never resolves by productId alone.
 */
export async function getProduct(input: unknown): Promise<Product> {
  const parsed = getProductInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ProductDomainError(
      "VALIDATION",
      first?.message ?? "Invalid get product input",
      { field: first?.path.join(".") || undefined },
    );
  }

  return findProductInStore(parsed.data.storeId, parsed.data.productId);
}
