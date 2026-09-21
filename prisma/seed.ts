/**
 * The Next Gen Store — development seed.
 *
 * Builds FOUR merchants, each owning exactly one store (ADR-2.8-001).
 *
 *   · The Next Gen Store (electronics) carries the COMPLETE growth loop: a
 *     catalogue, five customers whose events form believable journeys, the
 *     orders and payments those journeys produced, and the growth-loop records
 *     (opportunities, AI actions, guardrail evaluations, attribution, audit)
 *     that follow from them.
 *   · Daily Dairy, Fresh Harvest and Copper & Clay are CATALOG-DEPTH: merchant,
 *     store, catalogue, customers, sessions and a couple of PAID orders. They
 *     exist to demonstrate tenancy and catalogue generality, not to repeat the
 *     growth loop three more times (ADR-2.8-010).
 *
 * Their data lives in prisma/seed-data/*.ts so this file stays readable.
 *
 * Authority: docs/architecture/phase-2.7-decisions.md and
 * docs/architecture/phase-2.8-platform-decisions.md. This file invents no
 * domain behaviour — it only produces states the frozen architecture permits.
 *
 * Determinism
 *   · Every row has an explicit, stable `id` and is written with `upsert`, so
 *     repeated runs update in place and never duplicate.
 *   · The timeline is anchored to the start of the current UTC day minus six
 *     days. Two runs on the same day produce identical timestamps, while
 *     relative-time state (OPEN opportunities, the 7-day attribution window)
 *     stays coherent instead of drifting into the past.
 *
 * Run with:  npm run seed     (or: npx prisma db seed)
 */

import { Prisma, PrismaClient } from "../lib/generated/prisma";
import { validateProductSpecs } from "../lib/catalog/spec-registry";
import { dairyStore } from "./seed-data/dairy";
import { produceStore } from "./seed-data/produce";
import { utensilsStore } from "./seed-data/utensils";
import type { CatalogStoreSeed } from "./seed-data/types";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Start of the current UTC day, minus six days, at 09:00 UTC. */
const TIMELINE_START = (() => {
  const now = new Date();
  const midnightUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(midnightUtc - 6 * 86_400_000 + 9 * 3_600_000);
})();

/** A point on the seeded timeline: `day` days and `minutes` minutes in. */
const at = (day: number, minutes = 0): Date =>
  new Date(TIMELINE_START.getTime() + day * 86_400_000 + minutes * 60_000);

/** Client clocks run slightly behind the server (ADR-2.7-012). */
const clientClaim = (receivedAt: Date): Date => new Date(receivedAt.getTime() - 400);

/**
 * GST is 18% on consumer electronics. MRP and selling price are GST-INCLUSIVE,
 * so the tax component is extracted from the inclusive total rather than added
 * to it (ADR-2.7-021). Integer paise throughout — no floating-point money.
 */
const GST_BPS = 1800;
const gstComponentPaise = (inclusivePaise: number): number =>
  inclusivePaise - Math.round((inclusivePaise * 10_000) / (10_000 + GST_BPS));

/** A whole-percent discount on an integer-paise amount. */
const percentOf = (paise: number, percent: number): number =>
  Math.round((paise * percent) / 100);

// ─────────────────────────────────────────────────────────────────────────────
// Identity — one merchant, one store (ADR-2.7-002)
// ─────────────────────────────────────────────────────────────────────────────

const MERCHANT_ID = "seed_merchant_rohan";
const STORE_ID = "seed_store_nextgen";
const STORE_SLUG = "next-gen-electronics";

async function seedStore() {
  const merchant = {
    email: "rohan.mehta@nextgenstore.test",
    name: "Rohan Mehta",
  };
  await prisma.merchant.upsert({
    where: { id: MERCHANT_ID },
    create: { id: MERCHANT_ID, ...merchant },
    update: merchant,
  });

  const store = {
    name: "The Next Gen Store",
    // Platform-unique; resolves the storefront route /s/next-gen-electronics
    // (ADR-2.8-002, PLT-2).
    slug: STORE_SLUG,
    merchantId: MERCHANT_ID,
    // "Low" is category-dependent; per-product overrides sit on Product.
    defaultLowStockThreshold: 5,
  };
  await prisma.store.upsert({
    where: { id: STORE_ID },
    create: { id: STORE_ID, ...store },
    update: store,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue (ADR-2.7-003 / 005 / 021, PRD-*)
// ─────────────────────────────────────────────────────────────────────────────

const BRANDS = [
  { id: "seed_brand_aeris", name: "Aeris", slug: "aeris" },
  { id: "seed_brand_nova", name: "Nova", slug: "nova" },
  { id: "seed_brand_vertex", name: "Vertex", slug: "vertex" },
  { id: "seed_brand_kestrel", name: "Kestrel", slug: "kestrel" },
  { id: "seed_brand_lumen", name: "Lumen", slug: "lumen" },
];

const CATEGORIES = [
  { id: "seed_cat_audio", name: "Audio", slug: "audio", position: 0 },
  { id: "seed_cat_peripherals", name: "Peripherals", slug: "peripherals", position: 1 },
  { id: "seed_cat_storage", name: "Storage", slug: "storage", position: 2 },
  { id: "seed_cat_components", name: "Components", slug: "components", position: 3 },
  { id: "seed_cat_displays", name: "Displays", slug: "displays", position: 4 },
];

/** Exactly two levels — no arbitrary nesting (catalog §7). */
const SUBCATEGORIES = [
  { id: "seed_sub_headphones", categoryId: "seed_cat_audio", name: "Headphones", slug: "headphones", position: 0 },
  { id: "seed_sub_earphones", categoryId: "seed_cat_audio", name: "Earphones", slug: "earphones", position: 1 },
  { id: "seed_sub_keyboards", categoryId: "seed_cat_peripherals", name: "Keyboards", slug: "keyboards", position: 0 },
  { id: "seed_sub_mice", categoryId: "seed_cat_peripherals", name: "Mice", slug: "mice", position: 1 },
  { id: "seed_sub_webcams", categoryId: "seed_cat_peripherals", name: "Webcams", slug: "webcams", position: 2 },
  { id: "seed_sub_usb_hubs", categoryId: "seed_cat_peripherals", name: "USB Hubs", slug: "usb-hubs", position: 3 },
  { id: "seed_sub_ssds", categoryId: "seed_cat_storage", name: "Solid-State Drives", slug: "ssds", position: 0 },
  { id: "seed_sub_gpus", categoryId: "seed_cat_components", name: "Graphics Cards", slug: "graphics-cards", position: 0 },
  { id: "seed_sub_psus", categoryId: "seed_cat_components", name: "Power Supplies", slug: "power-supplies", position: 1 },
  { id: "seed_sub_monitors", categoryId: "seed_cat_displays", name: "Monitors", slug: "monitors", position: 0 },
];

type SeedProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  lifecycleStatus: "DRAFT" | "ACTIVE" | "ARCHIVED";
  brandId: string | null;
  categoryId: string;
  subcategoryId: string | null;
  mrpPaise: number;
  sellingPricePaise: number;
  /** GST-exclusive. Null where the merchant has not recorded it (PRD-5). */
  costPricePaise: number | null;
  /** Current stock — already reflects the orders seeded below. */
  stockQuantity: number;
  lowStockThreshold: number | null;
  specs: Record<string, string | number | boolean>;
  imageAlt: string;
};

/**
 * Prices are integer paise, GST-inclusive for MRP and selling price
 * (ADR-2.7-020 / 021). Spec keys carry their canonical unit so numeric
 * comparisons work — `batteryHours: 40`, never `battery: "40 hours"`
 * (PRD-12, catalog §8.2).
 */
const PRODUCTS: SeedProduct[] = [
  {
    id: "seed_prod_aer_halo",
    name: "Aeris Halo ANC Wireless Headphones",
    slug: "aeris-halo-anc-wireless-headphones",
    sku: "AER-HALO-BK",
    description:
      "Over-ear wireless headphones with hybrid active noise cancellation, 40-hour battery life and multipoint Bluetooth pairing.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_aeris",
    categoryId: "seed_cat_audio",
    subcategoryId: "seed_sub_headphones",
    mrpPaise: 1_499_900,
    sellingPricePaise: 1_149_900,
    costPricePaise: 780_000,
    stockQuantity: 23,
    lowStockThreshold: null,
    specs: { type: "Over-ear", noiseCancelling: true, batteryHours: 40, bluetoothVersion: "5.3", weightGrams: 268 },
    imageAlt: "Aeris Halo over-ear headphones in matte black, three-quarter view",
  },
  {
    id: "seed_prod_aer_pulse",
    name: "Aeris Pulse Wireless Earbuds",
    slug: "aeris-pulse-wireless-earbuds",
    sku: "AER-PULSE-WH",
    description:
      "In-ear true wireless earbuds with adaptive noise cancellation, IPX5 water resistance and a pocketable charging case.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_aeris",
    categoryId: "seed_cat_audio",
    subcategoryId: "seed_sub_earphones",
    mrpPaise: 499_900,
    sellingPricePaise: 349_900,
    costPricePaise: 215_000,
    stockQuantity: 3, // below its threshold — derives to LOW_STOCK
    lowStockThreshold: 5,
    specs: { type: "In-ear", noiseCancelling: true, batteryHours: 28, waterResistance: "IPX5", weightGrams: 5 },
    imageAlt: "Aeris Pulse wireless earbuds in white with charging case open",
  },
  {
    id: "seed_prod_nov_strike75",
    name: "Nova Strike 75 Mechanical Keyboard",
    slug: "nova-strike-75-mechanical-keyboard",
    sku: "NOV-STR75-BR",
    description:
      "75% hot-swappable mechanical keyboard with pre-lubricated tactile switches, PBT double-shot keycaps and a gasket-mounted plate.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_nova",
    categoryId: "seed_cat_peripherals",
    subcategoryId: "seed_sub_keyboards",
    mrpPaise: 949_900,
    sellingPricePaise: 799_900,
    costPricePaise: 520_000,
    stockQuantity: 18,
    lowStockThreshold: null,
    specs: { layout: "75%", switchType: "Tactile", hotSwappable: true, keycapMaterial: "PBT", connection: "Wired" },
    imageAlt: "Nova Strike 75 mechanical keyboard with brown keycaps, top-down view",
  },
  {
    id: "seed_prod_nov_glidepro",
    name: "Nova Glide Pro Wireless Gaming Mouse",
    slug: "nova-glide-pro-wireless-gaming-mouse",
    sku: "NOV-GLDPRO-BK",
    description:
      "Lightweight 58 g wireless gaming mouse with a 26,000 DPI optical sensor, optical switches and 90-hour battery life.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_nova",
    categoryId: "seed_cat_peripherals",
    subcategoryId: "seed_sub_mice",
    mrpPaise: 649_900,
    sellingPricePaise: 499_900,
    costPricePaise: 310_000,
    stockQuantity: 31,
    lowStockThreshold: null,
    specs: { sensorDpi: 26000, weightGrams: 58, connection: "Wireless", batteryHours: 90, buttons: 6 },
    imageAlt: "Nova Glide Pro wireless gaming mouse in black, side profile",
  },
  {
    id: "seed_prod_nov_vision4k",
    name: "Nova Vision 4K Webcam",
    slug: "nova-vision-4k-webcam",
    sku: "NOV-VIS4K",
    description:
      "4K UHD webcam with autofocus, dual noise-cancelling microphones and a physical privacy shutter.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_nova",
    categoryId: "seed_cat_peripherals",
    subcategoryId: "seed_sub_webcams",
    mrpPaise: 899_900,
    sellingPricePaise: 699_900,
    costPricePaise: 460_000,
    stockQuantity: 12,
    lowStockThreshold: null,
    specs: { resolution: "3840x2160", frameRate: 30, autofocus: true, privacyShutter: true, connection: "USB-C" },
    imageAlt: "Nova Vision 4K webcam mounted on a monitor bezel",
  },
  {
    id: "seed_prod_lum_hub7c",
    name: "Lumen Port 7-in-1 USB-C Hub",
    slug: "lumen-port-7-in-1-usb-c-hub",
    sku: "LUM-HUB7C",
    description:
      "Aluminium USB-C hub with HDMI 4K60, two USB-A 3.2 ports, SD and microSD readers, Ethernet and 100 W pass-through charging.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_lumen",
    categoryId: "seed_cat_peripherals",
    subcategoryId: "seed_sub_usb_hubs",
    mrpPaise: 349_900,
    sellingPricePaise: 249_900,
    // Merchant has not recorded a cost. Profit and margin are UNAVAILABLE,
    // never zero and never guessed (PRD-5).
    costPricePaise: null,
    stockQuantity: 40,
    lowStockThreshold: null,
    specs: { ports: 7, hdmiVersion: "2.0", passThroughWatts: 100, ethernetMbps: 1000, material: "Aluminium" },
    imageAlt: "Lumen Port 7-in-1 USB-C hub in space grey with cables attached",
  },
  {
    id: "seed_prod_vtx_rpd512",
    name: "Vertex Rapid 512GB NVMe SSD",
    slug: "vertex-rapid-512gb-nvme-ssd",
    sku: "VTX-RPD512",
    description:
      "Entry-level PCIe Gen4 M.2 NVMe solid-state drive with a five-year warranty, suited to boot drives and light workloads.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_vertex",
    categoryId: "seed_cat_storage",
    subcategoryId: "seed_sub_ssds",
    mrpPaise: 649_900,
    sellingPricePaise: 479_900,
    costPricePaise: 340_000,
    // ACTIVE but out of stock: still VISIBLE so the agent can offer a
    // substitution, but not PURCHASABLE (catalog §6, PRD-9).
    stockQuantity: 0,
    lowStockThreshold: null,
    specs: { capacityGb: 512, interface: "NVMe", pcieGeneration: 4, formFactor: "M.2 2280", readMbps: 5000 },
    imageAlt: "Vertex Rapid 512GB M.2 NVMe solid-state drive",
  },
  {
    id: "seed_prod_vtx_rpd1tb",
    name: "Vertex Rapid 1TB NVMe SSD",
    slug: "vertex-rapid-1tb-nvme-ssd",
    sku: "VTX-RPD1TB",
    description:
      "PCIe Gen4 M.2 NVMe solid-state drive with a DRAM cache, delivering sustained sequential reads up to 7,000 MB/s.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_vertex",
    categoryId: "seed_cat_storage",
    subcategoryId: "seed_sub_ssds",
    mrpPaise: 1_099_900,
    sellingPricePaise: 849_900,
    costPricePaise: 610_000,
    stockQuantity: 15,
    lowStockThreshold: null,
    specs: { capacityGb: 1000, interface: "NVMe", pcieGeneration: 4, formFactor: "M.2 2280", readMbps: 7000 },
    imageAlt: "Vertex Rapid 1TB M.2 NVMe solid-state drive",
  },
  {
    id: "seed_prod_vtx_rpd2tb",
    name: "Vertex Rapid 2TB NVMe SSD",
    slug: "vertex-rapid-2tb-nvme-ssd",
    sku: "VTX-RPD2TB",
    description:
      "High-capacity PCIe Gen4 M.2 NVMe solid-state drive with a DRAM cache and a heatsink-ready 2280 form factor.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_vertex",
    categoryId: "seed_cat_storage",
    subcategoryId: "seed_sub_ssds",
    mrpPaise: 1_899_900,
    sellingPricePaise: 1_549_900,
    costPricePaise: 1_120_000,
    stockQuantity: 9,
    lowStockThreshold: null,
    specs: { capacityGb: 2000, interface: "NVMe", pcieGeneration: 4, formFactor: "M.2 2280", readMbps: 7400 },
    imageAlt: "Vertex Rapid 2TB M.2 NVMe solid-state drive",
  },
  {
    id: "seed_prod_vtx_trq4070",
    name: "Vertex Torque RTX 4070 12GB",
    slug: "vertex-torque-rtx-4070-12gb",
    sku: "VTX-TRQ4070",
    description:
      "Triple-fan GeForce RTX 4070 graphics card with 12 GB GDDR6X memory and a factory overclock, recommended with a 650 W or larger supply.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_vertex",
    categoryId: "seed_cat_components",
    subcategoryId: "seed_sub_gpus",
    mrpPaise: 6_299_900,
    sellingPricePaise: 5_499_900,
    costPricePaise: 4_450_000,
    stockQuantity: 5,
    lowStockThreshold: null,
    specs: { memoryGb: 12, memoryType: "GDDR6X", interface: "PCIe 4.0 x16", recommendedPsuWatts: 650, lengthMm: 305 },
    imageAlt: "Vertex Torque RTX 4070 triple-fan graphics card",
  },
  {
    id: "seed_prod_vtx_srg750",
    name: "Vertex Surge 750W Gold Power Supply",
    slug: "vertex-surge-750w-gold-power-supply",
    sku: "VTX-SRG750G",
    description:
      "Fully modular 750 W ATX power supply with 80 PLUS Gold efficiency, a 120 mm fluid-dynamic-bearing fan and a ten-year warranty.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_vertex",
    categoryId: "seed_cat_components",
    subcategoryId: "seed_sub_psus",
    mrpPaise: 999_900,
    sellingPricePaise: 749_900,
    costPricePaise: 530_000,
    stockQuantity: 22,
    lowStockThreshold: null,
    specs: { wattage: 750, efficiencyRating: "80 PLUS Gold", modular: true, fanSizeMm: 120, formFactor: "ATX" },
    imageAlt: "Vertex Surge 750W modular power supply unit",
  },
  {
    id: "seed_prod_kes_clr27q",
    name: 'Kestrel Clarity 27" 144Hz QHD Monitor',
    slug: "kestrel-clarity-27-144hz-qhd-monitor",
    sku: "KES-CLR27Q",
    description:
      "27-inch 2560x1440 IPS monitor with a 144 Hz refresh rate, 1 ms response time and a height-adjustable stand.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_kestrel",
    categoryId: "seed_cat_displays",
    subcategoryId: "seed_sub_monitors",
    mrpPaise: 2_999_900,
    sellingPricePaise: 2_499_900,
    costPricePaise: 1_980_000,
    stockQuantity: 6,
    lowStockThreshold: null,
    specs: { screenSizeInches: 27, resolution: "2560x1440", refreshRateHz: 144, panelType: "IPS", responseTimeMs: 1 },
    imageAlt: "Kestrel Clarity 27-inch QHD monitor on a height-adjustable stand",
  },
  {
    id: "seed_prod_kes_clr32k",
    name: 'Kestrel Clarity 32" 4K Monitor',
    slug: "kestrel-clarity-32-4k-monitor",
    sku: "KES-CLR32K",
    description:
      "32-inch 3840x2160 IPS monitor with 95% DCI-P3 coverage, USB-C 90 W power delivery and a built-in KVM switch.",
    lifecycleStatus: "ACTIVE",
    brandId: "seed_brand_kestrel",
    categoryId: "seed_cat_displays",
    subcategoryId: "seed_sub_monitors",
    mrpPaise: 4_499_900,
    sellingPricePaise: 3_899_900,
    costPricePaise: 3_150_000,
    stockQuantity: 4, // at threshold — derives to LOW_STOCK
    lowStockThreshold: 5,
    specs: { screenSizeInches: 32, resolution: "3840x2160", refreshRateHz: 60, panelType: "IPS", usbCWatts: 90 },
    imageAlt: "Kestrel Clarity 32-inch 4K monitor displaying a colour-grading workspace",
  },
  {
    id: "seed_prod_lum_arcmat",
    name: "Lumen Arc Desk Mat",
    slug: "lumen-arc-desk-mat",
    sku: "LUM-ARCMAT",
    description:
      "Extended stitched-edge desk mat with a water-repellent microfibre surface and a non-slip rubber base.",
    // Being prepared — invisible to customers (catalog §6).
    lifecycleStatus: "DRAFT",
    brandId: "seed_brand_lumen",
    categoryId: "seed_cat_peripherals",
    subcategoryId: null,
    mrpPaise: 199_900,
    sellingPricePaise: 149_900,
    costPricePaise: null,
    stockQuantity: 50,
    lowStockThreshold: null,
    specs: { widthMm: 900, depthMm: 400, material: "Microfibre", stitchedEdge: true },
    imageAlt: "Lumen Arc extended desk mat in charcoal",
  },
  {
    id: "seed_prod_aer_echo",
    name: "Aeris Echo Bluetooth Speaker",
    slug: "aeris-echo-bluetooth-speaker",
    sku: "AER-ECHO-GY",
    description:
      "Portable Bluetooth speaker with a 360-degree driver array and 18-hour playback. Discontinued by the supplier.",
    // Withdrawn from sale, record retained (ADR-2.7-004, PRD-16).
    lifecycleStatus: "ARCHIVED",
    brandId: "seed_brand_aeris",
    categoryId: "seed_cat_audio",
    subcategoryId: null,
    mrpPaise: 599_900,
    sellingPricePaise: 449_900,
    costPricePaise: 290_000,
    stockQuantity: 0,
    lowStockThreshold: null,
    specs: { batteryHours: 18, waterResistance: "IPX7", outputWatts: 30, bluetoothVersion: "5.2" },
    imageAlt: "Aeris Echo portable Bluetooth speaker in grey",
  },
];

async function seedCatalogue() {
  for (const brand of BRANDS) {
    const data = { storeId: STORE_ID, name: brand.name, slug: brand.slug, isActive: true };
    await prisma.brand.upsert({ where: { id: brand.id }, create: { id: brand.id, ...data }, update: data });
  }

  for (const category of CATEGORIES) {
    const data = {
      storeId: STORE_ID,
      name: category.name,
      slug: category.slug,
      position: category.position,
      isActive: true,
    };
    await prisma.category.upsert({
      where: { id: category.id },
      create: { id: category.id, ...data },
      update: data,
    });
  }

  for (const sub of SUBCATEGORIES) {
    const data = {
      storeId: STORE_ID,
      categoryId: sub.categoryId,
      name: sub.name,
      slug: sub.slug,
      position: sub.position,
      isActive: true,
    };
    await prisma.subcategory.upsert({ where: { id: sub.id }, create: { id: sub.id, ...data }, update: data });
  }

  for (const product of PRODUCTS) {
    const { id, imageAlt, ...rest } = product;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.product.upsert({ where: { id }, create: { id, ...data }, update: data });

    // The primary image is simply the lowest position — there is no
    // isPrimary flag (PRD-14). Hosting is out of scope; these are local paths.
    const imageId = `${id}_img0`;
    const image = { productId: id, url: `/products/${product.slug}.jpg`, altText: imageAlt, position: 0 };
    await prisma.productImage.upsert({
      where: { id: imageId },
      create: { id: imageId, ...image },
      update: image,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Merchant policies (ADR-2.7-026)
//
// These are the rules the seeded guardrail evaluations below are actually
// measured against — a proposed 15% discount is rejected because MAX_DISCOUNT
// is 10%, and a proposed 5% discount passes.
// ─────────────────────────────────────────────────────────────────────────────

const POLICY_MAX_DISCOUNT = "seed_policy_max_discount";
const POLICY_MIN_MARGIN = "seed_policy_min_margin";
const POLICY_INVENTORY = "seed_policy_inventory_requirement";
const POLICY_PRODUCT_ELIGIBILITY = "seed_policy_product_eligibility";
const POLICY_CUSTOMER_ELIGIBILITY = "seed_policy_customer_eligibility";
const POLICY_FREQUENCY = "seed_policy_frequency_limit";

const MAX_DISCOUNT_PERCENT = 10;
const MIN_CONTRIBUTION_PERCENT = 12;
const MIN_STOCK_FOR_ACTION = 3;

const POLICIES = [
  {
    id: POLICY_MAX_DISCOUNT,
    type: "MAX_DISCOUNT" as const,
    // Version 2: the merchant tightened this from 15% to 10% (see the
    // POLICY_CHANGED audit entry).
    version: 2,
    scope: { actionTypes: ["PERSONALIZED_OFFER", "CROSS_SELL", "UPSELL", "ABANDONED_CHECKOUT_INTERVENTION"] },
    value: { maxDiscountPercent: MAX_DISCOUNT_PERCENT },
  },
  {
    id: POLICY_MIN_MARGIN,
    type: "MIN_MARGIN" as const,
    version: 1,
    scope: { appliesTo: "allProductsWithRecordedCost" },
    // Indicative contribution, not accounting profit (ADR-2.7-021).
    value: { minContributionPercent: MIN_CONTRIBUTION_PERCENT },
  },
  {
    id: POLICY_INVENTORY,
    type: "INVENTORY_REQUIREMENT" as const,
    version: 1,
    scope: { appliesTo: "allActionTypes" },
    value: { minStockQuantity: MIN_STOCK_FOR_ACTION },
  },
  {
    id: POLICY_PRODUCT_ELIGIBILITY,
    type: "PRODUCT_ELIGIBILITY" as const,
    version: 1,
    scope: { appliesTo: "allActionTypes" },
    value: { requireLifecycleStatus: "ACTIVE", requirePurchasable: true },
  },
  {
    id: POLICY_CUSTOMER_ELIGIBILITY,
    type: "CUSTOMER_ELIGIBILITY" as const,
    version: 1,
    scope: { appliesTo: "allActionTypes" },
    value: { requireAuthenticated: true, excludeOptedOut: true },
  },
  {
    id: POLICY_FREQUENCY,
    type: "FREQUENCY_LIMIT" as const,
    version: 1,
    scope: { bucket: "hour" },
    value: { maxActionsPerCustomerPerBucket: 1 },
  },
];

async function seedPolicies() {
  for (const policy of POLICIES) {
    const data = {
      storeId: STORE_ID,
      type: policy.type,
      enabled: true,
      scope: policy.scope,
      value: policy.value,
      version: policy.version,
      effectiveFrom: at(-30),
    };
    await prisma.policy.upsert({
      where: { id: policy.id },
      create: { id: policy.id, ...data },
      update: data,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers and sessions (identity-model.md)
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { id: "seed_cust_ananya", email: "ananya.iyer@example.test", name: "Ananya Iyer", phone: "+91 98200 41122" },
  { id: "seed_cust_rahul", email: "rahul.verma@example.test", name: "Rahul Verma", phone: "+91 99303 55870" },
  { id: "seed_cust_priya", email: "priya.nair@example.test", name: "Priya Nair", phone: "+91 90040 27319" },
  { id: "seed_cust_karthik", email: "karthik.rao@example.test", name: "Karthik Rao", phone: "+91 97400 68255" },
  { id: "seed_cust_sneha", email: "sneha.deshpande@example.test", name: "Sneha Deshpande", phone: "+91 94220 31647" },
];

const SESSIONS = [
  // Karthik browsed anonymously before he registered. customerId stays NULL —
  // this session was never authenticated — and the later login backfilled
  // attributedCustomerId. That is IDENTITY attribution, not revenue
  // attribution (ADR-2.7-009, INV-8).
  {
    id: "seed_sess_karthik_anon",
    anonymousId: "anon_dev_karthik_7f3c",
    customerId: null,
    attributedCustomerId: "seed_cust_karthik",
    startedAt: at(0, -90),
    lastActivityAt: at(0, -74),
    endedAt: at(0, -44),
  },
  {
    id: "seed_sess_karthik_1",
    anonymousId: "anon_dev_karthik_7f3c",
    customerId: "seed_cust_karthik",
    attributedCustomerId: null,
    startedAt: at(0),
    lastActivityAt: at(0, 22),
    endedAt: at(0, 52),
  },
  {
    id: "seed_sess_ananya_1",
    anonymousId: "anon_dev_ananya_2b91",
    customerId: "seed_cust_ananya",
    attributedCustomerId: null,
    startedAt: at(2),
    lastActivityAt: at(2, 14),
    endedAt: null,
  },
  {
    id: "seed_sess_sneha_1",
    anonymousId: "anon_dev_sneha_c40d",
    customerId: "seed_cust_sneha",
    attributedCustomerId: null,
    startedAt: at(3),
    lastActivityAt: at(3, 16),
    endedAt: null,
  },
  {
    id: "seed_sess_rahul_1",
    anonymousId: "anon_dev_rahul_9e52",
    customerId: "seed_cust_rahul",
    attributedCustomerId: null,
    startedAt: at(4),
    lastActivityAt: at(4, 13),
    endedAt: null,
  },
  {
    id: "seed_sess_priya_1",
    anonymousId: "anon_dev_priya_18a7",
    customerId: "seed_cust_priya",
    attributedCustomerId: null,
    startedAt: at(5),
    lastActivityAt: at(5, 9),
    endedAt: null,
  },
];

async function seedCustomersAndSessions() {
  for (const customer of CUSTOMERS) {
    const { id, ...rest } = customer;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.customer.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const session of SESSIONS) {
    const { id, ...rest } = session;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.session.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Carts (ADR-2.7-015)
//
// At most one ACTIVE cart per customer — the partial unique index enforces it.
// Carts whose checkout succeeded are CONVERTED.
// ─────────────────────────────────────────────────────────────────────────────

const CARTS = [
  { id: "seed_cart_karthik", customerId: "seed_cust_karthik", status: "CONVERTED" as const, lastActivityAt: at(0, 18) },
  { id: "seed_cart_ananya", customerId: "seed_cust_ananya", status: "CONVERTED" as const, lastActivityAt: at(2, 10) },
  { id: "seed_cart_sneha", customerId: "seed_cust_sneha", status: "CONVERTED" as const, lastActivityAt: at(3, 12) },
  { id: "seed_cart_rahul", customerId: "seed_cust_rahul", status: "ACTIVE" as const, lastActivityAt: at(4, 13) },
  { id: "seed_cart_priya", customerId: "seed_cust_priya", status: "ACTIVE" as const, lastActivityAt: at(5, 9) },
];

/** Only the two live carts still hold items; converted carts were emptied. */
const CART_ITEMS = [
  { id: "seed_cartitem_rahul_2tb", cartId: "seed_cart_rahul", productId: "seed_prod_vtx_rpd2tb", quantity: 1 },
  { id: "seed_cartitem_priya_kb", cartId: "seed_cart_priya", productId: "seed_prod_nov_strike75", quantity: 1 },
];

async function seedCarts() {
  for (const cart of CARTS) {
    const { id, ...rest } = cart;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.cart.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  for (const item of CART_ITEMS) {
    const { id, ...rest } = item;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.cartItem.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Opportunities (ADR-2.7-024)
//
// Each one is something a deterministic signal could genuinely have detected
// from the seeded events — repeated product views, a GPU in the cart, an
// out-of-stock product, a checkout that never completed. The LLM does not
// discover these; it reasons about them afterwards.
// ─────────────────────────────────────────────────────────────────────────────

const OPP_RAHUL_UPSELL = "seed_opp_rahul_ssd_upsell";
const OPP_SNEHA_PSU = "seed_opp_sneha_gpu_psu";
const OPP_KARTHIK_SUBST = "seed_opp_karthik_ssd_substitution";
const OPP_PRIYA_ABANDONED = "seed_opp_priya_abandoned_checkout";
const OPP_PRIYA_CARTOPT = "seed_opp_priya_cart_optimization";
const OPP_ANANYA_CROSSSELL = "seed_opp_ananya_hub_crosssell";
const OPP_KARTHIK_MONITOR = "seed_opp_karthik_monitor_upsell";
const OPP_RAHUL_WEBCAM = "seed_opp_rahul_webcam_crosssell";

const OPPORTUNITIES = [
  {
    id: OPP_RAHUL_UPSELL,
    customerId: "seed_cust_rahul",
    sessionId: "seed_sess_rahul_1",
    type: "UPSELL" as const,
    status: "RESOLVED" as const,
    dedupeKey: "upsell:seed_cust_rahul:seed_prod_vtx_rpd1tb",
    evidence: {
      signal: "REPEATED_PRODUCT_VIEW",
      viewCount: 2,
      sourceProductId: "seed_prod_vtx_rpd1tb",
      candidateProductIds: ["seed_prod_vtx_rpd2tb"],
      eventIds: ["seed_evt_rahul_2", "seed_evt_rahul_3"],
    },
    createdAt: at(4, 10),
    expiresAt: at(5, 10),
    resolvedAt: at(4, 11),
  },
  {
    id: OPP_SNEHA_PSU,
    customerId: "seed_cust_sneha",
    sessionId: "seed_sess_sneha_1",
    type: "CROSS_SELL" as const,
    status: "RESOLVED" as const,
    dedupeKey: "crosssell:seed_cust_sneha:seed_prod_vtx_trq4070",
    evidence: {
      signal: "CART_MISSING_REQUIRED_COMPLEMENT",
      sourceProductId: "seed_prod_vtx_trq4070",
      // The compatibility claim is catalogue-supported: the GPU's specs record
      // recommendedPsuWatts 650, and the candidate supplies 750 W (AI-7).
      compatibilityBasis: { specKey: "recommendedPsuWatts", requiredWatts: 650 },
      candidateProductIds: ["seed_prod_vtx_srg750"],
      eventIds: ["seed_evt_sneha_3"],
    },
    createdAt: at(3, 6),
    expiresAt: at(4, 6),
    resolvedAt: at(3, 7),
  },
  {
    id: OPP_KARTHIK_SUBST,
    customerId: "seed_cust_karthik",
    sessionId: "seed_sess_karthik_1",
    type: "SUBSTITUTION" as const,
    status: "RESOLVED" as const,
    dedupeKey: "substitution:seed_cust_karthik:seed_prod_vtx_rpd512",
    evidence: {
      signal: "VIEWED_PRODUCT_NOT_PURCHASABLE",
      sourceProductId: "seed_prod_vtx_rpd512",
      sourceStockQuantity: 0,
      candidateProductIds: ["seed_prod_vtx_rpd1tb"],
      eventIds: ["seed_evt_karthik_3"],
    },
    createdAt: at(0, 6),
    expiresAt: at(1, 6),
    resolvedAt: at(0, 9),
  },
  {
    id: OPP_PRIYA_ABANDONED,
    customerId: "seed_cust_priya",
    sessionId: "seed_sess_priya_1",
    type: "ABANDONED_CHECKOUT" as const,
    status: "OPEN" as const,
    dedupeKey: "abandoned:seed_cust_priya:seed_order_priya",
    evidence: {
      signal: "CHECKOUT_STARTED_WITHOUT_PAYMENT",
      orderId: "seed_order_priya",
      cartId: "seed_cart_priya",
      failedPaymentAttempts: 1,
      eventIds: ["seed_evt_priya_5"],
    },
    createdAt: at(5, 40),
    expiresAt: at(6, 40),
    resolvedAt: null,
  },
  {
    id: OPP_PRIYA_CARTOPT,
    customerId: "seed_cust_priya",
    sessionId: "seed_sess_priya_1",
    type: "CART_OPTIMIZATION" as const,
    // Resolved by a recorded NO_ACTION decision — an opportunity may exist
    // without an intervention being taken (growth §6, AI-4).
    status: "RESOLVED" as const,
    dedupeKey: "cartopt:seed_cust_priya:seed_cart_priya",
    evidence: {
      signal: "SINGLE_ITEM_CART",
      cartId: "seed_cart_priya",
      candidateProductIds: ["seed_prod_nov_glidepro"],
      eventIds: ["seed_evt_priya_3"],
    },
    createdAt: at(5, 12),
    expiresAt: at(6, 12),
    resolvedAt: at(5, 13),
  },
  {
    id: OPP_ANANYA_CROSSSELL,
    customerId: "seed_cust_ananya",
    sessionId: "seed_sess_ananya_1",
    type: "CROSS_SELL" as const,
    status: "OPEN" as const,
    dedupeKey: "crosssell:seed_cust_ananya:seed_prod_aer_halo",
    evidence: {
      signal: "POST_PURCHASE_COMPLEMENT",
      sourceProductId: "seed_prod_aer_halo",
      candidateProductIds: ["seed_prod_lum_hub7c"],
      orderId: "seed_order_ananya",
    },
    createdAt: at(2, 30),
    expiresAt: at(3, 30),
    resolvedAt: null,
  },
  {
    id: OPP_KARTHIK_MONITOR,
    customerId: "seed_cust_karthik",
    sessionId: "seed_sess_karthik_1",
    type: "UPSELL" as const,
    status: "OPEN" as const,
    dedupeKey: "upsell:seed_cust_karthik:seed_prod_kes_clr27q",
    evidence: {
      signal: "PURCHASED_ENTRY_TIER",
      sourceProductId: "seed_prod_kes_clr27q",
      candidateProductIds: ["seed_prod_kes_clr32k"],
      orderId: "seed_order_karthik",
    },
    createdAt: at(1, 15),
    expiresAt: at(2, 15),
    resolvedAt: null,
  },
  {
    id: OPP_RAHUL_WEBCAM,
    customerId: "seed_cust_rahul",
    sessionId: "seed_sess_rahul_1",
    type: "CROSS_SELL" as const,
    status: "OPEN" as const,
    dedupeKey: "crosssell:seed_cust_rahul:seed_prod_nov_vision4k",
    evidence: {
      signal: "CATEGORY_AFFINITY",
      sourceProductId: "seed_prod_vtx_rpd2tb",
      candidateProductIds: ["seed_prod_nov_vision4k"],
      eventIds: ["seed_evt_rahul_6"],
    },
    createdAt: at(4, 20),
    expiresAt: at(5, 20),
    resolvedAt: null,
  },
];

async function seedOpportunities() {
  for (const opp of OPPORTUNITIES) {
    const { id, ...rest } = opp;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.opportunity.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI actions (ADR-2.7-025)
//
// Every lifecycle state is represented, and not every action executes.
// Rationale is concise and operational — never chain-of-thought (AI-11).
// observedStockQuantity records stock AT GENERATION TIME, which is why it can
// legitimately differ from the product's current stock (PRD-10).
// ─────────────────────────────────────────────────────────────────────────────

const ACT_RAHUL_UPSELL = "seed_act_rahul_ssd_upsell";
const ACT_SNEHA_PSU = "seed_act_sneha_psu_crosssell";
const ACT_KARTHIK_SUBST = "seed_act_karthik_ssd_substitution";
const ACT_PRIYA_REJECTED = "seed_act_priya_abandoned_offer";
const ACT_PRIYA_NOACTION = "seed_act_priya_cart_no_action";
const ACT_ANANYA_GENERATED = "seed_act_ananya_hub_crosssell";
const ACT_KARTHIK_APPROVED = "seed_act_karthik_monitor_upsell";
const ACT_RAHUL_VALIDATING = "seed_act_rahul_webcam_crosssell";

/** Shared reproducibility metadata (ADR-2.7-025). No chain-of-thought. */
const MODEL_META = {
  modelProvider: "anthropic",
  modelId: "claude-opus-5",
  modelVersion: "2026-05-01",
  decisionSchemaVersion: "ai-action/v1",
};

const AI_ACTIONS = [
  {
    id: ACT_RAHUL_UPSELL,
    opportunityId: OPP_RAHUL_UPSELL,
    customerId: "seed_cust_rahul",
    sessionId: "seed_sess_rahul_1",
    decision: "ACT" as const,
    actionType: "UPSELL" as const,
    status: "EXECUTED" as const,
    // Shown on the 2TB listing the customer opened.
    surface: "PRODUCT_DETAIL" as const,
    targetProductId: "seed_prod_vtx_rpd2tb",
    rationale:
      "Viewed the 1TB drive twice in one session, then opened the 2TB listing. Capacity-tier upsell within the same subcategory and brand.",
    confidence: 0.74,
    proposedOffer: null,
    observedStockQuantity: 9,
    candidateSetHash: "sha256:ssd-capacity-tier-v1",
    createdAt: at(4, 10),
    expiresAt: at(5, 10),
    executedAt: at(4, 11),
  },
  {
    id: ACT_SNEHA_PSU,
    opportunityId: OPP_SNEHA_PSU,
    customerId: "seed_cust_sneha",
    sessionId: "seed_sess_sneha_1",
    decision: "ACT" as const,
    actionType: "CROSS_SELL" as const,
    status: "EXECUTED" as const,
    // The GPU is already in the cart; the missing PSU belongs beside it.
    surface: "CART" as const,
    targetProductId: "seed_prod_vtx_srg750",
    rationale:
      "RTX 4070 in cart lists recommendedPsuWatts 650 and the cart holds no power supply. The 750W Gold unit satisfies that requirement and is in stock.",
    confidence: 0.81,
    // Fact #1 in ADR-2.7-023: what the AI PROPOSED. 5% is within the
    // merchant's 10% MAX_DISCOUNT, so the guardrail engine approves it.
    proposedOffer: {
      offerId: "crosssell-psu-5pct",
      kind: "PERCENT_DISCOUNT",
      discountPercent: 5,
      appliesToProductId: "seed_prod_vtx_srg750",
    },
    observedStockQuantity: 23, // 23 at generation; 22 now, after this order
    candidateSetHash: "sha256:gpu-psu-compat-v1",
    createdAt: at(3, 6),
    expiresAt: at(4, 6),
    executedAt: at(3, 7),
  },
  {
    id: ACT_KARTHIK_SUBST,
    opportunityId: OPP_KARTHIK_SUBST,
    customerId: "seed_cust_karthik",
    sessionId: "seed_sess_karthik_1",
    decision: "ACT" as const,
    actionType: "SUBSTITUTION" as const,
    status: "EXECUTED" as const,
    // Shown on the out-of-stock drive's own page, where the substitution is useful.
    surface: "PRODUCT_DETAIL" as const,
    // The out-of-stock 512GB drive is the SOURCE. The target is the 1TB drive,
    // which is ACTIVE with stock — the AI never targets a product that cannot
    // be bought (PRD-11, AI-9).
    targetProductId: "seed_prod_vtx_rpd1tb",
    rationale:
      "Viewed the 512GB drive while it is out of stock. The 1TB drive is the same interface and form factor and is purchasable.",
    confidence: 0.69,
    proposedOffer: null,
    observedStockQuantity: 15,
    candidateSetHash: "sha256:ssd-substitute-v1",
    createdAt: at(0, 6),
    expiresAt: at(1, 6),
    executedAt: at(0, 7),
  },
  {
    id: ACT_PRIYA_REJECTED,
    opportunityId: OPP_PRIYA_ABANDONED,
    customerId: "seed_cust_priya",
    sessionId: "seed_sess_priya_1",
    decision: "ACT" as const,
    actionType: "ABANDONED_CHECKOUT_INTERVENTION" as const,
    // Rejected by the guardrail engine, and kept so the rejection stays
    // auditable (GR-3).
    status: "REJECTED" as const,
    // In-app tray — the customer left checkout, so there is no live surface to render on (ADR-2.8-007).
    surface: "NOTIFICATION" as const,
    targetProductId: "seed_prod_nov_strike75",
    rationale:
      "Checkout started then payment failed once. Proposed a recovery discount on the cart's only line to rescue the order.",
    confidence: 0.58,
    // 15% exceeds the merchant's 10% maximum — the AI proposes, the business
    // decides (GR-1, ADR-2.7-024 flow).
    proposedOffer: {
      offerId: "abandoned-kb-15pct",
      kind: "PERCENT_DISCOUNT",
      discountPercent: 15,
      appliesToProductId: "seed_prod_nov_strike75",
    },
    observedStockQuantity: 18,
    candidateSetHash: "sha256:abandoned-recovery-v1",
    createdAt: at(5, 41),
    expiresAt: at(6, 41),
    executedAt: null,
  },
  {
    id: ACT_PRIYA_NOACTION,
    opportunityId: OPP_PRIYA_CARTOPT,
    customerId: "seed_cust_priya",
    sessionId: "seed_sess_priya_1",
    // NO_ACTION is a valid recorded decision (AI-4). actionType must be null —
    // the CHECK constraint enforces that pairing.
    decision: "NO_ACTION" as const,
    // No surface: a declined intervention has nothing to place. The CHECK in
    // the migration enforces that surface is null exactly when NO_ACTION.
    actionType: null,
    // The model declined, so nothing entered validation. It never reaches
    // APPROVED or REJECTED, which are guardrail outcomes.
    status: "GENERATED" as const,
    targetProductId: null,
    rationale:
      "Single-item cart viewed once, no repeat intent and no strong complement in the same session. Intervening here would be intrusive.",
    confidence: 0.31,
    proposedOffer: null,
    observedStockQuantity: null,
    candidateSetHash: "sha256:cart-complement-v1",
    createdAt: at(5, 12),
    expiresAt: at(6, 12),
    executedAt: null,
  },
  {
    id: ACT_ANANYA_GENERATED,
    opportunityId: OPP_ANANYA_CROSSSELL,
    customerId: "seed_cust_ananya",
    sessionId: "seed_sess_ananya_1",
    decision: "ACT" as const,
    actionType: "CROSS_SELL" as const,
    // Just produced; guardrails have not run yet.
    status: "GENERATED" as const,
    // Hub complements the laptop stand already in the cart.
    surface: "CART" as const,
    targetProductId: "seed_prod_lum_hub7c",
    rationale:
      "Bought USB-C headphones. A USB-C hub is a common complement and is well stocked.",
    confidence: 0.63,
    proposedOffer: null,
    observedStockQuantity: 40,
    candidateSetHash: "sha256:audio-accessory-v1",
    createdAt: at(2, 30),
    expiresAt: at(3, 30),
    executedAt: null,
  },
  {
    id: ACT_KARTHIK_APPROVED,
    opportunityId: OPP_KARTHIK_MONITOR,
    customerId: "seed_cust_karthik",
    sessionId: "seed_sess_karthik_1",
    decision: "ACT" as const,
    actionType: "UPSELL" as const,
    // Passed guardrails but has not been shown to anyone yet. Approval is not
    // permanent authorization — it is re-checked at execution (ADR-2.7-025).
    status: "APPROVED" as const,
    // Opportunity-backed upsell anchored on recent browsing, not a generic recommendation strip.
    surface: "HOME" as const,
    targetProductId: "seed_prod_kes_clr32k",
    rationale:
      "Bought the 27-inch QHD panel. The 32-inch 4K panel is the next tier in the same line and is in stock, though low.",
    confidence: 0.66,
    proposedOffer: null,
    observedStockQuantity: 4,
    candidateSetHash: "sha256:monitor-tier-v1",
    createdAt: at(1, 15),
    expiresAt: at(2, 15),
    executedAt: null,
  },
  {
    id: ACT_RAHUL_VALIDATING,
    opportunityId: OPP_RAHUL_WEBCAM,
    customerId: "seed_cust_rahul",
    sessionId: "seed_sess_rahul_1",
    decision: "ACT" as const,
    actionType: "CROSS_SELL" as const,
    // Currently in the guardrail engine.
    status: "VALIDATING" as const,
    // Last-moment cross-sell while the order is still PENDING.
    surface: "CHECKOUT" as const,
    targetProductId: "seed_prod_nov_vision4k",
    rationale:
      "Active storage-upgrade session suggests a workstation refresh. The 4K webcam is in stock and frequently bought alongside.",
    confidence: 0.44,
    proposedOffer: null,
    observedStockQuantity: 12,
    candidateSetHash: "sha256:workstation-affinity-v1",
    createdAt: at(4, 20),
    expiresAt: at(5, 20),
    executedAt: null,
  },
];

async function seedAiActions() {
  for (const action of AI_ACTIONS) {
    const { id, proposedOffer, ...rest } = action;
    const data = {
      storeId: STORE_ID,
      ...MODEL_META,
      ...rest,
      // A nullable Json column takes SQL NULL via Prisma.DbNull, not `null`.
      proposedOffer: proposedOffer ?? Prisma.DbNull,
    };
    await prisma.aiAction.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guardrail evaluations (ADR-2.7-026)
//
// Executed actions carry two snapshots — GENERATION and EXECUTION — because
// hard constraints are re-checked before anything reaches a customer.
// ─────────────────────────────────────────────────────────────────────────────

const rulePass = (policyId: string, type: string, version: number, detail: string) => ({
  policyId,
  policyType: type,
  policyVersion: version,
  result: "PASS",
  detail,
});

const GUARDRAIL_EVALUATIONS = [
  {
    id: "seed_gre_rahul_gen",
    aiActionId: ACT_RAHUL_UPSELL,
    phase: "GENERATION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(4, 10),
    rules: [
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Target is ACTIVE and purchasable."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Stock 9 >= required 3."),
      rulePass(POLICY_CUSTOMER_ELIGIBILITY, "CUSTOMER_ELIGIBILITY", 1, "Authenticated, not opted out."),
      rulePass(POLICY_FREQUENCY, "FREQUENCY_LIMIT", 1, "No prior action for this customer in the hour bucket."),
    ],
  },
  {
    id: "seed_gre_rahul_exec",
    aiActionId: ACT_RAHUL_UPSELL,
    phase: "EXECUTION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(4, 11),
    rules: [
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Re-checked at execution: still purchasable."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Re-checked at execution: stock 9 >= 3."),
    ],
  },
  {
    id: "seed_gre_sneha_gen",
    aiActionId: ACT_SNEHA_PSU,
    phase: "GENERATION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(3, 6),
    rules: [
      rulePass(POLICY_MAX_DISCOUNT, "MAX_DISCOUNT", 2, "Proposed 5% is within the 10% maximum."),
      rulePass(POLICY_MIN_MARGIN, "MIN_MARGIN", 1, "Indicative contribution after discount is 25.6% >= 12%."),
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Target is ACTIVE and purchasable."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Stock 23 >= required 3."),
      rulePass(POLICY_CUSTOMER_ELIGIBILITY, "CUSTOMER_ELIGIBILITY", 1, "Authenticated, not opted out."),
      rulePass(POLICY_FREQUENCY, "FREQUENCY_LIMIT", 1, "Hour bucket claimed by this action."),
    ],
  },
  {
    id: "seed_gre_sneha_exec",
    aiActionId: ACT_SNEHA_PSU,
    phase: "EXECUTION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(3, 7),
    rules: [
      rulePass(POLICY_MAX_DISCOUNT, "MAX_DISCOUNT", 2, "Re-checked at execution: offer still within bounds."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Re-checked at execution: stock 23 >= 3."),
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Re-checked at execution: still purchasable."),
    ],
  },
  {
    id: "seed_gre_karthik_gen",
    aiActionId: ACT_KARTHIK_SUBST,
    phase: "GENERATION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(0, 6),
    rules: [
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Substitute is ACTIVE and purchasable."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Stock 15 >= required 3."),
      rulePass(POLICY_CUSTOMER_ELIGIBILITY, "CUSTOMER_ELIGIBILITY", 1, "Authenticated, not opted out."),
    ],
  },
  {
    id: "seed_gre_karthik_exec",
    aiActionId: ACT_KARTHIK_SUBST,
    phase: "EXECUTION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(0, 7),
    rules: [
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Re-checked at execution: stock 15 >= 3."),
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Re-checked at execution: still purchasable."),
    ],
  },
  {
    // The headline guardrail case: the AI proposed 15%, the merchant allows 10%.
    id: "seed_gre_priya_gen",
    aiActionId: ACT_PRIYA_REJECTED,
    phase: "GENERATION" as const,
    result: "REJECTED" as const,
    reason: "Proposed discount of 15% exceeds the merchant maximum of 10%.",
    evaluatedAt: at(5, 41),
    rules: [
      {
        policyId: POLICY_MAX_DISCOUNT,
        policyType: "MAX_DISCOUNT",
        policyVersion: 2,
        result: "FAIL",
        detail: "Proposed 15% exceeds the configured maximum of 10%.",
      },
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Target is ACTIVE and purchasable."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Stock 18 >= required 3."),
      rulePass(POLICY_CUSTOMER_ELIGIBILITY, "CUSTOMER_ELIGIBILITY", 1, "Authenticated, not opted out."),
    ],
  },
  {
    id: "seed_gre_karthik_monitor_gen",
    aiActionId: ACT_KARTHIK_APPROVED,
    phase: "GENERATION" as const,
    result: "APPROVED" as const,
    reason: null,
    evaluatedAt: at(1, 15),
    rules: [
      rulePass(POLICY_PRODUCT_ELIGIBILITY, "PRODUCT_ELIGIBILITY", 1, "Target is ACTIVE and purchasable."),
      rulePass(POLICY_INVENTORY, "INVENTORY_REQUIREMENT", 1, "Stock 4 >= required 3."),
      rulePass(POLICY_CUSTOMER_ELIGIBILITY, "CUSTOMER_ELIGIBILITY", 1, "Authenticated, not opted out."),
    ],
  },
];

/** The unique constraint IS the rate limiter (ADR-2.7-027). */
const FREQUENCY_LEDGER = [
  {
    id: "seed_freq_rahul_upsell",
    customerId: "seed_cust_rahul",
    actionType: "UPSELL" as const,
    bucketStart: at(4, 0),
    aiActionId: ACT_RAHUL_UPSELL,
  },
  {
    id: "seed_freq_sneha_crosssell",
    customerId: "seed_cust_sneha",
    actionType: "CROSS_SELL" as const,
    bucketStart: at(3, 0),
    aiActionId: ACT_SNEHA_PSU,
  },
  {
    id: "seed_freq_karthik_subst",
    customerId: "seed_cust_karthik",
    actionType: "SUBSTITUTION" as const,
    bucketStart: at(0, 0),
    aiActionId: ACT_KARTHIK_SUBST,
  },
];

async function seedGuardrails() {
  for (const evaluation of GUARDRAIL_EVALUATIONS) {
    const { id, ...rest } = evaluation;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.guardrailEvaluation.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  for (const entry of FREQUENCY_LEDGER) {
    const { id, ...rest } = entry;
    const data = { storeId: STORE_ID, ...rest };
    await prisma.frequencyLedgerEntry.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders, order items and payments (ADR-2.7-016 / 017 / 018)
//
// Order stores no total: Order Value is the sum of its line totals
// (ADR-2.7-022). Line snapshots are historical and do not read through to the
// live Product.
// ─────────────────────────────────────────────────────────────────────────────

type SeedOrderLine = {
  id: string;
  productId: string;
  quantity: number;
  discountPercent: number;
  appliedOfferId: string | null;
  appliedActionId: string | null;
};

type SeedOrder = {
  id: string;
  customerId: string;
  cartId: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  placedAt: Date;
  paidAt: Date | null;
  lines: SeedOrderLine[];
};

const ORDERS: SeedOrder[] = [
  {
    id: "seed_order_karthik",
    customerId: "seed_cust_karthik",
    cartId: "seed_cart_karthik",
    status: "PAID",
    placedAt: at(0, 18),
    paidAt: at(0, 21),
    lines: [
      {
        id: "seed_oi_karthik_monitor",
        productId: "seed_prod_kes_clr27q",
        quantity: 1,
        discountPercent: 0,
        appliedOfferId: null,
        appliedActionId: null,
      },
    ],
  },
  {
    id: "seed_order_ananya",
    customerId: "seed_cust_ananya",
    cartId: "seed_cart_ananya",
    status: "PAID",
    placedAt: at(2, 10),
    paidAt: at(2, 13),
    lines: [
      {
        // Organic purchase — no AI action involved, so no attribution.
        id: "seed_oi_ananya_headphones",
        productId: "seed_prod_aer_halo",
        quantity: 1,
        discountPercent: 0,
        appliedOfferId: null,
        appliedActionId: null,
      },
    ],
  },
  {
    id: "seed_order_sneha",
    customerId: "seed_cust_sneha",
    cartId: "seed_cart_sneha",
    status: "PAID",
    placedAt: at(3, 12),
    paidAt: at(3, 15),
    lines: [
      {
        id: "seed_oi_sneha_gpu",
        productId: "seed_prod_vtx_trq4070",
        quantity: 1,
        discountPercent: 0,
        appliedOfferId: null,
        appliedActionId: null,
      },
      {
        // Fact #3 in ADR-2.7-023: the offer actually REDEEMED at checkout,
        // recorded on the line alongside the action credited with it.
        id: "seed_oi_sneha_psu",
        productId: "seed_prod_vtx_srg750",
        quantity: 1,
        discountPercent: 5,
        appliedOfferId: "crosssell-psu-5pct",
        appliedActionId: ACT_SNEHA_PSU,
      },
    ],
  },
  {
    id: "seed_order_priya",
    customerId: "seed_cust_priya",
    cartId: "seed_cart_priya",
    // Checkout started, payment failed, never paid. No PURCHASE event follows
    // from this (CO-12).
    status: "PENDING",
    placedAt: at(5, 9),
    paidAt: null,
    lines: [
      {
        id: "seed_oi_priya_keyboard",
        productId: "seed_prod_nov_strike75",
        quantity: 1,
        discountPercent: 0,
        appliedOfferId: null,
        appliedActionId: null,
      },
    ],
  },
];

/** Line totals, computed from the catalogue price at purchase time. */
function buildLine(line: SeedOrderLine, orderId: string) {
  const product = PRODUCTS.find((p) => p.id === line.productId);
  if (!product) throw new Error(`Seed error: unknown product ${line.productId}`);

  const gross = product.sellingPricePaise * line.quantity;
  const discountPaise = percentOf(gross, line.discountPercent);
  const lineTotalPaise = gross - discountPaise;

  return {
    id: line.id,
    storeId: STORE_ID,
    orderId,
    productId: product.id,
    // Snapshotted, not read through to the live Product (CO-8, CO-9).
    productName: product.name,
    sku: product.sku,
    unitPricePaise: product.sellingPricePaise,
    quantity: line.quantity,
    discountPaise,
    lineTotalPaise,
    taxPaise: gstComponentPaise(lineTotalPaise),
    appliedOfferId: line.appliedOfferId,
    appliedActionId: line.appliedActionId,
  };
}

/** Order Value = sum of line totals (ADR-2.7-022). Never stored on Order. */
const orderValuePaise = (order: SeedOrder): number =>
  order.lines.reduce((sum, line) => sum + buildLine(line, order.id).lineTotalPaise, 0);

async function seedOrders() {
  for (const order of ORDERS) {
    const data = {
      storeId: STORE_ID,
      customerId: order.customerId,
      cartId: order.cartId,
      status: order.status,
      idempotencyKey: `checkout_${order.id}`,
      placedAt: order.placedAt,
      paidAt: order.paidAt,
      cancelledAt: null,
    };
    await prisma.order.upsert({ where: { id: order.id }, create: { id: order.id, ...data }, update: data });

    for (const line of order.lines) {
      const built = buildLine(line, order.id);
      const { id, ...rest } = built;
      await prisma.orderItem.upsert({
        where: { id },
        create: { id, ...rest, createdAt: order.placedAt },
        update: { ...rest, createdAt: order.placedAt },
      });
    }
  }
}

async function seedPayments() {
  for (const order of ORDERS) {
    const amountPaise = orderValuePaise(order);

    if (order.status === "PAID") {
      // Sneha's first attempt failed before the retry succeeded — Order 1:N
      // PaymentAttempt, at most one SUCCEEDED (ADR-2.7-018).
      if (order.id === "seed_order_sneha") {
        const failedId = `seed_pay_${order.id}_1`;
        const failed = {
          storeId: STORE_ID,
          orderId: order.id,
          status: "FAILED" as const,
          amountPaise,
          provider: "RAZORPAY" as const,
          providerOrderId: `order_seed_${order.id}`,
          providerPaymentId: `pay_seed_${order.id}_1`,
          providerEventId: `evt_seed_${order.id}_1`,
          idempotencyKey: `${order.id}_attempt_1`,
          failureReason: "Issuer declined the transaction (insufficient funds).",
          createdAt: order.placedAt,
        };
        await prisma.paymentAttempt.upsert({
          where: { id: failedId },
          create: { id: failedId, ...failed },
          update: failed,
        });
      }

      const succeededId = `seed_pay_${order.id}_ok`;
      const succeeded = {
        storeId: STORE_ID,
        orderId: order.id,
        status: "SUCCEEDED" as const,
        amountPaise,
        provider: "RAZORPAY" as const,
        providerOrderId: `order_seed_${order.id}`,
        providerPaymentId: `pay_seed_${order.id}_ok`,
        providerEventId: `evt_seed_${order.id}_ok`,
        idempotencyKey: `${order.id}_attempt_final`,
        failureReason: null,
        createdAt: order.paidAt ?? order.placedAt,
      };
      await prisma.paymentAttempt.upsert({
        where: { id: succeededId },
        create: { id: succeededId, ...succeeded },
        update: succeeded,
      });
    } else {
      const failedId = `seed_pay_${order.id}_1`;
      const failed = {
        storeId: STORE_ID,
        orderId: order.id,
        status: "FAILED" as const,
        amountPaise,
        provider: "RAZORPAY" as const,
        providerOrderId: `order_seed_${order.id}`,
        providerPaymentId: `pay_seed_${order.id}_1`,
        providerEventId: `evt_seed_${order.id}_1`,
        idempotencyKey: `${order.id}_attempt_1`,
        failureReason: "Payment authentication timed out.",
        createdAt: order.placedAt,
      };
      await prisma.paymentAttempt.upsert({
        where: { id: failedId },
        create: { id: failedId, ...failed },
        update: failed,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Events (ADR-2.7-011 / 012 / 013)
//
// Five coherent journeys. PURCHASE is emitted ONLY for orders that actually
// reached PAID, and it carries no clientEventId or clientOccurredAt because it
// is a server-side business outcome, not client telemetry.
// ─────────────────────────────────────────────────────────────────────────────

type SeedEvent = {
  id: string;
  sessionId: string;
  type:
    | "SEARCH"
    | "PRODUCT_VIEW"
    | "PRODUCT_CLICK"
    | "ADD_TO_CART"
    | "REMOVE_FROM_CART"
    | "CART_VIEW"
    | "CHECKOUT_STARTED"
    | "OFFER_VIEWED"
    | "OFFER_CLICKED"
    | "OFFER_DISMISSED"
    | "PURCHASE";
  receivedAt: Date;
  payload: Prisma.InputJsonObject;
  orderId?: string;
  aiActionId?: string;
};

/** Price observed when the item was added — the cart itself stores no price. */
const observedPrice = (productId: string): number => {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) throw new Error(`Seed error: unknown product ${productId}`);
  return product.sellingPricePaise;
};

const EVENTS: SeedEvent[] = [
  // ── Karthik, anonymous: browsing before he ever registered ────────────────
  {
    id: "seed_evt_karthik_a1",
    sessionId: "seed_sess_karthik_anon",
    type: "SEARCH",
    receivedAt: at(0, -90),
    payload: { query: "nvme ssd", resultCount: 3 },
  },
  {
    id: "seed_evt_karthik_a2",
    sessionId: "seed_sess_karthik_anon",
    type: "PRODUCT_VIEW",
    receivedAt: at(0, -74),
    payload: { productId: "seed_prod_vtx_rpd512" },
  },

  // ── Karthik, authenticated: substitution offered, then dismissed ──────────
  {
    id: "seed_evt_karthik_3",
    sessionId: "seed_sess_karthik_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(0, 4),
    payload: { productId: "seed_prod_vtx_rpd512" },
  },
  {
    id: "seed_evt_karthik_4",
    sessionId: "seed_sess_karthik_1",
    type: "OFFER_VIEWED",
    receivedAt: at(0, 8),
    payload: { surface: "PRODUCT_DETAIL", actionType: "SUBSTITUTION" },
    aiActionId: ACT_KARTHIK_SUBST,
  },
  {
    // Exposed, then explicitly declined. No purchase follows, so no revenue
    // attribution — exposure alone never earns credit.
    id: "seed_evt_karthik_5",
    sessionId: "seed_sess_karthik_1",
    type: "OFFER_DISMISSED",
    receivedAt: at(0, 9),
    payload: { surface: "PRODUCT_DETAIL", reason: "not_interested" },
    aiActionId: ACT_KARTHIK_SUBST,
  },
  {
    id: "seed_evt_karthik_6",
    sessionId: "seed_sess_karthik_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(0, 12),
    payload: { productId: "seed_prod_kes_clr27q" },
  },
  {
    id: "seed_evt_karthik_7",
    sessionId: "seed_sess_karthik_1",
    type: "ADD_TO_CART",
    receivedAt: at(0, 15),
    payload: {
      cartId: "seed_cart_karthik",
      productId: "seed_prod_kes_clr27q",
      quantity: 1,
      observedSellingPricePaise: observedPrice("seed_prod_kes_clr27q"),
    },
  },
  {
    id: "seed_evt_karthik_8",
    sessionId: "seed_sess_karthik_1",
    type: "CHECKOUT_STARTED",
    receivedAt: at(0, 18),
    payload: { cartId: "seed_cart_karthik", cartValuePaise: 2_499_900 },
    orderId: "seed_order_karthik",
  },
  {
    id: "seed_evt_karthik_9",
    sessionId: "seed_sess_karthik_1",
    type: "PURCHASE",
    receivedAt: at(0, 22),
    payload: { orderId: "seed_order_karthik", orderValuePaise: 2_499_900, lineCount: 1 },
    orderId: "seed_order_karthik",
  },

  // ── Ananya: search → view → view → click → cart → checkout → purchase ─────
  {
    id: "seed_evt_ananya_1",
    sessionId: "seed_sess_ananya_1",
    type: "SEARCH",
    receivedAt: at(2, 0),
    payload: { query: "wireless headphones", resultCount: 2 },
  },
  {
    id: "seed_evt_ananya_2",
    sessionId: "seed_sess_ananya_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(2, 2),
    payload: { productId: "seed_prod_aer_halo" },
  },
  {
    id: "seed_evt_ananya_3",
    sessionId: "seed_sess_ananya_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(2, 4),
    payload: { productId: "seed_prod_aer_pulse" },
  },
  {
    id: "seed_evt_ananya_4",
    sessionId: "seed_sess_ananya_1",
    type: "PRODUCT_CLICK",
    receivedAt: at(2, 5),
    // Source distinguishes independently discovered products from AI-driven
    // ones (activity-tracking §5.5).
    payload: { productId: "seed_prod_aer_halo", source: "search_results", position: 1 },
  },
  {
    id: "seed_evt_ananya_5",
    sessionId: "seed_sess_ananya_1",
    type: "ADD_TO_CART",
    receivedAt: at(2, 6),
    payload: {
      cartId: "seed_cart_ananya",
      productId: "seed_prod_aer_halo",
      quantity: 1,
      observedSellingPricePaise: observedPrice("seed_prod_aer_halo"),
    },
  },
  {
    id: "seed_evt_ananya_6",
    sessionId: "seed_sess_ananya_1",
    type: "CART_VIEW",
    receivedAt: at(2, 8),
    payload: { cartId: "seed_cart_ananya", itemCount: 1 },
  },
  {
    id: "seed_evt_ananya_7",
    sessionId: "seed_sess_ananya_1",
    type: "CHECKOUT_STARTED",
    receivedAt: at(2, 10),
    payload: { cartId: "seed_cart_ananya", cartValuePaise: 1_149_900 },
    orderId: "seed_order_ananya",
  },
  {
    id: "seed_evt_ananya_8",
    sessionId: "seed_sess_ananya_1",
    type: "PURCHASE",
    receivedAt: at(2, 14),
    payload: { orderId: "seed_order_ananya", orderValuePaise: 1_149_900, lineCount: 1 },
    orderId: "seed_order_ananya",
  },

  // ── Sneha: the full growth loop — GPU → cross-sell → purchase ─────────────
  {
    id: "seed_evt_sneha_1",
    sessionId: "seed_sess_sneha_1",
    type: "SEARCH",
    receivedAt: at(3, 0),
    payload: { query: "rtx 4070", resultCount: 1 },
  },
  {
    id: "seed_evt_sneha_2",
    sessionId: "seed_sess_sneha_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(3, 2),
    payload: { productId: "seed_prod_vtx_trq4070" },
  },
  {
    id: "seed_evt_sneha_3",
    sessionId: "seed_sess_sneha_1",
    type: "ADD_TO_CART",
    receivedAt: at(3, 5),
    payload: {
      cartId: "seed_cart_sneha",
      productId: "seed_prod_vtx_trq4070",
      quantity: 1,
      observedSellingPricePaise: observedPrice("seed_prod_vtx_trq4070"),
    },
  },
  {
    id: "seed_evt_sneha_4",
    sessionId: "seed_sess_sneha_1",
    type: "CART_VIEW",
    receivedAt: at(3, 6),
    payload: { cartId: "seed_cart_sneha", itemCount: 1 },
  },
  {
    // THE EXPOSURE. This event is what makes the action eligible for revenue
    // attribution, and its receivedAt opens the 7-day window (ADR-2.7-028).
    id: "seed_evt_sneha_5",
    sessionId: "seed_sess_sneha_1",
    type: "OFFER_VIEWED",
    receivedAt: at(3, 7),
    payload: { surface: "CART", actionType: "CROSS_SELL", offerId: "crosssell-psu-5pct" },
    aiActionId: ACT_SNEHA_PSU,
  },
  {
    id: "seed_evt_sneha_6",
    sessionId: "seed_sess_sneha_1",
    type: "OFFER_CLICKED",
    receivedAt: at(3, 8),
    payload: { surface: "CART", offerId: "crosssell-psu-5pct" },
    aiActionId: ACT_SNEHA_PSU,
  },
  {
    id: "seed_evt_sneha_7",
    sessionId: "seed_sess_sneha_1",
    type: "ADD_TO_CART",
    receivedAt: at(3, 9),
    payload: {
      cartId: "seed_cart_sneha",
      productId: "seed_prod_vtx_srg750",
      quantity: 1,
      observedSellingPricePaise: observedPrice("seed_prod_vtx_srg750"),
      source: "ai_action",
    },
  },
  {
    id: "seed_evt_sneha_8",
    sessionId: "seed_sess_sneha_1",
    type: "CHECKOUT_STARTED",
    receivedAt: at(3, 12),
    payload: { cartId: "seed_cart_sneha", cartValuePaise: 6_249_800 },
    orderId: "seed_order_sneha",
  },
  {
    id: "seed_evt_sneha_9",
    sessionId: "seed_sess_sneha_1",
    type: "PURCHASE",
    receivedAt: at(3, 16),
    payload: { orderId: "seed_order_sneha", orderValuePaise: 6_212_305, lineCount: 2 },
    orderId: "seed_order_sneha",
  },

  // ── Rahul: upsell exposed and clicked, still deciding (live cart) ─────────
  {
    id: "seed_evt_rahul_1",
    sessionId: "seed_sess_rahul_1",
    type: "SEARCH",
    receivedAt: at(4, 0),
    payload: { query: "nvme ssd 1tb", resultCount: 3 },
  },
  {
    id: "seed_evt_rahul_2",
    sessionId: "seed_sess_rahul_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(4, 3),
    payload: { productId: "seed_prod_vtx_rpd1tb" },
  },
  {
    // Second view of the same product — the repeated-intent signal behind the
    // upsell opportunity.
    id: "seed_evt_rahul_3",
    sessionId: "seed_sess_rahul_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(4, 7),
    payload: { productId: "seed_prod_vtx_rpd1tb" },
  },
  {
    id: "seed_evt_rahul_4",
    sessionId: "seed_sess_rahul_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(4, 9),
    payload: { productId: "seed_prod_vtx_rpd2tb" },
  },
  {
    id: "seed_evt_rahul_5",
    sessionId: "seed_sess_rahul_1",
    type: "OFFER_VIEWED",
    receivedAt: at(4, 11),
    payload: { surface: "PRODUCT_DETAIL", actionType: "UPSELL" },
    aiActionId: ACT_RAHUL_UPSELL,
  },
  {
    id: "seed_evt_rahul_6",
    sessionId: "seed_sess_rahul_1",
    type: "OFFER_CLICKED",
    receivedAt: at(4, 12),
    payload: { surface: "PRODUCT_DETAIL" },
    aiActionId: ACT_RAHUL_UPSELL,
  },
  {
    // Exposed, clicked, added — but never checked out. No PAID order means no
    // attribution record, however promising the journey looks.
    id: "seed_evt_rahul_7",
    sessionId: "seed_sess_rahul_1",
    type: "ADD_TO_CART",
    receivedAt: at(4, 13),
    payload: {
      cartId: "seed_cart_rahul",
      productId: "seed_prod_vtx_rpd2tb",
      quantity: 1,
      observedSellingPricePaise: observedPrice("seed_prod_vtx_rpd2tb"),
      source: "ai_action",
    },
  },

  // ── Priya: abandoned checkout ─────────────────────────────────────────────
  {
    id: "seed_evt_priya_1",
    sessionId: "seed_sess_priya_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(5, 0),
    payload: { productId: "seed_prod_nov_strike75" },
  },
  {
    id: "seed_evt_priya_2",
    sessionId: "seed_sess_priya_1",
    type: "PRODUCT_VIEW",
    receivedAt: at(5, 4),
    payload: { productId: "seed_prod_nov_glidepro" },
  },
  {
    id: "seed_evt_priya_3",
    sessionId: "seed_sess_priya_1",
    type: "ADD_TO_CART",
    receivedAt: at(5, 6),
    payload: {
      cartId: "seed_cart_priya",
      productId: "seed_prod_nov_strike75",
      quantity: 1,
      observedSellingPricePaise: observedPrice("seed_prod_nov_strike75"),
    },
  },
  {
    id: "seed_evt_priya_4",
    sessionId: "seed_sess_priya_1",
    type: "CART_VIEW",
    receivedAt: at(5, 7),
    payload: { cartId: "seed_cart_priya", itemCount: 1 },
  },
  {
    // Checkout started, payment failed, and the journey stops here. There is
    // deliberately no PURCHASE event (CO-12).
    id: "seed_evt_priya_5",
    sessionId: "seed_sess_priya_1",
    type: "CHECKOUT_STARTED",
    receivedAt: at(5, 9),
    payload: { cartId: "seed_cart_priya", cartValuePaise: 799_900 },
    orderId: "seed_order_priya",
  },
];

async function seedEvents() {
  for (const event of EVENTS) {
    const isServerEmitted = event.type === "PURCHASE";
    const data = {
      storeId: STORE_ID,
      sessionId: event.sessionId,
      type: event.type,
      receivedAt: event.receivedAt,
      // A server-emitted business outcome has no client clock and no
      // client-generated id (ADR-2.7-011 / 012).
      clientOccurredAt: isServerEmitted ? null : clientClaim(event.receivedAt),
      clientEventId: isServerEmitted ? null : `ce_${event.id}`,
      payload: event.payload,
      orderId: event.orderId ?? null,
      aiActionId: event.aiActionId ?? null,
    };
    await prisma.event.upsert({ where: { id: event.id }, create: { id: event.id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue attribution (ADR-2.7-028)
//
// Exactly ONE record is seeded, because exactly one journey satisfies every
// rule: an OFFER_VIEWED exposure referencing the action, a PAID order inside
// the 7-day window, and the action's target product present as an order line.
// The amount is that matched line's total.
//
// Deliberately NOT attributed:
//   · Ananya's purchase — no AI action was involved at all.
//   · Karthik's purchase — he was exposed to a substitution offer and
//     dismissed it; the monitor he bought was not that action's target.
//   · Rahul's journey — exposed and clicked, but no PAID order exists.
// Fabricating records for those would claim revenue the rules do not support.
// ─────────────────────────────────────────────────────────────────────────────

const ATTRIBUTION_RULE_VERSION = "mvp-last-touch-7d";

async function seedAttribution() {
  const snehaOrder = ORDERS.find((o) => o.id === "seed_order_sneha");
  if (!snehaOrder) throw new Error("Seed error: Sneha's order is missing");

  const psuLine = snehaOrder.lines.find((l) => l.productId === "seed_prod_vtx_srg750");
  if (!psuLine) throw new Error("Seed error: the attributed order line is missing");

  const exposure = EVENTS.find((e) => e.id === "seed_evt_sneha_5");
  if (!exposure) throw new Error("Seed error: the exposure event is missing");

  const id = "seed_attr_sneha_psu";
  const data = {
    storeId: STORE_ID,
    aiActionId: ACT_SNEHA_PSU,
    orderId: snehaOrder.id,
    customerId: snehaOrder.customerId,
    exposureEventId: exposure.id,
    exposedAt: exposure.receivedAt,
    // The matched line total, GST-inclusive, counted once (ADR-2.7-028).
    amountPaise: buildLine(psuLine, snehaOrder.id).lineTotalPaise,
    status: "ATTRIBUTED" as const,
    voidedAt: null,
    ruleVersion: ATTRIBUTION_RULE_VERSION,
    createdAt: snehaOrder.paidAt ?? snehaOrder.placedAt,
  };
  await prisma.attributionRecord.upsert({ where: { id }, create: { id, ...data }, update: data });
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit trail (ADR-2.7-029)
//
// What the SYSTEM and the AI did — never what the customer did, which is what
// Event records. Append-only in production; the seed upserts by stable id.
// ─────────────────────────────────────────────────────────────────────────────

type SeedAudit = {
  id: string;
  type:
    | "AI_ACTION_GENERATED"
    | "AI_ACTION_VALIDATED"
    | "AI_ACTION_APPROVED"
    | "AI_ACTION_REJECTED"
    | "AI_ACTION_EXECUTED"
    | "POLICY_CHANGED"
    | "PAYMENT_CONFIRMED"
    | "ATTRIBUTION_CREATED";
  actorType: "SYSTEM" | "MERCHANT" | "AI_AGENT";
  actorId: string | null;
  createdAt: Date;
  decision?: string;
  aiActionId?: string;
  opportunityId?: string;
  orderId?: string;
  policyId?: string;
  attributionRecordId?: string;
  snapshot?: Prisma.InputJsonObject;
};

const AUDIT_ENTRIES: SeedAudit[] = [
  {
    id: "seed_aud_policy_maxdiscount",
    type: "POLICY_CHANGED",
    actorType: "MERCHANT",
    actorId: MERCHANT_ID,
    createdAt: at(-2),
    decision: "UPDATED",
    policyId: POLICY_MAX_DISCOUNT,
    snapshot: { field: "maxDiscountPercent", from: 15, to: 10, newVersion: 2 },
  },

  // Karthik — substitution generated, approved, executed, then dismissed.
  {
    id: "seed_aud_karthik_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(0, 6),
    decision: "ACT",
    aiActionId: ACT_KARTHIK_SUBST,
    opportunityId: OPP_KARTHIK_SUBST,
    snapshot: { actionType: "SUBSTITUTION", observedStockQuantity: 15, sourceOutOfStock: "seed_prod_vtx_rpd512" },
  },
  {
    id: "seed_aud_karthik_approved",
    type: "AI_ACTION_APPROVED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(0, 6),
    decision: "APPROVED",
    aiActionId: ACT_KARTHIK_SUBST,
    snapshot: { phase: "GENERATION", rulesEvaluated: 3 },
  },
  {
    id: "seed_aud_karthik_executed",
    type: "AI_ACTION_EXECUTED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(0, 7),
    decision: "EXECUTED",
    aiActionId: ACT_KARTHIK_SUBST,
    snapshot: { phase: "EXECUTION", revalidated: true, surface: "PRODUCT_DETAIL" },
  },
  {
    id: "seed_aud_karthik_payment",
    type: "PAYMENT_CONFIRMED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(0, 21),
    decision: "SUCCEEDED",
    orderId: "seed_order_karthik",
    snapshot: { provider: "RAZORPAY", amountPaise: 2_499_900, inventoryDecremented: true },
  },

  // Ananya — cross-sell generated, not yet validated.
  {
    id: "seed_aud_ananya_payment",
    type: "PAYMENT_CONFIRMED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(2, 13),
    decision: "SUCCEEDED",
    orderId: "seed_order_ananya",
    snapshot: { provider: "RAZORPAY", amountPaise: 1_149_900, inventoryDecremented: true },
  },
  {
    id: "seed_aud_ananya_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(2, 30),
    decision: "ACT",
    aiActionId: ACT_ANANYA_GENERATED,
    opportunityId: OPP_ANANYA_CROSSSELL,
    snapshot: { actionType: "CROSS_SELL", observedStockQuantity: 40 },
  },

  // Sneha — the complete loop, ending in an attribution record.
  {
    id: "seed_aud_sneha_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(3, 6),
    decision: "ACT",
    aiActionId: ACT_SNEHA_PSU,
    opportunityId: OPP_SNEHA_PSU,
    snapshot: { actionType: "CROSS_SELL", proposedDiscountPercent: 5, observedStockQuantity: 23 },
  },
  {
    id: "seed_aud_sneha_validated",
    type: "AI_ACTION_VALIDATED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(3, 6),
    decision: "PASSED",
    aiActionId: ACT_SNEHA_PSU,
    snapshot: { phase: "GENERATION", rulesEvaluated: 6 },
  },
  {
    id: "seed_aud_sneha_approved",
    type: "AI_ACTION_APPROVED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(3, 6),
    decision: "APPROVED",
    aiActionId: ACT_SNEHA_PSU,
    snapshot: { maxDiscountPercent: MAX_DISCOUNT_PERCENT, proposedDiscountPercent: 5 },
  },
  {
    id: "seed_aud_sneha_executed",
    type: "AI_ACTION_EXECUTED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(3, 7),
    decision: "EXECUTED",
    aiActionId: ACT_SNEHA_PSU,
    snapshot: { phase: "EXECUTION", revalidated: true, surface: "CART" },
  },
  {
    id: "seed_aud_sneha_payment",
    type: "PAYMENT_CONFIRMED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(3, 15),
    decision: "SUCCEEDED",
    orderId: "seed_order_sneha",
    snapshot: { provider: "RAZORPAY", amountPaise: 6_212_305, attemptsBeforeSuccess: 1, inventoryDecremented: true },
  },
  {
    id: "seed_aud_sneha_attribution",
    type: "ATTRIBUTION_CREATED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(3, 15),
    decision: "ATTRIBUTED",
    aiActionId: ACT_SNEHA_PSU,
    orderId: "seed_order_sneha",
    attributionRecordId: "seed_attr_sneha_psu",
    snapshot: {
      ruleVersion: ATTRIBUTION_RULE_VERSION,
      windowDays: 7,
      basis: "last-touch exposure via OFFER_VIEWED; target product present as an order line",
      note: "Attributed revenue is not incremental or causal revenue.",
    },
  },

  // Rahul — upsell executed; exposure happened but no order followed.
  {
    id: "seed_aud_rahul_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(4, 10),
    decision: "ACT",
    aiActionId: ACT_RAHUL_UPSELL,
    opportunityId: OPP_RAHUL_UPSELL,
    snapshot: { actionType: "UPSELL", observedStockQuantity: 9 },
  },
  {
    id: "seed_aud_rahul_approved",
    type: "AI_ACTION_APPROVED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(4, 10),
    decision: "APPROVED",
    aiActionId: ACT_RAHUL_UPSELL,
    snapshot: { phase: "GENERATION", rulesEvaluated: 4 },
  },
  {
    id: "seed_aud_rahul_executed",
    type: "AI_ACTION_EXECUTED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(4, 11),
    decision: "EXECUTED",
    aiActionId: ACT_RAHUL_UPSELL,
    snapshot: { phase: "EXECUTION", revalidated: true, surface: "PRODUCT_DETAIL" },
  },
  {
    id: "seed_aud_rahul_webcam_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(4, 20),
    decision: "ACT",
    aiActionId: ACT_RAHUL_VALIDATING,
    opportunityId: OPP_RAHUL_WEBCAM,
    snapshot: { actionType: "CROSS_SELL", observedStockQuantity: 12 },
  },

  // Priya — a NO_ACTION decision, and a rejection on merchant policy.
  {
    id: "seed_aud_priya_noaction",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(5, 12),
    decision: "NO_ACTION",
    aiActionId: ACT_PRIYA_NOACTION,
    opportunityId: OPP_PRIYA_CARTOPT,
    snapshot: { reason: "weak_intent", confidence: 0.31 },
  },
  {
    id: "seed_aud_priya_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(5, 41),
    decision: "ACT",
    aiActionId: ACT_PRIYA_REJECTED,
    opportunityId: OPP_PRIYA_ABANDONED,
    snapshot: { actionType: "ABANDONED_CHECKOUT_INTERVENTION", proposedDiscountPercent: 15 },
  },
  {
    id: "seed_aud_priya_rejected",
    type: "AI_ACTION_REJECTED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(5, 41),
    decision: "REJECTED",
    aiActionId: ACT_PRIYA_REJECTED,
    opportunityId: OPP_PRIYA_ABANDONED,
    policyId: POLICY_MAX_DISCOUNT,
    snapshot: {
      reason: "Proposed discount of 15% exceeds the merchant maximum of 10%.",
      policyType: "MAX_DISCOUNT",
      policyVersion: 2,
      proposedDiscountPercent: 15,
      maxDiscountPercent: MAX_DISCOUNT_PERCENT,
    },
  },

  // Karthik — monitor upsell approved but not yet shown.
  {
    id: "seed_aud_karthik_monitor_gen",
    type: "AI_ACTION_GENERATED",
    actorType: "AI_AGENT",
    actorId: "growth-agent",
    createdAt: at(1, 15),
    decision: "ACT",
    aiActionId: ACT_KARTHIK_APPROVED,
    opportunityId: OPP_KARTHIK_MONITOR,
    snapshot: { actionType: "UPSELL", observedStockQuantity: 4 },
  },
  {
    id: "seed_aud_karthik_monitor_approved",
    type: "AI_ACTION_APPROVED",
    actorType: "SYSTEM",
    actorId: null,
    createdAt: at(1, 15),
    decision: "APPROVED",
    aiActionId: ACT_KARTHIK_APPROVED,
    snapshot: { phase: "GENERATION", rulesEvaluated: 3, awaitingExposure: true },
  },
];

async function seedAudit() {
  for (const entry of AUDIT_ENTRIES) {
    const { id, ...rest } = entry;
    const data = {
      storeId: STORE_ID,
      ...rest,
      decision: rest.decision ?? null,
      aiActionId: rest.aiActionId ?? null,
      opportunityId: rest.opportunityId ?? null,
      orderId: rest.orderId ?? null,
      policyId: rest.policyId ?? null,
      attributionRecordId: rest.attributionRecordId ?? null,
      snapshot: rest.snapshot ?? Prisma.DbNull,
    };
    await prisma.auditEntry.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalog-depth stores (ADR-2.8-010)
//
// Daily Dairy, Fresh Harvest and Copper & Clay. Each is a complete, isolated
// tenant — merchant, store, catalogue, customers, sessions and a couple of PAID
// orders — but none carries the growth loop. They exist to prove tenancy and
// catalogue generality, not to repeat the electronics demo three more times.
//
// Their data lives in prisma/seed-data/*.ts; this is the writer.
// ─────────────────────────────────────────────────────────────────────────────

const CATALOG_STORES: CatalogStoreSeed[] = [dairyStore, produceStore, utensilsStore];

/**
 * The baseline policy set every store is provisioned with (ADR-2.8-008).
 *
 * An absent Policy applies no constraint, so a store with no rows would run its
 * guardrail engine permissively. Seeding these three means no store is
 * unconstrained in practice, without pretending the merchant configured rules
 * they never saw.
 */
function baselinePolicies(storeKey: string) {
  return [
    {
      id: `${storeKey}_policy_max_discount`,
      type: "MAX_DISCOUNT" as const,
      scope: {
        actionTypes: ["PERSONALIZED_OFFER", "CROSS_SELL", "UPSELL", "ABANDONED_CHECKOUT_INTERVENTION"],
      },
      value: { maxDiscountPercent: 10 },
    },
    {
      id: `${storeKey}_policy_frequency_limit`,
      type: "FREQUENCY_LIMIT" as const,
      scope: { bucket: "hour" },
      value: { maxActionsPerCustomerPerBucket: 1 },
    },
    {
      id: `${storeKey}_policy_inventory_requirement`,
      type: "INVENTORY_REQUIREMENT" as const,
      scope: { appliesTo: "allActionTypes" },
      value: { minStockQuantity: 3 },
    },
  ];
}

async function seedCatalogStore(seed: CatalogStoreSeed) {
  const storeId = seed.store.id;

  // ── Identity ──
  const merchant = { email: seed.merchant.email, name: seed.merchant.name };
  await prisma.merchant.upsert({
    where: { id: seed.merchant.id },
    create: { id: seed.merchant.id, ...merchant },
    update: merchant,
  });

  const store = {
    name: seed.store.name,
    slug: seed.store.slug,
    merchantId: seed.merchant.id,
    defaultLowStockThreshold: seed.store.defaultLowStockThreshold,
  };
  await prisma.store.upsert({
    where: { id: storeId },
    create: { id: storeId, ...store },
    update: store,
  });

  // ── Catalogue ──
  for (const brand of seed.brands) {
    const data = { storeId, name: brand.name, slug: brand.slug, isActive: true };
    await prisma.brand.upsert({ where: { id: brand.id }, create: { id: brand.id, ...data }, update: data });
  }

  for (const category of seed.categories) {
    const data = {
      storeId,
      name: category.name,
      slug: category.slug,
      position: category.position,
      isActive: true,
    };
    await prisma.category.upsert({
      where: { id: category.id },
      create: { id: category.id, ...data },
      update: data,
    });
  }

  for (const sub of seed.subcategories) {
    const data = {
      storeId,
      categoryId: sub.categoryId,
      name: sub.name,
      slug: sub.slug,
      position: sub.position,
      isActive: true,
    };
    await prisma.subcategory.upsert({ where: { id: sub.id }, create: { id: sub.id, ...data }, update: data });
  }

  for (const product of seed.products) {
    // The seed writes Products directly rather than through createProduct(),
    // which would reject anything but DRAFT. Running the specs through the same
    // registry the domain service uses keeps that shortcut honest: a category
    // whose schema was never registered fails here, loudly, instead of silently
    // rejecting specs the first time a merchant edits the product
    // (ADR-2.8-005, PRD-13).
    const specsResult = validateProductSpecs(
      product.categoryId,
      product.subcategoryId,
      product.specs,
    );
    if (!specsResult.ok) {
      throw new Error(
        `[${seed.key}] specs rejected for ${product.id} ` +
          `(${product.categoryId} / ${product.subcategoryId ?? "no subcategory"}): ` +
          `${specsResult.message} at ${specsResult.field}`,
      );
    }

    const { id, imageAlt, ...rest } = product;
    const data = { storeId, ...rest };
    await prisma.product.upsert({ where: { id }, create: { id, ...data }, update: data });

    const imageId = `${id}_img0`;
    const image = {
      productId: id,
      url: `/products/${product.slug}.jpg`,
      altText: imageAlt,
      position: 0,
    };
    await prisma.productImage.upsert({
      where: { id: imageId },
      create: { id: imageId, ...image },
      update: image,
    });
  }

  // ── Merchant guardrails ──
  for (const policy of baselinePolicies(seed.key)) {
    const data = {
      storeId,
      type: policy.type,
      enabled: true,
      scope: policy.scope,
      value: policy.value,
      version: 1,
      effectiveFrom: at(-30),
    };
    await prisma.policy.upsert({
      where: { id: policy.id },
      create: { id: policy.id, ...data },
      update: data,
    });
  }

  // ── Customers and sessions ──
  for (const customer of seed.customers) {
    const { id, ...rest } = customer;
    const data = { storeId, ...rest };
    await prisma.customer.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const session of seed.sessions) {
    const startedAt = at(session.day, session.minutes);
    const data = {
      storeId,
      anonymousId: session.anonymousId,
      customerId: session.customerId,
      startedAt,
      // Session end is DERIVED, never stored: these sessions are long past the
      // 30-minute inactivity window, so they read as ENDED without an
      // endedAt (ADR-2.7-008). endedAt stays null because nobody logged out.
      lastActivityAt: at(session.day, session.minutes + session.durationMinutes),
      endedAt: null,
    };
    await prisma.session.upsert({
      where: { id: session.id },
      create: { id: session.id, ...data },
      update: data,
    });
  }

  // ── Orders, payments and the server-emitted PURCHASE ──
  const productsById = new Map(seed.products.map((p) => [p.id, p]));

  for (const order of seed.orders) {
    const placedAt = at(order.day, order.minutes);
    // Payment lands a couple of minutes after checkout starts.
    const paidAt = at(order.day, order.minutes + 2);

    const lines = order.lines.map((line) => {
      const product = productsById.get(line.productId);
      if (!product) {
        throw new Error(`[${seed.key}] order ${order.id} references unknown product ${line.productId}`);
      }
      // OrderItem is a historical snapshot and must not read through to
      // Product at runtime (CO-8, CO-9). Copying the current price here is
      // sound only because the seed is constructing a past in which the price
      // has not moved since.
      return {
        product,
        quantity: line.quantity,
        unitPricePaise: product.sellingPricePaise,
        lineTotalPaise: product.sellingPricePaise * line.quantity,
      };
    });

    const orderValuePaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);

    const orderData = {
      storeId,
      customerId: order.customerId,
      // No Cart: these stores stop short of the cart slice (ADR-2.8-010), and
      // Order.cartId is nullable precisely because an Order can stand alone.
      cartId: null,
      status: "PAID" as const,
      idempotencyKey: order.idempotencyKey,
      placedAt,
      paidAt,
      cancelledAt: null,
    };
    await prisma.order.upsert({
      where: { id: order.id },
      create: { id: order.id, ...orderData },
      update: orderData,
    });

    for (const [index, line] of lines.entries()) {
      const itemId = `${order.id}_item${index}`;
      const itemData = {
        storeId,
        orderId: order.id,
        productId: line.product.id,
        productName: line.product.name,
        sku: line.product.sku,
        unitPricePaise: line.unitPricePaise,
        quantity: line.quantity,
        discountPaise: 0,
        lineTotalPaise: line.lineTotalPaise,
        // Null, deliberately. GST rates are not modelled (ADR-2.8-009) and
        // ADR-2.7-017 allows taxPaise to stay null until line tax is known.
        // The electronics store records it because 18% is uniform there.
        taxPaise: null,
        appliedOfferId: null,
        appliedActionId: null,
        createdAt: placedAt,
      };
      await prisma.orderItem.upsert({
        where: { id: itemId },
        create: { id: itemId, ...itemData },
        update: itemData,
      });
    }

    const attemptId = `${order.id}_pay0`;
    const attemptData = {
      storeId,
      orderId: order.id,
      status: "SUCCEEDED" as const,
      // Payment amount equals Order Value; they are separate facts that happen
      // to agree here (ADR-2.7-022).
      amountPaise: orderValuePaise,
      provider: "RAZORPAY" as const,
      providerOrderId: order.providerOrderId,
      providerPaymentId: order.providerPaymentId,
      providerEventId: `evt_${order.providerPaymentId}`,
      idempotencyKey: `${order.idempotencyKey}-pay`,
      failureReason: null,
      createdAt: placedAt,
    };
    await prisma.paymentAttempt.upsert({
      where: { id: attemptId },
      create: { id: attemptId, ...attemptData },
      update: attemptData,
    });

    // PURCHASE is SERVER_BUSINESS: emitted only after the Order reached PAID,
    // never submitted by a client (ADR-2.7-011). It always references its Order.
    const eventId = `${order.id}_purchase`;
    const eventData = {
      storeId,
      sessionId: order.sessionId,
      type: "PURCHASE" as const,
      receivedAt: paidAt,
      // No clientOccurredAt: the server emitted this, so there is no client
      // claim to retain.
      clientOccurredAt: null,
      payload: {
        orderId: order.id,
        orderValuePaise,
        itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      },
      clientEventId: null,
      orderId: order.id,
      aiActionId: null,
    };
    await prisma.event.upsert({
      where: { id: eventId },
      create: { id: eventId, ...eventData },
      update: eventData,
    });
  }
}

async function seedCatalogStores() {
  for (const store of CATALOG_STORES) {
    await seedCatalogStore(store);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestration
//
// Order matters: a row is only written once everything it references exists.
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding The Next Gen Store — timeline starts ${TIMELINE_START.toISOString()}`);

  await seedStore();
  await seedCatalogue();
  await seedPolicies();
  await seedCustomersAndSessions();
  await seedCarts();
  await seedOpportunities();
  await seedAiActions();
  await seedGuardrails();
  await seedOrders();
  await seedPayments();
  await seedEvents();
  await seedAttribution();
  await seedAudit();

  // The other three merchants, catalog-depth only (ADR-2.8-001 / 010).
  await seedCatalogStores();

  const counts = {
    merchants: await prisma.merchant.count(),
    stores: await prisma.store.count(),
    brands: await prisma.brand.count(),
    categories: await prisma.category.count(),
    subcategories: await prisma.subcategory.count(),
    products: await prisma.product.count(),
    productImages: await prisma.productImage.count(),
    customers: await prisma.customer.count(),
    sessions: await prisma.session.count(),
    events: await prisma.event.count(),
    carts: await prisma.cart.count(),
    cartItems: await prisma.cartItem.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    paymentAttempts: await prisma.paymentAttempt.count(),
    policies: await prisma.policy.count(),
    opportunities: await prisma.opportunity.count(),
    aiActions: await prisma.aiAction.count(),
    guardrailEvaluations: await prisma.guardrailEvaluation.count(),
    frequencyLedgerEntries: await prisma.frequencyLedgerEntry.count(),
    attributionRecords: await prisma.attributionRecord.count(),
    auditEntries: await prisma.auditEntry.count(),
  };

  console.log("\nSeed complete. Row counts:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(24)} ${count}`);
  }

  // Per-store breakdown. Every storefront resolves at /s/<slug> (ADR-2.8-002),
  // and only the electronics store carries AI actions (ADR-2.8-010).
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: true, customers: true, orders: true, aiActions: true } },
    },
  });

  console.log("\nStores:");
  for (const store of stores) {
    const c = store._count;
    console.log(
      `  ${store.name.padEnd(19)} /s/${store.slug.padEnd(21)}` +
        `${String(c.products).padStart(3)} products ` +
        `${String(c.customers).padStart(2)} customers ` +
        `${String(c.orders).padStart(2)} orders ` +
        `${String(c.aiActions).padStart(2)} AI actions`,
    );
  }
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
