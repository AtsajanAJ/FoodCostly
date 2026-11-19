import { describe, expect, it } from "vitest";
import { toCsv } from "@/features/reports/csv";

describe("csv export", () => {
  it("escapes commas and quotes", () => {
    const csv = toCsv(
      ["Name", "Note"],
      [
        ["Flour", "plain"],
        ['Say "hi"', "a,b"],
      ],
    );
    expect(csv).toBe('Name,Note\nFlour,plain\n"Say ""hi""","a,b"');
  });
});
