import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as menuRepository from "@/server/repositories/menu-repository";
import * as recipeRepository from "@/server/repositories/recipe-repository";

export async function listMenuItemsForTenant(tenant: TenantContext) {
  return menuRepository.listMenuItems(tenant.organizationId);
}

export async function createMenuItemForTenant(
  tenant: TenantContext,
  input: {
    name: string;
    description?: string | null;
    recipeId: string;
    pinLatestVersion?: boolean;
    priceInStore?: string | null;
    priceDelivery?: string | null;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const name = input.name.trim();
  if (!name) throw new Error("Menu item name is required");

  const recipe = await recipeRepository.getRecipeForOrg(
    tenant.organizationId,
    input.recipeId,
  );
  if (!recipe || recipe.status !== "ACTIVE") {
    throw new Error("Recipe not found");
  }

  const latestVersion = recipe.versions[0] ?? null;
  if (input.pinLatestVersion && !latestVersion) {
    throw new Error("Publish a recipe version before pinning it to a menu item");
  }

  const priceInStore =
    input.priceInStore != null && input.priceInStore !== ""
      ? new Decimal(input.priceInStore)
      : null;
  const priceDelivery =
    input.priceDelivery != null && input.priceDelivery !== ""
      ? new Decimal(input.priceDelivery)
      : null;

  if (priceInStore && (!priceInStore.isFinite() || priceInStore.lt(0))) {
    throw new Error("In-store price must be a non-negative decimal");
  }
  if (priceDelivery && (!priceDelivery.isFinite() || priceDelivery.lt(0))) {
    throw new Error("Delivery price must be a non-negative decimal");
  }

  return menuRepository.createMenuItem({
    id: randomUUID(),
    organizationId: tenant.organizationId,
    name,
    description: input.description?.trim() || null,
    recipeId: recipe.id,
    recipeVersionId: input.pinLatestVersion ? latestVersion?.id ?? null : null,
    priceInStore: priceInStore?.toFixed(6) ?? null,
    priceDelivery: priceDelivery?.toFixed(6) ?? null,
  });
}

export async function archiveMenuItemForTenant(
  tenant: TenantContext,
  menuItemId: string,
) {
  assertCanWriteMasterData(tenant.role);
  const result = await menuRepository.archiveMenuItem(
    tenant.organizationId,
    menuItemId,
  );
  if (result.count === 0) {
    throw new Error("Menu item not found");
  }
}
