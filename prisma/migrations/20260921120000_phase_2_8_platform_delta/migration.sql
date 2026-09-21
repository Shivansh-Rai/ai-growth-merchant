-- Phase 2.8 platform delta
--
-- Authority: docs/architecture/phase-2.8-platform-decisions.md
--   · ADR-2.8-002  Store public identity & tenant resolution
--   · ADR-2.8-006  AI Action surface (placement)
--
-- Two columns, one enum, one index. No new tables. Nothing here reverses a
-- Phase 2.7 decision.
--
-- Written by hand rather than generated, because the generated form would
-- ADD COLUMN "slug" TEXT NOT NULL against a table that already has rows, and
-- because the surface/decision invariant is a CHECK constraint Prisma cannot
-- express (ADR-2.7-031).

-- ─── ADR-2.8-006: the placement vocabulary ──────────────────────────────────
CREATE TYPE "Surface" AS ENUM ('HOME', 'PRODUCT_DETAIL', 'CART', 'CHECKOUT', 'NOTIFICATION');

-- ─── ADR-2.8-002: Store.slug, the tenant selector ───────────────────────────
-- Added nullable, backfilled, then constrained. The backfill uses the primary
-- key because it is unique by definition; the seed immediately replaces it with
-- the merchant's real slug. A generated NOT NULL default would have failed here.
ALTER TABLE "stores" ADD COLUMN "slug" TEXT;

UPDATE "stores" SET "slug" = "id" WHERE "slug" IS NULL;

ALTER TABLE "stores" ALTER COLUMN "slug" SET NOT NULL;

-- Platform-global, deliberately NOT store-scoped: a tenant selector cannot
-- itself be tenant-scoped without circularity (PLT-2).
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- ─── ADR-2.8-006: AiAction.surface ──────────────────────────────────────────
ALTER TABLE "ai_actions" ADD COLUMN "surface" "Surface";

-- Backfill so the CHECK below can be added against existing rows. Placement was
-- not recorded before this migration, so these are the defensible defaults for
-- each action type; the seed overwrites them with intentional values.
UPDATE "ai_actions"
SET "surface" = CASE "actionType"
  WHEN 'CART_OPTIMIZATION'              THEN 'CART'::"Surface"
  WHEN 'ABANDONED_CHECKOUT_INTERVENTION' THEN 'NOTIFICATION'::"Surface"
  WHEN 'SUBSTITUTION'                   THEN 'PRODUCT_DETAIL'::"Surface"
  ELSE 'CART'::"Surface"
END
WHERE "decision" = 'ACT' AND "surface" IS NULL;

-- A declined intervention has nothing to place. This mirrors exactly the
-- existing ai_actions_action_type_matches_decision constraint: surface is null
-- precisely when decision = NO_ACTION (AI-4).
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_surface_matches_decision"
  CHECK (("decision" = 'ACT') = ("surface" IS NOT NULL));

-- Drives the storefront render query: approved actions for one store on one
-- surface.
CREATE INDEX "ai_actions_storeId_surface_status_idx" ON "ai_actions"("storeId", "surface", "status");
