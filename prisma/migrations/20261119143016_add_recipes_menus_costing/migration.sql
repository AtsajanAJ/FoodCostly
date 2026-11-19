-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MenuItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "recipe" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "portionCount" DECIMAL(24,6) NOT NULL,
    "status" "RecipeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(24,6) NOT NULL,
    "unitId" TEXT NOT NULL,
    "yieldPercent" DECIMAL(8,4) NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_version" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "portionCount" DECIMAL(24,6) NOT NULL,
    "totalCost" DECIMAL(24,6) NOT NULL,
    "costPerPortion" DECIMAL(24,6) NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_version_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipeVersionId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(24,6) NOT NULL,
    "unitId" TEXT NOT NULL,
    "baseQuantity" DECIMAL(24,6) NOT NULL,
    "yieldPercent" DECIMAL(8,4) NOT NULL,
    "requiredBaseQuantity" DECIMAL(24,6) NOT NULL,
    "unitCostSnapshot" DECIMAL(24,6) NOT NULL,
    "lineCostSnapshot" DECIMAL(24,6) NOT NULL,

    CONSTRAINT "recipe_version_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recipeId" TEXT NOT NULL,
    "recipeVersionId" TEXT,
    "priceInStore" DECIMAL(24,6),
    "priceDelivery" DECIMAL(24,6),
    "status" "MenuItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_organizationId_status_idx" ON "recipe"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_organizationId_name_key" ON "recipe"("organizationId", "name");

-- CreateIndex
CREATE INDEX "recipe_item_organizationId_idx" ON "recipe_item"("organizationId");

-- CreateIndex
CREATE INDEX "recipe_item_recipeId_idx" ON "recipe_item"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_item_ingredientId_idx" ON "recipe_item"("ingredientId");

-- CreateIndex
CREATE INDEX "recipe_version_organizationId_recipeId_idx" ON "recipe_version"("organizationId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_version_recipeId_versionNumber_key" ON "recipe_version"("recipeId", "versionNumber");

-- CreateIndex
CREATE INDEX "recipe_version_item_organizationId_idx" ON "recipe_version_item"("organizationId");

-- CreateIndex
CREATE INDEX "recipe_version_item_recipeVersionId_idx" ON "recipe_version_item"("recipeVersionId");

-- CreateIndex
CREATE INDEX "recipe_version_item_ingredientId_idx" ON "recipe_version_item"("ingredientId");

-- CreateIndex
CREATE INDEX "menu_item_organizationId_status_idx" ON "menu_item"("organizationId", "status");

-- CreateIndex
CREATE INDEX "menu_item_recipeId_idx" ON "menu_item"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_organizationId_name_key" ON "menu_item"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version" ADD CONSTRAINT "recipe_version_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_item" ADD CONSTRAINT "recipe_version_item_recipeVersionId_fkey" FOREIGN KEY ("recipeVersionId") REFERENCES "recipe_version"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_item" ADD CONSTRAINT "recipe_version_item_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_version_item" ADD CONSTRAINT "recipe_version_item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_recipeVersionId_fkey" FOREIGN KEY ("recipeVersionId") REFERENCES "recipe_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
