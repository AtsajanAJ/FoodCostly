import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import type { InventoryMovementType, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class InsufficientStockError extends Error {
  readonly status = 409;

  constructor(message = "Insufficient stock for this operation") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

/**
 * Apply one stock movement inside an existing transaction.
 * quantityBaseSigned > 0 increases stock; < 0 decreases stock.
 * Outbound movements value stock at the current MWAC average.
 * Inbound movements use the provided unitCost.
 */
export async function applyStockMovement(
  tx: Tx,
  params: {
    organizationId: string;
    ingredientId: string;
    quantityBaseSigned: Decimal.Value;
    unitCostForInbound?: Decimal.Value | null;
    movementType: InventoryMovementType;
    reason: string;
    referenceType: string;
    referenceId: string;
    lineReferenceId?: string | null;
    createdByUserId: string;
    occurredAt?: Date;
  },
) {
  const delta = new Decimal(params.quantityBaseSigned);
  if (!delta.isFinite() || delta.eq(0)) {
    throw new Error("Stock movement quantity must be a non-zero decimal");
  }

  const reason = params.reason.trim();
  if (!reason) {
    throw new Error("A reason is required for inventory movements");
  }

  const ingredient = await tx.ingredient.findFirst({
    where: {
      id: params.ingredientId,
      organizationId: params.organizationId,
    },
  });

  if (!ingredient) {
    throw new Error("Ingredient not found in this organization");
  }

  const existingBalance = await tx.stockBalance.findFirst({
    where: {
      organizationId: params.organizationId,
      ingredientId: params.ingredientId,
    },
  });

  const existingQty = new Decimal(
    existingBalance?.quantityBase.toString() ?? "0",
  );
  const existingValue = new Decimal(
    existingBalance?.valueTotal.toString() ?? "0",
  );

  const currentAverage = existingQty.gt(0)
    ? existingValue.div(existingQty)
    : new Decimal(ingredient.valuationCost?.toString() ?? "0");

  let unitCost: Decimal;
  let totalCost: Decimal;
  let newQty: Decimal;
  let newValue: Decimal;

  if (delta.gt(0)) {
    unitCost = new Decimal(
      params.unitCostForInbound ?? currentAverage.toString(),
    );
    if (!unitCost.isFinite() || unitCost.lt(0)) {
      throw new Error("Inbound unit cost must be a non-negative decimal");
    }
    totalCost = delta.mul(unitCost).toDecimalPlaces(6);
    newQty = existingQty.plus(delta);
    newValue = existingValue.plus(totalCost);
  } else {
    const outboundQty = delta.abs();
    if (existingQty.lt(outboundQty)) {
      throw new InsufficientStockError(
        `Insufficient stock for ${ingredient.name}: have ${existingQty.toFixed(6)}, need ${outboundQty.toFixed(6)}`,
      );
    }
    unitCost = currentAverage.toDecimalPlaces(6);
    totalCost = outboundQty.mul(unitCost).toDecimalPlaces(6).neg();
    newQty = existingQty.minus(outboundQty);
    newValue = existingValue.minus(outboundQty.mul(unitCost));
    if (newQty.eq(0)) {
      newValue = new Decimal(0);
    }
  }

  if (newQty.lt(0)) {
    throw new InsufficientStockError();
  }

  newQty = newQty.toDecimalPlaces(6);
  newValue = newValue.toDecimalPlaces(6);
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
        organizationId: params.organizationId,
        ingredientId: params.ingredientId,
        quantityBase: newQty.toFixed(6),
        valueTotal: newValue.toFixed(6),
      },
    });
  }

  await tx.inventoryLedgerEntry.create({
    data: {
      id: randomUUID(),
      organizationId: params.organizationId,
      ingredientId: params.ingredientId,
      movementType: params.movementType,
      quantityBase: delta.toFixed(6),
      unitCost: unitCost.toFixed(6),
      totalCost: totalCost.toFixed(6),
      balanceQuantityAfter: newQty.toFixed(6),
      balanceValueAfter: newValue.toFixed(6),
      occurredAt: params.occurredAt ?? new Date(),
      reason,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      lineReferenceId: params.lineReferenceId ?? null,
      createdByUserId: params.createdByUserId,
    },
  });

  await tx.ingredient.update({
    where: { id: params.ingredientId },
    data: {
      valuationCost: newAverage.toFixed(6),
    },
  });

  return {
    quantityAfter: newQty,
    valueAfter: newValue,
    averageCost: newAverage,
  };
}
