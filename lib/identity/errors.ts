/**
 * Typed errors for Identity domain operations (Customer, Session).
 *
 * Keep this small and Identity-specific — no shared error framework.
 */

import type { z } from "zod";

export type IdentityErrorCode = "VALIDATION" | "NOT_FOUND" | "CONFLICT";

export class IdentityDomainError extends Error {
  readonly code: IdentityErrorCode;
  readonly field?: string;

  constructor(
    code: IdentityErrorCode,
    message: string,
    options?: { field?: string; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "IdentityDomainError";
    this.code = code;
    this.field = options?.field;
  }
}

/**
 * Zod boundary for every identity service. Throws VALIDATION naming the first
 * failing field.
 */
export function parseIdentityInput<T extends z.ZodType>(
  schema: T,
  input: unknown,
  fallbackMessage: string,
): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new IdentityDomainError("VALIDATION", first?.message ?? fallbackMessage, {
      field: first?.path.join(".") || undefined,
    });
  }
  return parsed.data;
}
