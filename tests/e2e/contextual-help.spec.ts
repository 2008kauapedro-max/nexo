import { test, expect, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
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
async function ownedAttempt() {
  // Read the repository's public configuration; no service key is used by this test.
  const env = readFileSync(".env.local", "utf8");
  const value = (key: string) =>
    env
      .match(new RegExp("^" + key + "=(.*)$", "m"))?.[1]
      .trim()
      .replace(/^"|"$/g, "");
  const client = createClient(
    value("NEXT_PUBLIC_SUPABASE_URL")!,
    value("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const auth = await client.auth.signInWithPassword(users[1]);
  if (auth.error) throw new Error("QA authentication failed");
  const { data, error } = await client
    .from("question_attempts")
    .select("question_id,session_id,learning_sessions!inner(finished_at)")
    .not("learning_sessions.finished_at", "is", null)
    .limit(1)
    .single();
  if (error) throw new Error("Missing owned completed QA attempt");
  await client.auth.signOut({ scope: "local" });
  return data;
}
for (const width of [390, 1440])
  test(`contextual saved help stays in the question at ${width}px without Groq`, async ({
    page,
  }) => {
    test.skip(!users.length, "Requires isolated QA identities");
    const attempt = await ownedAttempt();
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    await page.goto(
      `/sessao/${attempt.session_id}?questao=${attempt.question_id}`,
    );
    await page
      .getByRole("button", { name: /Quero entender|Entender|dica/i })
      .first()
      .click();
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", { name: "Entenda a resposta" }),
    ).toBeVisible();
    await expect(panel).toContainText("não consomem sua cota");
    await panel.getByText('Entenda cada alternativa',{exact:true}).click();
    await expect(panel.locator('ol[type="A"] li')).toHaveCount(4);
    await page.screenshot({path:`.local/evidence/contextual-help-${width}.png`});
    await panel.getByRole("button", { name: /Ainda não entendi/ }).click();
    await expect(
      panel.getByRole("button", { name: "Pedir ajuda personalizada" }),
    ).toBeDisabled();
    await expect(panel).toContainText("continuam funcionando");
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/sessao/);
    await page.goto("/ia");
    await expect(page).toHaveURL(/estudar$/);
    await page.goto("/planos");
    await expect(page.locator("main")).toContainText("24,90");
    await expect(page.locator("main")).toContainText("44,90");
    await expect(page.locator("main")).toContainText("5 ajudas");
  });
test("context requires ownership, blocks generic prompts and protects pre-answer solutions", async ({
  page,
}) => {
  test.skip(!users.length, "Requires isolated QA identities");
  await login(page);
  await page.goto("/estudar");
  await page
    .getByRole("button", { name: "Começar treino →", exact: true })
    .click();
  await expect(page).toHaveURL(/sessao/);
  const session = new URL(page.url()).pathname.split("/").at(-1)!;
  const question = await page.locator('input[name="question"]').inputValue();
  // Use the browser's real cookie/Origin behavior (including Secure cookies on localhost).
  const post = (path: string, data: unknown) =>
    page.evaluate(
      async ({ path, data }) => {
        const response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return { status: response.status, body: await response.json() };
      },
      { path, data },
    );
  const help = await post("/api/question-help", { question, session });
  const content = help.body;
  expect(help.status, JSON.stringify(content)).toBe(200);
  expect(content.help.answer).toBeNull();
  expect(content.help.solution_steps).toEqual([]);
  const payload = {
    question,
    session,
    intent: "concept",
    requestId: crypto.randomUUID(),
    observation: "Por que essa relação funciona?",
  };
  expect((await post("/api/tutor", payload)).status).toBe(503);
  expect((await post("/api/tutor", { ...payload, model: "120b" })).status).toBe(
    400,
  );
  expect(
    (await post("/api/tutor", { ...payload, observation: "Crie um SaaS." }))
      .body.counted,
  ).toBe(false);
  const crossSite = await page.request.post("/api/question-help", {
    headers: { origin: "https://evil.example" },
    data: { question, session },
  });
  expect(crossSite.status()).toBe(403);
  await page.context().clearCookies();
  await login(page, 0);
  expect((await post("/api/question-help", { question, session })).status).toBe(
    403,
  );
});
