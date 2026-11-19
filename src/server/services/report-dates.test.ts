import { describe, expect, it } from "vitest";
import {
  parseDateOnlyInTimeZone,
  percentOf,
  resolveReportWindow,
} from "@/server/services/report-dates";

describe("report date windows", () => {
  it("maps Bangkok midnight to the prior-day UTC evening", () => {
    const start = parseDateOnlyInTimeZone("2026-11-19", "Asia/Bangkok");
    expect(start.toISOString()).toBe("2026-11-18T17:00:00.000Z");
  });

  it("builds a half-open inclusive calendar range", () => {
    const window = resolveReportWindow({
      timeZone: "Asia/Bangkok",
      fromDate: "2026-11-01",
      toDate: "2026-11-01",
    });
    expect(window.start.toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(window.endExclusive.toISOString()).toBe("2026-11-01T17:00:00.000Z");
  });

  it("computes percent of safely", () => {
    expect(percentOf("25", "100").toString()).toBe("25");
    expect(percentOf("1", "0").toString()).toBe("0");
  });
});
