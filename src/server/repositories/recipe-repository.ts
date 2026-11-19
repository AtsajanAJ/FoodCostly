import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function listRecipes(organizationId: string) {
  return prisma.recipe.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: {
      items: {
        include: { ingredient: true, unit: true },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRecipeForOrg(organizationId: string, recipeId: string) {
  return prisma.recipe.findFirst({
    where: { id: recipeId, organizationId },
    include: {
      items: {
        include: {
          ingredient: true,
          unit: true,
        },
        orderBy: { createdAt: "asc" },
      },
      versions: {
        include: {
          items: {
            include: { ingredient: true, unit: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
    },
  });
}

export async function createRecipeWithItems(data: {
  recipe: Prisma.RecipeUncheckedCreateInput;
  items: Prisma.RecipeItemUncheckedCreateInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.create({ data: data.recipe });
    if (data.items.length > 0) {
      await tx.recipeItem.createMany({ data: data.items });
    }
    return getRecipeInTx(tx, recipe.organizationId, recipe.id);
  });
}

export async function replaceRecipeItems(params: {
  organizationId: string;
  recipeId: string;
  recipeUpdate: Prisma.RecipeUncheckedUpdateInput;
  items: Prisma.RecipeItemUncheckedCreateInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.recipe.findFirst({
      where: {
        id: params.recipeId,
        organizationId: params.organizationId,
        status: "ACTIVE",
      },
    });
    if (!existing) {
      throw new Error("Recipe not found");
    }

    await tx.recipe.update({
      where: { id: params.recipeId },
      data: params.recipeUpdate,
    });
    await tx.recipeItem.deleteMany({
      where: {
        recipeId: params.recipeId,
        organizationId: params.organizationId,
      },
    });
    if (params.items.length > 0) {
      await tx.recipeItem.createMany({ data: params.items });
    }
    return getRecipeInTx(tx, params.organizationId, params.recipeId);
  });
}

export async function createRecipeVersion(data: {
  version: Prisma.RecipeVersionUncheckedCreateInput;
  items: Prisma.RecipeVersionItemUncheckedCreateInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const version = await tx.recipeVersion.create({ data: data.version });
    await tx.recipeVersionItem.createMany({ data: data.items });
    return tx.recipeVersion.findFirstOrThrow({
      where: { id: version.id },
      include: {
        items: {
          include: { ingredient: true, unit: true },
        },
      },
    });
  });
}

async function getRecipeInTx(
  tx: Prisma.TransactionClient,
  organizationId: string,
  recipeId: string,
) {
  return tx.recipe.findFirstOrThrow({
    where: { id: recipeId, organizationId },
    include: {
      items: {
        include: { ingredient: true, unit: true },
        orderBy: { createdAt: "asc" },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
      },
    },
  });
}
