import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import * as ingredientRepository from "@/server/repositories/ingredient-repository";

const ids = {
  userA: "test_user_a_ingredient_iso",
  userB: "test_user_b_ingredient_iso",
  orgA: "test_org_a_ingredient_iso",
  orgB: "test_org_b_ingredient_iso",
  memberA: "test_member_a_ingredient_iso",
  memberB: "test_member_b_ingredient_iso",
  ingredientA: "test_ingredient_a_iso",
  ingredientB: "test_ingredient_b_iso",
};

describe("ingredient tenant isolation", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.createMany({
      data: [
        {
          id: ids.userA,
          name: "User A",
          email: "user-a-ingredient-iso@example.com",
          emailVerified: true,
        },
        {
          id: ids.userB,
          name: "User B",
          email: "user-b-ingredient-iso@example.com",
          emailVerified: true,
        },
      ],
    });

    await prisma.organization.createMany({
      data: [
        {
          id: ids.orgA,
          name: "Org A",
          slug: "org-a-ingredient-iso",
          createdAt: new Date(),
        },
        {
          id: ids.orgB,
          name: "Org B",
          slug: "org-b-ingredient-iso",
          createdAt: new Date(),
        },
      ],
    });

    await prisma.member.createMany({
      data: [
        {
          id: ids.memberA,
          organizationId: ids.orgA,
          userId: ids.userA,
          role: "owner",
          createdAt: new Date(),
        },
        {
          id: ids.memberB,
          organizationId: ids.orgB,
          userId: ids.userB,
          role: "owner",
          createdAt: new Date(),
        },
      ],
    });

    await prisma.ingredient.createMany({
      data: [
        {
          id: ids.ingredientA,
          organizationId: ids.orgA,
          name: "Flour A",
          baseUnitId: "unit_g",
        },
        {
          id: ids.ingredientB,
          organizationId: ids.orgB,
          name: "Flour B",
          baseUnitId: "unit_g",
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("lists only the active organization ingredients", async () => {
    const orgAIngredients = await ingredientRepository.listIngredients(ids.orgA);
    expect(orgAIngredients.map((item) => item.id)).toEqual([ids.ingredientA]);
  });

  it("cannot load another organization ingredient by id", async () => {
    const stolen = await ingredientRepository.getIngredientForOrg(
      ids.orgA,
      ids.ingredientB,
    );
    expect(stolen).toBeNull();
  });
});

async function cleanup() {
  await prisma.ingredient.deleteMany({
    where: { id: { in: [ids.ingredientA, ids.ingredientB] } },
  });
  await prisma.member.deleteMany({
    where: { id: { in: [ids.memberA, ids.memberB] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [ids.orgA, ids.orgB] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [ids.userA, ids.userB] } },
  });
}
