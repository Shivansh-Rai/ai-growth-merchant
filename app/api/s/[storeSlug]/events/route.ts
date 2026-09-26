import type { NextRequest } from "next/server";
import { z } from "zod";

import { EventDomainError, type EventErrorCode } from "@/lib/events/errors";
import { CLIENT_SUBMITTABLE, EVENT_PAYLOAD_SCHEMAS } from "@/lib/events/payload-schemas";
import { recordEvent } from "@/lib/events/record-event";
import { EventType } from "@/lib/generated/prisma";
import { resolveStoreBySlug } from "@/lib/store/resolve-store";
import { ensureStorefrontSession, readAnonymousToken } from "@/lib/storefront/session-cookie";

/** Generous next to any valid payload (≤ 16 KiB); stops a huge body early. */
const MAX_BODY_BYTES = 32 * 1024;

/**
 * What a browser may send. Deliberately NOT strict: storeId, sessionId,
 * receivedAt, orderId or anything else in the body is dropped, never honoured
 * (PLT-3, ADR-2.7-012). The payload itself is strict (EV-10).
 */
const clientEnvelopeSchema = z.object({
  type: z.enum(EventType),
  payload: z.unknown(),
  clientOccurredAt: z.iso.datetime({ offset: true }).nullable().optional(),
  clientEventId: z.string().trim().min(1).max(64).nullable().optional(),
  aiActionId: z.string().trim().min(1).nullable().optional(),
});

const STATUS: Record<EventErrorCode, number> = {
  VALIDATION: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

function reject(status: number, error: string, field?: string) {
  return Response.json(field ? { error, field } : { error }, { status });
}

/**
 * POST /api/s/[storeSlug]/events — client telemetry.
 *
 * Cheap checks (store, body, type, payload shape) run before the Session is
 * resolved, so a rejected event never counts as session activity.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/s/[storeSlug]/events">) {
  // 1. storeId from the route slug only (PLT-3).
  const { storeSlug } = await ctx.params;
  const store = await resolveStoreBySlug(storeSlug);
  if (!store) return reject(404, "Store not found");

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return reject(415, "Expected application/json");
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return reject(413, "Body too large");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reject(400, "Body is not valid JSON");
  }

  const envelope = clientEnvelopeSchema.safeParse(body);
  if (!envelope.success) {
    const first = envelope.error.issues[0];
    return reject(400, first?.message ?? "Invalid event", first?.path.join("."));
  }
  const event = envelope.data;

  // 3. A browser can never create PURCHASE, or any server-emitted type (ADR-2.7-011).
  if (!CLIENT_SUBMITTABLE.has(event.type)) {
    return reject(403, `${event.type} cannot be submitted by a client`, "type");
  }

  // 4. Payload shape.
  const payload = EVENT_PAYLOAD_SCHEMAS[event.type].safeParse(event.payload);
  if (!payload.success) {
    const first = payload.error.issues[0];
    return reject(
      400,
      first?.message ?? `Invalid ${event.type} payload`,
      ["payload", ...(first?.path ?? [])].join("."),
    );
  }

  // 2. Session from this store's cookie. The cookie name carries the storeId,
  //    and the lookup filters on it, so a session from another store is
  //    unreachable here (PLT-4).
  if ((await readAnonymousToken(store.id)) === null) {
    return reject(400, "No storefront session for this store");
  }

  try {
    // Resumes and touches the ACTIVE session, or opens a new one on the same
    // token if the last went idle (ADR-2.7-008) — the touchSession step.
    const session = await ensureStorefrontSession(store);

    // 5. The single write path. receivedAt is server time.
    const recorded = await recordEvent({
      storeId: store.id,
      sessionId: session.id,
      type: event.type,
      payload: payload.data,
      clientOccurredAt: event.clientOccurredAt ?? null,
      clientEventId: event.clientEventId ?? null,
      aiActionId: event.aiActionId ?? null,
    });

    // 6.
    return Response.json({ id: recorded.id }, { status: 202 });
  } catch (error) {
    if (error instanceof EventDomainError) {
      return reject(STATUS[error.code], error.message, error.field);
    }
    console.error("[events] unexpected failure recording event", error);
    return reject(500, "Could not record event");
  }
}
