import { describe, expect, it } from "vitest";
import {
  calculateChannelFee,
  calculateSaleProfitability,
} from "@/server/services/sale-profitability";

describe("sale profitability", () => {
  it("calculates percent and fixed channel fees on net revenue", () => {
    expect(
      calculateChannelFee({
        feeType: "PERCENT",
        feeValue: "30",
        netRevenue: "100",
      }).toString(),
    ).toBe("30");

    expect(
      calculateChannelFee({
        feeType: "FIXED",
        feeValue: "15.5",
        netRevenue: "100",
      }).toString(),
    ).toBe("15.5");

    expect(
      calculateChannelFee({
        feeType: "NONE",
        feeValue: "99",
        netRevenue: "100",
      }).toString(),
    ).toBe("0");
  });

  it("separates food cost, fees, discount, and contribution margin", () => {
    const result = calculateSaleProfitability({
      lines: [
        { quantity: "2", unitPrice: "50", foodCost: "20" },
        { quantity: "1", unitPrice: "40", foodCost: "12" },
      ],
      discountAmount: "10",
      packagingCost: "5",
      feeType: "PERCENT",
      feeValue: "20",
    });

    // gross = 100 + 40 = 140; net = 130; fee = 26; food = 32
    // contribution = 130 - 32 - 5 - 26 = 67
    expect(result.grossRevenue.toString()).toBe("140");
    expect(result.netRevenue.toString()).toBe("130");
    expect(result.channelFeeAmount.toString()).toBe("26");
    expect(result.foodCostTotal.toString()).toBe("32");
    expect(result.contributionMargin.toString()).toBe("67");
  });

  it("rejects discount above gross and invalid percent fees", () => {
    expect(() =>
      calculateSaleProfitability({
        lines: [{ quantity: "1", unitPrice: "10", foodCost: "1" }],
        discountAmount: "11",
        feeType: "NONE",
        feeValue: "0",
      }),
    ).toThrow(/Discount cannot exceed/);

    expect(() =>
      calculateChannelFee({
        feeType: "PERCENT",
        feeValue: "101",
        netRevenue: "10",
      }),
    ).toThrow(/at most 100/);
  });
});
