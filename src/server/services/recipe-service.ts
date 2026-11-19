import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as recipeRepository from "@/server/repositories/recipe-repository";
import * as unitRepository from "@/server/repositories/unit-repository";
import { calculateRecipeCost } from "@/server/services/recipe-costing";

type LineInput = {
  ingredientId: string;
  quantity: string;
  unitId: string;
  yieldPercent?: string | null;
};

async function buildRecipeItems(
  organizationId: string,
  recipeId: string,
  lines: LineInput[],
) {
  if (lines.length === 0) {
    throw new Error("Recipe requires at least one ingredient");
  }

  const items = [];

  for (const line of lines) {
    const quantity = new Decimal(line.quantity);
    if (!quantity.isFinite() || quantity.lte(0)) {
      throw new Error("Ingredient quantity must be greater than zero");
    }

    const yieldPercent = new Decimal(line.yieldPercent || "100");
    if (!yieldPercent.isFinite() || yieldPercent.lte(0) || yieldPercent.gt(100)) {
      throw new Error("Yield percent must be > 0 and <= 100");
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: line.ingredientId,
        organizationId,
        status: "ACTIVE",
      },
      include: { baseUnit: true },
    });
    if (!ingredient) {
      throw new Error("Ingredient not found");
    }

    const unit = await unitRepository.getUnitById(line.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }
    if (unit.dimension !== ingredient.baseUnit.dimension) {
      throw new Error(
        `Unit ${unit.code} is incompatible with ${ingredient.baseUnit.code}`,
      );
    }

    items.push({
      id: randomUUID(),
      organizationId,
      recipeId,
      ingredientId: ingredient.id,
      quantity: quantity.toFixed(6),
      unitId: unit.id,
      yieldPercent: yieldPercent.toFixed(4),
    });
  }

  return items;
}

export async function listRecipesForTenant(tenant: TenantContext) {
  return recipeRepository.listRecipes(tenant.organizationId);
}

export async function getRecipeForTenant(
  tenant: TenantContext,
  recipeId: string,
) {
  return recipeRepository.getRecipeForOrg(tenant.organizationId, recipeId);
}

export async function createRecipe(
  tenant: TenantContext,
  input: {
    name: string;
    description?: string | null;
    portionCount: string;
    notes?: string | null;
    lines: LineInput[];
  },
) {
  assertCanWriteMasterData(tenant.role);

  const name = input.name.trim();
  if (!name) throw new Error("Recipe name is required");

  const portionCount = new Decimal(input.portionCount);
  if (!portionCount.isFinite() || portionCount.lte(0)) {
    throw new Error("Portion count must be greater than zero");
  }

  const recipeId = randomUUID();
  const items = await buildRecipeItems(
    tenant.organizationId,
    recipeId,
    input.lines,
  );

  return recipeRepository.createRecipeWithItems({
    recipe: {
      id: recipeId,
      organizationId: tenant.organizationId,
      name,
      description: input.description?.trim() || null,
      portionCount: portionCount.toFixed(6),
      notes: input.notes?.trim() || null,
      status: "ACTIVE",
    },
    items,
  });
}

export async function updateRecipe(
  tenant: TenantContext,
  recipeId: string,
  input: {
    name: string;
    description?: string | null;
    portionCount: string;
    notes?: string | null;
    lines: LineInput[];
  },
) {
  assertCanWriteMasterData(tenant.role);

  const existing = await recipeRepository.getRecipeForOrg(
    tenant.organizationId,
    recipeId,
  );
  if (!existing || existing.status !== "ACTIVE") {
    throw new Error("Recipe not found");
  }

  const name = input.name.trim();
  if (!name) throw new Error("Recipe name is required");

  const portionCount = new Decimal(input.portionCount);
  if (!portionCount.isFinite() || portionCount.lte(0)) {
    throw new Error("Portion count must be greater than zero");
  }

  const items = await buildRecipeItems(
    tenant.organizationId,
    recipeId,
    input.lines,
  );

  return recipeRepository.replaceRecipeItems({
    organizationId: tenant.organizationId,
    recipeId,
    recipeUpdate: {
      name,
      description: input.description?.trim() || null,
      portionCount: portionCount.toFixed(6),
      notes: input.notes?.trim() || null,
    },
    items,
  });
}

export async function computeLiveRecipeCost(
  tenant: TenantContext,
  recipeId: string,
) {
  const recipe = await recipeRepository.getRecipeForOrg(
    tenant.organizationId,
    recipeId,
  );
  if (!recipe) {
    throw new Error("Recipe not found");
  }

  return calculateRecipeCost({
    portionCount: recipe.portionCount.toString(),
    lines: recipe.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity.toString(),
      unit: {
        id: item.unit.id,
        code: item.unit.code,
        dimension: item.unit.dimension,
        toBaseFactor: item.unit.toBaseFactor.toString(),
      },
      yieldPercent: item.yieldPercent.toString(),
      unitCost: item.ingredient.valuationCost?.toString() ?? "0",
    })),
  });
}

export async function publishRecipeVersion(
  tenant: TenantContext,
  recipeId: string,
  notes?: string | null,
) {
  assertCanWriteMasterData(tenant.role);

  const recipe = await recipeRepository.getRecipeForOrg(
    tenant.organizationId,
    recipeId,
  );
  if (!recipe || recipe.status !== "ACTIVE") {
    throw new Error("Recipe not found");
  }

  const liveCost = calculateRecipeCost({
    portionCount: recipe.portionCount.toString(),
    lines: recipe.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity.toString(),
      unit: {
        id: item.unit.id,
        code: item.unit.code,
        dimension: item.unit.dimension,
        toBaseFactor: item.unit.toBaseFactor.toString(),
      },
      yieldPercent: item.yieldPercent.toString(),
      unitCost: item.ingredient.valuationCost?.toString() ?? "0",
    })),
  });

  const latestVersion = recipe.versions[0]?.versionNumber ?? 0;
  const versionId = randomUUID();

  const snapshotItems = recipe.items.map((item, index) => {
    const costLine = liveCost.lines[index]!;
    return {
      id: randomUUID(),
      organizationId: tenant.organizationId,
      recipeVersionId: versionId,
      ingredientId: item.ingredientId,
      quantity: item.quantity.toString(),
      unitId: item.unitId,
      baseQuantity: costLine.baseQuantity.toFixed(6),
      yieldPercent: item.yieldPercent.toString(),
      requiredBaseQuantity: costLine.requiredBaseQuantity.toFixed(6),
      unitCostSnapshot: costLine.unitCost.toFixed(6),
      lineCostSnapshot: costLine.lineCost.toFixed(6),
    };
  });

  return recipeRepository.createRecipeVersion({
    version: {
      id: versionId,
      organizationId: tenant.organizationId,
      recipeId: recipe.id,
      versionNumber: latestVersion + 1,
      portionCount: liveCost.portionCount.toFixed(6),
      totalCost: liveCost.totalCost.toFixed(6),
      costPerPortion: liveCost.costPerPortion.toFixed(6),
      notes: notes?.trim() || null,
      createdByUserId: tenant.userId,
    },
    items: snapshotItems,
  });
}
