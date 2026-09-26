import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-signed cookie values: `<base64url JSON>.<base64url HMAC-SHA256>`.
 *
 * The purpose ("customer" / "merchant") is part of the signed message, so a
 * value minted for one namespace never verifies as the other — even if copied
 * into the other cookie's name (INV-7).
 *
 * Signing only proves the server issued the value. Each reader still checks
 * the database (session state, merchant existence) on every request.
 */
export type CookiePurpose = "customer" | "merchant";

function secret(): Buffer {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters (see .env)");
  }
  return Buffer.from(value, "utf8");
}

function mac(purpose: CookiePurpose, body: string): Buffer {
  return createHmac("sha256", secret()).update(`${purpose}.${body}`).digest();
}

export function signCookieValue(purpose: CookiePurpose, payload: object): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${mac(purpose, body).toString("base64url")}`;
}

/** The decoded payload, or null for anything missing, tampered or malformed. */
export function verifyCookieValue(purpose: CookiePurpose, value: string | undefined): unknown {
  if (!value) return null;
  const [body, signature, extra] = value.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = mac(purpose, body);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
