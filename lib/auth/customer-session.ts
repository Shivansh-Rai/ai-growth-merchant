import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { sessionState } from "@/lib/identity/session-state";
import { prisma } from "@/lib/prisma";

import { AUTH_COOKIE_BASE, signCookieValue, verifyCookieValue } from "./signed-cookie";

export type CustomerAuth = { customerId: string; storeId: string; sessionId: string };

const customerAuthSchema = z.object({
  customerId: z.string().min(1),
  storeId: z.string().min(1),
  sessionId: z.string().min(1),
});

/** Cookie is per-store, like the anonymous token (PLT-4). */
export function customerAuthCookieName(storeId: string): string {
  return `ngs_auth_${storeId}`;
}

/**
 * The authenticated customer for this store, verified server-side.
 *
 * The cookie only names a Session; the Session row is the truth. It must be in
 * this store, still ACTIVE, and authenticated as this customer (INV-10). So a
 * logout (endedAt) or 30 idle minutes (ADR-2.7-008) ends authentication
 * without any cookie state to revoke. The anonymous token is never consulted
 * (ADR-2.7-010).
 */
export async function readCustomerAuth(storeId: string): Promise<CustomerAuth | null> {
  const value = (await cookies()).get(customerAuthCookieName(storeId))?.value;
  const parsed = customerAuthSchema.safeParse(verifyCookieValue("customer", value));
  if (!parsed.success || parsed.data.storeId !== storeId) return null;
  const auth = parsed.data;

  const session = await prisma.session.findUnique({
    where: { storeId_id: { storeId, id: auth.sessionId } },
    select: { customerId: true, endedAt: true, lastActivityAt: true },
  });
  if (!session || session.customerId !== auth.customerId) return null;
  if (sessionState(session) === "ENDED") return null;

  return auth;
}

/**
 * Route handlers only. No max-age: remember-me is out of scope, and the
 * Session's own 30-minute window bounds it anyway.
 */
export async function writeCustomerAuth(auth: CustomerAuth): Promise<void> {
  (await cookies()).set(
    customerAuthCookieName(auth.storeId),
    signCookieValue("customer", auth),
    AUTH_COOKIE_BASE,
  );
}

export async function clearCustomerAuth(storeId: string): Promise<void> {
  (await cookies()).delete({ name: customerAuthCookieName(storeId), path: "/" });
}
