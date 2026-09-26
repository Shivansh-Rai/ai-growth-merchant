import type { Metadata } from "next";

import { MerchantLoginForm } from "@/components/auth/merchant-login-form";

export const metadata: Metadata = { title: "Merchant sign in" };

/**
 * Dashboard sign-in at /login.
 *
 * Lives in its own route group rather than (dashboard): that group's layout
 * requires a signed-in merchant, so a login page inside it would redirect to
 * itself. Merchant accounts are seeded — there is no sign-up (ADR-2.8-009).
 */
export default function MerchantLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-canvas p-6">
        <h1 className="text-xl font-bold text-navy">Merchant dashboard</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">Sign in to manage your store.</p>
        <MerchantLoginForm />
      </div>
    </main>
  );
}
