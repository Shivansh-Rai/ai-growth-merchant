import type { Session } from "@/lib/generated/prisma";

/** Fixed MVP constant (ADR-2.7-008). Changing it is a product decision. */
export const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

export type SessionState = "ACTIVE" | "ENDED";

/**
 * DERIVED, never stored: endedAt set, or now - lastActivityAt > 30 min.
 *
 * There is no status column — it would go stale the moment the inactivity
 * window elapsed with no write (ADR-2.7-008).
 */
export function sessionState(
  session: Pick<Session, "endedAt" | "lastActivityAt">,
  now: Date = new Date(),
): SessionState {
  if (session.endedAt !== null) return "ENDED";
  if (now.getTime() - session.lastActivityAt.getTime() > SESSION_INACTIVITY_MS) {
    return "ENDED";
  }
  return "ACTIVE";
}

/**
 * Earliest lastActivityAt a session may have and still be ACTIVE at `now`.
 * The query-side form of sessionState(), for conditional writes.
 */
export function activityCutoff(now: Date): Date {
  return new Date(now.getTime() - SESSION_INACTIVITY_MS);
}
