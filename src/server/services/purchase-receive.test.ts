import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as purchaseService from "@/server/services/purchase-service";

const ids = {
  user: "test_user_purchase_receive",
  org: "test_org_purchase_receive",
  member: "test_member_purchase_receive",
  supplier: "test_supplier_purchase_receive",
  ingredient: "test_ingredient_purchase_receive",
};

const tenant: TenantContext = {
  userId: ids.user,
  userEmail: "purchase-receive@example.com",
  userName: "Purchase Tester",
  organizationId: ids.org,
  organizationName: "Purchase Org",
  organizationSlug: "purchase-org-receive",
  role: "owner",
  sessionId: "test_session_purchase_receive",
};

describe("purchase receive workflow", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.create({
      data: {
        id: ids.user,
        name: "Purchase Tester",
        email: "purchase-receive@example.com",
        emailVerified: true,
      },
    });

    await prisma.organization.create({
      data: {
        id: ids.org,
        name: "Purchase Org",
        slug: "purchase-org-receive",
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
        name: "Test Mill",
      },
    });

    await prisma.ingredient.create({
      data: {
        id: ids.ingredient,
        organizationId: ids.org,
        name: "Bread Flour",
        baseUnitId: "unit_g",
      },
    });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("converts purchase qty, receives once, and updates MWAC", async () => {
    const draft = await purchaseService.createDraftPurchase(tenant, {
      supplierId: ids.supplier,
      purchasedAt: new Date().toISOString(),
      discountAmount: "0",
      taxAmount: "0",
      shippingAmount: "0",
      lines: [
        {
          ingredientId: ids.ingredient,
          quantity: "2",
          unitId: "unit_kg",
          unitPrice: "50",
        },
      ],
    });

    expect(draft.lines[0]?.baseQuantity.toString()).toBe("2000");
    expect(draft.lines[0]?.allocatedCost.toString()).toBe("100");

    const received = await purchaseService.receivePurchase(tenant, draft.id);
    expect(received.status).toBe("RECEIVED");

    const again = await purchaseService.receivePurchase(tenant, draft.id);
    expect(again.status).toBe("RECEIVED");

    const ledgerCount = await prisma.inventoryLedgerEntry.count({
      where: {
        organizationId: ids.org,
        referenceType: "PURCHASE",
        referenceId: draft.id,
      },
    });
    expect(ledgerCount).toBe(1);

    const balance = await prisma.stockBalance.findFirstOrThrow({
      where: {
        organizationId: ids.org,
        ingredientId: ids.ingredient,
      },
    });

    expect(balance.quantityBase.toString()).toBe("2000");
    expect(balance.valueTotal.toString()).toBe("100");

    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { id: ids.ingredient },
    });

    expect(new Decimal(ingredient.latestPurchaseCost!.toString()).toString()).toBe(
      "0.05",
    );
    expect(new Decimal(ingredient.valuationCost!.toString()).toString()).toBe(
      "0.05",
    );

    // Historical purchase line cost must remain unchanged after later purchase.
    const second = await purchaseService.createDraftPurchase(tenant, {
      supplierId: ids.supplier,
      purchasedAt: new Date().toISOString(),
      lines: [
        {
          ingredientId: ids.ingredient,
          quantity: "1",
          unitId: "unit_kg",
          unitPrice: "80",
        },
      ],
    });
    await purchaseService.receivePurchase(tenant, second.id);

    const firstLine = await prisma.purchaseLine.findFirstOrThrow({
      where: { purchaseId: draft.id },
    });
    expect(firstLine.unitPrice.toString()).toBe("50");
    expect(firstLine.allocatedCost.toString()).toBe("100");
    expect(firstLine.baseUnitCost!.toString()).toBe("0.05");
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
  await prisma.ingredient.deleteMany({
    where: { id: ids.ingredient },
  });
  await prisma.supplier.deleteMany({
    where: { id: ids.supplier },
  });
  await prisma.member.deleteMany({
    where: { id: ids.member },
  });
  await prisma.organization.deleteMany({
    where: { id: ids.org },
  });
  await prisma.user.deleteMany({
    where: { id: ids.user },
  });
}
