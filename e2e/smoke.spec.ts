import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("home shows product and demo CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Restaurant cost and inventory",
    );
    await expect(page.getByRole("button", { name: /try demo/i })).toBeVisible();
  });

  test("demo page is public and labeled as demo", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText(/you are in demo mode/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /demo dashboard/i }),
    ).toBeVisible();
  });

  test("sign-in and sign-up pages render", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Sign in", { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();

    await page.goto("/sign-up");
    await expect(page.getByText("Create account").first()).toBeVisible();
    await expect(page.getByLabel(/^name$/i)).toBeVisible();
  });
});
