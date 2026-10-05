import { test, expect, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
const users: { email: string; password: string }[] = existsSync(
  ".local/qa-users.json",
)
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];
async function login(page: Page, index = 1) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(users[index].email);
  await page.getByLabel("Senha", { exact: true }).fill(users[index].password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/inicio$/);
}
test("weekly plan and reflection persist after reload", async ({ page }) => {
  test.skip(!users.length, "Requires isolated QA accounts");
  await login(page);
  await page.goto("/plano");
  const details = page.locator("details").first();
  if ((await details.getAttribute("open")) === null)
    await details.locator("summary").click();
  await page
    .getByRole("button", { name: "Organizar os próximos sete dias" })
    .click();
  await expect(page.locator("article.row-card")).toHaveCount(7);
  await page.reload();
  await expect(page.locator("article.row-card")).toHaveCount(7);
  await page.goto("/aprender");
  await page.locator(".lesson-list a").first().click();
  await page.getByRole("link", { name: "Me prove que aprendeu →" }).click();
  const text =
    "Eu entendi a ideia e consigo explicar um exemplo com minhas próprias palavras.";
  await page.getByLabel("Como você explicaria isso para alguém?").fill(text);
  await page
    .getByRole("button", { name: "Salvar e comparar meu raciocínio" })
    .click();
  await expect(page.getByRole("status")).toContainText("salva");
  await page.reload();
  await expect(
    page.getByLabel("Como você explicaria isso para alguém?"),
  ).toHaveValue(text);
  await expect(page.locator(".worked-example")).toBeVisible();
  for (const route of ["/missoes", "/desafios"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
test("question survives refresh and failed request then accepts retry once", async ({
  page,
  context,
}) => {
  test.skip(!users.length, "Requires isolated QA accounts");
  test.setTimeout(90000);
  await login(page);
  await page.goto("/desafios");
  await page.getByRole("button", { name: "Começar meu desafio →" }).click();
  await expect(page).toHaveURL(/sessao/);
  const question = await page.locator("h1").innerText();
  const address = page.url();
  await page.reload();
  await expect(page.locator("h1")).toHaveText(question);
  await page.locator(".answer").first().click();
  await page.route("**/sessao/**", (route) =>
    route.request().method() === "POST"
      ? route.abort("failed")
      : route.continue(),
  );
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "seleção foi mantida",
  );
  await page.unroute("**/sessao/**");
  await context.setOffline(true);
  await expect(page.locator(".connection-status")).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator(".connection-status")).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate(() =>
        fetch("/", { method: "HEAD", cache: "no-store" })
          .then((r) => r.ok)
          .catch(() => false),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.goto("/inicio");
  await page.goto(address);
  await expect(page.locator(".question-top")).toContainText("Questão 2 de 5");
});
test("content factory produces drafts and quality reporting is readable", async ({
  page,
}) => {
  test.skip(!users.length, "Requires QA admin");
  await login(page, 2);
  await page.goto("/admin/fabrica");
  await page.getByLabel("Semente do lote").fill("9876");
  await page.getByRole("button", { name: "Gerar cinco rascunhos" }).click();
  await expect(page.getByRole("status")).toContainText("rascunhos");
  await page.goto("/admin/qualidade");
  await expect(
    page.getByRole("heading", { name: "Qualidade do conteúdo." }),
  ).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  await expect(page.getByLabel("Lista de questões")).toBeVisible();
  await page.getByRole("button", { name: "Questões", exact: true }).click();
  await expect(page.getByLabel("Lista de questões")).not.toBeVisible();
});
