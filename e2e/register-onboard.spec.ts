import { expect, test } from "@playwright/test";

test.describe("register and onboard", () => {
  test("user can register, create organization, reach dashboard", async ({
    page,
  }) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@example.com`;
    const orgName = `E2E Cafe ${stamp}`;

    await page.goto("/sign-up");
    await page.getByLabel(/^name$/i).fill("E2E Tester");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
    await page.getByLabel(/restaurant|business name/i).fill(orgName);
    await page.getByRole("button", { name: /create organization/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /^dashboard$/i })).toBeVisible();
    await expect(page.getByText(/contribution margin/i).first()).toBeVisible();
  });
});
