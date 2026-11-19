import type { IngredientStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function listIngredients(
  organizationId: string,
  options?: { includeArchived?: boolean },
) {
  return prisma.ingredient.findMany({
    where: {
      organizationId,
      ...(options?.includeArchived
        ? {}
        : { status: "ACTIVE", archivedAt: null }),
    },
    include: {
      baseUnit: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getIngredientForOrg(
  organizationId: string,
  ingredientId: string,
) {
  return prisma.ingredient.findFirst({
    where: { id: ingredientId, organizationId },
    include: {
      baseUnit: true,
      category: true,
    },
  });
}

export async function createIngredient(
  data: Prisma.IngredientUncheckedCreateInput,
) {
  return prisma.ingredient.create({
    data,
    include: {
      baseUnit: true,
      category: true,
    },
  });
}

export async function updateIngredientForOrg(
  organizationId: string,
  ingredientId: string,
  data: Prisma.IngredientUncheckedUpdateInput,
) {
  return prisma.ingredient.updateMany({
    where: { id: ingredientId, organizationId },
    data,
  });
}

export async function archiveIngredient(
  organizationId: string,
  ingredientId: string,
) {
  return prisma.ingredient.updateMany({
    where: {
      id: ingredientId,
      organizationId,
      status: "ACTIVE",
    },
    data: {
      status: "ARCHIVED" satisfies IngredientStatus,
      archivedAt: new Date(),
    },
  });
}
