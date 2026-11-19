import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import { assertCanWriteMasterData } from "@/server/permissions/roles";
import type { TenantContext } from "@/server/permissions/tenant-context";
import * as saleRepository from "@/server/repositories/sale-repository";
import {
  applyStockMovement,
  InsufficientStockError,
} from "@/server/services/inventory-movement";
import { calculateSaleProfitability } from "@/server/services/sale-profitability";

type SaleLineInput = {
  menuItemId: string;
  quantity: string;
};

type BuiltLine = {
  itemId: string;
  menuItemId: string;
  menuItemName: string;
  recipeId: string;
  recipeVersionId: string | null;
  quantity: Decimal;
  unitPrice: Decimal;
  foodCost: Decimal;
  consumptions: Array<{
    id: string;
    ingredientId: string;
    quantityBase: Decimal;
    unitCostSnapshot: Decimal;
    totalCostSnapshot: Decimal;
  }>;
};

function channelPriceFor(
  channelCode: string,
  menuItem: { priceInStore: { toString(): string } | null; priceDelivery: { toString(): string } | null },
) {
  if (channelCode === "DELIVERY") {
    return menuItem.priceDelivery?.toString() ?? null;
  }
  return menuItem.priceInStore?.toString() ?? null;
}

async function buildSaleLines(
  organizationId: string,
  channelCode: string,
  lines: SaleLineInput[],
): Promise<BuiltLine[]> {
  if (lines.length === 0) {
    throw new Error("Sale requires at least one menu item");
  }

  const built: BuiltLine[] = [];

  for (const line of lines) {
    const quantity = new Decimal(line.quantity);
    if (!quantity.isFinite() || quantity.lte(0)) {
      throw new Error("Sale quantity must be greater than zero");
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: line.menuItemId,
        organizationId,
        status: "ACTIVE",
      },
      include: {
        recipe: {
          include: {
            items: {
              include: { ingredient: true, unit: true },
            },
            versions: {
              include: { items: true },
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
        recipeVersion: {
          include: { items: true },
        },
      },
    });

    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    const unitPriceRaw = channelPriceFor(channelCode, menuItem);
    if (unitPriceRaw == null) {
      throw new Error(
        `Menu item "${menuItem.name}" has no price for channel ${channelCode}`,
      );
    }
    const unitPrice = new Decimal(unitPriceRaw);
    if (!unitPrice.isFinite() || unitPrice.lt(0)) {
      throw new Error(`Invalid price for menu item "${menuItem.name}"`);
    }

    const version =
      menuItem.recipeVersion ?? menuItem.recipe.versions[0] ?? null;

    const itemId = randomUUID();
    const portionCount = new Decimal(
      version?.portionCount.toString() ??
        menuItem.recipe.portionCount.toString(),
    );
    if (!portionCount.isFinite() || portionCount.lte(0)) {
      throw new Error("Recipe portion count must be greater than zero");
    }
    const scale = quantity.div(portionCount);

    let foodCost = new Decimal(0);
    const consumptions: BuiltLine["consumptions"] = [];

    if (version) {
      for (const versionItem of version.items) {
        const requiredBase = new Decimal(
          versionItem.requiredBaseQuantity.toString(),
        )
          .mul(scale)
          .toDecimalPlaces(6);
        const unitCost = new Decimal(versionItem.unitCostSnapshot.toString());
        const lineFood = requiredBase.mul(unitCost).toDecimalPlaces(6);
        foodCost = foodCost.plus(lineFood);
        consumptions.push({
          id: randomUUID(),
          ingredientId: versionItem.ingredientId,
          quantityBase: requiredBase,
          unitCostSnapshot: unitCost.toDecimalPlaces(6),
          totalCostSnapshot: lineFood,
        });
      }
    } else {
      for (const recipeItem of menuItem.recipe.items) {
        const qty = new Decimal(recipeItem.quantity.toString());
        const yieldPercent = new Decimal(recipeItem.yieldPercent.toString());
        const baseQuantity = qty
          .mul(recipeItem.unit.toBaseFactor.toString())
          .toDecimalPlaces(6);
        const requiredBase = baseQuantity
          .div(yieldPercent.div(100))
          .mul(scale)
          .toDecimalPlaces(6);
        const unitCost = new Decimal(
          recipeItem.ingredient.valuationCost?.toString() ?? "0",
        );
        const lineFood = requiredBase.mul(unitCost).toDecimalPlaces(6);
        foodCost = foodCost.plus(lineFood);
        consumptions.push({
          id: randomUUID(),
          ingredientId: recipeItem.ingredientId,
          quantityBase: requiredBase,
          unitCostSnapshot: unitCost.toDecimalPlaces(6),
          totalCostSnapshot: lineFood,
        });
      }
    }

    built.push({
      itemId,
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      recipeId: menuItem.recipeId,
      recipeVersionId: version?.id ?? null,
      quantity: quantity.toDecimalPlaces(6),
      unitPrice: unitPrice.toDecimalPlaces(6),
      foodCost: foodCost.toDecimalPlaces(6),
      consumptions,
    });
  }

  return built;
}

export async function listChannelsForTenant(tenant: TenantContext) {
  return saleRepository.ensureDefaultChannels(tenant.organizationId);
}

export async function updateChannelFeeForTenant(
  tenant: TenantContext,
  channelId: string,
  input: { feeType: "NONE" | "PERCENT" | "FIXED"; feeValue: string },
) {
  assertCanWriteMasterData(tenant.role);

  const feeValue = new Decimal(input.feeValue);
  if (!feeValue.isFinite() || feeValue.lt(0)) {
    throw new Error("Fee value must be a non-negative decimal");
  }
  if (input.feeType === "PERCENT" && feeValue.gt(100)) {
    throw new Error("Percent fee must be at most 100");
  }

  const result = await saleRepository.updateSaleChannelFee(
    tenant.organizationId,
    channelId,
    {
      feeType: input.feeType,
      feeValue: feeValue.toFixed(6),
    },
  );
  if (result.count === 0) {
    throw new Error("Channel not found");
  }
}

export async function listSalesForTenant(tenant: TenantContext) {
  return saleRepository.listSales(tenant.organizationId);
}

export async function getSaleForTenant(tenant: TenantContext, saleId: string) {
  return saleRepository.getSaleForOrg(tenant.organizationId, saleId);
}

/**
 * Posts a sale and deducts stock atomically.
 * Duplicate idempotencyKey returns the existing sale without double-deducting.
 */
export async function createSale(
  tenant: TenantContext,
  input: {
    channelId: string;
    soldAt?: string | null;
    idempotencyKey: string;
    discountAmount?: string | null;
    packagingCost?: string | null;
    notes?: string | null;
    lines: SaleLineInput[];
  },
) {
  assertCanWriteMasterData(tenant.role);

  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) {
    throw new Error("Idempotency key is required");
  }

  const existing = await saleRepository.findSaleByIdempotencyKey(
    tenant.organizationId,
    idempotencyKey,
  );
  if (existing) {
    return existing;
  }

  await saleRepository.ensureDefaultChannels(tenant.organizationId);

  const channel = await saleRepository.getSaleChannelForOrg(
    tenant.organizationId,
    input.channelId,
  );
  if (!channel) {
    throw new Error("Sales channel not found");
  }

  const builtLines = await buildSaleLines(
    tenant.organizationId,
    channel.code,
    input.lines,
  );

  const profitability = calculateSaleProfitability({
    lines: builtLines.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      foodCost: line.foodCost,
    })),
    discountAmount: input.discountAmount,
    packagingCost: input.packagingCost,
    feeType: channel.feeType,
    feeValue: channel.feeValue.toString(),
  });

  const saleId = randomUUID();
  const soldAt = input.soldAt ? new Date(input.soldAt) : new Date();
  if (Number.isNaN(soldAt.getTime())) {
    throw new Error("Invalid soldAt datetime");
  }

  const currency = (
    await prisma.organization.findFirstOrThrow({
      where: { id: tenant.organizationId },
      select: { currency: true },
    })
  ).currency ?? "THB";

  // Aggregate consumptions by ingredient (sorted) to apply stock once and avoid deadlocks.
  const aggregated = new Map<
    string,
    { quantityBase: Decimal; unitCost: Decimal; lineRefs: string[] }
  >();

  for (const line of builtLines) {
    for (const consumption of line.consumptions) {
      const current = aggregated.get(consumption.ingredientId);
      if (current) {
        current.quantityBase = current.quantityBase.plus(
          consumption.quantityBase,
        );
        current.lineRefs.push(consumption.id);
      } else {
        aggregated.set(consumption.ingredientId, {
          quantityBase: consumption.quantityBase,
          unitCost: consumption.unitCostSnapshot,
          lineRefs: [consumption.id],
        });
      }
    }
  }

  const sortedIngredientIds = [...aggregated.keys()].sort();

  try {
    return await prisma.$transaction(async (tx) => {
      const again = await tx.sale.findFirst({
        where: {
          organizationId: tenant.organizationId,
          idempotencyKey,
        },
        include: {
          channel: true,
          items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
        },
      });
      if (again) {
        return again;
      }

      await tx.sale.create({
        data: {
          id: saleId,
          organizationId: tenant.organizationId,
          channelId: channel.id,
          status: "POSTED",
          soldAt,
          idempotencyKey,
          currency,
          notes: input.notes?.trim() || null,
          grossRevenue: profitability.grossRevenue.toFixed(6),
          discountAmount: profitability.discountAmount.toFixed(6),
          packagingCost: profitability.packagingCost.toFixed(6),
          channelFeeAmount: profitability.channelFeeAmount.toFixed(6),
          foodCostTotal: profitability.foodCostTotal.toFixed(6),
          contributionMargin: profitability.contributionMargin.toFixed(6),
          createdByUserId: tenant.userId,
        },
      });

      await tx.saleItem.createMany({
        data: builtLines.map((line, index) => ({
          id: line.itemId,
          organizationId: tenant.organizationId,
          saleId,
          menuItemId: line.menuItemId,
          menuItemNameSnapshot: line.menuItemName,
          recipeId: line.recipeId,
          recipeVersionId: line.recipeVersionId,
          quantity: line.quantity.toFixed(6),
          unitPriceSnapshot: line.unitPrice.toFixed(6),
          lineRevenue: profitability.lines[index]!.lineRevenue.toFixed(6),
          foodCostSnapshot: line.foodCost.toFixed(6),
        })),
      });

      await tx.saleStockConsumption.createMany({
        data: builtLines.flatMap((line) =>
          line.consumptions.map((consumption) => ({
            id: consumption.id,
            organizationId: tenant.organizationId,
            saleId,
            saleItemId: line.itemId,
            ingredientId: consumption.ingredientId,
            quantityBase: consumption.quantityBase.toFixed(6),
            unitCostSnapshot: consumption.unitCostSnapshot.toFixed(6),
            totalCostSnapshot: consumption.totalCostSnapshot.toFixed(6),
          })),
        ),
      });

      for (const ingredientId of sortedIngredientIds) {
        const agg = aggregated.get(ingredientId)!;
        if (agg.quantityBase.lte(0)) continue;

        await applyStockMovement(tx, {
          organizationId: tenant.organizationId,
          ingredientId,
          quantityBaseSigned: agg.quantityBase.neg(),
          movementType: "SALE_CONSUMPTION",
          reason: "Sale stock consumption",
          referenceType: "SALE",
          referenceId: saleId,
          lineReferenceId: ingredientId,
          createdByUserId: tenant.userId,
          occurredAt: soldAt,
        });
      }

      return tx.sale.findFirstOrThrow({
        where: { id: saleId, organizationId: tenant.organizationId },
        include: {
          channel: true,
          items: {
            include: { menuItem: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const raced = await saleRepository.findSaleByIdempotencyKey(
        tenant.organizationId,
        idempotencyKey,
      );
      if (raced) return raced;
    }
    throw error;
  }
}

/**
 * Cancels a posted sale with compensating stock reversals. Idempotent.
 */
export async function cancelSale(
  tenant: TenantContext,
  saleId: string,
  cancelReason: string,
) {
  assertCanWriteMasterData(tenant.role);

  const reason = cancelReason.trim();
  if (!reason) {
    throw new Error("Cancel reason is required");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, organizationId: tenant.organizationId },
      include: {
        consumptions: true,
        channel: true,
        items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.status === "CANCELLED") {
      return sale;
    }

    if (sale.status !== "POSTED") {
      throw new Error("Only posted sales can be cancelled");
    }

    const byIngredient = new Map<
      string,
      { quantityBase: Decimal; unitCost: Decimal }
    >();

    for (const consumption of sale.consumptions) {
      const qty = new Decimal(consumption.quantityBase.toString());
      const unitCost = new Decimal(consumption.unitCostSnapshot.toString());
      const current = byIngredient.get(consumption.ingredientId);
      if (current) {
        current.quantityBase = current.quantityBase.plus(qty);
      } else {
        byIngredient.set(consumption.ingredientId, {
          quantityBase: qty,
          unitCost,
        });
      }
    }

    const sortedIngredientIds = [...byIngredient.keys()].sort();
    const occurredAt = new Date();

    for (const ingredientId of sortedIngredientIds) {
      const agg = byIngredient.get(ingredientId)!;
      if (agg.quantityBase.lte(0)) continue;

      await applyStockMovement(tx, {
        organizationId: tenant.organizationId,
        ingredientId,
        quantityBaseSigned: agg.quantityBase,
        unitCostForInbound: agg.unitCost,
        movementType: "SALE_REVERSAL",
        reason: `Sale cancelled: ${reason}`,
        referenceType: "SALE_CANCEL",
        referenceId: sale.id,
        lineReferenceId: ingredientId,
        createdByUserId: tenant.userId,
        occurredAt,
      });
    }

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: "CANCELLED",
        cancelledAt: occurredAt,
        cancelReason: reason,
      },
    });

    return tx.sale.findFirstOrThrow({
      where: { id: sale.id, organizationId: tenant.organizationId },
      include: {
        channel: true,
        items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
        consumptions: { include: { ingredient: true } },
      },
    });
  });
}

export { InsufficientStockError };
