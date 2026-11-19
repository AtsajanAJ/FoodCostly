import { Decimal } from "decimal.js";
import type { ConvertibleUnit } from "@/server/services/unit-conversion";
import { toBaseQuantity } from "@/server/services/unit-conversion";

export type RecipeCostLineInput = {
  id?: string;
  ingredientId: string;
  quantity: Decimal.Value;
  unit: ConvertibleUnit;
  yieldPercent: Decimal.Value;
  unitCost: Decimal.Value;
};

export type RecipeCostLineResult = {
  ingredientId: string;
  quantity: Decimal;
  baseQuantity: Decimal;
  yieldPercent: Decimal;
  requiredBaseQuantity: Decimal;
  unitCost: Decimal;
  lineCost: Decimal;
};

export type RecipeCostResult = {
  lines: RecipeCostLineResult[];
  totalCost: Decimal;
  costPerPortion: Decimal;
  portionCount: Decimal;
};

/**
 * MVP yield assumption (open decision #2, reversible):
 * yieldPercent is edible yield at recipe-item level.
 * requiredBaseQuantity = baseQuantity / (yieldPercent / 100)
 * so 80% yield means 25% more raw ingredient is required.
 */
export function calculateRecipeCost(params: {
  portionCount: Decimal.Value;
  lines: RecipeCostLineInput[];
}): RecipeCostResult {
  const portionCount = new Decimal(params.portionCount);
  if (!portionCount.isFinite() || portionCount.lte(0)) {
    throw new Error("Portion count must be greater than zero");
  }

  if (params.lines.length === 0) {
    throw new Error("Recipe requires at least one ingredient line");
  }

  const lines = params.lines.map((line) => {
    const quantity = new Decimal(line.quantity);
    if (!quantity.isFinite() || quantity.lte(0)) {
      throw new Error("Recipe line quantity must be greater than zero");
    }

    const yieldPercent = new Decimal(line.yieldPercent);
    if (!yieldPercent.isFinite() || yieldPercent.lte(0) || yieldPercent.gt(100)) {
      throw new Error("Yield percent must be greater than 0 and at most 100");
    }

    const unitCost = new Decimal(line.unitCost);
    if (!unitCost.isFinite() || unitCost.lt(0)) {
      throw new Error("Unit cost must be a non-negative decimal");
    }

    const baseQuantity = toBaseQuantity({
      quantity,
      unit: line.unit,
    });

    const yieldFraction = yieldPercent.div(100);
    const requiredBaseQuantity = baseQuantity
      .div(yieldFraction)
      .toDecimalPlaces(6);
    const lineCost = requiredBaseQuantity.mul(unitCost).toDecimalPlaces(6);

    return {
      ingredientId: line.ingredientId,
      quantity: quantity.toDecimalPlaces(6),
      baseQuantity: baseQuantity.toDecimalPlaces(6),
      yieldPercent: yieldPercent.toDecimalPlaces(4),
      requiredBaseQuantity,
      unitCost: unitCost.toDecimalPlaces(6),
      lineCost,
    };
  });

  const totalCost = lines
    .reduce((sum, line) => sum.plus(line.lineCost), new Decimal(0))
    .toDecimalPlaces(6);
  const costPerPortion = totalCost.div(portionCount).toDecimalPlaces(6);

  return {
    lines,
    totalCost,
    costPerPortion,
    portionCount: portionCount.toDecimalPlaces(6),
  };
}
