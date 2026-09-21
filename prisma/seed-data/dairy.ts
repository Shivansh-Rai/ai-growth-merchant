/**
 * Daily Dairy — catalog-depth store (ADR-2.8-010).
 *
 * This store is the clearest demonstration of ADR-2.8-004: milk is sold by
 * volume in the real world, but "Toned Milk 500 ml" and "Toned Milk 1 L" are
 * TWO Products with two SKUs, not one product with a unit of measure.
 * `stockQuantity` counts packs.
 *
 * GST on most dairy staples is 0-5%, unlike the 18% on electronics. The MVP
 * does not model GST rates (ADR-2.8-009), so prices are simply GST-inclusive
 * as recorded and OrderItem.taxPaise stays null — which is exactly what
 * ADR-2.7-017 permits ("nullable until line tax is known").
 */

import type { CatalogStoreSeed } from "./types";

const CAT_MILK = "dairy_cat_milk";
const CAT_CURD = "dairy_cat_curd";
const CAT_BUTTER_GHEE = "dairy_cat_butter_ghee";
const CAT_PANEER_CHEESE = "dairy_cat_paneer_cheese";

const SUB_TONED = "dairy_sub_toned";
const SUB_FULL_CREAM = "dairy_sub_full_cream";

const BRAND_ANANDAM = "dairy_brand_anandam";
const BRAND_GOKULAM = "dairy_brand_gokulam";
const BRAND_VRAJ = "dairy_brand_vraj";

export const dairyStore: CatalogStoreSeed = {
  key: "dairy",

  merchant: {
    id: "dairy_merchant_meera",
    email: "meera.iyer@dailydairy.test",
    name: "Meera Iyer",
  },

  store: {
    id: "dairy_store_daily",
    name: "Daily Dairy",
    slug: "daily-dairy",
    // Dairy moves fast and spoils; "low" sits higher than it does for hardware.
    defaultLowStockThreshold: 12,
  },

  brands: [
    { id: BRAND_ANANDAM, name: "Anandam", slug: "anandam" },
    { id: BRAND_GOKULAM, name: "Gokulam Farms", slug: "gokulam-farms" },
    { id: BRAND_VRAJ, name: "Vraj", slug: "vraj" },
  ],

  categories: [
    { id: CAT_MILK, name: "Milk", slug: "milk", position: 0 },
    { id: CAT_CURD, name: "Curd & Yoghurt", slug: "curd-yoghurt", position: 1 },
    { id: CAT_BUTTER_GHEE, name: "Butter & Ghee", slug: "butter-ghee", position: 2 },
    { id: CAT_PANEER_CHEESE, name: "Paneer & Cheese", slug: "paneer-cheese", position: 3 },
  ],

  subcategories: [
    { id: SUB_TONED, categoryId: CAT_MILK, name: "Toned", slug: "toned", position: 0 },
    { id: SUB_FULL_CREAM, categoryId: CAT_MILK, name: "Full Cream", slug: "full-cream", position: 1 },
  ],

  products: [
    {
      id: "dairy_prod_toned_500",
      name: "Anandam Toned Milk 500 ml",
      slug: "anandam-toned-milk-500ml",
      sku: "DD-MLK-TON-500",
      description:
        "Pasteurised toned milk in a 500 ml pouch. Delivered chilled each morning.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_ANANDAM,
      categoryId: CAT_MILK,
      subcategoryId: SUB_TONED,
      mrpPaise: 2700,
      sellingPricePaise: 2700,
      costPricePaise: 2260,
      stockQuantity: 148,
      lowStockThreshold: 40,
      specs: { volumeMl: 500, fatPercent: 3, pasteurised: true, shelfLifeDays: 2 },
      imageAlt: "Anandam toned milk 500 ml pouch",
    },
    {
      // The same milk in a different pack is a DIFFERENT Product (ADR-2.8-004).
      id: "dairy_prod_toned_1l",
      name: "Anandam Toned Milk 1 L",
      slug: "anandam-toned-milk-1l",
      sku: "DD-MLK-TON-1000",
      description:
        "Pasteurised toned milk in a 1 litre pouch. Better value per litre than the 500 ml pack.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_ANANDAM,
      categoryId: CAT_MILK,
      subcategoryId: SUB_TONED,
      mrpPaise: 5400,
      sellingPricePaise: 5200,
      costPricePaise: 4450,
      stockQuantity: 96,
      lowStockThreshold: 30,
      specs: { volumeMl: 1000, fatPercent: 3, pasteurised: true, shelfLifeDays: 2 },
      imageAlt: "Anandam toned milk 1 litre pouch",
    },
    {
      id: "dairy_prod_full_500",
      name: "Gokulam Full Cream Milk 500 ml",
      slug: "gokulam-full-cream-milk-500ml",
      sku: "DD-MLK-FC-500",
      description: "Full cream milk, 6% fat, in a 500 ml pouch.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_GOKULAM,
      categoryId: CAT_MILK,
      subcategoryId: SUB_FULL_CREAM,
      mrpPaise: 3500,
      sellingPricePaise: 3500,
      costPricePaise: 2950,
      stockQuantity: 72,
      lowStockThreshold: 25,
      specs: { volumeMl: 500, fatPercent: 6, pasteurised: true, shelfLifeDays: 2 },
      imageAlt: "Gokulam full cream milk 500 ml pouch",
    },
    {
      id: "dairy_prod_full_1l",
      name: "Gokulam Full Cream Milk 1 L",
      slug: "gokulam-full-cream-milk-1l",
      sku: "DD-MLK-FC-1000",
      description: "Full cream milk, 6% fat, in a 1 litre pouch.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_GOKULAM,
      categoryId: CAT_MILK,
      subcategoryId: SUB_FULL_CREAM,
      mrpPaise: 6900,
      sellingPricePaise: 6700,
      costPricePaise: 5800,
      // Below threshold — availability derives to LOW_STOCK (PRD-8).
      stockQuantity: 9,
      lowStockThreshold: 25,
      specs: { volumeMl: 1000, fatPercent: 6, pasteurised: true, shelfLifeDays: 2 },
      imageAlt: "Gokulam full cream milk 1 litre pouch",
    },
    {
      id: "dairy_prod_curd_400",
      name: "Anandam Fresh Curd 400 g",
      slug: "anandam-fresh-curd-400g",
      sku: "DD-CRD-400",
      description: "Set curd in a 400 g cup. Thick, mildly sour, no added starch.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_ANANDAM,
      categoryId: CAT_CURD,
      subcategoryId: null,
      mrpPaise: 4000,
      sellingPricePaise: 3800,
      costPricePaise: 3100,
      stockQuantity: 64,
      // Falls back to Store.defaultLowStockThreshold (catalog 5.2).
      lowStockThreshold: null,
      specs: { netWeightGrams: 400, fatPercent: 4, probiotic: false, shelfLifeDays: 4 },
      imageAlt: "Anandam fresh curd 400 gram cup",
    },
    {
      id: "dairy_prod_curd_1kg",
      name: "Anandam Fresh Curd 1 kg",
      slug: "anandam-fresh-curd-1kg",
      sku: "DD-CRD-1000",
      description: "Set curd in a 1 kg family tub.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_ANANDAM,
      categoryId: CAT_CURD,
      subcategoryId: null,
      mrpPaise: 9500,
      sellingPricePaise: 9000,
      costPricePaise: 7400,
      stockQuantity: 38,
      lowStockThreshold: null,
      specs: { netWeightGrams: 1000, fatPercent: 4, probiotic: false, shelfLifeDays: 4 },
      imageAlt: "Anandam fresh curd 1 kilogram tub",
    },
    {
      id: "dairy_prod_greek_100",
      name: "Vraj Greek Yoghurt 100 g",
      slug: "vraj-greek-yoghurt-100g",
      sku: "DD-YOG-GRK-100",
      description: "Strained Greek yoghurt, 10 g protein per cup, live cultures.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_VRAJ,
      categoryId: CAT_CURD,
      subcategoryId: null,
      mrpPaise: 5000,
      sellingPricePaise: 4500,
      costPricePaise: 3600,
      stockQuantity: 51,
      lowStockThreshold: null,
      specs: { netWeightGrams: 100, fatPercent: 5, probiotic: true, shelfLifeDays: 12 },
      imageAlt: "Vraj Greek yoghurt 100 gram cup",
    },
    {
      id: "dairy_prod_butter_100",
      name: "Gokulam Table Butter 100 g",
      slug: "gokulam-table-butter-100g",
      sku: "DD-BTR-100",
      description: "Salted table butter in a 100 g block.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_GOKULAM,
      categoryId: CAT_BUTTER_GHEE,
      subcategoryId: null,
      mrpPaise: 6200,
      sellingPricePaise: 6200,
      costPricePaise: 5150,
      stockQuantity: 87,
      lowStockThreshold: null,
      specs: { netWeightGrams: 100, salted: true, variant: "Table butter", shelfLifeDays: 120 },
      imageAlt: "Gokulam salted table butter 100 gram block",
    },
    {
      id: "dairy_prod_butter_500",
      name: "Gokulam Table Butter 500 g",
      slug: "gokulam-table-butter-500g",
      sku: "DD-BTR-500",
      description: "Salted table butter in a 500 g block.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_GOKULAM,
      categoryId: CAT_BUTTER_GHEE,
      subcategoryId: null,
      mrpPaise: 28500,
      sellingPricePaise: 27500,
      costPricePaise: 23000,
      stockQuantity: 29,
      lowStockThreshold: null,
      specs: { netWeightGrams: 500, salted: true, variant: "Table butter", shelfLifeDays: 120 },
      imageAlt: "Gokulam salted table butter 500 gram block",
    },
    {
      id: "dairy_prod_ghee_500",
      name: "Vraj Cow Ghee 500 ml",
      slug: "vraj-cow-ghee-500ml",
      sku: "DD-GHE-500",
      description: "Granular cow ghee made by the bilona method, in a 500 ml glass jar.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_VRAJ,
      categoryId: CAT_BUTTER_GHEE,
      subcategoryId: null,
      mrpPaise: 34000,
      sellingPricePaise: 32500,
      // Cost not recorded — profit and margin are UNAVAILABLE, never zero (PRD-5).
      costPricePaise: null,
      stockQuantity: 41,
      lowStockThreshold: null,
      specs: { netWeightGrams: 460, salted: false, variant: "Cow ghee", shelfLifeDays: 270 },
      imageAlt: "Vraj cow ghee 500 ml glass jar",
    },
    {
      id: "dairy_prod_paneer_200",
      name: "Anandam Fresh Paneer 200 g",
      slug: "anandam-fresh-paneer-200g",
      sku: "DD-PNR-200",
      description: "Soft fresh paneer block, 200 g, made daily from full cream milk.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_ANANDAM,
      categoryId: CAT_PANEER_CHEESE,
      subcategoryId: null,
      mrpPaise: 9500,
      sellingPricePaise: 9000,
      costPricePaise: 7300,
      // OUT_OF_STOCK but still ACTIVE, so it stays visible and can anchor a
      // substitution (catalog 6). ACTIVE + OUT_OF_STOCK is a legitimate state.
      stockQuantity: 0,
      lowStockThreshold: null,
      specs: { netWeightGrams: 200, milkType: "Full cream", type: "Paneer", shelfLifeDays: 3 },
      imageAlt: "Anandam fresh paneer 200 gram block",
    },
    {
      id: "dairy_prod_cheese_slices",
      name: "Vraj Cheese Slices 200 g",
      slug: "vraj-cheese-slices-200g",
      sku: "DD-CHS-SLC-200",
      description: "Ten processed cheese slices, 200 g pack.",
      lifecycleStatus: "ACTIVE",
      brandId: BRAND_VRAJ,
      categoryId: CAT_PANEER_CHEESE,
      subcategoryId: null,
      mrpPaise: 13500,
      sellingPricePaise: 12800,
      costPricePaise: 10600,
      stockQuantity: 33,
      lowStockThreshold: null,
      specs: { netWeightGrams: 200, milkType: "Cow", type: "Processed slices", shelfLifeDays: 150 },
      imageAlt: "Vraj processed cheese slices 200 gram pack",
    },
    {
      id: "dairy_prod_lassi_200",
      name: "Anandam Sweet Lassi 200 ml",
      slug: "anandam-sweet-lassi-200ml",
      sku: "DD-LSS-200",
      description:
        "Chilled sweet lassi in a 200 ml bottle. Seasonal line, not yet published.",
      // DRAFT never reaches the storefront (catalog 6).
      lifecycleStatus: "DRAFT",
      brandId: BRAND_ANANDAM,
      categoryId: CAT_CURD,
      subcategoryId: null,
      mrpPaise: 3000,
      sellingPricePaise: 3000,
      costPricePaise: 2400,
      stockQuantity: 0,
      lowStockThreshold: null,
      specs: { netWeightGrams: 200, fatPercent: 3, probiotic: true, shelfLifeDays: 5 },
      imageAlt: "Anandam sweet lassi 200 ml bottle",
    },
  ],

  customers: [
    {
      id: "dairy_cust_asha",
      email: "asha.pillai@example.test",
      name: "Asha Pillai",
      phone: "+919845012233",
    },
    {
      id: "dairy_cust_imran",
      email: "imran.qureshi@example.test",
      name: "Imran Qureshi",
      phone: "+919845044556",
    },
  ],

  sessions: [
    {
      id: "dairy_sess_asha_1",
      anonymousId: "dairy-anon-asha-6f2b91c4",
      customerId: "dairy_cust_asha",
      day: 2,
      minutes: 30,
      durationMinutes: 14,
    },
    {
      id: "dairy_sess_imran_1",
      anonymousId: "dairy-anon-imran-1c77ae03",
      customerId: "dairy_cust_imran",
      day: 4,
      minutes: 110,
      durationMinutes: 9,
    },
    {
      // Never authenticated: an anonymous visitor is a STATE of a Session, not
      // an entity (identity 2). The token is store-scoped (ADR-2.8-003) — it
      // shares nothing with the tokens in the other three stores.
      id: "dairy_sess_anon_1",
      anonymousId: "dairy-anon-visitor-90d15e7a",
      customerId: null,
      day: 5,
      minutes: 55,
      durationMinutes: 4,
    },
  ],

  orders: [
    {
      id: "dairy_order_asha_1",
      customerId: "dairy_cust_asha",
      sessionId: "dairy_sess_asha_1",
      idempotencyKey: "dairy-checkout-asha-0001",
      day: 2,
      minutes: 41,
      lines: [
        { productId: "dairy_prod_toned_1l", quantity: 2 },
        { productId: "dairy_prod_curd_400", quantity: 1 },
        { productId: "dairy_prod_butter_100", quantity: 1 },
      ],
      providerOrderId: "order_DDAsha0001",
      providerPaymentId: "pay_DDAsha0001",
    },
    {
      id: "dairy_order_imran_1",
      customerId: "dairy_cust_imran",
      sessionId: "dairy_sess_imran_1",
      idempotencyKey: "dairy-checkout-imran-0001",
      day: 4,
      minutes: 118,
      lines: [
        { productId: "dairy_prod_ghee_500", quantity: 1 },
        { productId: "dairy_prod_greek_100", quantity: 4 },
      ],
      providerOrderId: "order_DDImran0001",
      providerPaymentId: "pay_DDImran0001",
    },
  ],
};
