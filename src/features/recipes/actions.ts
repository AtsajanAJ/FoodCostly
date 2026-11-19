"use server";

import { revalidatePath } from "next/cache";
import {
  createMenuItemSchema,
  createRecipeSchema,
  publishRecipeVersionSchema,
} from "@/features/recipes/schemas";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as menuService from "@/server/services/menu-service";
import * as recipeService from "@/server/services/recipe-service";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function createRecipeAction(input: unknown): Promise<ActionResult> {
  try {
    const data = createRecipeSchema.parse(input);
    const tenant = await requireTenantContext();
    const recipe = await recipeService.createRecipe(tenant, data);
    revalidatePath("/dashboard/recipes");
    revalidatePath(`/dashboard/recipes/${recipe.id}`);
    return { ok: true, id: recipe.id };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function publishRecipeVersionAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = publishRecipeVersionSchema.parse(input);
    const tenant = await requireTenantContext();
    const version = await recipeService.publishRecipeVersion(
      tenant,
      data.recipeId,
      data.notes,
    );
    revalidatePath("/dashboard/recipes");
    revalidatePath(`/dashboard/recipes/${data.recipeId}`);
    revalidatePath("/dashboard/menus");
    return { ok: true, id: version.id };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createMenuItemAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = createMenuItemSchema.parse(input);
    const tenant = await requireTenantContext();
    const item = await menuService.createMenuItemForTenant(tenant, data);
    revalidatePath("/dashboard/menus");
    return { ok: true, id: item.id };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
