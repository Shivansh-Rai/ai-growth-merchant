/**
 * Connectivity check for the Neon Postgres database.
 *
 * Uses a short-lived PrismaClient (same generated client as the app) so this
 * script does not import `lib/prisma.ts` / `server-only`, which are for
 * Next.js server modules only.
 *
 * Usage: npm run db:verify
 */
import { PrismaClient } from "../lib/generated/prisma";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Ensure .env (or the environment) defines it.",
    );
  }

  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    if (!rows[0] || Number(rows[0].ok) !== 1) {
      throw new Error(`Unexpected query result: ${JSON.stringify(rows)}`);
    }
    console.log("Database connection OK (SELECT 1).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Database verification failed:");
  console.error(error);
  process.exit(1);
});
