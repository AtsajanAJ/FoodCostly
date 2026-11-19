-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'RECEIVED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('PURCHASE_RECEIPT');

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "discountAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receivedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(24,6) NOT NULL,
    "unitId" TEXT NOT NULL,
    "unitPrice" DECIMAL(24,6) NOT NULL,
    "baseQuantity" DECIMAL(24,6) NOT NULL,
    "lineGross" DECIMAL(24,6) NOT NULL,
    "allocatedDiscount" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "allocatedTax" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "allocatedShipping" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "allocatedCost" DECIMAL(24,6) NOT NULL,
    "baseUnitCost" DECIMAL(24,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_balance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantityBase" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "valueTotal" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_ledger_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "quantityBase" DECIMAL(24,6) NOT NULL,
    "unitCost" DECIMAL(24,6) NOT NULL,
    "totalCost" DECIMAL(24,6) NOT NULL,
    "balanceQuantityAfter" DECIMAL(24,6) NOT NULL,
    "balanceValueAfter" DECIMAL(24,6) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "lineReferenceId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_organizationId_idx" ON "supplier"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_organizationId_name_key" ON "supplier"("organizationId", "name");

-- CreateIndex
CREATE INDEX "purchase_organizationId_status_idx" ON "purchase"("organizationId", "status");

-- CreateIndex
CREATE INDEX "purchase_organizationId_purchasedAt_idx" ON "purchase"("organizationId", "purchasedAt");

-- CreateIndex
CREATE INDEX "purchase_supplierId_idx" ON "purchase"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_line_organizationId_idx" ON "purchase_line"("organizationId");

-- CreateIndex
CREATE INDEX "purchase_line_purchaseId_idx" ON "purchase_line"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_line_ingredientId_idx" ON "purchase_line"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balance_ingredientId_key" ON "stock_balance"("ingredientId");

-- CreateIndex
CREATE INDEX "stock_balance_organizationId_ingredientId_idx" ON "stock_balance"("organizationId", "ingredientId");

-- CreateIndex
CREATE INDEX "inventory_ledger_entry_organizationId_ingredientId_occurred_idx" ON "inventory_ledger_entry"("organizationId", "ingredientId", "occurredAt");

-- CreateIndex
CREATE INDEX "inventory_ledger_entry_organizationId_referenceType_referen_idx" ON "inventory_ledger_entry"("organizationId", "referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_ledger_entry_organizationId_referenceType_referen_key" ON "inventory_ledger_entry"("organizationId", "referenceType", "referenceId", "lineReferenceId", "movementType");

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_line" ADD CONSTRAINT "purchase_line_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_line" ADD CONSTRAINT "purchase_line_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_line" ADD CONSTRAINT "purchase_line_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balance" ADD CONSTRAINT "stock_balance_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger_entry" ADD CONSTRAINT "inventory_ledger_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger_entry" ADD CONSTRAINT "inventory_ledger_entry_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
