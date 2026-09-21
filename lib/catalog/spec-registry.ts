import { z } from "zod";

/**
 * Authoritative Product specs registry (ADR-2.7-006, catalog §8.3).
 *
 * Keyed by `(categoryId, subcategoryId | null)`. When subcategory is null,
 * the category-level schema applies. Unknown keys are rejected via `.strict()`.
 *
 * Category / subcategory IDs match the deterministic seed catalogue in
 * `prisma/seed.ts`. Adding a category is a code change, not a migration.
 */

const primitive = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
} as const;

/** Headphones — seed_cat_audio / seed_sub_headphones */
const headphonesSpecs = z
  .object({
    type: primitive.string.optional(),
    noiseCancelling: primitive.boolean.optional(),
    batteryHours: primitive.number.optional(),
    bluetoothVersion: primitive.string.optional(),
    weightGrams: primitive.number.optional(),
  })
  .strict();

/** Earphones — seed_cat_audio / seed_sub_earphones */
const earphonesSpecs = z
  .object({
    type: primitive.string.optional(),
    noiseCancelling: primitive.boolean.optional(),
    batteryHours: primitive.number.optional(),
    waterResistance: primitive.string.optional(),
    weightGrams: primitive.number.optional(),
  })
  .strict();

/** Category-level Audio (no subcategory) — e.g. portable speakers */
const audioCategorySpecs = z
  .object({
    batteryHours: primitive.number.optional(),
    waterResistance: primitive.string.optional(),
    outputWatts: primitive.number.optional(),
    bluetoothVersion: primitive.string.optional(),
  })
  .strict();

/** Keyboards — seed_cat_peripherals / seed_sub_keyboards */
const keyboardsSpecs = z
  .object({
    layout: primitive.string.optional(),
    switchType: primitive.string.optional(),
    hotSwappable: primitive.boolean.optional(),
    keycapMaterial: primitive.string.optional(),
    connection: primitive.string.optional(),
  })
  .strict();

/** Mice — seed_cat_peripherals / seed_sub_mice */
const miceSpecs = z
  .object({
    sensorDpi: primitive.number.optional(),
    weightGrams: primitive.number.optional(),
    connection: primitive.string.optional(),
    batteryHours: primitive.number.optional(),
    buttons: primitive.number.optional(),
  })
  .strict();

/** Webcams — seed_cat_peripherals / seed_sub_webcams */
const webcamsSpecs = z
  .object({
    resolution: primitive.string.optional(),
    frameRate: primitive.number.optional(),
    autofocus: primitive.boolean.optional(),
    privacyShutter: primitive.boolean.optional(),
    connection: primitive.string.optional(),
  })
  .strict();

/** USB Hubs — seed_cat_peripherals / seed_sub_usb_hubs */
const usbHubsSpecs = z
  .object({
    ports: primitive.number.optional(),
    hdmiVersion: primitive.string.optional(),
    passThroughWatts: primitive.number.optional(),
    ethernetMbps: primitive.number.optional(),
    material: primitive.string.optional(),
  })
  .strict();

/** Category-level Peripherals (no subcategory) — e.g. desk mats */
const peripheralsCategorySpecs = z
  .object({
    widthMm: primitive.number.optional(),
    depthMm: primitive.number.optional(),
    material: primitive.string.optional(),
    stitchedEdge: primitive.boolean.optional(),
  })
  .strict();

/** SSDs — seed_cat_storage / seed_sub_ssds */
const ssdsSpecs = z
  .object({
    capacityGb: primitive.number.optional(),
    interface: primitive.string.optional(),
    pcieGeneration: primitive.number.optional(),
    formFactor: primitive.string.optional(),
    readMbps: primitive.number.optional(),
  })
  .strict();

/** GPUs — seed_cat_components / seed_sub_gpus */
const gpusSpecs = z
  .object({
    memoryGb: primitive.number.optional(),
    memoryType: primitive.string.optional(),
    interface: primitive.string.optional(),
    recommendedPsuWatts: primitive.number.optional(),
    lengthMm: primitive.number.optional(),
  })
  .strict();

/** PSUs — seed_cat_components / seed_sub_psus */
const psusSpecs = z
  .object({
    wattage: primitive.number.optional(),
    efficiencyRating: primitive.string.optional(),
    modular: primitive.boolean.optional(),
    fanSizeMm: primitive.number.optional(),
    formFactor: primitive.string.optional(),
  })
  .strict();

/** Monitors — seed_cat_displays / seed_sub_monitors */
const monitorsSpecs = z
  .object({
    screenSizeInches: primitive.number.optional(),
    resolution: primitive.string.optional(),
    refreshRateHz: primitive.number.optional(),
    panelType: primitive.string.optional(),
    responseTimeMs: primitive.number.optional(),
    usbCWatts: primitive.number.optional(),
  })
  .strict();

type SpecSchema = z.ZodType<Record<string, string | number | boolean>>;

/**
 * Composite key: categoryId + "\0" + (subcategoryId or "").
 * Empty subcategory segment means category-level schema (subcategoryId = null).
 */
function registryKey(categoryId: string, subcategoryId: string | null): string {
  return `${categoryId}\0${subcategoryId ?? ""}`;
}

const SPEC_REGISTRY = new Map<string, SpecSchema>([
  [registryKey("seed_cat_audio", "seed_sub_headphones"), headphonesSpecs as SpecSchema],
  [registryKey("seed_cat_audio", "seed_sub_earphones"), earphonesSpecs as SpecSchema],
  [registryKey("seed_cat_audio", null), audioCategorySpecs as SpecSchema],
  [registryKey("seed_cat_peripherals", "seed_sub_keyboards"), keyboardsSpecs as SpecSchema],
  [registryKey("seed_cat_peripherals", "seed_sub_mice"), miceSpecs as SpecSchema],
  [registryKey("seed_cat_peripherals", "seed_sub_webcams"), webcamsSpecs as SpecSchema],
  [registryKey("seed_cat_peripherals", "seed_sub_usb_hubs"), usbHubsSpecs as SpecSchema],
  [registryKey("seed_cat_peripherals", null), peripheralsCategorySpecs as SpecSchema],
  [registryKey("seed_cat_storage", "seed_sub_ssds"), ssdsSpecs as SpecSchema],
  [registryKey("seed_cat_components", "seed_sub_gpus"), gpusSpecs as SpecSchema],
  [registryKey("seed_cat_components", "seed_sub_psus"), psusSpecs as SpecSchema],
  [registryKey("seed_cat_displays", "seed_sub_monitors"), monitorsSpecs as SpecSchema],
]);

/**
 * Resolve the Zod schema for a catalogue classification.
 * Returns null when no schema is registered for that exact key
 * (no silent fallback from subcategory → category).
 */
export function getProductSpecSchema(
  categoryId: string,
  subcategoryId: string | null,
): SpecSchema | null {
  return SPEC_REGISTRY.get(registryKey(categoryId, subcategoryId)) ?? null;
}

export type SpecsValidationSuccess = {
  ok: true;
  specs: Record<string, string | number | boolean> | null;
};

export type SpecsValidationFailure = {
  ok: false;
  message: string;
  field: string;
};

/**
 * Validate product specs against the registry for `(categoryId, subcategoryId)`.
 *
 * - `null` / `undefined` → accepted (no specs stored).
 * - Present object → must match a registered schema; unknown keys rejected.
 */
export function validateProductSpecs(
  categoryId: string,
  subcategoryId: string | null,
  specs: Record<string, string | number | boolean> | null | undefined,
): SpecsValidationSuccess | SpecsValidationFailure {
  if (specs === null || specs === undefined) {
    return { ok: true, specs: null };
  }

  const schema = getProductSpecSchema(categoryId, subcategoryId);
  if (!schema) {
    return {
      ok: false,
      message:
        "No specification schema is registered for this category/subcategory",
      field: "specs",
    };
  }

  const parsed = schema.safeParse(specs);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.length ? `specs.${first.path.join(".")}` : "specs";
    return {
      ok: false,
      message: first?.message ?? "Invalid product specifications",
      field: path,
    };
  }

  return { ok: true, specs: parsed.data };
}
