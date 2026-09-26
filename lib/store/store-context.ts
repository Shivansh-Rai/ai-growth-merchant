import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { resolveStoreBySlug, type ResolvedStore } from "./resolve-store";

/**
 * Per-request store context for server components.
 *
 * Memoised for the lifetime of one request, so the storefront layout and page
 * share a single lookup. Returns null for an unknown slug.
 */
export const findStoreContext = cache(resolveStoreBySlug);

/**
 * The store for this route, or this segment's not-found UI.
 *
 * Pages call this; the layout does not. notFound() thrown from a layout skips
 * the not-found.tsx of its own segment, so the layout renders nothing for an
 * unknown store and lets the page throw instead.
 */
export async function requireStoreContext(storeSlug: string): Promise<ResolvedStore> {
  const store = await findStoreContext(storeSlug);
  if (!store) notFound();
  return store;
}
