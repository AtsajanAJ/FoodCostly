"use server";

import { revalidatePath } from "next/cache";
import {
  archiveCategorySchema,
  archiveIngredientSchema,
  createCategorySchema,
  createIngredientSchema,
  updateIngredientSchema,
} from "@/features/ingredients/schemas";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as categoryService from "@/server/services/category-service";
import * as ingredientService from "@/server/services/ingredient-service";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = createCategorySchema.parse(input);
    const tenant = await requireTenantContext();
    await categoryService.createIngredientCategory(tenant, data);
    revalidatePath("/dashboard/ingredients");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function archiveCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = archiveCategorySchema.parse(input);
    const tenant = await requireTenantContext();
    await categoryService.archiveIngredientCategory(tenant, data.categoryId);
    revalidatePath("/dashboard/ingredients");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createIngredientAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = createIngredientSchema.parse(input);
    const tenant = await requireTenantContext();
    await ingredientService.createIngredientForTenant(tenant, {
      ...data,
      categoryId: data.categoryId || null,
      minimumStock: data.minimumStock || null,
      notes: data.notes || null,
    });
    revalidatePath("/dashboard/ingredients");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateIngredientAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = updateIngredientSchema.parse(input);
    const tenant = await requireTenantContext();
    await ingredientService.updateIngredientForTenant(
      tenant,
      data.ingredientId,
      {
        name: data.name,
        categoryId: data.categoryId || null,
        minimumStock: data.minimumStock || null,
        notes: data.notes || null,
      },
    );
    revalidatePath("/dashboard/ingredients");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function archiveIngredientAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const data = archiveIngredientSchema.parse(input);
    const tenant = await requireTenantContext();
    await ingredientService.archiveIngredientForTenant(
      tenant,
      data.ingredientId,
    );
    revalidatePath("/dashboard/ingredients");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
