"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Product photo with a text fallback. Image hosting is out of scope (catalog
 * §9) and the seeded URLs have no files behind them yet, so a failed load
 * degrades to the alt text rather than a broken-image icon.
 */
export function ProductImage({
  image,
  fallbackLabel,
  className,
}: {
  image: { url: string; altText: string } | null;
  fallbackLabel: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before hydration attaches onError, so the
  // event is missed. Check once on mount: complete with no pixels = failed.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (image === null || failed) {
    return (
      <div
        role="img"
        aria-label={image?.altText ?? fallbackLabel}
        className={cn(
          "flex items-center justify-center bg-surface-muted p-4 text-center text-sm font-medium text-ink-subtle",
          className,
        )}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // Plain <img>: URLs are opaque (catalog §9) and not yet served by a host
    // next/image could be configured for.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={image.url}
      alt={image.altText}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
