import { expect, test } from "@playwright/test";

test.describe("auth gate", () => {
  test("dashboard redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  });

  test("onboarding redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
