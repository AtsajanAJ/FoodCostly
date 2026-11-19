import { Decimal } from "decimal.js";

export type AllocationLineInput = {
  id: string;
  lineGross: Decimal.Value;
};

export type AllocationLineResult = {
  id: string;
  lineGross: Decimal;
  allocatedDiscount: Decimal;
  allocatedTax: Decimal;
  allocatedShipping: Decimal;
  allocatedCost: Decimal;
};

/**
 * MVP purchase header cost allocation (reversible product assumption):
 * 1. discount is allocated by share of lineGross
 * 2. tax and shipping are allocated by share of (lineGross - discountShare)
 *
 * Money rounded to 6 dp at the allocation boundary. Remainder from rounding
 * is applied to the last line so totals still reconcile.
 */
export function allocatePurchaseCosts(params: {
  lines: AllocationLineInput[];
  discountAmount: Decimal.Value;
  taxAmount: Decimal.Value;
  shippingAmount: Decimal.Value;
}): AllocationLineResult[] {
  const discountAmount = new Decimal(params.discountAmount);
  const taxAmount = new Decimal(params.taxAmount);
  const shippingAmount = new Decimal(params.shippingAmount);

  if (discountAmount.lt(0) || taxAmount.lt(0) || shippingAmount.lt(0)) {
    throw new Error("Discount, tax, and shipping must be non-negative");
  }

  if (params.lines.length === 0) {
    return [];
  }

  const lines = params.lines.map((line) => ({
    id: line.id,
    lineGross: new Decimal(line.lineGross),
  }));

  for (const line of lines) {
    if (!line.lineGross.isFinite() || line.lineGross.lt(0)) {
      throw new Error("Line gross must be a non-negative decimal");
    }
  }

  const totalGross = lines.reduce(
    (sum, line) => sum.plus(line.lineGross),
    new Decimal(0),
  );

  if (totalGross.lte(0) && discountAmount.gt(0)) {
    throw new Error("Cannot allocate discount when line totals are zero");
  }

  const discountShares = allocateProportionally(
    lines.map((line) => line.lineGross),
    discountAmount,
  );

  const nets = lines.map((line, index) =>
    line.lineGross.minus(discountShares[index]!),
  );

  const totalNet = nets.reduce((sum, value) => sum.plus(value), new Decimal(0));

  if (totalNet.lte(0) && (taxAmount.gt(0) || shippingAmount.gt(0))) {
    throw new Error(
      "Cannot allocate tax/shipping when net line totals are zero",
    );
  }

  const taxShares = allocateProportionally(nets, taxAmount);
  const shippingShares = allocateProportionally(nets, shippingAmount);

  return lines.map((line, index) => {
    const allocatedDiscount = discountShares[index]!;
    const allocatedTax = taxShares[index]!;
    const allocatedShipping = shippingShares[index]!;
    const allocatedCost = line.lineGross
      .minus(allocatedDiscount)
      .plus(allocatedTax)
      .plus(allocatedShipping)
      .toDecimalPlaces(6);

    return {
      id: line.id,
      lineGross: line.lineGross.toDecimalPlaces(6),
      allocatedDiscount,
      allocatedTax,
      allocatedShipping,
      allocatedCost,
    };
  });
}

function allocateProportionally(
  weights: Decimal[],
  amount: Decimal,
): Decimal[] {
  if (amount.eq(0)) {
    return weights.map(() => new Decimal(0));
  }

  const totalWeight = weights.reduce(
    (sum, weight) => sum.plus(weight),
    new Decimal(0),
  );

  if (totalWeight.lte(0)) {
    throw new Error("Cannot allocate against zero weight total");
  }

  const shares: Decimal[] = [];
  let allocated = new Decimal(0);

  for (let index = 0; index < weights.length; index += 1) {
    if (index === weights.length - 1) {
      shares.push(amount.minus(allocated).toDecimalPlaces(6));
      break;
    }

    const share = amount
      .mul(weights[index]!)
      .div(totalWeight)
      .toDecimalPlaces(6);
    shares.push(share);
    allocated = allocated.plus(share);
  }

  return shares;
}
