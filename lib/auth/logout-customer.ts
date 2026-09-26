import "server-only";

import { endSession } from "@/lib/identity/end-session";

import { clearCustomerAuth, readCustomerAuth } from "./customer-session";

/**
 * Logout ends the authenticated Session (ADR-2.7-008) and clears the auth
 * cookie. The anonymous token is kept: the next page opens a new anonymous
 * Session on it, and post-logout activity is never attributed to this customer
 * (identity-model §5.3). Idempotent.
 */
export async function logoutCustomer(storeId: string): Promise<void> {
  const auth = await readCustomerAuth(storeId);
  if (auth) await endSession(storeId, auth.sessionId);
  await clearCustomerAuth(storeId);
}
