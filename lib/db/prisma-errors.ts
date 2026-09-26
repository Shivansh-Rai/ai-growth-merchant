/**
 * Recognise a Prisma known-request error by its code.
 *
 * Deliberately not `instanceof Prisma.PrismaClientKnownRequestError`: inside
 * the Next.js server bundle the Prisma runtime can load as two module
 * instances, so a genuine P2002 fails the instanceof check (observed in phase
 * 3.7). The `code` field is Prisma's documented, stable contract.
 */
export function isPrismaErrorCode(error: unknown, code: "P2002" | "P2003"): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "PrismaClientKnownRequestError" &&
    (error as { code?: unknown }).code === code
  );
}
