import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];

test("language changes preserve an exercise selection and saved feedback", async ({
  page,
}) => {
  test.skip(!users.length, "Isolated NEXO QA account required");
  test.setTimeout(120000);
  await page.goto("/entrar");
  await page.locator("input[name=email]").fill(users[1].email);
  await page.locator("input[name=password]").fill(users[1].password);
  await page.locator("form button").first().click();
  await expect(page).toHaveURL(/inicio$/);
  const language = page.locator(".language-selector:visible select").first();
  try {
    await language.selectOption("pt-BR");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await page.goto("/estudar/matematica");
    await page.getByRole("button", { name: "Treino rápido →" }).click();
    await expect(page).toHaveURL(/questao=/);
    const url = page.url();
    const statement = await page.locator("h1").textContent();
    await page.locator(".answer").first().click();
    await language.selectOption("en-US");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page).toHaveURL(url);
    await expect(page.locator("h1")).toHaveText(statement!);
    await expect(page.locator(".answer").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator(".question-actions button.primary").click();
    await expect(page.locator(".feedback")).toBeVisible();
    for (const locale of ["de", "ja", "zh-CN"]) {
      await language.selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page).toHaveURL(url);
      await expect(page.locator("h1")).toHaveText(statement!);
      await expect(page.locator(".feedback")).toBeVisible();
    }
    await page.reload();
    await expect(page.locator(".feedback")).toBeVisible();
    await expect(page.locator(".answer").first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator(".question-actions button.primary").click();
    await expect(page).not.toHaveURL(url);
    await expect(page.locator(".feedback")).toHaveCount(0);
  } finally {
    // A cleanup failure must not hide the original exercise assertion.
    await page
      .goto("/inicio")
      .then(async () => {
        await language.selectOption("pt-BR");
        await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      })
      .catch(() => {});
  }
});
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
      {
        name: "nexo-locale",
        value: "ja",
        domain: new URL(page.url()).hostname,
        path: "/",
      },
    ]);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await page.locator("input[name=email]").fill(users[1].email);
    await page.locator("input[name=password]").fill(users[1].password);
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    await expect(page).toHaveURL(/inicio$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  } finally {
    if (page.url().includes("/entrar")) {
      await page.locator("input[name=email]").fill(users[1].email);
      await page.locator("input[name=password]").fill(users[1].password);
      await page.locator("form button").first().click();
      await expect(page).toHaveURL(/inicio$/);
    }
    await page
      .locator(".language-selector:visible select")
      .first()
      .selectOption("pt-BR");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  }
});
