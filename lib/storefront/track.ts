/**
 * Client helper for storefront telemetry. Browser-only; no server imports.
 *
 * Fire-and-forget: telemetry failures must never break a page, so every
 * failure is swallowed. The server decides store, session and receivedAt —
 * this sends only the event and the untrusted client clock (ADR-2.7-012).
 */

/** Mirrors CLIENT_SUBMITTABLE in lib/events/payload-schemas.ts. */
export type TrackableEventType =
  | "SEARCH"
  | "PRODUCT_VIEW"
  | "PRODUCT_CLICK"
  | "CART_VIEW"
  | "OFFER_VIEWED"
  | "OFFER_CLICKED"
  | "OFFER_DISMISSED";

export function track(
  storeSlug: string,
  type: TrackableEventType,
  payload: Record<string, unknown>,
  options: { clientEventId?: string; aiActionId?: string } = {},
): void {
  const body = JSON.stringify({
    type,
    payload,
    clientOccurredAt: new Date().toISOString(),
    clientEventId: options.clientEventId ?? crypto.randomUUID(),
    aiActionId: options.aiActionId,
  });

  fetch(`/api/s/${encodeURIComponent(storeSlug)}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // Swallowed deliberately — see module comment.
  });
}
