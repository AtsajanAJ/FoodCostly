import { Decimal } from "decimal.js";

export type ChannelFeeType = "NONE" | "PERCENT" | "FIXED";

export type SaleLineInput = {
  quantity: Decimal.Value;
  unitPrice: Decimal.Value;
  foodCost: Decimal.Value;
};

export type SaleProfitabilityResult = {
  grossRevenue: Decimal;
  discountAmount: Decimal;
  netRevenue: Decimal;
  packagingCost: Decimal;
  channelFeeAmount: Decimal;
  foodCostTotal: Decimal;
  contributionMargin: Decimal;
  lines: Array<{
    quantity: Decimal;
    unitPrice: Decimal;
    lineRevenue: Decimal;
    foodCost: Decimal;
  }>;
};

/**
 * Channel fee is calculated on net revenue (gross − discount).
 * PERCENT feeValue is 0–100. FIXED is a currency amount.
 */
export function calculateChannelFee(params: {
  feeType: ChannelFeeType;
  feeValue: Decimal.Value;
  netRevenue: Decimal.Value;
}): Decimal {
  const netRevenue = new Decimal(params.netRevenue);
  if (!netRevenue.isFinite() || netRevenue.lt(0)) {
    throw new Error("Net revenue must be a non-negative decimal");
  }

  const feeValue = new Decimal(params.feeValue);
  if (!feeValue.isFinite() || feeValue.lt(0)) {
    throw new Error("Fee value must be a non-negative decimal");
  }

  if (params.feeType === "NONE") {
    return new Decimal(0).toDecimalPlaces(6);
  }

  if (params.feeType === "FIXED") {
    return feeValue.toDecimalPlaces(6);
  }

  if (params.feeType === "PERCENT") {
    if (feeValue.gt(100)) {
      throw new Error("Percent fee must be at most 100");
    }
    return netRevenue.mul(feeValue).div(100).toDecimalPlaces(6);
  }

  throw new Error("Unknown channel fee type");
}

/**
 * Contribution margin = netRevenue − foodCost − packaging − channelFee.
 * This is not net profit (operating expenses are excluded).
 */
export function calculateSaleProfitability(params: {
  lines: SaleLineInput[];
  discountAmount?: Decimal.Value | null;
  packagingCost?: Decimal.Value | null;
  feeType: ChannelFeeType;
  feeValue: Decimal.Value;
}): SaleProfitabilityResult {
  if (params.lines.length === 0) {
    throw new Error("Sale requires at least one line");
  }

  const lines = params.lines.map((line) => {
    const quantity = new Decimal(line.quantity);
    if (!quantity.isFinite() || quantity.lte(0)) {
      throw new Error("Sale line quantity must be greater than zero");
    }

    const unitPrice = new Decimal(line.unitPrice);
    if (!unitPrice.isFinite() || unitPrice.lt(0)) {
      throw new Error("Unit price must be a non-negative decimal");
    }

    const foodCost = new Decimal(line.foodCost);
    if (!foodCost.isFinite() || foodCost.lt(0)) {
      throw new Error("Food cost must be a non-negative decimal");
    }

    return {
      quantity: quantity.toDecimalPlaces(6),
      unitPrice: unitPrice.toDecimalPlaces(6),
      lineRevenue: quantity.mul(unitPrice).toDecimalPlaces(6),
      foodCost: foodCost.toDecimalPlaces(6),
    };
  });

  const grossRevenue = lines
    .reduce((sum, line) => sum.plus(line.lineRevenue), new Decimal(0))
    .toDecimalPlaces(6);

  const discountAmount = new Decimal(params.discountAmount || 0);
  if (!discountAmount.isFinite() || discountAmount.lt(0)) {
    throw new Error("Discount must be a non-negative decimal");
  }
  if (discountAmount.gt(grossRevenue)) {
    throw new Error("Discount cannot exceed gross revenue");
  }

  const packagingCost = new Decimal(params.packagingCost || 0);
  if (!packagingCost.isFinite() || packagingCost.lt(0)) {
    throw new Error("Packaging cost must be a non-negative decimal");
  }

  const netRevenue = grossRevenue.minus(discountAmount).toDecimalPlaces(6);
  const channelFeeAmount = calculateChannelFee({
    feeType: params.feeType,
    feeValue: params.feeValue,
    netRevenue,
  });

  const foodCostTotal = lines
    .reduce((sum, line) => sum.plus(line.foodCost), new Decimal(0))
    .toDecimalPlaces(6);

  const contributionMargin = netRevenue
    .minus(foodCostTotal)
    .minus(packagingCost)
    .minus(channelFeeAmount)
    .toDecimalPlaces(6);

  return {
    grossRevenue,
    discountAmount: discountAmount.toDecimalPlaces(6),
    netRevenue,
    packagingCost: packagingCost.toDecimalPlaces(6),
    channelFeeAmount,
    foodCostTotal,
    contributionMargin,
    lines,
  };
}
