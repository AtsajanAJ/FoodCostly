import { afterEach, describe, expect, it, vi } from "vitest";
import { reportError } from "@/lib/safe-log";

describe("reportError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs error JSON without raw secrets", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    reportError(new Error("boom"), {
      organizationId: "org_1",
      password: "super-secret",
      BETTER_AUTH_SECRET: "abc",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.error.message).toBe("boom");
    expect(payload.context.organizationId).toBe("org_1");
    expect(payload.context.password).toBe("[redacted]");
    expect(payload.context.BETTER_AUTH_SECRET).toBe("[redacted]");
  });
});
