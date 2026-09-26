import "server-only";

import { z } from "zod";

import { attachCustomerToSession } from "@/lib/identity/attach-customer";
import { customerEmailSchema } from "@/lib/identity/create-customer";
import { endSession } from "@/lib/identity/end-session";
import { IdentityDomainError } from "@/lib/identity/errors";
import { startSession } from "@/lib/identity/start-session";
import { prisma } from "@/lib/prisma";

import type { CustomerAuth } from "./customer-session";
import { AuthDomainError, INVALID_CREDENTIALS_MESSAGE } from "./errors";
import { burnPasswordCheck, verifyPassword } from "./password";

const loginCustomerInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
    email: customerEmailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

export type LoginCustomerResult = { auth: CustomerAuth; attributedSessionCount: number };

/**
 * Verifies credentials, then attaches the customer to the RUNNING session —
 * login does not end it (ADR-2.7-008). The 3.5 backfill runs inside.
 */
export async function loginCustomer(input: unknown): Promise<LoginCustomerResult> {
  const parsed = loginCustomerInputSchema.safeParse(input);
  if (!parsed.success) {
    // Malformed input still gets the generic message: no hint about which field.
    throw new AuthDomainError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }
  const data = parsed.data;

  const customer = await prisma.customer.findUnique({
    where: { storeId_email: { storeId: data.storeId, email: data.email } },
    select: { id: true, passwordHash: true },
  });

  // Same message, similar time, for unknown email / no password / wrong password.
  const ok = customer?.passwordHash
    ? await verifyPassword(data.password, customer.passwordHash)
    : (await burnPasswordCheck(data.password), false);
  if (!customer || !ok) {
    throw new AuthDomainError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  return signInOnSession(data.storeId, data.sessionId, customer.id);
}

/**
 * Authenticate `customerId` on the storefront Session, shared by login and
 * registration.
 *
 * The running Session is used when it can take this customer. When it cannot —
 * already authenticated as someone else, already identity-attributed, or ended —
 * ADR-2.7-008 applies: end it if needed and open a NEW Session on the same
 * anonymous token. customerId is never overwritten (INV-5), and the token is
 * never rotated, so the backfill's linkage survives.
 */
export async function signInOnSession(
  storeId: string,
  sessionId: string,
  customerId: string,
): Promise<LoginCustomerResult> {
  try {
    const result = await attachCustomerToSession(storeId, sessionId, customerId);
    return {
      auth: { customerId, storeId, sessionId: result.session.id },
      attributedSessionCount: result.attributedSessionCount,
    };
  } catch (error) {
    if (!(error instanceof IdentityDomainError) || error.code !== "CONFLICT") throw error;
  }

  const prior = await prisma.session.findUniqueOrThrow({
    where: { storeId_id: { storeId, id: sessionId } },
    select: { anonymousId: true },
  });
  await endSession(storeId, sessionId);
  const fresh = await startSession({ storeId, anonymousId: prior.anonymousId });

  const result = await attachCustomerToSession(storeId, fresh.id, customerId);
  return {
    auth: { customerId, storeId, sessionId: result.session.id },
    attributedSessionCount: result.attributedSessionCount,
  };
}
