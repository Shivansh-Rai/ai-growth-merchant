"use client";

import { useEffect, useRef } from "react";

import { track } from "@/lib/storefront/track";

/**
 * Fires one PRODUCT_VIEW per product detail view.
 *
 * The ref guards against React's dev-mode double effect; the per-view
 * clientEventId would also let the server dedupe a repeat (ADR-2.7-011).
 * Renders nothing.
 */
export function TrackProductView({ storeSlug, productId }: { storeSlug: string; productId: string }) {
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    if (sentFor.current === productId) return;
    sentFor.current = productId;
    track(storeSlug, "PRODUCT_VIEW", { productId });
  }, [storeSlug, productId]);

  return null;
}
