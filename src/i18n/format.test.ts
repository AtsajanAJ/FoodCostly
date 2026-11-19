import { describe, expect, it } from "vitest";
import { formatMessage } from "@/i18n/format";

describe("formatMessage", () => {
  it("replaces placeholders", () => {
    expect(formatMessage("{count} posted sales", { count: 3 })).toBe(
      "3 posted sales",
    );
  });
});
