import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

import { readMerchantAuthCookie } from "./merchant-session";

export type MerchantAuth = { merchantId: string; storeId: string };

/**
 * Dashboard gate. The ONLY way dashboard code learns its storeId (PLT-3).
 *
 * storeId is read from the database via the Merchant's own Store — never from
 * the cookie, a URL or a request body. A customer cookie is a different name
 * and signing purpose, so it never satisfies this (INV-7). Anything missing
 * redirects to /login. Memoised per request.
 */
export const requireMerchant = cache(async (): Promise<MerchantAuth> => {
  const cookie = await readMerchantAuthCookie();
  if (!cookie) redirect("/login");

  const merchant = await prisma.merchant.findUnique({
    where: { id: cookie.merchantId },
    select: { id: true, store: { select: { id: true } } },
  });
  if (!merchant?.store) redirect("/login");

  return { merchantId: merchant.id, storeId: merchant.store.id };
});

/** What the dashboard chrome shows about the signed-in merchant. */
export type MerchantProfile = { name: string; email: string; storeName: string };

export async function getMerchantProfile(auth: MerchantAuth): Promise<MerchantProfile> {
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: auth.merchantId },
    select: { name: true, email: true, store: { select: { name: true } } },
  });
  return {
    name: merchant.name,
    email: merchant.email,
    storeName: merchant.store?.name ?? "",
  };
}
