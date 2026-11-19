import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import * as categoryRepository from "@/server/repositories/category-repository";
import * as ingredientRepository from "@/server/repositories/ingredient-repository";
import * as unitRepository from "@/server/repositories/unit-repository";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";

export async function listIngredientsForTenant(
  tenant: TenantContext,
  options?: { includeArchived?: boolean },
) {
  return ingredientRepository.listIngredients(tenant.organizationId, options);
}

export async function createIngredientForTenant(
  tenant: TenantContext,
  input: {
    name: string;
    baseUnitId: string;
    categoryId?: string | null;
    minimumStock?: string | null;
    notes?: string | null;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const name = input.name.trim();
  if (!name) {
    throw new Error("Ingredient name is required");
  }

  const unit = await unitRepository.getUnitById(input.baseUnitId);
  if (!unit) {
    throw new Error("Base unit not found");
  }

  if (!unit.isBase) {
    throw new Error(
      "Ingredient base unit must be a canonical base unit (g, ml, or pcs)",
    );
  }

  if (input.categoryId) {
    const category = await categoryRepository.getCategoryForOrg(
      tenant.organizationId,
      input.categoryId,
    );
    if (!category || category.archivedAt) {
      throw new Error("Category not found in this organization");
    }
  }

  let minimumStock: string | null = null;
  if (input.minimumStock != null && input.minimumStock !== "") {
    const parsed = new Decimal(input.minimumStock);
    if (!parsed.isFinite() || parsed.lt(0)) {
      throw new Error("Minimum stock must be a non-negative decimal");
    }
    minimumStock = parsed.toFixed(6);
  }

  return ingredientRepository.createIngredient({
    id: randomUUID(),
    organizationId: tenant.organizationId,
    name,
    baseUnitId: unit.id,
    categoryId: input.categoryId || null,
    minimumStock,
    notes: input.notes?.trim() || null,
    status: "ACTIVE",
  });
}

export async function updateIngredientForTenant(
  tenant: TenantContext,
  ingredientId: string,
  input: {
    name: string;
    categoryId?: string | null;
    minimumStock?: string | null;
    notes?: string | null;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const existing = await ingredientRepository.getIngredientForOrg(
    tenant.organizationId,
    ingredientId,
  );

  if (!existing) {
    throw new Error("Ingredient not found");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("Ingredient name is required");
  }

  if (input.categoryId) {
    const category = await categoryRepository.getCategoryForOrg(
      tenant.organizationId,
      input.categoryId,
    );
    if (!category || category.archivedAt) {
      throw new Error("Category not found in this organization");
    }
  }

  let minimumStock: string | null = null;
  if (input.minimumStock != null && input.minimumStock !== "") {
    const parsed = new Decimal(input.minimumStock);
    if (!parsed.isFinite() || parsed.lt(0)) {
      throw new Error("Minimum stock must be a non-negative decimal");
    }
    minimumStock = parsed.toFixed(6);
  }

  // Base unit is immutable after create to protect inventory history later.
  const result = await ingredientRepository.updateIngredientForOrg(
    tenant.organizationId,
    ingredientId,
    {
      name,
      categoryId: input.categoryId || null,
      minimumStock,
      notes: input.notes?.trim() || null,
    },
  );

  if (result.count === 0) {
    throw new Error("Ingredient not found");
  }

  return ingredientRepository.getIngredientForOrg(
    tenant.organizationId,
    ingredientId,
  );
}

export async function archiveIngredientForTenant(
  tenant: TenantContext,
  ingredientId: string,
) {
  assertCanWriteMasterData(tenant.role);

  const existing = await ingredientRepository.getIngredientForOrg(
    tenant.organizationId,
    ingredientId,
  );

  if (!existing) {
    throw new Error("Ingredient not found");
  }

  const result = await ingredientRepository.archiveIngredient(
    tenant.organizationId,
    ingredientId,
  );

  if (result.count === 0) {
    throw new Error("Ingredient not found or already archived");
  }
}
