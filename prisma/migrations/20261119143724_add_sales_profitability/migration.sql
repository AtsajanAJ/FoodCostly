-- CreateEnum
CREATE TYPE "SaleChannelFeeType" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "SaleChannelStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('POSTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InventoryMovementType" ADD VALUE 'SALE_CONSUMPTION';
ALTER TYPE "InventoryMovementType" ADD VALUE 'SALE_REVERSAL';

-- CreateTable
CREATE TABLE "sale_channel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feeType" "SaleChannelFeeType" NOT NULL DEFAULT 'NONE',
    "feeValue" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "status" "SaleChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'POSTED',
    "soldAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "notes" TEXT,
    "grossRevenue" DECIMAL(24,6) NOT NULL,
    "discountAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "packagingCost" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "channelFeeAmount" DECIMAL(24,6) NOT NULL,
    "foodCostTotal" DECIMAL(24,6) NOT NULL,
    "contributionMargin" DECIMAL(24,6) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "menuItemNameSnapshot" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeVersionId" TEXT,
    "quantity" DECIMAL(24,6) NOT NULL,
    "unitPriceSnapshot" DECIMAL(24,6) NOT NULL,
    "lineRevenue" DECIMAL(24,6) NOT NULL,
    "foodCostSnapshot" DECIMAL(24,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_stock_consumption" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityBase" DECIMAL(24,6) NOT NULL,
    "unitCostSnapshot" DECIMAL(24,6) NOT NULL,
    "totalCostSnapshot" DECIMAL(24,6) NOT NULL,

    CONSTRAINT "sale_stock_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_channel_organizationId_status_idx" ON "sale_channel"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sale_channel_organizationId_code_key" ON "sale_channel"("organizationId", "code");

-- CreateIndex
CREATE INDEX "sale_organizationId_status_soldAt_idx" ON "sale"("organizationId", "status", "soldAt");

-- CreateIndex
CREATE INDEX "sale_organizationId_channelId_idx" ON "sale"("organizationId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_organizationId_idempotencyKey_key" ON "sale"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "sale_item_organizationId_idx" ON "sale_item"("organizationId");

-- CreateIndex
CREATE INDEX "sale_item_saleId_idx" ON "sale_item"("saleId");

-- CreateIndex
CREATE INDEX "sale_item_menuItemId_idx" ON "sale_item"("menuItemId");

-- CreateIndex
CREATE INDEX "sale_stock_consumption_organizationId_saleId_idx" ON "sale_stock_consumption"("organizationId", "saleId");

-- CreateIndex
CREATE INDEX "sale_stock_consumption_saleItemId_idx" ON "sale_stock_consumption"("saleItemId");

-- CreateIndex
CREATE INDEX "sale_stock_consumption_ingredientId_idx" ON "sale_stock_consumption"("ingredientId");

-- AddForeignKey
ALTER TABLE "sale_channel" ADD CONSTRAINT "sale_channel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "sale_channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_recipeVersionId_fkey" FOREIGN KEY ("recipeVersionId") REFERENCES "recipe_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_stock_consumption" ADD CONSTRAINT "sale_stock_consumption_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_stock_consumption" ADD CONSTRAINT "sale_stock_consumption_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "sale_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_stock_consumption" ADD CONSTRAINT "sale_stock_consumption_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
