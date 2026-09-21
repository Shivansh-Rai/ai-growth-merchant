import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/generated/prisma";

import { ProductDomainError } from "./errors";

const listProductsInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    lifecycleStatus: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  })
  .strict();

export type ListProductsInput = z.infer<typeof listProductsInputSchema>;

/**
 * Store-scoped Product list.
 *
 * Optional exact lifecycleStatus filter only — no generic query engine.
 */
export async function listProducts(input: unknown): Promise<Product[]> {
  const parsed = listProductsInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ProductDomainError(
      "VALIDATION",
      first?.message ?? "Invalid list products input",
      { field: first?.path.join(".") || undefined },
    );
  }

  const { storeId, lifecycleStatus } = parsed.data;

  return prisma.product.findMany({
    where: {
      storeId,
      ...(lifecycleStatus !== undefined ? { lifecycleStatus } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}
