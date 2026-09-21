import { z } from "zod";

/**
 * Spec schemas for the catalog-depth stores (ADR-2.8-005).
 *
 * Kept beside `spec-registry.ts` rather than inside it so one store's catalogue
 * vocabulary can be read without scrolling past three others. The registry in
 * `spec-registry.ts` remains the single lookup surface — this file only supplies
 * entries to it.
 *
 * Keys are `(categoryId, subcategoryId | null)` exactly as ADR-2.7-006 defines.
 * The ids are the deterministic, store-prefixed ids provisioned in
 * `prisma/seed-data/*.ts`; the seed asserts that every product it writes
 * resolves a schema here, so drift between the two fails loudly at seed time
 * rather than silently rejecting specs later.
 *
 * Units are encoded in the key, never the value (catalog 8.2): `volumeMl: 500`,
 * never `volume: "500 ml"`. That is what keeps range queries possible.
 */

const str = z.string();
const num = z.number();
const bool = z.boolean();

/* ── Daily Dairy ─────────────────────────────────────────────────────────── */

/** Milk, both toned and full cream. Sold by pack, never by volume drawn. */
const milkSpecs = z
  .object({
    volumeMl: num.optional(),
    fatPercent: num.optional(),
    pasteurised: bool.optional(),
    shelfLifeDays: num.optional(),
  })
  .strict();

/** Curd, yoghurt and lassi — the category-level schema. */
const curdSpecs = z
  .object({
    netWeightGrams: num.optional(),
    fatPercent: num.optional(),
    probiotic: bool.optional(),
    shelfLifeDays: num.optional(),
  })
  .strict();

const butterGheeSpecs = z
  .object({
    netWeightGrams: num.optional(),
    salted: bool.optional(),
    variant: str.optional(),
    shelfLifeDays: num.optional(),
  })
  .strict();

const paneerCheeseSpecs = z
  .object({
    netWeightGrams: num.optional(),
    milkType: str.optional(),
    type: str.optional(),
    shelfLifeDays: num.optional(),
  })
  .strict();

/* ── Fresh Harvest ───────────────────────────────────────────────────────── */

/** Vegetables and fruit: either a pack weight or a piece count, never both. */
const freshProduceSpecs = z
  .object({
    netWeightGrams: num.optional(),
    pieceCount: num.optional(),
    origin: str.optional(),
    organic: bool.optional(),
    shelfLifeDays: num.optional(),
  })
  .strict();

const herbsSpecs = z
  .object({
    netWeightGrams: num.optional(),
    origin: str.optional(),
    washed: bool.optional(),
    shelfLifeDays: num.optional(),
  })
  .strict();

/* ── Copper & Clay ───────────────────────────────────────────────────────── */

const kadhaiSpecs = z
  .object({
    capacityLitres: num.optional(),
    diameterCm: num.optional(),
    material: str.optional(),
    induction: bool.optional(),
    dishwasherSafe: bool.optional(),
  })
  .strict();

const tawaSpecs = z
  .object({
    diameterCm: num.optional(),
    material: str.optional(),
    induction: bool.optional(),
    dishwasherSafe: bool.optional(),
    weightGrams: num.optional(),
  })
  .strict();

const pressureCookerSpecs = z
  .object({
    capacityLitres: num.optional(),
    material: str.optional(),
    induction: bool.optional(),
    dishwasherSafe: bool.optional(),
    lidType: str.optional(),
  })
  .strict();

const servewareSpecs = z
  .object({
    capacityMl: num.optional(),
    material: str.optional(),
    pieceCount: num.optional(),
    dishwasherSafe: bool.optional(),
  })
  .strict();

const storageSpecs = z
  .object({
    capacityMl: num.optional(),
    material: str.optional(),
    pieceCount: num.optional(),
    airtight: bool.optional(),
  })
  .strict();

const bakewareSpecs = z
  .object({
    diameterCm: num.optional(),
    material: str.optional(),
    pieceCount: num.optional(),
    ovenSafe: bool.optional(),
    dishwasherSafe: bool.optional(),
  })
  .strict();

/**
 * `[categoryId, subcategoryId | null, schema]` triples, merged into the main
 * registry by `spec-registry.ts`.
 */
export const CATALOG_STORE_SPEC_ENTRIES: ReadonlyArray<
  readonly [string, string | null, z.ZodTypeAny]
> = [
  // Daily Dairy
  ["dairy_cat_milk", "dairy_sub_toned", milkSpecs],
  ["dairy_cat_milk", "dairy_sub_full_cream", milkSpecs],
  ["dairy_cat_curd", null, curdSpecs],
  ["dairy_cat_butter_ghee", null, butterGheeSpecs],
  ["dairy_cat_paneer_cheese", null, paneerCheeseSpecs],

  // Fresh Harvest
  ["produce_cat_vegetables", null, freshProduceSpecs],
  ["produce_cat_fruits", "produce_sub_seasonal", freshProduceSpecs],
  ["produce_cat_fruits", "produce_sub_imported", freshProduceSpecs],
  ["produce_cat_herbs", null, herbsSpecs],

  // Copper & Clay
  ["utensils_cat_cookware", "utensils_sub_kadhai", kadhaiSpecs],
  ["utensils_cat_cookware", "utensils_sub_tawa", tawaSpecs],
  ["utensils_cat_cookware", "utensils_sub_cookers", pressureCookerSpecs],
  ["utensils_cat_serveware", null, servewareSpecs],
  ["utensils_cat_storage", null, storageSpecs],
  ["utensils_cat_bakeware", null, bakewareSpecs],
];
