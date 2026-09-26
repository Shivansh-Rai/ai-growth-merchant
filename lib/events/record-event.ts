import "server-only";

import { z } from "zod";

import { isPrismaErrorCode } from "@/lib/db/prisma-errors";
import { EventType, type Event, type Prisma, type Session } from "@/lib/generated/prisma";
import { sessionState } from "@/lib/identity/session-state";
import { prisma } from "@/lib/prisma";

import { EventDomainError } from "./errors";
import { EVENT_PAYLOAD_SCHEMAS, MAX_PAYLOAD_BYTES, OFFER_EVENT_TYPES } from "./payload-schemas";

const recordEventInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
    type: z.enum(EventType),
    payload: z.unknown(),
    /** Untrusted client claim, retained for analytics only. */
    clientOccurredAt: z.iso.datetime({ offset: true }).nullable().optional(),
    /** Optional soft-dedupe key, unique per (sessionId, clientEventId). */
    clientEventId: z.string().trim().min(1).max(64).nullable().optional(),
    /** OFFER_* only. */
    aiActionId: z.string().trim().min(1).nullable().optional(),
    /** CHECKOUT_STARTED only; PURCHASE goes through recordPurchase. */
    orderId: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export type RecordEventInput = z.infer<typeof recordEventInputSchema>;

/**
 * The single write path for every Event except PURCHASE.
 *
 * - receivedAt is server time and cannot be supplied (ADR-2.7-012)
 * - payload is validated against its type's strict schema (EV-10) and capped at
 *   16 KiB (ADR-2.7-007)
 * - every id the payload references must belong to this store (PLT-10)
 * - the Session must be ACTIVE: activity after the end opens a new Session
 *   (ADR-2.7-008)
 *
 * There is no update or delete counterpart anywhere — Events are immutable
 * (EV-2, EV-3).
 */
export async function recordEvent(input: unknown): Promise<Event> {
  const parsed = recordEventInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new EventDomainError("VALIDATION", first?.message ?? "Invalid event", {
      field: first?.path.join(".") || undefined,
    });
  }
  const data = parsed.data;

  if (data.type === EventType.PURCHASE) {
    throw new EventDomainError(
      "FORBIDDEN",
      "PURCHASE is emitted only by recordPurchaseEvent after the Order is PAID",
      { field: "type" },
    );
  }

  const payload = parsePayload(data.type, data.payload);
  const aiActionId = data.aiActionId ?? null;
  const orderId = data.orderId ?? null;

  if (OFFER_EVENT_TYPES.has(data.type) !== (aiActionId !== null)) {
    throw new EventDomainError(
      "VALIDATION",
      "aiActionId is required on OFFER_* events and not allowed on any other type",
      { field: "aiActionId" },
    );
  }
  if (orderId !== null && data.type !== EventType.CHECKOUT_STARTED) {
    throw new EventDomainError("VALIDATION", "orderId is only allowed on CHECKOUT_STARTED", {
      field: "orderId",
    });
  }

  const session = await findSession(data.storeId, data.sessionId);
  if (sessionState(session) === "ENDED") {
    throw new EventDomainError("CONFLICT", "Session has ended; activity opens a new session", {
      field: "sessionId",
    });
  }

  await assertReferencesInStore(session, payload, { aiActionId, orderId });

  return insertEvent({
    storeId: data.storeId,
    sessionId: data.sessionId,
    type: data.type,
    payload,
    clientOccurredAt: data.clientOccurredAt ? new Date(data.clientOccurredAt) : null,
    clientEventId: data.clientEventId ?? null,
    aiActionId,
    orderId,
  });
}

/* ── Shared with record-purchase.ts — not for use outside lib/events ─────── */

/** Validates a payload against its type's schema and the 16 KiB cap. */
export function parsePayload(type: EventType, payload: unknown): Prisma.InputJsonObject {
  const result = EVENT_PAYLOAD_SCHEMAS[type].safeParse(payload);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new EventDomainError("VALIDATION", first?.message ?? `Invalid ${type} payload`, {
      field: ["payload", ...(first?.path ?? [])].join("."),
    });
  }

  const bytes = Buffer.byteLength(JSON.stringify(result.data), "utf8");
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new EventDomainError("VALIDATION", `Payload is ${bytes} bytes; the limit is 16 KiB`, {
      field: "payload",
    });
  }
  return result.data;
}

/** Store-scoped Session lookup — never by sessionId alone. */
export async function findSession(storeId: string, sessionId: string): Promise<Session> {
  const session = await prisma.session.findUnique({
    where: { storeId_id: { storeId, id: sessionId } },
  });
  if (!session) {
    throw new EventDomainError("NOT_FOUND", "Session not found in this store", {
      field: "sessionId",
    });
  }
  return session;
}

type EventRow = {
  storeId: string;
  sessionId: string;
  type: EventType;
  payload: Prisma.InputJsonObject;
  clientOccurredAt: Date | null;
  clientEventId: string | null;
  aiActionId: string | null;
  orderId: string | null;
};

/**
 * The one INSERT. A repeated (sessionId, clientEventId) — a client retry, or a
 * React dev double-mount — returns the original row instead of a duplicate
 * (ADR-2.7-011 soft dedupe).
 */
export async function insertEvent(row: EventRow): Promise<Event> {
  try {
    return await prisma.event.create({ data: row });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002") && row.clientEventId !== null) {
      const existing = await prisma.event.findUnique({
        where: {
          sessionId_clientEventId: { sessionId: row.sessionId, clientEventId: row.clientEventId },
        },
      });
      if (existing) return existing;
    }
    throw error;
  }
}

/* ── Reference checks ────────────────────────────────────────────────────── */

async function assertReferencesInStore(
  session: Session,
  payload: Prisma.InputJsonObject,
  refs: { aiActionId: string | null; orderId: string | null },
): Promise<void> {
  const storeId = session.storeId;

  if (typeof payload.productId === "string") {
    const product = await prisma.product.findUnique({
      where: { storeId_id: { storeId, id: payload.productId } },
      select: { id: true },
    });
    if (!product) invalidReference("payload.productId", "Product not found in this store");
  }

  // A cart is only ever referenced by its owner's session (INV-10): an
  // anonymous session has no cart, and one customer cannot log another's.
  if (typeof payload.cartId === "string") {
    const cart =
      session.customerId === null
        ? null
        : await prisma.cart.findFirst({
            where: { storeId, id: payload.cartId, customerId: session.customerId },
            select: { id: true },
          });
    if (!cart) invalidReference("payload.cartId", "Cart not found for this session's customer");
  }

  if (refs.aiActionId !== null) {
    const action = await prisma.aiAction.findUnique({
      where: { storeId_id: { storeId, id: refs.aiActionId } },
      select: { id: true },
    });
    if (!action) invalidReference("aiActionId", "AI Action not found in this store");
  }

  if (refs.orderId !== null) {
    const order = await prisma.order.findUnique({
      where: { storeId_id: { storeId, id: refs.orderId } },
      select: { id: true },
    });
    if (!order) invalidReference("orderId", "Order not found in this store");
  }
}

function invalidReference(field: string, message: string): never {
  throw new EventDomainError("VALIDATION", message, { field });
}
