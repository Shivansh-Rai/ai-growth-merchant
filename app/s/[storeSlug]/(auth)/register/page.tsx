import type { Metadata } from "next";

import { CustomerAuthForm } from "@/components/storefront/customer-auth-form";
import { requireStoreContext } from "@/lib/store/store-context";

export const metadata: Metadata = { title: "Create account" };

/**
 * Registration creates a Customer in THIS store. The same email at another
 * store is a separate account, by design (ADR-2.8-009).
 */
export default async function CustomerRegisterPage({
  params,
}: PageProps<"/s/[storeSlug]/register">) {
  const { storeSlug } = await params;
  const store = await requireStoreContext(storeSlug);

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border border-line bg-canvas p-6">
      <h1 className="text-xl font-bold text-navy">Create an account</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">with {store.name}</p>
      <CustomerAuthForm mode="register" storeSlug={store.slug} />
    </div>
  );
}
