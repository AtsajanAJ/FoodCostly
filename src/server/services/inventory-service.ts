import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as inventoryRepository from "@/server/repositories/inventory-repository";
import * as unitRepository from "@/server/repositories/unit-repository";
import {
  applyStockMovement,
} from "@/server/services/inventory-movement";
import { toBaseQuantity } from "@/server/services/unit-conversion";

export async function listStockForTenant(tenant: TenantContext) {
  const balances = await inventoryRepository.listStockBalances(
    tenant.organizationId,
  );

  return balances.map((balance) => {
    const quantity = new Decimal(balance.quantityBase.toString());
    const minimum = balance.ingredient.minimumStock
      ? new Decimal(balance.ingredient.minimumStock.toString())
      : null;
    const isLowStock =
      minimum != null && quantity.gt(0) && quantity.lte(minimum);
    const isOutOfStock = quantity.lte(0);

    return {
      ...balance,
      isLowStock,
      isOutOfStock,
    };
  });
}

export async function listLedgerForTenant(
  tenant: TenantContext,
  options?: { ingredientId?: string },
) {
  return inventoryRepository.listLedgerEntries(tenant.organizationId, options);
}

async function resolveBaseQuantity(params: {
  organizationId: string;
  ingredientId: string;
  quantity: string;
  unitId: string;
}) {
  const quantity = new Decimal(params.quantity);
  if (!quantity.isFinite() || quantity.lte(0)) {
    throw new Error("Quantity must be greater than zero");
  }

  const ingredient = await prisma.ingredient.findFirst({
    where: {
      id: params.ingredientId,
      organizationId: params.organizationId,
      status: "ACTIVE",
    },
    include: { baseUnit: true },
  });

  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  const unit = await unitRepository.getUnitById(params.unitId);
  if (!unit) {
    throw new Error("Unit not found");
  }

  if (unit.dimension !== ingredient.baseUnit.dimension) {
    throw new Error(
      `Unit ${unit.code} is incompatible with ${ingredient.baseUnit.code}`,
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

  return { ingredient, unit, baseQuantity };
}

export async function recordWaste(
  tenant: TenantContext,
  input: {
    ingredientId: string;
    quantity: string;
    unitId: string;
    reason: string;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const { baseQuantity } = await resolveBaseQuantity({
    organizationId: tenant.organizationId,
    ingredientId: input.ingredientId,
    quantity: input.quantity,
    unitId: input.unitId,
  });

  const referenceId = randomUUID();

  return prisma.$transaction(async (tx) => {
    await applyStockMovement(tx, {
      organizationId: tenant.organizationId,
      ingredientId: input.ingredientId,
      quantityBaseSigned: baseQuantity.neg(),
      movementType: "WASTE",
      reason: input.reason,
      referenceType: "WASTE",
      referenceId,
      createdByUserId: tenant.userId,
    });
    return { referenceId };
  });
}

export async function recordAdjustment(
  tenant: TenantContext,
  input: {
    ingredientId: string;
    quantity: string;
    unitId: string;
    direction: "IN" | "OUT";
    reason: string;
    unitCost?: string | null;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const { baseQuantity } = await resolveBaseQuantity({
    organizationId: tenant.organizationId,
    ingredientId: input.ingredientId,
    quantity: input.quantity,
    unitId: input.unitId,
  });

  const referenceId = randomUUID();
  const signed =
    input.direction === "IN" ? baseQuantity : baseQuantity.neg();

  return prisma.$transaction(async (tx) => {
    await applyStockMovement(tx, {
      organizationId: tenant.organizationId,
      ingredientId: input.ingredientId,
      quantityBaseSigned: signed,
      unitCostForInbound:
        input.direction === "IN" ? input.unitCost || null : null,
      movementType:
        input.direction === "IN" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
      reason: input.reason,
      referenceType: "ADJUSTMENT",
      referenceId,
      createdByUserId: tenant.userId,
    });
    return { referenceId };
  });
}

export async function recordStockCount(
  tenant: TenantContext,
  input: {
    ingredientId: string;
    countedQuantity: string;
    unitId: string;
    reason: string;
  },
) {
  assertCanWriteMasterData(tenant.role);

  const { baseQuantity: countedBase } = await resolveBaseQuantity({
    organizationId: tenant.organizationId,
    ingredientId: input.ingredientId,
    quantity: input.countedQuantity,
    unitId: input.unitId,
  });

  const referenceId = randomUUID();

  return prisma.$transaction(async (tx) => {
    const balance = await tx.stockBalance.findFirst({
      where: {
        organizationId: tenant.organizationId,
        ingredientId: input.ingredientId,
      },
    });

    const currentQty = new Decimal(balance?.quantityBase.toString() ?? "0");
    const delta = countedBase.minus(currentQty).toDecimalPlaces(6);

    if (delta.eq(0)) {
      return { referenceId, delta: "0" };
    }

    await applyStockMovement(tx, {
      organizationId: tenant.organizationId,
      ingredientId: input.ingredientId,
      quantityBaseSigned: delta,
      movementType: delta.gt(0) ? "STOCK_COUNT_GAIN" : "STOCK_COUNT_LOSS",
      reason: input.reason,
      referenceType: "STOCK_COUNT",
      referenceId,
      createdByUserId: tenant.userId,
    });

    return { referenceId, delta: delta.toFixed(6) };
  });
}
