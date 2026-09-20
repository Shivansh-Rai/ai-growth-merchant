-- CreateEnum
CREATE TYPE "ProductLifecycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SEARCH', 'PRODUCT_VIEW', 'PRODUCT_CLICK', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'CART_VIEW', 'CHECKOUT_STARTED', 'OFFER_VIEWED', 'OFFER_CLICKED', 'OFFER_DISMISSED', 'PURCHASE');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('UPSELL', 'CROSS_SELL', 'SUBSTITUTION', 'PERSONALIZED_OFFER', 'CART_OPTIMIZATION', 'ABANDONED_CHECKOUT');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'SUPPRESSED', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AiDecision" AS ENUM ('ACT', 'NO_ACTION');

-- CreateEnum
CREATE TYPE "AiActionType" AS ENUM ('UPSELL', 'CROSS_SELL', 'SUBSTITUTION', 'PERSONALIZED_OFFER', 'CART_OPTIMIZATION', 'ABANDONED_CHECKOUT_INTERVENTION');

-- CreateEnum
CREATE TYPE "AiActionStatus" AS ENUM ('GENERATED', 'VALIDATING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('MAX_DISCOUNT', 'MIN_MARGIN', 'PRODUCT_ELIGIBILITY', 'CUSTOMER_ELIGIBILITY', 'FREQUENCY_LIMIT', 'INVENTORY_REQUIREMENT');

-- CreateEnum
CREATE TYPE "GuardrailPhase" AS ENUM ('GENERATION', 'EXECUTION');

-- CreateEnum
CREATE TYPE "GuardrailResult" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttributionStatus" AS ENUM ('ATTRIBUTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('SYSTEM', 'MERCHANT', 'AI_AGENT');

-- CreateEnum
CREATE TYPE "AuditEntryType" AS ENUM ('AI_ACTION_GENERATED', 'AI_ACTION_VALIDATED', 'AI_ACTION_APPROVED', 'AI_ACTION_REJECTED', 'AI_ACTION_EXECUTED', 'AI_ACTION_EXPIRED', 'AI_ACTION_CANCELLED', 'POLICY_CHANGED', 'PAYMENT_CONFIRMED', 'ATTRIBUTION_CREATED', 'ATTRIBUTION_VOIDED');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "defaultLowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "customerId" TEXT,
    "attributedCustomerId" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "lifecycleStatus" "ProductLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "brandId" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "mrpPaise" INTEGER NOT NULL,
    "sellingPricePaise" INTEGER NOT NULL,
    "costPricePaise" INTEGER,
    "stockQuantity" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER,
    "specs" JSONB,
    "externalUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientOccurredAt" TIMESTAMPTZ(3),
    "payload" JSONB NOT NULL,
    "clientEventId" TEXT,
    "orderId" TEXT,
    "aiActionId" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastActivityAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cartId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "placedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discountPaise" INTEGER NOT NULL DEFAULT 0,
    "lineTotalPaise" INTEGER NOT NULL,
    "taxPaise" INTEGER,
    "appliedOfferId" TEXT,
    "appliedActionId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "amountPaise" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "providerEventId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "sessionId" TEXT,
    "type" "OpportunityType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "dedupeKey" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_actions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "customerId" TEXT,
    "sessionId" TEXT,
    "decision" "AiDecision" NOT NULL,
    "actionType" "AiActionType",
    "status" "AiActionStatus" NOT NULL DEFAULT 'GENERATED',
    "targetProductId" TEXT,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "proposedOffer" JSONB,
    "observedStockQuantity" INTEGER,
    "modelProvider" TEXT,
    "modelId" TEXT,
    "modelVersion" TEXT,
    "decisionSchemaVersion" TEXT,
    "candidateSetHash" TEXT,
    "expiresAt" TIMESTAMPTZ(3),
    "executedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scope" JSONB,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardrail_evaluations" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "aiActionId" TEXT NOT NULL,
    "phase" "GuardrailPhase" NOT NULL,
    "result" "GuardrailResult" NOT NULL,
    "reason" TEXT,
    "rules" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardrail_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequency_ledger_entries" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "actionType" "AiActionType" NOT NULL,
    "bucketStart" TIMESTAMPTZ(3) NOT NULL,
    "aiActionId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frequency_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_records" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "aiActionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "exposureEventId" TEXT NOT NULL,
    "exposedAt" TIMESTAMPTZ(3) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" "AttributionStatus" NOT NULL DEFAULT 'ATTRIBUTED',
    "voidedAt" TIMESTAMPTZ(3),
    "ruleVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "AuditEntryType" NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT,
    "aiActionId" TEXT,
    "opportunityId" TEXT,
    "orderId" TEXT,
    "policyId" TEXT,
    "attributionRecordId" TEXT,
    "decision" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_merchantId_key" ON "stores"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_storeId_email_key" ON "customers"("storeId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_storeId_id_key" ON "customers"("storeId", "id");

-- CreateIndex
CREATE INDEX "sessions_storeId_anonymousId_startedAt_idx" ON "sessions"("storeId", "anonymousId", "startedAt");

-- CreateIndex
CREATE INDEX "sessions_storeId_customerId_idx" ON "sessions"("storeId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_storeId_id_key" ON "sessions"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_storeId_slug_key" ON "brands"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_storeId_id_key" ON "brands"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_storeId_slug_key" ON "categories"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_storeId_id_key" ON "categories"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_storeId_categoryId_slug_key" ON "subcategories"("storeId", "categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_categoryId_id_key" ON "subcategories"("categoryId", "id");

-- CreateIndex
CREATE INDEX "products_storeId_lifecycleStatus_idx" ON "products"("storeId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "products_storeId_categoryId_idx" ON "products"("storeId", "categoryId");

-- CreateIndex
CREATE INDEX "products_storeId_subcategoryId_idx" ON "products"("storeId", "subcategoryId");

-- CreateIndex
CREATE INDEX "products_storeId_brandId_idx" ON "products"("storeId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_sku_key" ON "products"("storeId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_slug_key" ON "products"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_id_key" ON "products"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_productId_position_key" ON "product_images"("productId", "position");

-- CreateIndex
CREATE INDEX "events_sessionId_receivedAt_idx" ON "events"("sessionId", "receivedAt");

-- CreateIndex
CREATE INDEX "events_storeId_type_receivedAt_idx" ON "events"("storeId", "type", "receivedAt");

-- CreateIndex
CREATE INDEX "events_storeId_receivedAt_idx" ON "events"("storeId", "receivedAt");

-- CreateIndex
CREATE INDEX "events_storeId_aiActionId_type_receivedAt_idx" ON "events"("storeId", "aiActionId", "type", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "events_sessionId_clientEventId_key" ON "events"("sessionId", "clientEventId");

-- CreateIndex
CREATE UNIQUE INDEX "events_storeId_id_key" ON "events"("storeId", "id");

-- CreateIndex
CREATE INDEX "carts_storeId_customerId_idx" ON "carts"("storeId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_storeId_id_key" ON "carts"("storeId", "id");

-- CreateIndex
CREATE INDEX "cart_items_storeId_productId_idx" ON "cart_items"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");

-- CreateIndex
CREATE INDEX "orders_storeId_customerId_status_idx" ON "orders"("storeId", "customerId", "status");

-- CreateIndex
CREATE INDEX "orders_storeId_status_placedAt_idx" ON "orders"("storeId", "status", "placedAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_storeId_idempotencyKey_key" ON "orders"("storeId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "orders_storeId_id_key" ON "orders"("storeId", "id");

-- CreateIndex
CREATE INDEX "order_items_storeId_productId_idx" ON "order_items"("storeId", "productId");

-- CreateIndex
CREATE INDEX "order_items_storeId_appliedActionId_idx" ON "order_items"("storeId", "appliedActionId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "payment_attempts_storeId_orderId_idx" ON "payment_attempts"("storeId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_storeId_idempotencyKey_key" ON "payment_attempts"("storeId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_providerPaymentId_key" ON "payment_attempts"("provider", "providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_providerEventId_key" ON "payment_attempts"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "opportunities_storeId_status_expiresAt_idx" ON "opportunities"("storeId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "opportunities_storeId_customerId_status_idx" ON "opportunities"("storeId", "customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_storeId_id_key" ON "opportunities"("storeId", "id");

-- CreateIndex
CREATE INDEX "ai_actions_storeId_status_createdAt_idx" ON "ai_actions"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_actions_storeId_customerId_createdAt_idx" ON "ai_actions"("storeId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_actions_storeId_targetProductId_idx" ON "ai_actions"("storeId", "targetProductId");

-- CreateIndex
CREATE INDEX "ai_actions_opportunityId_idx" ON "ai_actions"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_actions_storeId_id_key" ON "ai_actions"("storeId", "id");

-- CreateIndex
CREATE INDEX "policies_storeId_type_enabled_idx" ON "policies"("storeId", "type", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "policies_storeId_id_key" ON "policies"("storeId", "id");

-- CreateIndex
CREATE INDEX "guardrail_evaluations_storeId_aiActionId_phase_idx" ON "guardrail_evaluations"("storeId", "aiActionId", "phase");

-- CreateIndex
CREATE INDEX "frequency_ledger_entries_storeId_aiActionId_idx" ON "frequency_ledger_entries"("storeId", "aiActionId");

-- CreateIndex
CREATE UNIQUE INDEX "frequency_ledger_entries_storeId_customerId_actionType_buck_key" ON "frequency_ledger_entries"("storeId", "customerId", "actionType", "bucketStart");

-- CreateIndex
CREATE INDEX "attribution_records_storeId_aiActionId_idx" ON "attribution_records"("storeId", "aiActionId");

-- CreateIndex
CREATE INDEX "attribution_records_storeId_status_createdAt_idx" ON "attribution_records"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "attribution_records_orderId_idx" ON "attribution_records"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "attribution_records_storeId_id_key" ON "attribution_records"("storeId", "id");

-- CreateIndex
CREATE INDEX "audit_entries_storeId_type_createdAt_idx" ON "audit_entries"("storeId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "audit_entries_storeId_aiActionId_idx" ON "audit_entries"("storeId", "aiActionId");

-- CreateIndex
CREATE INDEX "audit_entries_storeId_orderId_idx" ON "audit_entries"("storeId", "orderId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_storeId_attributedCustomerId_fkey" FOREIGN KEY ("storeId", "attributedCustomerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_storeId_categoryId_fkey" FOREIGN KEY ("storeId", "categoryId") REFERENCES "categories"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_brandId_fkey" FOREIGN KEY ("storeId", "brandId") REFERENCES "brands"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_categoryId_fkey" FOREIGN KEY ("storeId", "categoryId") REFERENCES "categories"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_subcategoryId_fkey" FOREIGN KEY ("categoryId", "subcategoryId") REFERENCES "subcategories"("categoryId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_storeId_sessionId_fkey" FOREIGN KEY ("storeId", "sessionId") REFERENCES "sessions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_storeId_orderId_fkey" FOREIGN KEY ("storeId", "orderId") REFERENCES "orders"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_storeId_aiActionId_fkey" FOREIGN KEY ("storeId", "aiActionId") REFERENCES "ai_actions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_storeId_cartId_fkey" FOREIGN KEY ("storeId", "cartId") REFERENCES "carts"("storeId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_storeId_productId_fkey" FOREIGN KEY ("storeId", "productId") REFERENCES "products"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_cartId_fkey" FOREIGN KEY ("storeId", "cartId") REFERENCES "carts"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_storeId_orderId_fkey" FOREIGN KEY ("storeId", "orderId") REFERENCES "orders"("storeId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_storeId_productId_fkey" FOREIGN KEY ("storeId", "productId") REFERENCES "products"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_storeId_appliedActionId_fkey" FOREIGN KEY ("storeId", "appliedActionId") REFERENCES "ai_actions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_storeId_orderId_fkey" FOREIGN KEY ("storeId", "orderId") REFERENCES "orders"("storeId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_storeId_sessionId_fkey" FOREIGN KEY ("storeId", "sessionId") REFERENCES "sessions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_storeId_opportunityId_fkey" FOREIGN KEY ("storeId", "opportunityId") REFERENCES "opportunities"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_storeId_sessionId_fkey" FOREIGN KEY ("storeId", "sessionId") REFERENCES "sessions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_storeId_targetProductId_fkey" FOREIGN KEY ("storeId", "targetProductId") REFERENCES "products"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardrail_evaluations" ADD CONSTRAINT "guardrail_evaluations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardrail_evaluations" ADD CONSTRAINT "guardrail_evaluations_storeId_aiActionId_fkey" FOREIGN KEY ("storeId", "aiActionId") REFERENCES "ai_actions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequency_ledger_entries" ADD CONSTRAINT "frequency_ledger_entries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequency_ledger_entries" ADD CONSTRAINT "frequency_ledger_entries_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequency_ledger_entries" ADD CONSTRAINT "frequency_ledger_entries_storeId_aiActionId_fkey" FOREIGN KEY ("storeId", "aiActionId") REFERENCES "ai_actions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_storeId_aiActionId_fkey" FOREIGN KEY ("storeId", "aiActionId") REFERENCES "ai_actions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_storeId_orderId_fkey" FOREIGN KEY ("storeId", "orderId") REFERENCES "orders"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_storeId_customerId_fkey" FOREIGN KEY ("storeId", "customerId") REFERENCES "customers"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_storeId_exposureEventId_fkey" FOREIGN KEY ("storeId", "exposureEventId") REFERENCES "events"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_storeId_aiActionId_fkey" FOREIGN KEY ("storeId", "aiActionId") REFERENCES "ai_actions"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_storeId_opportunityId_fkey" FOREIGN KEY ("storeId", "opportunityId") REFERENCES "opportunities"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_storeId_orderId_fkey" FOREIGN KEY ("storeId", "orderId") REFERENCES "orders"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_storeId_policyId_fkey" FOREIGN KEY ("storeId", "policyId") REFERENCES "policies"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_storeId_attributionRecordId_fkey" FOREIGN KEY ("storeId", "attributionRecordId") REFERENCES "attribution_records"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ════════════════════════════════════════════════════════════════════════════
-- PostgreSQL-native invariants (ADR-2.7-031)
--
-- Prisma cannot express partial unique indexes or CHECK constraints. Per
-- ADR-2.7-031 these are added as raw SQL rather than weakening the domain
-- model. Each one below names the ADR or invariant it enforces.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Partial unique indexes ─────────────────────────────────────────────────

-- ADR-2.7-015: exactly one ACTIVE Cart per (storeId, customerId).
CREATE UNIQUE INDEX "carts_one_active_per_customer"
  ON "carts" ("storeId", "customerId")
  WHERE "status" = 'ACTIVE';

-- ADR-2.7-018: at most one SUCCEEDED PaymentAttempt per Order. Multiple
-- attempts are allowed while the Order is PENDING; only one may succeed.
CREATE UNIQUE INDEX "payment_attempts_one_succeeded_per_order"
  ON "payment_attempts" ("orderId")
  WHERE "status" = 'SUCCEEDED';

-- ADR-2.7-013: at most one PURCHASE Event per Order. Scoped to the PURCHASE
-- type because CHECKOUT_STARTED may also carry an orderId.
CREATE UNIQUE INDEX "events_one_purchase_per_order"
  ON "events" ("orderId")
  WHERE "type" = 'PURCHASE' AND "orderId" IS NOT NULL;

-- ADR-2.7-024: dedupe key is unique among OPEN opportunities for a store.
-- Resolved/expired opportunities may reuse the key.
CREATE UNIQUE INDEX "opportunities_one_open_per_dedupe_key"
  ON "opportunities" ("storeId", "dedupeKey")
  WHERE "status" = 'OPEN';

-- ADR-2.7-028: last-touch attribution — at most one live AttributionRecord per
-- Order. VOIDED records remain for history (GR-9: one purchase is never
-- counted as AI-attributed revenue more than once).
CREATE UNIQUE INDEX "attribution_records_one_live_per_order"
  ON "attribution_records" ("orderId")
  WHERE "status" = 'ATTRIBUTED';

-- ─── Identity ───────────────────────────────────────────────────────────────

-- INV-8: identity attribution is only ever recorded on a Session that was
-- never authenticated. A retroactive inference must never be able to overwrite
-- or disguise itself as contemporaneous truth.
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_attribution_only_when_anonymous"
  CHECK ("customerId" IS NULL OR "attributedCustomerId" IS NULL);

-- ─── Catalog: money and inventory (ADR-2.7-030) ─────────────────────────────

ALTER TABLE "stores" ADD CONSTRAINT "stores_default_low_stock_threshold_non_negative"
  CHECK ("defaultLowStockThreshold" >= 0);

-- PRD-4: 0 <= sellingPricePaise <= mrpPaise. Selling above MRP is unlawful in
-- India and would make the derived discount negative.
ALTER TABLE "products" ADD CONSTRAINT "products_mrp_non_negative"
  CHECK ("mrpPaise" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_selling_price_non_negative"
  CHECK ("sellingPricePaise" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_selling_price_not_above_mrp"
  CHECK ("sellingPricePaise" <= "mrpPaise");

-- PRD-5: cost is optional; when present it must be non-negative. It MAY exceed
-- the selling price — a loss-leader is a legitimate merchant decision.
ALTER TABLE "products" ADD CONSTRAINT "products_cost_price_non_negative"
  CHECK ("costPricePaise" IS NULL OR "costPricePaise" >= 0);

-- PRD-7 / ADR-2.7-019: stock can never go negative. This is the invariant the
-- conditional decrement in the Order to PAID transaction relies on.
ALTER TABLE "products" ADD CONSTRAINT "products_stock_quantity_non_negative"
  CHECK ("stockQuantity" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_low_stock_threshold_non_negative"
  CHECK ("lowStockThreshold" IS NULL OR "lowStockThreshold" >= 0);

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_position_non_negative"
  CHECK ("position" >= 0);

-- Catalog 8.4 / ADR-2.7-006: GIN index so specs containment queries are a real
-- relational capability rather than an opaque blob. The database still does
-- not validate key shapes — that is the application Zod registry's job.
CREATE INDEX "products_specs_gin" ON "products" USING GIN ("specs");

-- ─── Events (ADR-2.7-007 / 011 / 013) ───────────────────────────────────────

-- ADR-2.7-007: hard 16 KiB limit on serialized event payloads.
ALTER TABLE "events" ADD CONSTRAINT "events_payload_max_16kib"
  CHECK (octet_length("payload"::text) <= 16384);

-- ADR-2.7-011: PURCHASE is a SERVER_BUSINESS event emitted only after an Order
-- reaches PAID, so it must always reference that Order.
ALTER TABLE "events" ADD CONSTRAINT "events_purchase_requires_order"
  CHECK ("type" <> 'PURCHASE' OR "orderId" IS NOT NULL);

-- ADR-2.7-028 / GR-6: an OFFER_* event is meaningless without the AI Action it
-- refers to. OFFER_VIEWED is what establishes exposure, and exposure is the
-- precondition for revenue attribution.
ALTER TABLE "events" ADD CONSTRAINT "events_offer_requires_ai_action"
  CHECK (
    "type" NOT IN ('OFFER_VIEWED', 'OFFER_CLICKED', 'OFFER_DISMISSED')
    OR "aiActionId" IS NOT NULL
  );

-- ─── Commerce (ADR-2.7-016 / 017 / 018) ─────────────────────────────────────

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_positive"
  CHECK ("quantity" > 0);

-- ADR-2.7-016: lifecycle timestamps must agree with the recorded state.
ALTER TABLE "orders" ADD CONSTRAINT "orders_paid_requires_paid_at"
  CHECK ("status" <> 'PAID' OR "paidAt" IS NOT NULL);
ALTER TABLE "orders" ADD CONSTRAINT "orders_cancelled_requires_cancelled_at"
  CHECK ("status" <> 'CANCELLED' OR "cancelledAt" IS NOT NULL);

-- ADR-2.7-017: an order line is a historical financial fact; every monetary
-- component is non-negative integer paise.
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive"
  CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_non_negative"
  CHECK ("unitPricePaise" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_discount_non_negative"
  CHECK ("discountPaise" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_line_total_non_negative"
  CHECK ("lineTotalPaise" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tax_non_negative"
  CHECK ("taxPaise" IS NULL OR "taxPaise" >= 0);

ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_amount_non_negative"
  CHECK ("amountPaise" >= 0);

-- ─── Growth (ADR-2.7-025 / 026) ─────────────────────────────────────────────

-- ADR-2.7-025: an action type exists exactly when the model decided to ACT.
-- NO_ACTION is a valid recorded decision and carries no action type (AI-4).
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_action_type_matches_decision"
  CHECK (("decision" = 'ACT') = ("actionType" IS NOT NULL));

-- ADR-2.7-025: confidence is informational only, but must still be a
-- well-formed probability.
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_confidence_in_range"
  CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1));

-- PRD-10: the stock observed at generation time, against which any scarcity
-- claim is later audited.
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_observed_stock_non_negative"
  CHECK ("observedStockQuantity" IS NULL OR "observedStockQuantity" >= 0);

-- ADR-2.7-026: policy versions start at 1 and only ever move forward.
ALTER TABLE "policies" ADD CONSTRAINT "policies_version_positive"
  CHECK ("version" >= 1);

-- ─── Attribution (ADR-2.7-028) ──────────────────────────────────────────────

ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_amount_non_negative"
  CHECK ("amountPaise" >= 0);

-- A record is VOIDED exactly when it carries a void timestamp.
ALTER TABLE "attribution_records" ADD CONSTRAINT "attribution_records_voided_at_matches_status"
  CHECK (("status" = 'VOIDED') = ("voidedAt" IS NOT NULL));
