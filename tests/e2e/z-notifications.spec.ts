import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const users = existsSync(".local/qa-users.json")
  ? JSON.parse(readFileSync(".local/qa-users.json", "utf8"))
  : [];
test("real notification badges 0, 1, 2, 9, 99, 100 and read/deep-link actions", async ({
  page,
}) => {
  test.skip(
    !users.length,
    "Requires isolated QA accounts and qa-badge fixtures",
  );
  test.setTimeout(90000);
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { error } = await db.auth.signInWithPassword({
    email: users[1].email,
    password: users[1].password,
  });
  expect(error).toBeNull();
  const { data: rows, error: readError } = await db
    .from("notifications")
    .select("id")
    .like("dedupe_key", "qa-badge-%")
    .order("dedupe_key");
  expect(readError).toBeNull();
  expect(rows).toHaveLength(100);
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(users[1].email);
  await page.getByLabel("Senha", { exact: true }).fill(users[1].password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/inicio$/);
  for (const count of [0, 1, 2, 9, 99, 100]) {
    expect(
      (
        await db
          .from("notifications")
          .update({ read_at: new Date().toISOString(), dismissed_at: null })
          .eq("user_id", users[1].id)
      ).error,
    ).toBeNull();
    if (count)
      expect(
        (
          await db
            .from("notifications")
            .update({ read_at: null })
            .in(
              "id",
              rows!.slice(0, count).map((r) => r.id),
            )
        ).error,
      ).toBeNull();
    await page.goto("/notificacoes");
    const badge = page.locator(".notification-bell:visible span");
    if (count)
      await expect(badge).toHaveText(count > 99 ? "99+" : String(count));
    else await expect(badge).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Marcar todas como lidas" }).click();
  await expect(page.locator(".notification-bell:visible span")).toHaveCount(0);
  await page
    .locator(".notification-item a")
    .filter({ hasText: "Auditoria de notificações" })
    .first()
    .click();
  await expect(page).toHaveURL(/plano$/);
  await page.goto("/notificacoes");
  await page
    .getByRole("button", { name: "Dispensar", exact: true })
    .first()
    .click();
  expect(
    (
      await db
        .from("notifications")
        .update({ dismissed_at: new Date().toISOString() })
        .like("dedupe_key", "qa-badge-%")
    ).error,
  ).toBeNull();
  await db.auth.signOut();
});
