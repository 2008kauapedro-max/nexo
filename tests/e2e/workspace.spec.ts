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
test("private notes and flashcards persist and remain isolated", async ({
  page,
  browser,
}) => {
  test.skip(!users.length, "Requires isolated QA credentials");
  test.setTimeout(120000);
  await login(page);
  const title = `QA nota ${Date.now()}`;
  await page.goto("/anotacoes");
  await page.getByText("Nova anotação", { exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page
    .getByLabel("Sua anotação")
    .fill("Uma descoberta privada da conta B.");
  await page.getByRole("button", { name: "Salvar anotação" }).click();
  await expect(page.getByRole("status")).toContainText("salva");
  await page.reload();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const other = await browser.newContext();
  const a = await other.newPage();
  await login(a, 0);
  await a.goto("/anotacoes");
  await expect(a.getByRole("heading", { name: title })).toHaveCount(0);
  await other.close();
  await page.goto("/flashcards");
  await page.getByText("Criar meu flashcard", { exact: true }).click();
  await page.getByLabel("Frente · pergunta").fill(title);
  await page.getByLabel("Verso · resposta").fill("Resposta privada");
  await page
    .getByRole("button", { name: "Criar flashcard", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("criado");
  const card = page.locator(".flashcard").filter({ hasText: title });
  await card.getByRole("button", { name: "Ver resposta" }).click();
  await expect(card).toContainText("Resposta privada");
  await card.getByRole("button", { name: "Lembrei", exact: true }).click();
  await expect(card).toHaveCount(0);
});
test("lessons, notifications, settings and legal navigation work", async ({
  page,
}) => {
  test.skip(!users.length, "Requires isolated QA credentials");
  test.setTimeout(120000);
  await login(page);
  await page.goto("/aprender");
  await page.locator(".lesson-list a").first().click();
  await expect(page.locator(".worked-example")).toBeVisible();
  const activity = page.locator(".activity").first();
  if (await activity.getByLabel("Sua resposta", { exact: true }).isEnabled()) {
    await activity.getByLabel("Sua resposta", { exact: true }).fill("1");
    await activity
      .getByRole("button", { name: "Verificar meu entendimento" })
      .click();
  }
  await expect(activity.getByRole("status")).toBeVisible();
  await expect(activity.getByRole("alert")).toHaveCount(0);
  await page.reload();
  await expect(
    page.locator(".activity").first().getByRole("status"),
  ).toBeVisible();
  await expect(
    page
      .locator(".activity")
      .first()
      .getByLabel("Sua resposta", { exact: true }),
  ).toBeDisabled();
  for (const route of [
    "/notificacoes",
    "/mapa",
    "/caderno",
    "/sos",
    "/buscar",
    "/configuracoes",
    "/configuracoes/conta",
    "/configuracoes/dados",
    "/configuracoes/ajuda",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Não conseguimos carregar agora.")).toHaveCount(
      0,
    );
  }
  await page.goto("/configuracoes/notificacoes");
  await page.getByLabel("Estudos e revisões").uncheck();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(page.getByRole("status")).toContainText("salvas");
  await page.reload();
  await expect(page.getByLabel("Estudos e revisões")).not.toBeChecked();
  await page.getByLabel("Estudos e revisões").check();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
  for (const route of [
    "/termos",
    "/privacidade",
    "/cookies",
    "/uso-aceitavel",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
test("administrative health and finance stay restricted", async ({ page }) => {
  test.skip(!users.length, "Requires isolated QA credentials");
  await login(page);
  await page.goto("/admin/financeiro");
  await expect(page.getByText("Receita e MRR", { exact: true })).toHaveCount(0);
  await page.goto("/admin/saude");
  await expect(
    page.getByText("Auditoria recente", { exact: true }),
  ).toHaveCount(0);
  await page.context().clearCookies();
  await login(page, 2);
  await page.goto("/admin/financeiro");
  await expect(page.getByText("Receita e MRR", { exact: true })).toBeVisible();
  await page.goto("/admin/saude");
  await expect(
    page.getByRole("heading", { name: "Saúde da plataforma." }),
  ).toBeVisible();
  await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
});
