import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "@/server/services/recipe-costing";

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

describe("recipe costing", () => {
  it("sums line costs using MWAC unit costs and portions", () => {
    const result = calculateRecipeCost({
      portionCount: "10",
      lines: [
        {
          ingredientId: "flour",
          quantity: "0.5",
          unit: kg,
          yieldPercent: "100",
          unitCost: "0.04",
        },
        {
          ingredientId: "salt",
          quantity: "10",
          unit: g,
          yieldPercent: "100",
          unitCost: "0.01",
        },
      ],
    });

    // flour: 500g * 0.04 = 20; salt: 10g * 0.01 = 0.1; total 20.1; /10 = 2.01
    expect(result.totalCost.toString()).toBe("20.1");
    expect(result.costPerPortion.toString()).toBe("2.01");
  });

  it("increases required quantity when yield is below 100%", () => {
    const result = calculateRecipeCost({
      portionCount: "1",
      lines: [
        {
          ingredientId: "onion",
          quantity: "100",
          unit: g,
          yieldPercent: "80",
          unitCost: "0.02",
        },
      ],
    });

    expect(result.lines[0]?.requiredBaseQuantity.toString()).toBe("125");
    expect(result.totalCost.toString()).toBe("2.5");
  });

  it("preserves fractional quantities", () => {
    const result = calculateRecipeCost({
      portionCount: "3",
      lines: [
        {
          ingredientId: "spice",
          quantity: "1.25",
          unit: g,
          yieldPercent: "100",
          unitCost: "0.333333",
        },
      ],
    });

    expect(result.lines[0]?.lineCost.toString()).toBe("0.416666");
    expect(result.costPerPortion.toString()).toBe("0.138889");
  });
});
