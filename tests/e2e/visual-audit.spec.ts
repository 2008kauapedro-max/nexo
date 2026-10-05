import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];
test("expanded routes fit ten viewports and preserve visual evidence", async ({
  page,
}) => {
  test.skip(!users.length, "Requires isolated QA admin");
  test.setTimeout(300000);
  mkdirSync(".local/evidence", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrat|Minified React error/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(users[2].email);
  await page.getByLabel("Senha", { exact: true }).fill(users[2].password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/inicio$/);
  await page.goto("/plano");
  const planDetails = page.locator("details").first();
  if ((await planDetails.getAttribute("open")) === null)
    await planDetails.locator("summary").click();
  await page
    .getByRole("button", { name: "Organizar os próximos sete dias" })
    .click();
  await expect(page.locator("article.row-card")).toHaveCount(7);
  await page.goto("/aprender");
  const lesson = await page
    .locator(".lesson-list a")
    .first()
    .getAttribute("href");
  expect(lesson).toBeTruthy();
  const routes = [
    "/plano",
    "/missoes",
    "/desafios",
    "/mapa",
    "/caderno",
    "/flashcards",
    "/notificacoes",
    "/configuracoes",
    "/admin",
    "/admin/fabrica",
    "/admin/qualidade",
  ];
  for (const [width, height] of [
    [360, 800],
    [375, 812],
    [390, 844],
    [393, 852],
    [412, 915],
    [430, 932],
    [768, 1024],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    const extra = [390, 1440].includes(width)
      ? [
          "/inicio",
          "/estudar",
          "/aprender",
          lesson!,
          lesson!.replace("/aprender/", "/provar/"),
          "/simulados",
          "/ia",
          "/perfil",
          "/planos",
          "/anotacoes",
          "/sos",
          "/buscar",
          "/admin/financeiro",
          "/admin/saude",
          "/admin/relatos",
        ]
      : [];
    for (const route of [...routes, ...extra]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(
        page.getByText("Não conseguimos carregar agora.", { exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} @ ${width}`,
      ).toBe(true);
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `.local/evidence/${route.replaceAll("/", "-")}-${width}.png`,
          caret: "initial",
          fullPage: false,
        });
    }
  }
  expect(errors).toEqual([]);
});
