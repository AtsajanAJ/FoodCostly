import { randomUUID } from "node:crypto";
import * as categoryRepository from "@/server/repositories/category-repository";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";

export async function listIngredientCategories(
  tenant: TenantContext,
  includeArchived = false,
) {
  return categoryRepository.listCategories(tenant.organizationId, includeArchived);
}

export async function createIngredientCategory(
  tenant: TenantContext,
  input: { name: string },
) {
  assertCanWriteMasterData(tenant.role);

  const name = input.name.trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  return categoryRepository.createCategory({
    id: randomUUID(),
    organizationId: tenant.organizationId,
    name,
  });
}

export async function archiveIngredientCategory(
  tenant: TenantContext,
  categoryId: string,
) {
  assertCanWriteMasterData(tenant.role);

  const existing = await categoryRepository.getCategoryForOrg(
    tenant.organizationId,
    categoryId,
  );

  if (!existing) {
    throw new Error("Category not found");
  }

  await categoryRepository.archiveCategory(tenant.organizationId, categoryId);
}
