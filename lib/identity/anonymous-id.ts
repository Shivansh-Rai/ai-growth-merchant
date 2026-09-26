import "server-only";

import { randomBytes } from "node:crypto";

import { z } from "zod";

/** 16 random bytes → exactly 22 base64url characters, no padding. */
const ANONYMOUS_ID_BYTES = 16;
const ANONYMOUS_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

/**
 * 128 bits of crypto randomness, base64url. Server-side only.
 *
 * The token is an opaque device signal minted per Store. It is never an
 * authorization credential (ADR-2.7-010, ADR-2.8-003).
 */
export function mintAnonymousId(): string {
  return randomBytes(ANONYMOUS_ID_BYTES).toString("base64url");
}

/**
 * Shape of a token this server minted. A supplied token that does not match is
 * rejected rather than stored, so a client cannot choose a low-entropy token
 * (ADR-2.7-010: ≥128 bits, generated server-side).
 */
export const anonymousIdSchema = z
  .string()
  .regex(ANONYMOUS_ID_PATTERN, "anonymousId is not a server-minted token");
