import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getMerchantProfile, requireMerchant } from "@/lib/auth/require-merchant";

/**
 * Wraps every merchant-facing route in the persistent shell. The `(dashboard)`
 * route group keeps URLs flat — this layout adds no path segment.
 *
 * The dashboard gate: no valid merchant session → /login. Pages that read data
 * still call requireMerchant() themselves for their storeId (PLT-3); it is
 * memoised per request.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const auth = await requireMerchant();
  const merchant = await getMerchantProfile(auth);
  return <AppShell merchant={merchant}>{children}</AppShell>;
}
