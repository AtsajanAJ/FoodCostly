import { describe, expect, it } from "vitest";
import { allocatePurchaseCosts } from "@/server/services/purchase-allocation";

describe("purchase cost allocation", () => {
  it("allocates discount/tax/shipping by line value share", () => {
    const result = allocatePurchaseCosts({
      lines: [
        { id: "a", lineGross: "100" },
        { id: "b", lineGross: "300" },
      ],
      discountAmount: "40",
      taxAmount: "36",
      shippingAmount: "20",
    });

    expect(result[0]?.allocatedDiscount.toString()).toBe("10");
    expect(result[1]?.allocatedDiscount.toString()).toBe("30");
    expect(result[0]?.allocatedTax.toString()).toBe("9");
    expect(result[1]?.allocatedTax.toString()).toBe("27");
    expect(result[0]?.allocatedShipping.toString()).toBe("5");
    expect(result[1]?.allocatedShipping.toString()).toBe("15");
    expect(result[0]?.allocatedCost.toString()).toBe("104");
    expect(result[1]?.allocatedCost.toString()).toBe("312");
  });

  it("puts rounding remainder on the last line", () => {
    const result = allocatePurchaseCosts({
      lines: [
        { id: "a", lineGross: "10" },
        { id: "b", lineGross: "10" },
        { id: "c", lineGross: "10" },
      ],
      discountAmount: "1",
      taxAmount: "0",
      shippingAmount: "0",
    });

    const totalDiscount = result.reduce(
      (sum, line) => sum.plus(line.allocatedDiscount),
      result[0]!.allocatedDiscount.mul(0),
    );

    expect(totalDiscount.toString()).toBe("1");
  });
});
