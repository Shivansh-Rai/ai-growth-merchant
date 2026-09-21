/**
 * Copper & Clay — catalog-depth store (ADR-2.8-010).
 *
 * Durable goods, so this store looks the most like the electronics one:
 * branded, spec-heavy, slow-moving stock with low thresholds. It is here to
 * prove the catalogue is genuinely domain-agnostic (ADR-2.8-004) rather than
 * electronics-shaped with different labels.
 *
 * It also carries the deepest subcategory usage of the three catalog-depth
 * stores, which keeps the two-level hierarchy (catalog 7) exercised.
 */

import type { CatalogStoreSeed } from "./types";

const CAT_COOKWARE = "utensils_cat_cookware";
const CAT_SERVEWARE = "utensils_cat_serveware";
const CAT_STORAGE = "utensils_cat_storage";
const CAT_BAKEWARE = "utensils_cat_bakeware";

const SUB_KADHAI = "utensils_sub_kadhai";
const SUB_TAWA = "utensils_sub_tawa";
const SUB_COOKERS = "utensils_sub_cookers";

const BRAND_TAMRAKAR = "utensils_brand_tamrakar";
const BRAND_HEARTH = "utensils_brand_hearth_home";
const BRAND_RASOI = "utensils_brand_rasoi_works";

export const utensilsStore: CatalogStoreSeed = {
  key: "utensils",

  merchant: {
    id: "utensils_merchant_farida",
    email: "farida.contractor@copperandclay.test",
    name: "Farida Contractor",
  },

  store: {
    id: "utensils_store_copper",
    name: "Copper & Clay",
    slug: "copper-and-clay",
    // Durable goods turn over slowly; a low count is not an emergency.
    defaultLowStockThreshold: 3,
  },

  brands: [
    { id: BRAND_TAMRAKAR, name: "Tamrakar", slug: "tamrakar" },
    { id: BRAND_HEARTH, name: "Hearth & Home", slug: "hearth-home" },
    { id: BRAND_RASOI, name: "Rasoi Works", slug: "rasoi-works" },
  ],

  categories: [
    { id: CAT_COOKWARE, name: "Cookware", slug: "cookware", position: 0 },
    { id: CAT_SERVEWARE, name: "Serveware", slug: "serveware", position: 1 },
    { id: CAT_STORAGE, name: "Storage", slug: "storage", position: 2 },
    { id: CAT_BAKEWARE, name: "Bakeware", slug: "bakeware", position: 3 },
  ],

  subcategories: [
    { id: SUB_KADHAI, categoryId: CAT_COOKWARE, name: "Kadhai & Woks", slug: "kadhai-woks", position: 0 },
    { id: SUB_TAWA, categoryId: CAT_COOKWARE, name: "Tawa & Griddles", slug: "tawa-griddles", position: 1 },
    { id: SUB_COOKERS, categoryId: CAT_COOKWARE, name: "Pressure Cookers", slug: "pressure-cookers", position: 2 },
  ],

  products: [
    {
      id: "utensils_prod_kadhai_2l",
      name: "Rasoi Works Triply Kadhai 2 L",
      slug: "rasoi-works-triply-kadhai-2l",
      sku: "CC-CKW-KDH-2000",
      description:
        "Three-ply stainless steel kadhai with an aluminium core, 2 litre capacity, induction ready.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_RASOI,
      categoryId: CAT_COOKWARE,
      subcategoryId: SUB_KADHAI,
      mrpPaise: 189000,
      sellingPricePaise: 169000,
      costPricePaise: 122000,
      stockQuantity: 14,
      lowStockThreshold: null,
      specs: {
        capacityLitres: 2,
        diameterCm: 24,
        material: "Triply stainless steel",
        induction: true,
        dishwasherSafe: true,
      },
      imageAlt: "Rasoi Works triply stainless steel kadhai, 2 litre",
    },
    {
      id: "utensils_prod_kadhai_3l",
      name: "Rasoi Works Triply Kadhai 3 L",
      slug: "rasoi-works-triply-kadhai-3l",
      sku: "CC-CKW-KDH-3000",
      description:
        "Three-ply stainless steel kadhai with an aluminium core, 3 litre capacity, induction ready.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_RASOI,
      categoryId: CAT_COOKWARE,
      subcategoryId: SUB_KADHAI,
      mrpPaise: 239000,
      sellingPricePaise: 214000,
      costPricePaise: 158000,
      stockQuantity: 2,
      lowStockThreshold: null,
      specs: {
        capacityLitres: 3,
        diameterCm: 28,
        material: "Triply stainless steel",
        induction: true,
        dishwasherSafe: true,
      },
      imageAlt: "Rasoi Works triply stainless steel kadhai, 3 litre",
    },
    {
      id: "utensils_prod_tawa_26",
      name: "Hearth & Home Cast Iron Tawa 26 cm",
      slug: "hearth-home-cast-iron-tawa-26cm",
      sku: "CC-CKW-TWA-260",
      description:
        "Pre-seasoned cast iron tawa, 26 cm, with a forged handle. Improves with use.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_HEARTH,
      categoryId: CAT_COOKWARE,
      subcategoryId: SUB_TAWA,
      mrpPaise: 115000,
      sellingPricePaise: 99000,
      costPricePaise: 68000,
      stockQuantity: 21,
      lowStockThreshold: null,
      specs: {
        diameterCm: 26,
        material: "Cast iron",
        induction: true,
        dishwasherSafe: false,
        weightGrams: 2100,
      },
      imageAlt: "Hearth and Home pre-seasoned cast iron tawa, 26 centimetre",
    },
    {
      id: "utensils_prod_cooker_3l",
      name: "Rasoi Works Hard Anodised Pressure Cooker 3 L",
      slug: "rasoi-works-pressure-cooker-3l",
      sku: "CC-CKW-PCK-3000",
      description:
        "Hard anodised outer-lid pressure cooker, 3 litre, with a metallic safety plug.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_RASOI,
      categoryId: CAT_COOKWARE,
      subcategoryId: SUB_COOKERS,
      mrpPaise: 245000,
      sellingPricePaise: 219000,
      costPricePaise: 163000,
      stockQuantity: 9,
      lowStockThreshold: null,
      specs: {
        capacityLitres: 3,
        material: "Hard anodised aluminium",
        induction: true,
        dishwasherSafe: false,
        lidType: "Outer lid",
      },
      imageAlt: "Rasoi Works hard anodised pressure cooker, 3 litre",
    },
    {
      id: "utensils_prod_cooker_5l",
      name: "Rasoi Works Hard Anodised Pressure Cooker 5 L",
      slug: "rasoi-works-pressure-cooker-5l",
      sku: "CC-CKW-PCK-5000",
      description:
        "Hard anodised outer-lid pressure cooker, 5 litre, with a metallic safety plug.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_RASOI,
      categoryId: CAT_COOKWARE,
      subcategoryId: SUB_COOKERS,
      mrpPaise: 309000,
      sellingPricePaise: 279000,
      costPricePaise: 208000,
      stockQuantity: 0,
      lowStockThreshold: null,
      specs: {
        capacityLitres: 5,
        material: "Hard anodised aluminium",
        induction: true,
        dishwasherSafe: false,
        lidType: "Outer lid",
      },
      imageAlt: "Rasoi Works hard anodised pressure cooker, 5 litre",
    },
    {
      id: "utensils_prod_copper_bottle",
      name: "Tamrakar Copper Water Bottle 950 ml",
      slug: "tamrakar-copper-water-bottle-950ml",
      sku: "CC-SRV-CWB-950",
      description:
        "Seamless hammered copper bottle, 950 ml, with a leak-resistant threaded cap.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_TAMRAKAR,
      categoryId: CAT_SERVEWARE,
      subcategoryId: null,
      mrpPaise: 99000,
      sellingPricePaise: 89900,
      costPricePaise: 61000,
      stockQuantity: 37,
      lowStockThreshold: 8,
      specs: { capacityMl: 950, material: "Copper", pieceCount: 1, dishwasherSafe: false },
      imageAlt: "Tamrakar hammered copper water bottle, 950 millilitre",
    },
    {
      id: "utensils_prod_dinner_set_18",
      name: "Hearth & Home Steel Dinner Set 18 pc",
      slug: "hearth-home-steel-dinner-set-18pc",
      sku: "CC-SRV-DNR-18",
      description:
        "Eighteen-piece stainless steel dinner set: plates, bowls, tumblers and serving spoons.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_HEARTH,
      categoryId: CAT_SERVEWARE,
      subcategoryId: null,
      mrpPaise: 389000,
      sellingPricePaise: 349000,
      costPricePaise: 256000,
      stockQuantity: 6,
      lowStockThreshold: null,
      specs: { material: "Stainless steel", pieceCount: 18, dishwasherSafe: true },
      imageAlt: "Hearth and Home eighteen piece stainless steel dinner set",
    },
    {
      id: "utensils_prod_brass_bowl",
      name: "Tamrakar Brass Serving Bowl 600 ml",
      slug: "tamrakar-brass-serving-bowl-600ml",
      sku: "CC-SRV-BRB-600",
      description: "Hand-spun brass serving bowl with a food-safe tin lining, 600 ml.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_TAMRAKAR,
      categoryId: CAT_SERVEWARE,
      subcategoryId: null,
      mrpPaise: 139000,
      sellingPricePaise: 129000,
      // Bought from a small workshop at varying rates; not recorded (PRD-5).
      costPricePaise: null,
      stockQuantity: 12,
      lowStockThreshold: null,
      specs: { capacityMl: 600, material: "Brass", pieceCount: 1, dishwasherSafe: false },
      imageAlt: "Tamrakar hand-spun brass serving bowl, 600 millilitre",
    },
    {
      id: "utensils_prod_container_1500",
      name: "Rasoi Works Airtight Steel Container 1.5 L",
      slug: "rasoi-works-airtight-container-1500ml",
      sku: "CC-STO-ATC-1500",
      description: "Airtight stainless steel container with a silicone gasket lid, 1.5 litre.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_RASOI,
      categoryId: CAT_STORAGE,
      subcategoryId: null,
      mrpPaise: 59000,
      sellingPricePaise: 54900,
      costPricePaise: 38000,
      stockQuantity: 48,
      lowStockThreshold: 10,
      specs: { capacityMl: 1500, material: "Stainless steel", pieceCount: 1, airtight: true },
      imageAlt: "Rasoi Works airtight stainless steel container, 1.5 litre",
    },
    {
      id: "utensils_prod_container_set_3",
      name: "Rasoi Works Steel Container Set 3 pc",
      slug: "rasoi-works-steel-container-set-3pc",
      sku: "CC-STO-ATC-SET3",
      description: "Three nesting airtight containers: 500 ml, 1 L and 1.5 L.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_RASOI,
      categoryId: CAT_STORAGE,
      subcategoryId: null,
      mrpPaise: 129000,
      sellingPricePaise: 119000,
      costPricePaise: 84000,
      stockQuantity: 23,
      lowStockThreshold: null,
      specs: { capacityMl: 3000, material: "Stainless steel", pieceCount: 3, airtight: true },
      imageAlt: "Rasoi Works three piece nesting airtight steel container set",
    },
    {
      id: "utensils_prod_cake_tin_20",
      name: "Hearth & Home Non-stick Cake Tin 20 cm",
      slug: "hearth-home-non-stick-cake-tin-20cm",
      sku: "CC-BKW-CKT-200",
      description: "Round non-stick cake tin, 20 cm, with a loose base.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_HEARTH,
      categoryId: CAT_BAKEWARE,
      subcategoryId: null,
      mrpPaise: 79000,
      sellingPricePaise: 74000,
      costPricePaise: 51000,
      stockQuantity: 19,
      lowStockThreshold: null,
      specs: { diameterCm: 20, material: "Non-stick carbon steel", pieceCount: 1, ovenSafe: true },
      imageAlt: "Hearth and Home non-stick round cake tin, 20 centimetre",
    },
    {
      id: "utensils_prod_muffin_tray_12",
      name: "Hearth & Home Silicone Muffin Tray 12 cup",
      slug: "hearth-home-silicone-muffin-tray-12cup",
      sku: "CC-BKW-MFT-12",
      description: "Flexible food-grade silicone muffin tray, twelve cups.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_HEARTH,
      categoryId: CAT_BAKEWARE,
      subcategoryId: null,
      mrpPaise: 55000,
      sellingPricePaise: 52000,
      costPricePaise: 34000,
      stockQuantity: 31,
      lowStockThreshold: null,
      specs: { material: "Silicone", pieceCount: 12, ovenSafe: true, dishwasherSafe: true },
      imageAlt: "Hearth and Home twelve cup silicone muffin tray",
    },
    {
      id: "utensils_prod_clay_handi",
      name: "Tamrakar Clay Handi 2 L",
      slug: "tamrakar-clay-handi-2l",
      sku: "CC-CKW-CLH-2000",
      description:
        "Unglazed terracotta handi, 2 litre, for slow cooking. New line, still being photographed.",
      // DRAFT: being prepared, invisible to customers (catalog 6).
      lifecycleStatus: "DRAFT",
      brandId: BRAND_TAMRAKAR,
      categoryId: CAT_COOKWARE,
      subcategoryId: SUB_KADHAI,
      mrpPaise: 68000,
      sellingPricePaise: 68000,
      costPricePaise: 44000,
      stockQuantity: 15,
      lowStockThreshold: null,
      specs: {
        capacityLitres: 2,
        diameterCm: 22,
        material: "Terracotta",
        induction: false,
        dishwasherSafe: false,
      },
      imageAlt: "Tamrakar unglazed terracotta clay handi, 2 litre",
    },
  ],

  customers: [
    {
      id: "utensils_cust_vikram",
      email: "vikram.desai@example.test",
      name: "Vikram Desai",
      phone: "+919730055667",
    },
    {
      id: "utensils_cust_leela",
      email: "leela.krishnan@example.test",
      name: "Leela Krishnan",
      phone: "+919730077889",
    },
  ],

  sessions: [
    {
      id: "utensils_sess_vikram_1",
      anonymousId: "utensils-anon-vikram-2e55b0fa",
      customerId: "utensils_cust_vikram",
      day: 3,
      minutes: 45,
      durationMinutes: 26,
    },
    {
      id: "utensils_sess_leela_1",
      anonymousId: "utensils-anon-leela-7d41c682",
      customerId: "utensils_cust_leela",
      day: 5,
      minutes: 140,
      durationMinutes: 18,
    },
  ],

  orders: [
    {
      id: "utensils_order_vikram_1",
      customerId: "utensils_cust_vikram",
      sessionId: "utensils_sess_vikram_1",
      idempotencyKey: "utensils-checkout-vikram-0001",
      day: 3,
      minutes: 68,
      lines: [
        { productId: "utensils_prod_kadhai_2l", quantity: 1 },
        { productId: "utensils_prod_tawa_26", quantity: 1 },
      ],
      providerOrderId: "order_CCVikram0001",
      providerPaymentId: "pay_CCVikram0001",
    },
    {
      id: "utensils_order_leela_1",
      customerId: "utensils_cust_leela",
      sessionId: "utensils_sess_leela_1",
      idempotencyKey: "utensils-checkout-leela-0001",
      day: 5,
      minutes: 156,
      lines: [
        { productId: "utensils_prod_dinner_set_18", quantity: 1 },
        { productId: "utensils_prod_container_set_3", quantity: 2 },
        { productId: "utensils_prod_copper_bottle", quantity: 1 },
      ],
      providerOrderId: "order_CCLeela0001",
      providerPaymentId: "pay_CCLeela0001",
    },
  ],
};
