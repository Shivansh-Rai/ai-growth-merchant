/**
 * Typed errors for authentication.
 *
 * Keep this small and auth-specific — no shared error framework.
 */

export type AuthErrorCode =
  | "VALIDATION"
  /** Wrong email OR wrong password — deliberately indistinguishable. */
  | "INVALID_CREDENTIALS"
  /** No valid authentication for this surface (INV-10). */
  | "UNAUTHENTICATED"
  | "CONFLICT";

export class AuthDomainError extends Error {
  readonly code: AuthErrorCode;
  readonly field?: string;

  constructor(code: AuthErrorCode, message: string, options?: { field?: string; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AuthDomainError";
    this.code = code;
    this.field = options?.field;
  }
}

/** One message for unknown email and wrong password — never leak which. */
export const INVALID_CREDENTIALS_MESSAGE = "Incorrect email or password";

const STATUS: Record<AuthErrorCode, number> = {
  VALIDATION: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  CONFLICT: 409,
};

/** HTTP response for an auth route. Anything unexpected is rethrown. */
export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthDomainError) {
    return Response.json(
      error.field ? { error: error.message, field: error.field } : { error: error.message },
      { status: STATUS[error.code] },
    );
  }
  throw error;
}
