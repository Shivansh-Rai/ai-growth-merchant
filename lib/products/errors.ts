/**
 * Typed errors for Product domain operations.
 *
 * Keep this small and Product-specific — no shared error framework.
 */

export type ProductDomainErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_REFERENCE";

export class ProductDomainError extends Error {
  readonly code: ProductDomainErrorCode;
  readonly field?: string;

  constructor(
    code: ProductDomainErrorCode,
    message: string,
    options?: { field?: string; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ProductDomainError";
    this.code = code;
    this.field = options?.field;
  }
}
