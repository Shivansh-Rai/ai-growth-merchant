import { z } from "zod";

import { AiActionType, EventType, Surface } from "@/lib/generated/prisma";

/**
 * Per-type payloads, activity-tracking §5.5. Minimal by design: a payload holds
 * only what that event needs (EV-10). String lengths are bounded so no payload
 * can approach the 16 KiB cap (ADR-2.7-007).
 */

const id = z.string().trim().min(1).max(64);
const paise = z.number().int().nonnegative();
const count = z.number().int().nonnegative();

const offerPayload = z
  .object({
    surface: z.enum(Surface),
    actionType: z.enum(AiActionType).optional(),
    offerId: id.optional(),
  })
  .strict();

/**
 * One schema per type. `.strict()` throughout — an unknown key is a bug in the
 * caller, not something to silently accept (EV-10).
 */
export const EVENT_PAYLOAD_SCHEMAS = {
  SEARCH: z.object({ query: z.string().trim().min(1).max(200), resultCount: count }).strict(),
  PRODUCT_VIEW: z.object({ productId: id }).strict(),
  PRODUCT_CLICK: z
    .object({ productId: id, source: z.enum(["SEARCH", "CATEGORY", "AI_ACTION", "RELATED"]) })
    .strict(),
  /** observedPricePaise is behavioural evidence, not financial truth (ADR-2.7-015). */
  ADD_TO_CART: z
    .object({
      cartId: id,
      productId: id,
      quantity: z.number().int().positive(),
      observedPricePaise: paise,
    })
    .strict(),
  REMOVE_FROM_CART: z
    .object({ cartId: id, productId: id, quantity: z.number().int().positive() })
    .strict(),
  CART_VIEW: z.object({ cartId: id, itemCount: count }).strict(),
  CHECKOUT_STARTED: z.object({ cartId: id, cartValuePaise: paise }).strict(),
  OFFER_VIEWED: offerPayload,
  OFFER_CLICKED: offerPayload,
  OFFER_DISMISSED: offerPayload,
  PURCHASE: z
    .object({ orderId: id, orderValuePaise: paise, itemCount: z.number().int().positive() })
    .strict(),
} satisfies Record<EventType, z.ZodType>;

export type EventPayload<T extends EventType> = z.infer<(typeof EVENT_PAYLOAD_SCHEMAS)[T]>;

/**
 * Types a browser is allowed to submit. PURCHASE is deliberately absent
 * (ADR-2.7-011).
 *
 * ADD_TO_CART, REMOVE_FROM_CART and CHECKOUT_STARTED are absent too: they are
 * consequences of server-side commerce mutations, emitted by the cart and
 * checkout services (3.9, 3.10) with server-known cart ids and prices — a
 * browser-submitted copy would duplicate or contradict them.
 */
export const CLIENT_SUBMITTABLE: ReadonlySet<EventType> = new Set<EventType>([
  EventType.SEARCH,
  EventType.PRODUCT_VIEW,
  EventType.PRODUCT_CLICK,
  EventType.CART_VIEW,
  EventType.OFFER_VIEWED,
  EventType.OFFER_CLICKED,
  EventType.OFFER_DISMISSED,
]);

/** OFFER_* reference the AI Action they belong to (activity-tracking §5.5). */
export const OFFER_EVENT_TYPES: ReadonlySet<EventType> = new Set<EventType>([
  EventType.OFFER_VIEWED,
  EventType.OFFER_CLICKED,
  EventType.OFFER_DISMISSED,
]);

/** Hard cap on serialized payload size (ADR-2.7-007). The DB CHECK is final. */
export const MAX_PAYLOAD_BYTES = 16 * 1024;
