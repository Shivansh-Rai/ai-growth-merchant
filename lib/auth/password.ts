/**
 * Password hashing — Node's built-in scrypt, no extra dependency.
 *
 * No `server-only` import: the seed (plain tsx) hashes demo credentials with
 * this same function. Nothing here is useful or safe to call from a browser.
 *
 * Stored format: scrypt$N$r$p$<salt b64url>$<hash b64url>
 * Parameters live in the string, so they can be raised later without
 * invalidating existing hashes.
 */
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

import { z } from "zod";

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/** Registration policy. The upper bound keeps scrypt input bounded. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

function derive(plain: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plain.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(plain, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const parts = hash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltText, keyText] = parts;
  const expected = Buffer.from(keyText, "base64url");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await derive(plain, Buffer.from(saltText, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, expected);
}

let dummyHash: Promise<string> | undefined;

/**
 * Spend the same work as a real verification when there is no account to
 * verify against, so "unknown email" and "wrong password" take about as long
 * as each other as well as reading the same.
 */
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(plain, await dummyHash);
}
