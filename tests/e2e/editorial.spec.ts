import { test, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];
async function login(page: Page, index: number) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(users[index].email);
  await page.getByLabel("Senha", { exact: true }).fill(users[index].password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/inicio$/);
}
test("student report reaches admin review and stays resolved after refresh", async ({
  page,
}) => {
  test.skip(!users.length, "Requires isolated QA accounts");
  const marker = `Auditoria QA de relato ${Date.now()}`;
  await login(page, 1);
  await page.goto("/desafios");
  await page.getByRole("button", { name: "Começar meu desafio →" }).click();
  await expect(page).toHaveURL(/sessao/);
  await page.getByText("Reportar problema", { exact: true }).click();
  const question = await page.locator('input[name="question"]').inputValue();
  await page
    .getByRole("combobox", { name: "Motivo", exact: true })
    .selectOption("Outro");
  await page.getByLabel("Detalhes (opcional)").fill(marker);
  await page.getByRole("button", { name: "Enviar relato" }).click();
  await expect(page.getByRole("status")).toContainText(/Recebemos|já enviou/);
  process.loadEnvFile(".env.local");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(
    "https://jseljonjvpkurvhwqsjh.supabase.co",
  );
  const { error: loginError } = await db.auth.signInWithPassword({
    email: users[1].email,
    password: users[1].password,
  });
  expect(loginError).toBeNull();
  const { data: saved, error } = await db
    .from("question_reports")
    .select("id,detail")
    .eq("question_id", question)
    .single();
  expect(error).toBeNull();
  expect(saved).not.toBeNull();
  if (saved!.detail !== marker)
    await expect(page.getByRole("status")).toContainText("já enviou");
  await login(page, 2);
  await page.goto("/admin/relatos");
  const report = page.locator(`article[data-report-id="${saved!.id}"]`);
  await expect(report).toBeVisible();
  await report.getByLabel("Encaminhamento").selectOption("resolved");
  await report.getByRole("button", { name: "Salvar encaminhamento" }).click();
  await expect(report.getByRole("status")).toContainText("registrada");
  await page.reload();
  await expect(report.getByLabel("Encaminhamento")).toHaveValue("resolved");
});
test("error reflection and draft editorial changes persist", async ({
  page,
}) => {
  test.skip(!users.length, "Requires isolated QA accounts");
  await login(page, 1);
  await page.goto("/caderno?tab=recentes");
  const note = page.locator("article.note").first();
  await note.locator("summary").click();
  await note.getByLabel("O que aconteceu?").selectOption("Interpretação");
  await note.getByLabel("Já entendi este erro").check();
  await note.getByRole("button", { name: "Salvar reflexão" }).click();
  await page.goto("/caderno?tab=resolvidos");
  await expect(page.locator("article.note").first()).toBeVisible();
  await login(page, 2);
  await page.goto("/admin");
  await page.getByLabel("Pesquisar", { exact: true }).fill("Na equação");
  // Factory drafts stay unpublished; edit only an existing generated draft.
  let draft = page.locator("tbody tr").filter({ hasText: "draft" }).first();
  if ((await draft.count()) === 0) {
    await page.getByLabel("Pesquisar", { exact: true }).fill("");
    draft = page.locator("tbody tr").filter({ hasText: "draft" }).first();
  }
  await draft.getByRole("button", { name: "Editar", exact: true }).click();
  const explanation = page.getByRole("textbox", {
    name: "Explicação",
    exact: true,
  });
  const original = await explanation.inputValue();
  const statement = await page
    .getByRole("textbox", { name: "Enunciado", exact: true })
    .inputValue();
  const updated = original.includes("Igualdade conferida na revisão.")
    ? original
    : original + " Igualdade conferida na revisão.";
  await explanation.fill(updated);
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("draft");
  await page.getByRole("button", { name: "Salvar questão" }).click();
  await expect(page.locator("section:visible [role=status]")).toContainText(
    "salva",
  );
  await page.reload();
  await page.getByLabel("Pesquisar", { exact: true }).fill(statement);
  await page
    .locator("tbody tr")
    .filter({ hasText: statement })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Explicação", exact: true }),
  ).toHaveValue(updated);
});
