import "server-only";

import { z } from "zod";

import { isPrismaErrorCode } from "@/lib/db/prisma-errors";
import { EventType, type Event } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

import { EventDomainError } from "./errors";
import { findSession, insertEvent, parsePayload } from "./record-event";

const recordPurchaseInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
    orderId: z.string().trim().min(1),
    orderValuePaise: z.number().int().nonnegative(),
    itemCount: z.number().int().positive(),
  })
  .strict();

/**
 * The ONLY way a PURCHASE Event is created (ADR-2.7-011). Called from the
 * payment confirmation path in 3.11, after the Order reaches PAID — never from
 * an HTTP handler reachable by a browser.
 *
 * The caller derives orderValuePaise / itemCount from the Order's items; this
 * function proves the Order is PAID and in the store. The Session need not be
 * ACTIVE — payment confirmation can arrive after the customer has left.
 *
 * Idempotent: one PURCHASE per Order (partial UNIQUE, ADR-2.7-013), so a
 * retried confirmation returns the existing Event.
 */
export async function recordPurchaseEvent(args: {
  storeId: string;
  sessionId: string;
  orderId: string;
  orderValuePaise: number;
  itemCount: number;
}): Promise<Event> {
  const parsed = recordPurchaseInputSchema.safeParse(args);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new EventDomainError("VALIDATION", first?.message ?? "Invalid purchase event", {
      field: first?.path.join(".") || undefined,
    });
  }
  const data = parsed.data;

  const order = await prisma.order.findUnique({
    where: { storeId_id: { storeId: data.storeId, id: data.orderId } },
    select: { status: true },
  });
  if (!order) {
    throw new EventDomainError("NOT_FOUND", "Order not found in this store", { field: "orderId" });
  }
  if (order.status !== "PAID") {
    throw new EventDomainError("CONFLICT", `Order is ${order.status}; PURCHASE requires PAID`, {
      field: "orderId",
    });
  }

  await findSession(data.storeId, data.sessionId);

  const payload = parsePayload(EventType.PURCHASE, {
    orderId: data.orderId,
    orderValuePaise: data.orderValuePaise,
    itemCount: data.itemCount,
  });

  try {
    return await insertEvent({
      storeId: data.storeId,
      sessionId: data.sessionId,
      type: EventType.PURCHASE,
      payload,
      clientOccurredAt: null,
      clientEventId: null,
      aiActionId: null,
      orderId: data.orderId,
    });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      const existing = await prisma.event.findFirst({
        where: { storeId: data.storeId, orderId: data.orderId, type: EventType.PURCHASE },
      });
      if (existing) return existing;
    }
    throw error;
  }
}
