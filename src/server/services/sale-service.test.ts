import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import type { TenantContext } from "@/server/permissions/tenant-context";
import { InsufficientStockError } from "@/server/services/inventory-movement";
import * as inventoryService from "@/server/services/inventory-service";
import * as menuService from "@/server/services/menu-service";
import * as purchaseService from "@/server/services/purchase-service";
import * as recipeService from "@/server/services/recipe-service";
import * as saleService from "@/server/services/sale-service";

const ids = {
  user: "test_user_sale_sprint6",
  org: "test_org_sale_sprint6",
  member: "test_member_sale_sprint6",
  supplier: "test_supplier_sale_sprint6",
  ingredient: "test_ingredient_sale_sprint6",
  recipe: "",
  menuItem: "",
};

const tenant: TenantContext = {
  userId: ids.user,
  userEmail: "sale-sprint6@example.com",
  userName: "Sale Tester",
  organizationId: ids.org,
  organizationName: "Sale Org",
  organizationSlug: "sale-org-sprint6",
  role: "owner",
  sessionId: "test_session_sale_sprint6",
};

async function cleanup() {
  await prisma.inventoryLedgerEntry.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.saleStockConsumption.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.saleItem.deleteMany({ where: { organizationId: ids.org } });
  await prisma.sale.deleteMany({ where: { organizationId: ids.org } });
  await prisma.saleChannel.deleteMany({ where: { organizationId: ids.org } });
  await prisma.menuItem.deleteMany({ where: { organizationId: ids.org } });
  await prisma.recipeVersionItem.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.recipeVersion.deleteMany({ where: { organizationId: ids.org } });
  await prisma.recipeItem.deleteMany({ where: { organizationId: ids.org } });
  await prisma.recipe.deleteMany({ where: { organizationId: ids.org } });
  await prisma.purchaseLine.deleteMany({ where: { organizationId: ids.org } });
  await prisma.purchase.deleteMany({ where: { organizationId: ids.org } });
  await prisma.stockBalance.deleteMany({ where: { organizationId: ids.org } });
  await prisma.ingredient.deleteMany({ where: { organizationId: ids.org } });
  await prisma.supplier.deleteMany({ where: { organizationId: ids.org } });
  await prisma.member.deleteMany({ where: { organizationId: ids.org } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.user.deleteMany({ where: { id: ids.user } });
}

describe("sale posting and cancellation", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.create({
      data: {
        id: ids.user,
        name: "Sale Tester",
        email: "sale-sprint6@example.com",
        emailVerified: true,
      },
    });
    await prisma.organization.create({
      data: {
        id: ids.org,
        name: "Sale Org",
        slug: "sale-org-sprint6",
        createdAt: new Date(),
        currency: "THB",
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
    await prisma.supplier.create({
      data: {
        id: ids.supplier,
        organizationId: ids.org,
        name: "Sale Supplier",
      },
    });
    await prisma.ingredient.create({
      data: {
        id: ids.ingredient,
        organizationId: ids.org,
        name: "Flour",
        baseUnitId: "unit_g",
      },
    });

    const purchase = await purchaseService.createDraftPurchase(tenant, {
      supplierId: ids.supplier,
      purchasedAt: new Date().toISOString(),
      lines: [
        {
          ingredientId: ids.ingredient,
          quantity: "1000",
          unitId: "unit_g",
          unitPrice: "0.05",
        },
      ],
    });
    await purchaseService.receivePurchase(tenant, purchase.id);

    const recipe = await recipeService.createRecipe(tenant, {
      name: "Bun",
      portionCount: "1",
      lines: [
        {
          ingredientId: ids.ingredient,
          quantity: "100",
          unitId: "unit_g",
          yieldPercent: "100",
        },
      ],
    });
    ids.recipe = recipe.id;
    await recipeService.publishRecipeVersion(tenant, recipe.id, "v1");

    const menuItem = await menuService.createMenuItemForTenant(tenant, {
      name: "Bun item",
      recipeId: recipe.id,
      pinLatestVersion: true,
      priceInStore: "40",
      priceDelivery: "45",
    });
    ids.menuItem = menuItem.id;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  });

  it("posts a sale, deducts stock, and is idempotent", async () => {
    const channels = await saleService.listChannelsForTenant(tenant);
    const instore = channels.find((channel) => channel.code === "INSTORE")!;

    const first = await saleService.createSale(tenant, {
      channelId: instore.id,
      idempotencyKey: "sale-key-1",
      lines: [{ menuItemId: ids.menuItem, quantity: "2" }],
    });

    expect(first.status).toBe("POSTED");
    expect(first.grossRevenue.toString()).toBe("80");
    expect(new Decimal(first.foodCostTotal.toString()).gt(0)).toBe(true);

    const balance = await inventoryService.listStockForTenant(tenant);
    const flour = balance.find((row) => row.ingredientId === ids.ingredient)!;
    expect(new Decimal(flour.quantityBase.toString()).toFixed(6)).toBe(
      "800.000000",
    );

    const again = await saleService.createSale(tenant, {
      channelId: instore.id,
      idempotencyKey: "sale-key-1",
      lines: [{ menuItemId: ids.menuItem, quantity: "2" }],
    });
    expect(again.id).toBe(first.id);

    const balanceAgain = await inventoryService.listStockForTenant(tenant);
    const flourAgain = balanceAgain.find(
      (row) => row.ingredientId === ids.ingredient,
    )!;
    expect(new Decimal(flourAgain.quantityBase.toString()).toFixed(6)).toBe(
      "800.000000",
    );
  });

  it("rejects sales that would make stock negative", async () => {
    const channels = await saleService.listChannelsForTenant(tenant);
    const instore = channels.find((channel) => channel.code === "INSTORE")!;

    await expect(
      saleService.createSale(tenant, {
        channelId: instore.id,
        idempotencyKey: "sale-key-oversell",
        lines: [{ menuItemId: ids.menuItem, quantity: "20" }],
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    const sales = await saleService.listSalesForTenant(tenant);
    expect(sales.some((sale) => sale.idempotencyKey === "sale-key-oversell")).toBe(
      false,
    );
  });

  it("cancels a sale with stock reversal and is idempotent", async () => {
    const channels = await saleService.listChannelsForTenant(tenant);
    const instore = channels.find((channel) => channel.code === "INSTORE")!;

    const sale = await saleService.createSale(tenant, {
      channelId: instore.id,
      idempotencyKey: "sale-key-cancel",
      lines: [{ menuItemId: ids.menuItem, quantity: "1" }],
    });

    const before = await inventoryService.listStockForTenant(tenant);
    const qtyBefore = new Decimal(
      before.find((row) => row.ingredientId === ids.ingredient)!.quantityBase.toString(),
    );

    const cancelled = await saleService.cancelSale(
      tenant,
      sale.id,
      "Customer refund",
    );
    expect(cancelled.status).toBe("CANCELLED");

    const after = await inventoryService.listStockForTenant(tenant);
    const qtyAfter = new Decimal(
      after.find((row) => row.ingredientId === ids.ingredient)!.quantityBase.toString(),
    );
    expect(qtyAfter.minus(qtyBefore).toString()).toBe("100");

    const again = await saleService.cancelSale(
      tenant,
      sale.id,
      "Customer refund again",
    );
    expect(again.status).toBe("CANCELLED");
  });
});
