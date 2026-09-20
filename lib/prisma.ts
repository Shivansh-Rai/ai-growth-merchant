import "server-only";

import { PrismaClient } from "@/lib/generated/prisma";

/**
 * Shared Prisma Client for Next.js server code.
 *
 * In development, Next.js hot-reloads modules frequently. Stashing the client
 * on `globalThis` prevents opening a new connection pool on every reload.
 * Production keeps a single module-scoped instance.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
