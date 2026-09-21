import "server-only";

import { z } from "zod";

import { validateProductSpecs } from "@/lib/catalog/spec-registry";
import { prisma } from "@/lib/prisma";
import { Prisma, type Product } from "@/lib/generated/prisma";

import { ProductDomainError } from "./errors";
import { findProductInStore, mapPrismaWriteError } from "./prisma-errors";

const specsValueSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

/**
 * Input boundary for updateProduct.
 *
 * storeId + productId required. lifecycleStatus / id are omitted — archive is
 * the only lifecycle path; store ownership cannot move.
 */
const updateProductInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    productId: z.string().trim().min(1),
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    sku: z.string().trim().min(1).optional(),
    categoryId: z.string().trim().min(1).optional(),
    brandId: z.string().trim().min(1).nullable().optional(),
    subcategoryId: z.string().trim().min(1).nullable().optional(),
    mrpPaise: z.number().int().nonnegative().optional(),
    sellingPricePaise: z.number().int().nonnegative().optional(),
    costPricePaise: z.number().int().nonnegative().nullable().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
    externalUrl: z.string().trim().min(1).nullable().optional(),
    specs: specsValueSchema.nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const mutableKeys = [
      "name",
      "slug",
      "description",
      "sku",
      "categoryId",
      "brandId",
      "subcategoryId",
      "mrpPaise",
      "sellingPricePaise",
      "costPricePaise",
      "stockQuantity",
      "lowStockThreshold",
      "externalUrl",
      "specs",
    ] as const;

    if (!mutableKeys.some((key) => data[key] !== undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "At least one mutable product field must be provided",
      });
    }

    if (
      data.mrpPaise !== undefined &&
      data.sellingPricePaise !== undefined &&
      data.sellingPricePaise > data.mrpPaise
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sellingPricePaise"],
        message: "sellingPricePaise must be less than or equal to mrpPaise",
      });
    }
  });

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

type PrimitiveSpecs = Record<string, string | number | boolean>;

function asPrimitiveSpecs(value: unknown): PrimitiveSpecs | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = specsValueSchema.safeParse(value);
  if (!parsed.success) {
    throw new ProductDomainError(
      "VALIDATION",
      "Existing product specs are not a flat primitive object",
      { field: "specs" },
    );
  }
  return parsed.data;
}

/**
 * Update mutable fields on a store-scoped Product.
 *
 * Rejects archived products. Does not change lifecycleStatus or storeId.
 */
export async function updateProduct(input: unknown): Promise<Product> {
  const parsed = updateProductInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ProductDomainError(
      "VALIDATION",
      first?.message ?? "Invalid product update input",
      { field: first?.path.join(".") || undefined },
    );
  }

  const data = parsed.data;
  const product = await findProductInStore(data.storeId, data.productId);

  if (product.lifecycleStatus === "ARCHIVED") {
    throw new ProductDomainError(
      "VALIDATION",
      "Archived products cannot be updated",
      { field: "productId" },
    );
  }

  const nextMrp = data.mrpPaise ?? product.mrpPaise;
  const nextSelling = data.sellingPricePaise ?? product.sellingPricePaise;
  if (nextSelling > nextMrp) {
    throw new ProductDomainError(
      "VALIDATION",
      "sellingPricePaise must be less than or equal to mrpPaise",
      { field: "sellingPricePaise" },
    );
  }

  const nextCategoryId = data.categoryId ?? product.categoryId;
  const nextSubcategoryId =
    data.subcategoryId !== undefined
      ? data.subcategoryId
      : product.subcategoryId;

  if (data.categoryId !== undefined) {
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
  }

  if (data.brandId !== undefined && data.brandId !== null) {
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

  if (
    nextSubcategoryId !== null &&
    (data.subcategoryId !== undefined || data.categoryId !== undefined)
  ) {
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        categoryId_id: {
          categoryId: nextCategoryId,
          id: nextSubcategoryId,
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

  const classificationChanged =
    data.categoryId !== undefined || data.subcategoryId !== undefined;
  const specsProvided = data.specs !== undefined;

  let specsUpdate: PrimitiveSpecs | null | undefined = undefined;
  if (specsProvided || classificationChanged) {
    const nextSpecs = specsProvided
      ? data.specs
      : asPrimitiveSpecs(product.specs);
    const specsResult = validateProductSpecs(
      nextCategoryId,
      nextSubcategoryId,
      nextSpecs,
    );
    if (!specsResult.ok) {
      throw new ProductDomainError("VALIDATION", specsResult.message, {
        field: specsResult.field,
      });
    }
    // Only write specs column when caller sent specs, or classification
    // changed and we need to keep the validated payload (same values).
    if (specsProvided) {
      specsUpdate = specsResult.specs;
    }
  }

  try {
    const updateData: Prisma.ProductUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.brandId !== undefined) updateData.brandId = data.brandId;
    if (data.subcategoryId !== undefined) {
      updateData.subcategoryId = data.subcategoryId;
    }
    if (data.mrpPaise !== undefined) updateData.mrpPaise = data.mrpPaise;
    if (data.sellingPricePaise !== undefined) {
      updateData.sellingPricePaise = data.sellingPricePaise;
    }
    if (data.costPricePaise !== undefined) {
      updateData.costPricePaise = data.costPricePaise;
    }
    if (data.stockQuantity !== undefined) {
      updateData.stockQuantity = data.stockQuantity;
    }
    if (data.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = data.lowStockThreshold;
    }
    if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl;
    if (specsUpdate !== undefined) {
      updateData.specs =
        specsUpdate === null ? Prisma.JsonNull : specsUpdate;
    }

    return await prisma.product.update({
      where: {
        storeId_id: { storeId: data.storeId, id: data.productId },
      },
      data: updateData,
    });
  } catch (error) {
    throw mapPrismaWriteError(error);
  }
}
