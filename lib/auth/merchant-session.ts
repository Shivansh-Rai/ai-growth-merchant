import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { AUTH_COOKIE_BASE, signCookieValue, verifyCookieValue } from "./signed-cookie";

/**
 * One dashboard cookie, deliberately unrelated in name and signing purpose to
 * the per-store customer cookies (INV-7).
 */
export const MERCHANT_AUTH_COOKIE = "ngs_merchant";

/** A working day. No remember-me (out of scope). */
const MERCHANT_SESSION_TTL_S = 12 * 60 * 60;

const merchantCookieSchema = z.object({
  merchantId: z.string().min(1),
  /** Expiry, epoch seconds — checked here, not trusted to the browser. */
  exp: z.number().int(),
});

/**
 * The merchant id the cookie names, if it is genuine and unexpired. Callers
 * (require-merchant.ts) still confirm the Merchant exists and resolve its Store
 * from the database.
 */
export async function readMerchantAuthCookie(): Promise<{ merchantId: string } | null> {
  const value = (await cookies()).get(MERCHANT_AUTH_COOKIE)?.value;
  const parsed = merchantCookieSchema.safeParse(verifyCookieValue("merchant", value));
  if (!parsed.success) return null;
  if (parsed.data.exp <= Math.floor(Date.now() / 1000)) return null;
  return { merchantId: parsed.data.merchantId };
}

/** Server functions / route handlers only. */
export async function writeMerchantAuth(merchantId: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MERCHANT_SESSION_TTL_S;
  (await cookies()).set(MERCHANT_AUTH_COOKIE, signCookieValue("merchant", { merchantId, exp }), {
    ...AUTH_COOKIE_BASE,
    maxAge: MERCHANT_SESSION_TTL_S,
  });
}

export async function clearMerchantAuth(): Promise<void> {
  (await cookies()).delete({ name: MERCHANT_AUTH_COOKIE, path: "/" });
}
