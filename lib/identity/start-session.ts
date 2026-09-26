import "server-only";

import { z } from "zod";

import type { Session } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

import { anonymousIdSchema, mintAnonymousId } from "./anonymous-id";
import { IdentityDomainError, parseIdentityInput } from "./errors";

const startSessionInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    /** Existing per-store token from the cookie, or null to mint a new one. */
    anonymousId: anonymousIdSchema.nullable().optional(),
  })
  .strict();

export type StartSessionInput = z.infer<typeof startSessionInputSchema>;

/**
 * Always creates a NEW Session row. Reuses the token when one is supplied.
 *
 * Whether to resume an existing ACTIVE session instead is the caller's decision
 * (phase 3.6). startedAt / lastActivityAt take server time (ADR-2.7-008).
 *
 * The token is only ever stored under the supplied storeId, so a token is never
 * shared across stores (ADR-2.8-003, PLT-4).
 */
export async function startSession(input: unknown): Promise<Session> {
  const data = parseIdentityInput(startSessionInputSchema, input, "Invalid session input");

  const store = await prisma.store.findUnique({
    where: { id: data.storeId },
    select: { id: true },
  });
  if (!store) {
    throw new IdentityDomainError("NOT_FOUND", "Store not found", { field: "storeId" });
  }

  return prisma.session.create({
    data: {
      storeId: data.storeId,
      anonymousId: data.anonymousId ?? mintAnonymousId(),
    },
  });
}
