import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { IdentityDomainError, parseIdentityInput } from "./errors";
import { activityCutoff } from "./session-state";

const endSessionInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
  })
  .strict();

/**
 * Explicit logout only. Idempotent: ending an ended session is a no-op.
 *
 * endedAt records a logout, so it is not written onto a session that already
 * ended through inactivity — that would misstate when and why it ended
 * (ADR-2.7-008).
 */
export async function endSession(storeId: string, sessionId: string): Promise<void> {
  const data = parseIdentityInput(endSessionInputSchema, { storeId, sessionId }, "Invalid session reference");
  const now = new Date();

  const { count } = await prisma.session.updateMany({
    where: {
      storeId: data.storeId,
      id: data.sessionId,
      endedAt: null,
      lastActivityAt: { gte: activityCutoff(now) },
    },
    data: { endedAt: now },
  });
  if (count > 0) return;

  const exists = await prisma.session.findUnique({
    where: { storeId_id: { storeId: data.storeId, id: data.sessionId } },
    select: { id: true },
  });
  if (!exists) {
    throw new IdentityDomainError("NOT_FOUND", "Session not found in this store", {
      field: "sessionId",
    });
  }
  // Session exists but has already ended — documented no-op.
}
