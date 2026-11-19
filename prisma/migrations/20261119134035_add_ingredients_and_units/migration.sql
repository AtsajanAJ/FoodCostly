-- CreateEnum
CREATE TYPE "UnitDimension" AS ENUM ('WEIGHT', 'VOLUME', 'COUNT');

-- CreateEnum
CREATE TYPE "IngredientStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "unit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dimension" "UnitDimension" NOT NULL,
    "toBaseFactor" DECIMAL(24,12) NOT NULL,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_category" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "baseUnitId" TEXT NOT NULL,
    "minimumStock" DECIMAL(24,6),
    "status" "IngredientStatus" NOT NULL DEFAULT 'ACTIVE',
    "latestPurchaseCost" DECIMAL(24,6),
    "valuationCost" DECIMAL(24,6),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unit_code_key" ON "unit"("code");

-- CreateIndex
CREATE INDEX "unit_dimension_idx" ON "unit"("dimension");

-- CreateIndex
CREATE INDEX "ingredient_category_organizationId_idx" ON "ingredient_category"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_category_organizationId_name_key" ON "ingredient_category"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ingredient_organizationId_status_idx" ON "ingredient"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ingredient_organizationId_categoryId_idx" ON "ingredient"("organizationId", "categoryId");

-- CreateIndex
CREATE INDEX "ingredient_baseUnitId_idx" ON "ingredient"("baseUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_organizationId_name_key" ON "ingredient"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "ingredient_category" ADD CONSTRAINT "ingredient_category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ingredient_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_baseUnitId_fkey" FOREIGN KEY ("baseUnitId") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
