import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

export type ResolvedStore = {
  id: string;
  name: string;
  slug: string;
  defaultLowStockThreshold: number;
};

/** Slugs are lowercase kebab-case; anything else cannot name a store. */
const storeSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * The ONLY way a storefront request learns its storeId (PLT-3).
 *
 * `slug` comes from the route segment `/s/[storeSlug]` — never from a body,
 * query parameter, header or cookie (ADR-2.8-002). An unknown or malformed slug
 * resolves to null; callers render a 404.
 */
export async function resolveStoreBySlug(slug: string): Promise<ResolvedStore | null> {
  if (!storeSlugSchema.safeParse(slug).success) return null;

  return prisma.store.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, defaultLowStockThreshold: true },
  });
}
