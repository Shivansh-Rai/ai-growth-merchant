import "server-only";

import { z } from "zod";

import { validateProductSpecs } from "@/lib/catalog/spec-registry";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/generated/prisma";

import { ProductDomainError } from "./errors";
import { mapPrismaWriteError } from "./prisma-errors";

/**
 * Input boundary for createProduct.
 *
 * lifecycleStatus and id are intentionally omitted — create always persists
 * DRAFT and lets PostgreSQL/Prisma generate the id.
 *
 * Specs shape (primitives only) is checked here; allowed keys are validated
 * against lib/catalog/spec-registry.ts after category/subcategory ownership
 * is confirmed (ADR-2.7-006).
 */
const createProductInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    description: z.string().trim().min(1),
    sku: z.string().trim().min(1),
    categoryId: z.string().trim().min(1),
    brandId: z.string().trim().min(1).optional(),
    subcategoryId: z.string().trim().min(1).nullable().optional(),
    mrpPaise: z.number().int().nonnegative(),
    sellingPricePaise: z.number().int().nonnegative(),
    costPricePaise: z.number().int().nonnegative().nullable().optional(),
    stockQuantity: z.number().int().nonnegative(),
    lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
    externalUrl: z.string().trim().min(1).nullable().optional(),
    specs: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.sellingPricePaise > data.mrpPaise) {
      ctx.addIssue({
        code: "custom",
        path: ["sellingPricePaise"],
        message: "sellingPricePaise must be less than or equal to mrpPaise",
      });
    }
  });

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

/**
 * Create a store-scoped Product as DRAFT.
 *
 * Domain rules run here; PostgreSQL UNIQUE / CHECK / composite FKs remain the
 * final authority for concurrency-safe invariants.
 */
export async function createProduct(input: unknown): Promise<Product> {
  const parsed = createProductInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ProductDomainError(
      "VALIDATION",
      first?.message ?? "Invalid product input",
      { field: first?.path.join(".") || undefined },
    );
  }

  const data = parsed.data;
  const subcategoryId = data.subcategoryId ?? null;

  const store = await prisma.store.findUnique({
    where: { id: data.storeId },
    select: { id: true },
  });
  if (!store) {
    throw new ProductDomainError("NOT_FOUND", "Store not found", {
      field: "storeId",
    });
  }

  const category = await prisma.category.findUnique({
    where: {
      storeId_id: { storeId: data.storeId, id: data.categoryId },
    },
    select: { id: true },
  });
  if (!category) {
    throw new ProductDomainError(
      "NOT_FOUND",
      "Category not found in this store",
      { field: "categoryId" },
    );
  }

  if (data.brandId !== undefined) {
    const brand = await prisma.brand.findUnique({
      where: {
        storeId_id: { storeId: data.storeId, id: data.brandId },
      },
      select: { id: true },
    });
    if (!brand) {
      throw new ProductDomainError(
        "NOT_FOUND",
        "Brand not found in this store",
        { field: "brandId" },
      );
    }
  }

  if (subcategoryId !== null) {
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        categoryId_id: {
          categoryId: data.categoryId,
          id: subcategoryId,
        },
      },
      select: { id: true },
    });
    if (!subcategory) {
      throw new ProductDomainError(
        "NOT_FOUND",
        "Subcategory not found for this category",
        { field: "subcategoryId" },
      );
    }
  }

  const specsResult = validateProductSpecs(
    data.categoryId,
    subcategoryId,
    data.specs,
  );
  if (!specsResult.ok) {
    throw new ProductDomainError("VALIDATION", specsResult.message, {
      field: specsResult.field,
    });
  }

  try {
    return await prisma.product.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        sku: data.sku,
        lifecycleStatus: "DRAFT",
        categoryId: data.categoryId,
        brandId: data.brandId,
        subcategoryId,
        mrpPaise: data.mrpPaise,
        sellingPricePaise: data.sellingPricePaise,
        costPricePaise: data.costPricePaise ?? null,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold ?? null,
        externalUrl: data.externalUrl ?? null,
        specs: specsResult.specs ?? undefined,
      },
    });
  } catch (error) {
    throw mapPrismaWriteError(error);
  }
}
