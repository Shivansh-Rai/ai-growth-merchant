/**
 * Typed errors for Event recording.
 *
 * Keep this small and Event-specific — no shared error framework.
 */

export type EventErrorCode =
  /** Malformed envelope, payload, or a reference outside the store. */
  | "VALIDATION"
  /** The caller may not submit this event type (e.g. a browser sending PURCHASE). */
  | "FORBIDDEN"
  | "NOT_FOUND"
  /** The event contradicts current state (ended session, unpaid order). */
  | "CONFLICT";

export class EventDomainError extends Error {
  readonly code: EventErrorCode;
  readonly field?: string;

  constructor(
    code: EventErrorCode,
    message: string,
    options?: { field?: string; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "EventDomainError";
    this.code = code;
    this.field = options?.field;
  }
}
