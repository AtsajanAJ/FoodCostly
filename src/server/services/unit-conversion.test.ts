import { describe, expect, it } from "vitest";
import {
  UnitConversionError,
  convertQuantity,
  toBaseQuantity,
} from "@/server/services/unit-conversion";

const g = {
  id: "unit_g",
  code: "g",
  dimension: "WEIGHT" as const,
  toBaseFactor: "1",
};

const kg = {
  id: "unit_kg",
  code: "kg",
  dimension: "WEIGHT" as const,
  toBaseFactor: "1000",
};

const ml = {
  id: "unit_ml",
  code: "ml",
  dimension: "VOLUME" as const,
  toBaseFactor: "1",
};

describe("unit conversion", () => {
  it("converts 1 kg to 1000 g", () => {
    const result = convertQuantity({ quantity: "1", from: kg, to: g });
    expect(result.toString()).toBe("1000");
  });

  it("converts 2500 g to 2.5 kg", () => {
    const result = convertQuantity({ quantity: "2500", from: g, to: kg });
    expect(result.toString()).toBe("2.5");
  });

  it("preserves decimal fractions", () => {
    const result = convertQuantity({ quantity: "0.125", from: kg, to: g });
    expect(result.toString()).toBe("125");
  });

  it("rejects cross-dimension conversion", () => {
    expect(() =>
      convertQuantity({ quantity: "1", from: kg, to: ml }),
    ).toThrow(UnitConversionError);
  });

  it("converts purchase quantity to base quantity", () => {
    const result = toBaseQuantity({ quantity: "1.5", unit: kg });
    expect(result.toString()).toBe("1500");
  });
});
