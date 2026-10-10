import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];
test.use({ trace: "off", screenshot: "off", video: "off" });
test("real MFA reauthentication validates the database gate without deleting the QA account", async ({
  page,
}) => {
  test.skip(!users.length, "Isolated QA account required");
  test.setTimeout(150000);
  const env = readFileSync(".env.local", "utf8");
  const value = (name: string) =>
    env
      .match(new RegExp("^" + name + "=(.*)$", "m"))![1]
      .trim()
      .replace(/^"|"$/g, "");
  const url = value("NEXT_PUBLIC_SUPABASE_URL");
  expect(url).toBe("https://jseljonjvpkurvhwqsjh.supabase.co");
  const client = createClient(
    url,
    value("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const login = await client.auth.signInWithPassword(users[0]);
  expect(login.error).toBeNull();
  const factors = await client.auth.mfa.listFactors();
  expect(factors.error).toBeNull();
  expect(factors.data!.all).toHaveLength(0); // Never change an existing factor.
  const claims = (await client.auth.getClaims()).data!.claims;
  const started = performance.now();
  const serverNow = () => claims.iat + (performance.now() - started) / 1000;
  const enrolled = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "NEXO disposable browser audit",
  });
  expect(enrolled.error).toBeNull();
  const factor = enrolled.data!;
  const code = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bits = [...factor.totp.secret.toUpperCase().replace(/=+$/, "")]
      .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
      .join("");
    const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(serverNow() / 30)));
    const hash = createHmac("sha1", key).update(counter).digest();
    return String(
      (hash.readUInt32BE(hash[19] & 15) & 0x7fffffff) % 1000000,
    ).padStart(6, "0");
  };
  try {
    expect(
      (
        await client.auth.mfa.challengeAndVerify({
          factorId: factor.id,
          code: code(),
        })
      ).error,
    ).toBeNull();
    await page.goto("/entrar");
    await page.locator("input[name=email]").fill(users[0].email);
    await page.locator("input[name=password]").fill(users[0].password);
    await page.locator("form button").first().click();
    await expect(page).toHaveURL(/inicio$/);
    await page
      .locator(".language-selector:visible select")
      .first()
      .selectOption("pt-BR");
    await page.goto("/configuracoes/dados");
    await page.getByText("Excluir minha conta", { exact: true }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByLabel("Senha atual").fill(users[0].password);
    await page
      .locator("input[name=factorCode]")
      .fill(String((Number(code()) + 1) % 1000000).padStart(6, "0"));
    await page
      .getByRole("button", { name: "Confirmar minha identidade" })
      .click();
    await expect(page.locator("details [role=alert]")).toBeVisible();
    await expect(page.locator("input[name=confirmation]")).toHaveCount(0);
    // Enrollment used the previous window. Never replay an accepted TOTP.
    await new Promise((resolve) =>
      setTimeout(resolve, (31 - (serverNow() % 30)) * 1000),
    );
    await page.getByLabel("Senha atual").fill(users[0].password);
    await page.locator("input[name=factorCode]").fill(code());
    await page
      .getByRole("button", { name: "Confirmar minha identidade" })
      .click();
    await expect(page.locator("details [role=status]")).toContainText(
      "Identidade confirmada",
    );
    await expect(page.getByLabel("Senha atual")).toHaveValue("");
    await expect(page.locator("input[name=factorCode]")).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "Excluir minha conta permanentemente" }),
    ).toBeDisabled();
  } finally {
    const removed = await client.auth.mfa.unenroll({ factorId: factor.id });
    expect(removed.error, "Temporary QA factor must be removed").toBeNull();
    expect((await client.auth.mfa.listFactors()).data!.all).toHaveLength(0);
    await client.auth.signOut({ scope: "local" });
  }
});
