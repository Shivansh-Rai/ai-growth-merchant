import "server-only";

import { z } from "zod";

import type { Prisma, Session } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

import { IdentityDomainError, parseIdentityInput } from "./errors";
import { activityCutoff } from "./session-state";

/** Pre-login behaviour older than this is never attributed (ADR-2.7-009). */
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const attachCustomerInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
    customerId: z.string().trim().min(1),
  })
  .strict();

export type AttachCustomerResult = {
  session: Session;
  /** Prior anonymous sessions claimed by the backfill. */
  attributedSessionCount: number;
};

/**
 * Login. Sets customerId on the running session (never overwrites — INV-5),
 * then runs the ADR-2.7-009 backfill in the same transaction.
 *
 * Idempotent for the same customer: a repeat call leaves customerId as it is
 * and re-runs the backfill, which claims nothing already claimed.
 */
export async function attachCustomerToSession(
  storeId: string,
  sessionId: string,
  customerId: string,
): Promise<AttachCustomerResult> {
  const data = parseIdentityInput(
    attachCustomerInputSchema,
    { storeId, sessionId, customerId },
    "Invalid login input",
  );

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { storeId_id: { storeId: data.storeId, id: data.customerId } },
      select: { id: true },
    });
    if (!customer) {
      throw new IdentityDomainError("NOT_FOUND", "Customer not found in this store", {
        field: "customerId",
      });
    }

    const now = new Date();

    // Conditional write: only an ACTIVE, never-authenticated, never-attributed
    // session is claimed. Concurrent logins serialise on the row lock and the
    // loser matches zero rows, so customerId cannot be overwritten (INV-5).
    await tx.session.updateMany({
      where: {
        storeId: data.storeId,
        id: data.sessionId,
        customerId: null,
        attributedCustomerId: null,
        endedAt: null,
        lastActivityAt: { gte: activityCutoff(now) },
      },
      data: { customerId: data.customerId, lastActivityAt: now },
    });

    const session = await tx.session.findUnique({
      where: { storeId_id: { storeId: data.storeId, id: data.sessionId } },
    });
    if (!session) {
      throw new IdentityDomainError("NOT_FOUND", "Session not found in this store", {
        field: "sessionId",
      });
    }
    assertAttachedTo(session, data.customerId);

    const attributedSessionCount = await backfillIdentityAttribution(tx, {
      storeId: data.storeId,
      anonymousId: session.anonymousId,
      customerId: data.customerId,
      windowStart: new Date(now.getTime() - ATTRIBUTION_WINDOW_MS),
    });

    return { session, attributedSessionCount };
  });
}

/**
 * After the conditional write, the session must carry this customer. Anything
 * else explains why the claim was refused.
 */
function assertAttachedTo(session: Session, customerId: string): void {
  if (session.customerId === customerId) return;

  if (session.customerId !== null) {
    throw new IdentityDomainError(
      "CONFLICT",
      "Session is already authenticated as a different customer; a different login needs a new session",
      { field: "sessionId" },
    );
  }
  if (session.attributedCustomerId !== null) {
    // INV-8: customerId and attributedCustomerId are never both set.
    throw new IdentityDomainError(
      "CONFLICT",
      "Session is already identity-attributed to a customer; start a new session to log in",
      { field: "sessionId" },
    );
  }
  throw new IdentityDomainError(
    "CONFLICT",
    "Session has ended; start a new session to log in",
    { field: "sessionId" },
  );
}

/**
 * ADR-2.7-009, verbatim. Every guard is load-bearing:
 *   storeId                  — no cross-store identity leakage (PLT-4)
 *   customerId IS NULL       — never reassign a session someone was logged into
 *   attributedCustomerId NULL — first claim wins; shared devices don't steal history
 *   startedAt >= window      — pre-login behaviour is not retained indefinitely
 *
 * Raw SQL because the atomic "first claim wins" UPDATE is the point; it touches
 * Session only and never an Event (INV-9).
 */
async function backfillIdentityAttribution(
  tx: Prisma.TransactionClient,
  args: { storeId: string; anonymousId: string; customerId: string; windowStart: Date },
): Promise<number> {
  return tx.$executeRaw`
    UPDATE "sessions"
    SET "attributedCustomerId" = ${args.customerId}
    WHERE "anonymousId" = ${args.anonymousId}
      AND "storeId" = ${args.storeId}
      AND "startedAt" >= ${args.windowStart}
      AND "customerId" IS NULL
      AND "attributedCustomerId" IS NULL`;
}
