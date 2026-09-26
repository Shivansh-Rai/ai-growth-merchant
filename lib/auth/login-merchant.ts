"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { INVALID_CREDENTIALS_MESSAGE } from "./errors";
import { clearMerchantAuth, writeMerchantAuth } from "./merchant-session";
import { burnPasswordCheck, verifyPassword } from "./password";

/**
 * Merchant sign-in / sign-out, as Server Functions (the dashboard login form
 * posts here directly). Merchants are created by seed only — there is no
 * self-registration (ADR-2.8-009).
 */

export type MerchantLoginState = { error: string | null };

const merchantLoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export async function loginMerchant(
  _previous: MerchantLoginState,
  formData: FormData,
): Promise<MerchantLoginState> {
  const parsed = merchantLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: INVALID_CREDENTIALS_MESSAGE };

  // Merchant namespace only — a customer's credentials never match here (INV-7).
  const merchant = await prisma.merchant.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true, store: { select: { id: true } } },
  });

  const ok = merchant?.passwordHash
    ? await verifyPassword(parsed.data.password, merchant.passwordHash)
    : (await burnPasswordCheck(parsed.data.password), false);
  if (!merchant || !ok || !merchant.store) return { error: INVALID_CREDENTIALS_MESSAGE };

  await writeMerchantAuth(merchant.id);
  redirect("/overview");
}

export async function logoutMerchant(): Promise<void> {
  await clearMerchantAuth();
  redirect("/login");
}
