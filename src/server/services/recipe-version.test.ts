import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as recipeService from "@/server/services/recipe-service";

const ids = {
  user: "test_user_recipe_version",
  org: "test_org_recipe_version",
  member: "test_member_recipe_version",
  ingredient: "test_ingredient_recipe_version",
};

const tenant: TenantContext = {
  userId: ids.user,
  userEmail: "recipe-version@example.com",
  userName: "Recipe Tester",
  organizationId: ids.org,
  organizationName: "Recipe Org",
  organizationSlug: "recipe-org-version",
  role: "owner",
  sessionId: "test_session_recipe_version",
};

describe("recipe version snapshots", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.create({
      data: {
        id: ids.user,
        name: "Recipe Tester",
        email: "recipe-version@example.com",
        emailVerified: true,
      },
    });
    await prisma.organization.create({
      data: {
        id: ids.org,
        name: "Recipe Org",
        slug: "recipe-org-version",
        createdAt: new Date(),
      },
    });
    await prisma.member.create({
      data: {
        id: ids.member,
        organizationId: ids.org,
        userId: ids.user,
        role: "owner",
        createdAt: new Date(),
      },
    });
    await prisma.ingredient.create({
      data: {
        id: ids.ingredient,
        organizationId: ids.org,
        name: "Flour",
        baseUnitId: "unit_g",
        valuationCost: "0.05",
      },
    });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("freezes snapshot costs when ingredient MWAC changes later", async () => {
    const recipe = await recipeService.createRecipe(tenant, {
      name: "Test Loaf",
      portionCount: "2",
      lines: [
        {
          ingredientId: ids.ingredient,
          quantity: "100",
          unitId: "unit_g",
          yieldPercent: "100",
        },
      ],
    });

    const version = await recipeService.publishRecipeVersion(
      tenant,
      recipe.id,
      "v1",
    );

    expect(version.totalCost.toString()).toBe("5");
    expect(version.costPerPortion.toString()).toBe("2.5");
    expect(version.items[0]?.unitCostSnapshot.toString()).toBe("0.05");

    await prisma.ingredient.update({
      where: { id: ids.ingredient },
      data: { valuationCost: "0.20" },
    });

    const frozen = await prisma.recipeVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: { items: true },
    });

    expect(frozen.totalCost.toString()).toBe("5");
    expect(frozen.items[0]?.unitCostSnapshot.toString()).toBe("0.05");

    const live = await recipeService.computeLiveRecipeCost(tenant, recipe.id);
    expect(live.totalCost.toString()).toBe("20");
  });
});

async function cleanup() {
  await prisma.recipeVersionItem.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.recipeVersion.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.recipeItem.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.menuItem.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.recipe.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.ingredient.deleteMany({ where: { id: ids.ingredient } });
  await prisma.member.deleteMany({ where: { id: ids.member } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.user.deleteMany({ where: { id: ids.user } });
}
