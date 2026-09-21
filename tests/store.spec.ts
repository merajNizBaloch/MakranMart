import { test, expect } from "@playwright/test";

test("single-store shopping and cart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("all in one store");
  await expect(page.getByRole("link", { name: "Sell on MakranMart" })).toHaveCount(0);
  await page.getByRole("link", { name: "Start shopping" }).click();
  await page.getByRole("textbox", { name: "Search products" }).fill("Tote");
  await expect(page.getByRole("heading", { name: "Handcrafted Balochi Tote" })).toBeVisible();
  await page.getByRole("button", { name: "Add Handcrafted Balochi Tote to cart", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Shopping cart" })).toContainText("Handcrafted Balochi Tote");
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("admin is private and merchant routes are retired", async ({ page, request }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back, owner." })).toBeVisible();
  await page.getByRole("button", { name: "First time? Activate owner access" }).click();
  await expect(page.getByLabel("Owner activation code")).toBeVisible();
  const unauthorized = await request.post("/api/admin/products", { data: { title: "Unauthorized test" } });
  expect(unauthorized.status()).toBe(401);
  const retired = await request.post("/api/admin/sellers", { data: {} });
  expect(retired.status()).toBe(410);
  await page.goto("/sellers");
  await expect(page).toHaveURL(/\/products$/);
});
