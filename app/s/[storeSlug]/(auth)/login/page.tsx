import type { Metadata } from "next";
import Link from "next/link";

import { CustomerAuthForm } from "@/components/storefront/customer-auth-form";
import { readCustomerAuth } from "@/lib/auth/customer-session";
import { requireStoreContext } from "@/lib/store/store-context";

export const metadata: Metadata = { title: "Sign in" };

/** Customer sign-in for THIS store only — accounts are store-scoped (INV-2). */
export default async function CustomerLoginPage({ params }: PageProps<"/s/[storeSlug]/login">) {
  const { storeSlug } = await params;
  const store = await requireStoreContext(storeSlug);
  const signedIn = (await readCustomerAuth(store.id)) !== null;

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border border-line bg-canvas p-6">
      <h1 className="text-xl font-bold text-navy">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">to your {store.name} account</p>
      {signedIn ? (
        <p className="text-sm text-ink-muted">
          You&apos;re already signed in.{" "}
          <Link href={`/s/${store.slug}`} className="font-medium text-brand-700 hover:underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <CustomerAuthForm mode="login" storeSlug={store.slug} />
      )}
    </div>
  );
}
