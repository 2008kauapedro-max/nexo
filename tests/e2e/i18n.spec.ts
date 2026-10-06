import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];
test("visitor language changes preserve entered values and survive refresh", async ({
  page,
  context,
}) => {
  await page.goto("/entrar");
  await page.locator("input[name=email]").fill("draft@example.com");
  await page.locator(".language-selector select").selectOption("en-US");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.locator("input[name=email]")).toHaveValue(
    "draft@example.com",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  expect(
    (await context.cookies()).find((c) => c.name === "nexo-locale")?.httpOnly,
  ).toBe(true);
});
test("all ten language catalogs render login without overflow", async ({
  page,
}) => {
  await page.goto("/entrar");
  for (const locale of [
    "pt-BR",
    "en-US",
    "es",
    "fr",
    "de",
    "it",
    "ja",
    "ko",
    "zh-CN",
    "ru",
  ]) {
    await page.locator(".language-selector select").selectOption(locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.local/evidence/i18n-login-${locale}-${width}.png`,
        caret: "initial",
      });
    }
  }
});
test("account language overrides a visitor cookie after sign in and persists after logout", async ({
  page,
  context,
}) => {
  test.skip(!users.length, "Isolated NEXO QA account required");
  test.setTimeout(120000);
  await page.goto("/entrar");
  await page.locator("input[name=email]").fill(users[1].email);
  await page.locator("input[name=password]").fill(users[1].password);
  await page.locator("button[type=submit],form button").first().click();
  await expect(page).toHaveURL(/inicio$/);
  try {
    await page
      .locator(".language-selector:visible select")
      .first()
      .selectOption("de");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await page.getByRole("button", { name: "Abmelden", exact: true }).click();
    await expect(page).toHaveURL(/entrar/);
    await context.addCookies([
      { name: "nexo-locale", value: "ja", domain: "localhost", path: "/" },
    ]);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await page.locator("input[name=email]").fill(users[1].email);
    await page.locator("input[name=password]").fill(users[1].password);
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    await expect(page).toHaveURL(/inicio$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  } finally {
    await page
      .locator(".language-selector:visible select")
      .first()
      .selectOption("pt-BR");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  }
});
