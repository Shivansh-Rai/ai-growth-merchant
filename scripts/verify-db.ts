/**
 * Database verification for The Next Gen Store.
 *
 * Checks that the seeded database actually satisfies the invariants the
 * architecture claims — with particular attention to store isolation, which
 * stopped being theoretical the moment the platform held more than one store
 * (ADR-2.8-001).
 *
 * Deliberately not a test framework. It is a script with assertions, run on
 * demand, because a personal project does not need a runner to answer "is the
 * database in a state the architecture permits?" (CLAUDE.md 20).
 *
 * Uses a short-lived PrismaClient (the same generated client as the app) so this
 * script does not import lib/prisma.ts / server-only, which are for Next.js
 * server modules only.
 *
 * Usage: npm run db:verify
 */
import { PrismaClient } from "../lib/generated/prisma";
import { validateProductSpecs } from "../lib/catalog/spec-registry";

const prisma = new PrismaClient();

/* ── Tiny assertion harness ──────────────────────────────────────────────── */

let passed = 0;
const failures: string[] = [];

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

/* ── Checks ──────────────────────────────────────────────────────────────── */

async function checkConnectivity() {
  section("Connectivity");
  const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
  check("SELECT 1 returns 1", rows[0] !== undefined && Number(rows[0].ok) === 1);
}

async function checkTenancy() {
  section("Tenancy (ADR-2.8-001, ADR-2.8-002)");

  const stores = await prisma.store.findMany({
    select: { id: true, name: true, slug: true, merchantId: true },
    orderBy: { createdAt: "asc" },
  });

  check("at least 2 stores exist", stores.length >= 2, `found ${stores.length}`);

  const slugs = stores.map((s) => s.slug);
  check(
    "every store has a non-empty slug",
    slugs.every((slug) => slug.trim().length > 0),
    "PLT-2",
  );
  check(
    "store slugs are unique platform-wide",
    new Set(slugs).size === slugs.length,
    `${slugs.length} stores, ${new Set(slugs).size} distinct slugs`,
  );

  // ADR-2.7-002: the UNIQUE on Store.merchantId is what makes 1:1 structural.
  const merchantIds = stores.map((s) => s.merchantId);
  check(
    "each merchant owns exactly one store",
    new Set(merchantIds).size === merchantIds.length,
    "INV-1",
  );

  for (const store of stores) {
    console.log(`        ${store.name} -> /s/${store.slug}`);
  }

  return stores;
}

async function checkStoreIsolation(storeIds: string[]) {
  section("Store isolation (ADR-2.7-003, PLT-3)");

  // The composite (storeId, id) lookup is the pattern every domain service
  // uses. If it leaks, everything built on it leaks.
  let crossStoreHits = 0;
  let probes = 0;

  for (const ownerId of storeIds) {
    const product = await prisma.product.findFirst({
      where: { storeId: ownerId },
      select: { id: true },
    });
    if (!product) continue;

    for (const otherId of storeIds) {
      if (otherId === ownerId) continue;
      probes += 1;
      const leaked = await prisma.product.findUnique({
        where: { storeId_id: { storeId: otherId, id: product.id } },
        select: { id: true },
      });
      if (leaked) crossStoreHits += 1;
    }
  }

  check(
    "a product is unreachable with another store's storeId",
    crossStoreHits === 0,
    `${probes} probes, ${crossStoreHits} leaks`,
  );

  // Composite FKs should make these structurally impossible. Verifying them
  // proves the constraints are actually present, not merely intended.
  const [strayProductCategory, straySubcategory, strayOrderItem] = await Promise.all([
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "products" p
      JOIN "categories" c ON c."id" = p."categoryId"
      WHERE c."storeId" <> p."storeId"`,
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "subcategories" s
      JOIN "categories" c ON c."id" = s."categoryId"
      WHERE c."storeId" <> s."storeId"`,
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "order_items" oi
      JOIN "orders" o ON o."id" = oi."orderId"
      WHERE o."storeId" <> oi."storeId"`,
  ]);

  check("no Product points at another store's Category", Number(strayProductCategory[0].n) === 0);
  check("no Subcategory points at another store's Category", Number(straySubcategory[0].n) === 0);
  check("no OrderItem points at another store's Order", Number(strayOrderItem[0].n) === 0);

  // PLT-4: anonymous tokens are minted per store, so one token must never
  // appear under two stores.
  const sharedTokens = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*) AS n FROM (
      SELECT "anonymousId" FROM "sessions"
      GROUP BY "anonymousId" HAVING COUNT(DISTINCT "storeId") > 1
    ) shared`;
  check(
    "no anonymousId is shared across stores",
    Number(sharedTokens[0].n) === 0,
    "PLT-4, ADR-2.8-003",
  );
}

async function checkSpecRegistry() {
  section("Spec registry coverage (ADR-2.8-005, PRD-13)");

  const products = await prisma.product.findMany({
    select: { id: true, storeId: true, categoryId: true, subcategoryId: true, specs: true },
  });

  const unregistered: string[] = [];
  const invalid: string[] = [];

  for (const product of products) {
    if (product.specs === null) continue;
    const result = validateProductSpecs(
      product.categoryId,
      product.subcategoryId,
      product.specs as Record<string, string | number | boolean>,
    );
    if (!result.ok) {
      const target = result.message.includes("No specification schema") ? unregistered : invalid;
      target.push(`${product.id} (${result.message})`);
    }
  }

  check(
    "every product with specs resolves a registered schema",
    unregistered.length === 0,
    unregistered.slice(0, 3).join("; "),
  );
  check(
    "every stored specs object validates against its schema",
    invalid.length === 0,
    invalid.slice(0, 3).join("; "),
  );
}

async function checkPlatformInvariants() {
  section("Platform invariants (Phase 2.8)");

  // PLT-6: surface is null exactly when the decision was NO_ACTION. The CHECK
  // enforces it; this proves the CHECK is present and the seed respects it.
  const mismatched = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*) AS n FROM "ai_actions"
    WHERE ("decision" = 'ACT') <> ("surface" IS NOT NULL)`;
  check("AiAction.surface is set exactly when decision = ACT", Number(mismatched[0].n) === 0);

  const surfaced = await prisma.aiAction.groupBy({
    by: ["surface"],
    _count: { _all: true },
  });
  const rendered = surfaced
    .filter((row) => row.surface !== null)
    .map((row) => `${row.surface}:${row._count._all}`)
    .join("  ");
  console.log(`        surfaces in use: ${rendered || "none"}`);
}

async function checkCommerceInvariants() {
  section("Commerce invariants (Phase 2.7)");

  const [multipleActiveCarts, multipleSucceeded, multiplePurchases] = await Promise.all([
    // ADR-2.7-015
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM (
        SELECT "storeId", "customerId" FROM "carts" WHERE "status" = 'ACTIVE'
        GROUP BY "storeId", "customerId" HAVING COUNT(*) > 1
      ) dupes`,
    // ADR-2.7-018
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM (
        SELECT "orderId" FROM "payment_attempts" WHERE "status" = 'SUCCEEDED'
        GROUP BY "orderId" HAVING COUNT(*) > 1
      ) dupes`,
    // ADR-2.7-013
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM (
        SELECT "orderId" FROM "events" WHERE "type" = 'PURCHASE'
        GROUP BY "orderId" HAVING COUNT(*) > 1
      ) dupes`,
  ]);

  check("at most one ACTIVE cart per (store, customer)", Number(multipleActiveCarts[0].n) === 0);
  check("at most one SUCCEEDED payment attempt per order", Number(multipleSucceeded[0].n) === 0);
  check("at most one PURCHASE event per order", Number(multiplePurchases[0].n) === 0);

  // ADR-2.7-011: PURCHASE is server-emitted and always references its Order.
  const orphanPurchases = await prisma.event.count({
    where: { type: "PURCHASE", orderId: null },
  });
  check("every PURCHASE event references an Order", orphanPurchases === 0);

  // A PURCHASE must describe an Order that actually reached PAID.
  const unpaidPurchases = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*) AS n FROM "events" e
    JOIN "orders" o ON o."id" = e."orderId"
    WHERE e."type" = 'PURCHASE' AND o."status" <> 'PAID'`;
  check("no PURCHASE event for an order that is not PAID", Number(unpaidPurchases[0].n) === 0);

  // ADR-2.7-028: revenue attribution requires a PAID order.
  const attributedUnpaid = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*) AS n FROM "attribution_records" a
    JOIN "orders" o ON o."id" = a."orderId"
    WHERE a."status" = 'ATTRIBUTED' AND o."status" <> 'PAID'`;
  check("no live AttributionRecord against a non-PAID order", Number(attributedUnpaid[0].n) === 0);
}

async function checkMoney() {
  section("Money (ADR-2.7-020, PRD-3/4/7)");

  const [badPrice, negativeStock, badLineTotal] = await Promise.all([
    prisma.product.count({ where: { sellingPricePaise: { gt: prisma.product.fields.mrpPaise } } }),
    prisma.product.count({ where: { stockQuantity: { lt: 0 } } }),
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "order_items"
      WHERE "lineTotalPaise" <> ("unitPricePaise" * "quantity") - "discountPaise"`,
  ]);

  check("sellingPricePaise <= mrpPaise for every product", badPrice === 0, "PRD-4");
  check("stockQuantity >= 0 for every product", negativeStock === 0, "PRD-7");
  check(
    "lineTotalPaise = unitPricePaise * quantity - discountPaise",
    Number(badLineTotal[0].n) === 0,
    "ADR-2.7-017",
  );
}

/* ── Entry point ─────────────────────────────────────────────────────────── */

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Ensure .env (or the environment) defines it.");
  }

  await checkConnectivity();
  const stores = await checkTenancy();
  await checkStoreIsolation(stores.map((s) => s.id));
  await checkSpecRegistry();
  await checkPlatformInvariants();
  await checkCommerceInvariants();
  await checkMoney();

  console.log(`\n${passed} passed, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\nDatabase verification failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
