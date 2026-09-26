import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { IdentityDomainError, parseIdentityInput } from "./errors";
import { activityCutoff } from "./session-state";

const touchSessionInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
  })
  .strict();

/**
 * Bumps lastActivityAt to server now(). No-op if the session has ended.
 *
 * "Ended" includes the derived inactivity end: the conditional write refuses a
 * session idle for more than 30 minutes, so a touch can never revive it
 * (ADR-2.7-008 — further activity opens a new Session instead).
 */
export async function touchSession(storeId: string, sessionId: string): Promise<void> {
  const data = parseIdentityInput(touchSessionInputSchema, { storeId, sessionId }, "Invalid session reference");
  const now = new Date();

  const { count } = await prisma.session.updateMany({
    where: {
      storeId: data.storeId,
      id: data.sessionId,
      endedAt: null,
      lastActivityAt: { gte: activityCutoff(now) },
    },
    data: { lastActivityAt: now },
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
  // Session exists but has ended — documented no-op.
}
