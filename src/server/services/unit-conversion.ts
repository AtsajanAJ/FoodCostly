import { Decimal } from "decimal.js";

export type ConvertibleUnit = {
  id: string;
  code: string;
  dimension: "WEIGHT" | "VOLUME" | "COUNT";
  toBaseFactor: Decimal.Value;
};

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnitConversionError";
  }
}

/**
 * Convert a quantity between units of the same dimension.
 * Formula: targetQty = sourceQty * source.toBaseFactor / target.toBaseFactor
 *
 * Rounding is applied only at the documented boundary (default 6 dp).
 */
export function convertQuantity(params: {
  quantity: Decimal.Value;
  from: ConvertibleUnit;
  to: ConvertibleUnit;
  decimalPlaces?: number;
}): Decimal {
  const { quantity, from, to, decimalPlaces = 6 } = params;

  if (from.dimension !== to.dimension) {
    throw new UnitConversionError(
      `Cannot convert ${from.code} (${from.dimension}) to ${to.code} (${to.dimension}) without an explicit density rule`,
    );
  }

  const qty = new Decimal(quantity);
  if (!qty.isFinite()) {
    throw new UnitConversionError("Quantity must be a finite decimal");
  }

  const fromFactor = new Decimal(from.toBaseFactor);
  const toFactor = new Decimal(to.toBaseFactor);

  if (fromFactor.lte(0) || toFactor.lte(0)) {
    throw new UnitConversionError("Unit conversion factors must be positive");
  }

  const baseQuantity = qty.mul(fromFactor);
  return baseQuantity.div(toFactor).toDecimalPlaces(decimalPlaces);
}

export function toBaseQuantity(params: {
  quantity: Decimal.Value;
  unit: ConvertibleUnit;
  decimalPlaces?: number;
}): Decimal {
  const { quantity, unit, decimalPlaces = 6 } = params;
  const qty = new Decimal(quantity);
  const factor = new Decimal(unit.toBaseFactor);

  if (factor.lte(0)) {
    throw new UnitConversionError("Unit conversion factors must be positive");
  }

  return qty.mul(factor).toDecimalPlaces(decimalPlaces);
}
