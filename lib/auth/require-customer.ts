import "server-only";

import { readCustomerAuth, type CustomerAuth } from "./customer-session";
import { AuthDomainError } from "./errors";

/**
 * The commerce gate (INV-10). Throws UNAUTHENTICATED when absent.
 * An anonymousId ALONE never satisfies this (ADR-2.7-010).
 *
 * Call it at every commerce entry point (cart, checkout, order history) —
 * hiding a button is not a control. `storeId` must come from the route.
 */
export async function requireCustomer(storeId: string): Promise<CustomerAuth> {
  const auth = await readCustomerAuth(storeId);
  if (!auth) {
    throw new AuthDomainError("UNAUTHENTICATED", "Sign in to continue");
  }
  return auth;
}
