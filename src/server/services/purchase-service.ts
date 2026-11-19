import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as purchaseRepository from "@/server/repositories/purchase-repository";
import * as supplierRepository from "@/server/repositories/supplier-repository";
import * as unitRepository from "@/server/repositories/unit-repository";
import { allocatePurchaseCosts } from "@/server/services/purchase-allocation";
import { toBaseQuantity } from "@/server/services/unit-conversion";

type LineInput = {
  ingredientId: string;
  quantity: string;
  unitId: string;
  unitPrice: string;
};

async function buildComputedLines(
  organizationId: string,
  purchaseId: string,
  lines: LineInput[],
  header: {
    discountAmount: string;
    taxAmount: string;
    shippingAmount: string;
  },
) {
  if (lines.length === 0) {
    throw new Error("Purchase requires at least one line");
  }

  const computed = [];

  for (const line of lines) {
    const quantity = new Decimal(line.quantity);
    const unitPrice = new Decimal(line.unitPrice);

    if (!quantity.isFinite() || quantity.lte(0)) {
      throw new Error("Line quantity must be greater than zero");
    }
    if (!unitPrice.isFinite() || unitPrice.lt(0)) {
      throw new Error("Unit price must be a non-negative decimal");
    }

    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: line.ingredientId,
        organizationId,
        status: "ACTIVE",
      },
      include: { baseUnit: true },
    });

    if (!ingredient) {
      throw new Error("Ingredient not found in this organization");
    }

    const unit = await unitRepository.getUnitById(line.unitId);
    if (!unit) {
      throw new Error("Purchase unit not found");
    }

    if (unit.dimension !== ingredient.baseUnit.dimension) {
      throw new Error(
        `Unit ${unit.code} is incompatible with ingredient base unit ${ingredient.baseUnit.code}`,
      );
    }

    const baseQuantity = toBaseQuantity({
      quantity,
      unit: {
        id: unit.id,
        code: unit.code,
        dimension: unit.dimension,
        toBaseFactor: unit.toBaseFactor.toString(),
      },
    });

    const lineGross = quantity.mul(unitPrice).toDecimalPlaces(6);
    const lineId = randomUUID();

    computed.push({
      id: lineId,
      organizationId,
      purchaseId,
      ingredientId: ingredient.id,
      quantity: quantity.toFixed(6),
      unitId: unit.id,
      unitPrice: unitPrice.toFixed(6),
      baseQuantity: baseQuantity.toFixed(6),
      lineGross: lineGross.toFixed(6),
      allocatedDiscount: "0",
      allocatedTax: "0",
      allocatedShipping: "0",
      allocatedCost: lineGross.toFixed(6),
    });
  }

  const allocation = allocatePurchaseCosts({
    lines: computed.map((line) => ({
      id: line.id,
      lineGross: line.lineGross,
    })),
    discountAmount: header.discountAmount || "0",
    taxAmount: header.taxAmount || "0",
    shippingAmount: header.shippingAmount || "0",
  });

  const byId = new Map(allocation.map((item) => [item.id, item]));

  return computed.map((line) => {
    const allocated = byId.get(line.id)!;
    return {
      ...line,
      allocatedDiscount: allocated.allocatedDiscount.toFixed(6),
      allocatedTax: allocated.allocatedTax.toFixed(6),
      allocatedShipping: allocated.allocatedShipping.toFixed(6),
      allocatedCost: allocated.allocatedCost.toFixed(6),
    };
  });
}

export async function listPurchasesForTenant(tenant: TenantContext) {
  return purchaseRepository.listPurchases(tenant.organizationId);
}

export async function getPurchaseForTenant(
  tenant: TenantContext,
  purchaseId: string,
) {
  return purchaseRepository.getPurchaseForOrg(
    tenant.organizationId,
    purchaseId,
  );
}

export async function createDraftPurchase(
  tenant: TenantContext,
  input: {
    supplierId: string;
    purchasedAt: string;
    invoiceNumber?: string | null;
    discountAmount?: string | null;
    taxAmount?: string | null;
    shippingAmount?: string | null;
    notes?: string | null;
    lines: LineInput[];
  },
) {
  assertCanWriteMasterData(tenant.role);

  const supplier = await supplierRepository.getSupplierForOrg(
    tenant.organizationId,
    input.supplierId,
  );

  if (!supplier || supplier.archivedAt) {
    throw new Error("Supplier not found");
  }

  const purchaseId = randomUUID();
  const lines = await buildComputedLines(
    tenant.organizationId,
    purchaseId,
    input.lines,
    {
      discountAmount: input.discountAmount || "0",
      taxAmount: input.taxAmount || "0",
      shippingAmount: input.shippingAmount || "0",
    },
  );

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
  });

  return purchaseRepository.createPurchaseWithLines({
    purchase: {
      id: purchaseId,
      organizationId: tenant.organizationId,
      supplierId: supplier.id,
      purchasedAt: new Date(input.purchasedAt),
      invoiceNumber: input.invoiceNumber?.trim() || null,
      status: "DRAFT",
      currency: organization.currency || "THB",
      discountAmount: new Decimal(input.discountAmount || "0").toFixed(6),
      taxAmount: new Decimal(input.taxAmount || "0").toFixed(6),
      shippingAmount: new Decimal(input.shippingAmount || "0").toFixed(6),
      notes: input.notes?.trim() || null,
    },
    lines,
  });
}

export async function updateDraftPurchase(
  tenant: TenantContext,
  purchaseId: string,
  input: {
    supplierId: string;
    purchasedAt: string;
    invoiceNumber?: string | null;
    discountAmount?: string | null;
    taxAmount?: string | null;
    shippingAmount?: string | null;
    notes?: string | null;
    lines: LineInput[];
  },
) {
  assertCanWriteMasterData(tenant.role);

  const existing = await purchaseRepository.getPurchaseForOrg(
    tenant.organizationId,
    purchaseId,
  );

  if (!existing || existing.status !== "DRAFT") {
    throw new Error("Only draft purchases can be edited");
  }

  const supplier = await supplierRepository.getSupplierForOrg(
    tenant.organizationId,
    input.supplierId,
  );

  if (!supplier || supplier.archivedAt) {
    throw new Error("Supplier not found");
  }

  const lines = await buildComputedLines(
    tenant.organizationId,
    purchaseId,
    input.lines,
    {
      discountAmount: input.discountAmount || "0",
      taxAmount: input.taxAmount || "0",
      shippingAmount: input.shippingAmount || "0",
    },
  );

  return purchaseRepository.replaceDraftPurchaseLines({
    organizationId: tenant.organizationId,
    purchaseId,
    purchaseUpdate: {
      supplierId: supplier.id,
      purchasedAt: new Date(input.purchasedAt),
      invoiceNumber: input.invoiceNumber?.trim() || null,
      discountAmount: new Decimal(input.discountAmount || "0").toFixed(6),
      taxAmount: new Decimal(input.taxAmount || "0").toFixed(6),
      shippingAmount: new Decimal(input.shippingAmount || "0").toFixed(6),
      notes: input.notes?.trim() || null,
    },
    lines,
  });
}

/**
 * Receive a draft purchase atomically:
 * - mark RECEIVED exactly once
 * - write ledger entries per line
 * - upsert stock balances
 * - update MWAC valuationCost + latestPurchaseCost
 */
export async function receivePurchase(
  tenant: TenantContext,
  purchaseId: string,
) {
  assertCanWriteMasterData(tenant.role);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: {
        id: purchaseId,
        organizationId: tenant.organizationId,
      },
      include: {
        lines: true,
      },
    });

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    if (purchase.status === "RECEIVED") {
      // Idempotent: already received, return current record.
      return tx.purchase.findFirstOrThrow({
        where: { id: purchaseId, organizationId: tenant.organizationId },
        include: {
          supplier: true,
          lines: {
            include: { ingredient: true, unit: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    if (purchase.status !== "DRAFT") {
      throw new Error("Only draft purchases can be received");
    }

    if (purchase.lines.length === 0) {
      throw new Error("Cannot receive a purchase with no lines");
    }

    const occurredAt = new Date();

    for (const line of purchase.lines) {
      const baseQuantity = new Decimal(line.baseQuantity.toString());
      const allocatedCost = new Decimal(line.allocatedCost.toString());

      if (baseQuantity.lte(0)) {
        throw new Error("Received base quantity must be greater than zero");
      }

      const baseUnitCost = allocatedCost.div(baseQuantity).toDecimalPlaces(6);

      const existingBalance = await tx.stockBalance.findFirst({
        where: {
          organizationId: tenant.organizationId,
          ingredientId: line.ingredientId,
        },
      });

      const existingQty = new Decimal(
        existingBalance?.quantityBase.toString() ?? "0",
      );
      const existingValue = new Decimal(
        existingBalance?.valueTotal.toString() ?? "0",
      );

      const newQty = existingQty.plus(baseQuantity);
      const newValue = existingValue.plus(allocatedCost);
      const newAverage = newQty.gt(0)
        ? newValue.div(newQty).toDecimalPlaces(6)
        : new Decimal(0);

      if (existingBalance) {
        await tx.stockBalance.update({
          where: { id: existingBalance.id },
          data: {
            quantityBase: newQty.toFixed(6),
            valueTotal: newValue.toFixed(6),
          },
        });
      } else {
        await tx.stockBalance.create({
          data: {
            id: randomUUID(),
            organizationId: tenant.organizationId,
            ingredientId: line.ingredientId,
            quantityBase: newQty.toFixed(6),
            valueTotal: newValue.toFixed(6),
          },
        });
      }

      await tx.inventoryLedgerEntry.create({
        data: {
          id: randomUUID(),
          organizationId: tenant.organizationId,
          ingredientId: line.ingredientId,
          movementType: "PURCHASE_RECEIPT",
          quantityBase: baseQuantity.toFixed(6),
          unitCost: baseUnitCost.toFixed(6),
          totalCost: allocatedCost.toFixed(6),
          balanceQuantityAfter: newQty.toFixed(6),
          balanceValueAfter: newValue.toFixed(6),
          occurredAt,
          reason: "Purchase received",
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          lineReferenceId: line.id,
          createdByUserId: tenant.userId,
        },
      });

      await tx.purchaseLine.update({
        where: { id: line.id },
        data: {
          baseUnitCost: baseUnitCost.toFixed(6),
        },
      });

      await tx.ingredient.update({
        where: { id: line.ingredientId },
        data: {
          latestPurchaseCost: baseUnitCost.toFixed(6),
          valuationCost: newAverage.toFixed(6),
        },
      });
    }

    const updated = await tx.purchase.updateMany({
      where: {
        id: purchase.id,
        organizationId: tenant.organizationId,
        status: "DRAFT",
      },
      data: {
        status: "RECEIVED",
        receivedAt: occurredAt,
        receivedByUserId: tenant.userId,
      },
    });

    if (updated.count !== 1) {
      throw new Error("Purchase was already received by another request");
    }

    return tx.purchase.findFirstOrThrow({
      where: { id: purchaseId, organizationId: tenant.organizationId },
      include: {
        supplier: true,
        lines: {
          include: { ingredient: true, unit: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });
}
