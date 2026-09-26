import type { Metadata } from "next";

import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { readCustomerAuth } from "@/lib/auth/customer-session";
import { prisma } from "@/lib/prisma";
import { findStoreContext } from "@/lib/store/store-context";
import { ensureStorefrontSession } from "@/lib/storefront/session-cookie";

export async function generateMetadata({
  params,
}: LayoutProps<"/s/[storeSlug]">): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await findStoreContext(storeSlug);
  if (!store) return { title: { absolute: "Store not found" } };
  return { title: { absolute: store.name, template: `%s · ${store.name}` } };
}

/**
 * Resolves the store from the route (PLT-3), establishes the Session, renders
 * the storefront frame.
 *
 * An unknown store renders children bare: the page then calls notFound(),
 * which this segment's not-found.tsx can only catch when thrown below the
 * layout, not from it.
 */
export default async function StorefrontLayout({
  children,
  params,
}: LayoutProps<"/s/[storeSlug]">) {
  const { storeSlug } = await params;
  const store = await findStoreContext(storeSlug);
  if (!store) return children;

  await ensureStorefrontSession(store);
  const customerName = await signedInCustomerName(store.id);

  return (
    <StorefrontShell storeName={store.name} storeSlug={store.slug} customerName={customerName}>
      {children}
    </StorefrontShell>
  );
}

/** Display name for the header; verified server-side by readCustomerAuth. */
async function signedInCustomerName(storeId: string): Promise<string | null> {
  const auth = await readCustomerAuth(storeId);
  if (!auth) return null;
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { storeId_id: { storeId, id: auth.customerId } },
    select: { name: true, email: true },
  });
  return customer.name ?? customer.email;
}
