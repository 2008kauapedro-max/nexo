import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8")) : [];
// Credentials must never enter traces, screenshots or test attachments.
test.use({ trace: "off", screenshot: "off", video: "off" });
test("deletion requires real password reauthentication and remains gated", async ({ page }) => {
  test.skip(!users.length, "Isolated QA account required");
  test.setTimeout(120000);
  await page.goto("/entrar");
  await page.locator("input[name=email]").fill(users[1].email);
  await page.locator("input[name=password]").fill(users[1].password);
  await page.locator("form button").first().click();
  await expect(page).toHaveURL(/inicio$/);
  await page.locator(".language-selector:visible select").first().selectOption("pt-BR");
  await page.goto("/configuracoes/dados");
  await page.getByText("Excluir minha conta", { exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Senha atual").fill("Incorrect-QA-password-123!");
  await page.getByRole("button", { name: "Confirmar minha identidade" }).click();
  await expect(page.locator("details [role=alert]")).toContainText("Confirme sua senha atual");
  await expect(page.getByRole("button", { name: "Confirmar minha identidade" })).toBeEnabled();
  await expect(page.getByLabel("Senha atual")).toHaveValue("");
  await expect(page.locator("input[name=confirmation]")).toHaveCount(0);
  await page.getByLabel("Senha atual").fill(users[1].password);
  await page.getByRole("button", { name: "Confirmar minha identidade" }).click();
  await expect(page.locator("details [role=status]")).toContainText("Identidade confirmada");
  await expect(page.getByLabel("Senha atual")).toHaveValue("");
  await page.locator("input[name=confirmation]").fill("EXCLUIR");
  await expect(page.getByRole("button", { name: "Excluir minha conta permanentemente" })).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.locator("input[name=confirmation]")).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByLabel("Senha atual")).toHaveValue("");
  await expect(page.locator("input[name=confirmation]")).toHaveCount(0);
  await page.goto("/inicio");
  await expect(page).toHaveURL(/inicio$/);
});
