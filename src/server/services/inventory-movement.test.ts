import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as inventoryRepository from "@/server/repositories/inventory-repository";
import {
  InsufficientStockError,
} from "@/server/services/inventory-movement";
import * as inventoryService from "@/server/services/inventory-service";
import * as purchaseService from "@/server/services/purchase-service";

const ids = {
  user: "test_user_inventory_sprint4",
  org: "test_org_inventory_sprint4",
  member: "test_member_inventory_sprint4",
  supplier: "test_supplier_inventory_sprint4",
  ingredient: "test_ingredient_inventory_sprint4",
};

const tenant: TenantContext = {
  userId: ids.user,
  userEmail: "inventory-sprint4@example.com",
  userName: "Inventory Tester",
  organizationId: ids.org,
  organizationName: "Inventory Org",
  organizationSlug: "inventory-org-sprint4",
  role: "owner",
  sessionId: "test_session_inventory_sprint4",
};

describe("inventory movements", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.create({
      data: {
        id: ids.user,
        name: "Inventory Tester",
        email: "inventory-sprint4@example.com",
        emailVerified: true,
      },
    });
    await prisma.organization.create({
      data: {
        id: ids.org,
        name: "Inventory Org",
        slug: "inventory-org-sprint4",
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
        name: "Inventory Supplier",
      },
    });
    await prisma.ingredient.create({
      data: {
        id: ids.ingredient,
        organizationId: ids.org,
        name: "Sugar",
        baseUnitId: "unit_g",
        minimumStock: "500",
      },
    });

    const purchase = await purchaseService.createDraftPurchase(tenant, {
      supplierId: ids.supplier,
      purchasedAt: new Date().toISOString(),
      lines: [
        {
          ingredientId: ids.ingredient,
          quantity: "1",
          unitId: "unit_kg",
          unitPrice: "40",
        },
      ],
    });
    await purchaseService.receivePurchase(tenant, purchase.id);
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("rejects waste that would make stock negative", async () => {
    await expect(
      inventoryService.recordWaste(tenant, {
        ingredientId: ids.ingredient,
        quantity: "2",
        unitId: "unit_kg",
        reason: "Too much waste",
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it("records waste as a compensating outbound movement", async () => {
    await inventoryService.recordWaste(tenant, {
      ingredientId: ids.ingredient,
      quantity: "200",
      unitId: "unit_g",
      reason: "Spoilage",
    });

    const balance = await prisma.stockBalance.findFirstOrThrow({
      where: {
        organizationId: ids.org,
        ingredientId: ids.ingredient,
      },
    });
    expect(balance.quantityBase.toString()).toBe("800");

    const ledgerSum = await inventoryRepository.sumLedgerQuantity(
      ids.org,
      ids.ingredient,
    );
    expect(new Decimal(ledgerSum!.toString()).toString()).toBe("800");
  });

  it("applies stock count as a compensating delta", async () => {
    await inventoryService.recordStockCount(tenant, {
      ingredientId: ids.ingredient,
      countedQuantity: "750",
      unitId: "unit_g",
      reason: "Weekly count",
    });

    const balance = await prisma.stockBalance.findFirstOrThrow({
      where: {
        organizationId: ids.org,
        ingredientId: ids.ingredient,
      },
    });
    expect(balance.quantityBase.toString()).toBe("750");

    const ledgerSum = await inventoryRepository.sumLedgerQuantity(
      ids.org,
      ids.ingredient,
    );
    expect(new Decimal(ledgerSum!.toString()).toString()).toBe("750");
  });

  it("marks low stock when at or below minimum threshold", async () => {
    await inventoryService.recordStockCount(tenant, {
      ingredientId: ids.ingredient,
      countedQuantity: "500",
      unitId: "unit_g",
      reason: "Count to minimum",
    });

    const rows = await inventoryService.listStockForTenant(tenant);
    const sugar = rows.find((row) => row.ingredientId === ids.ingredient);
    expect(sugar?.isLowStock).toBe(true);
  });
});

async function cleanup() {
  await prisma.inventoryLedgerEntry.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.stockBalance.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.purchaseLine.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.purchase.deleteMany({
    where: { organizationId: ids.org },
  });
  await prisma.ingredient.deleteMany({ where: { id: ids.ingredient } });
  await prisma.supplier.deleteMany({ where: { id: ids.supplier } });
  await prisma.member.deleteMany({ where: { id: ids.member } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.user.deleteMany({ where: { id: ids.user } });
}
