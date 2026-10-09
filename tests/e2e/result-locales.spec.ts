import {test, expect} from "@playwright/test";
import {existsSync, readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const users = existsSync(".local/qa-users.json") ? JSON.parse(readFileSync(".local/qa-users.json", "utf8")) : [];
test("subject and completed result render in all ten languages on mobile", async ({page}) => {
  test.skip(!users.length, "Isolated QA account required");
  test.setTimeout(180000);
  expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://jseljonjvpkurvhwqsjh.supabase.co");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {auth:{persistSession:false}});
  expect((await db.auth.signInWithPassword({email:users[1].email,password:users[1].password})).error).toBeNull();
  const {data, error} = await db.from("learning_sessions").select("id").eq("user_id",users[1].id).not("finished_at","is",null).gt("answered",0).order("finished_at",{ascending:false}).limit(1).single();
  expect(error).toBeNull();
  await page.setViewportSize({width:360,height:800});
  await page.goto("/entrar");
  await page.locator("input[name=email]").fill(users[1].email);
  await page.locator("input[name=password]").fill(users[1].password);
  await page.locator("form button").first().click();
  await expect(page).toHaveURL(/inicio$/);
  const language = page.locator(".language-selector:visible select").first();
  try {
    for (const locale of ["pt-BR","en-US","es","fr","de","it","ja","ko","zh-CN","ru"]) {
      const messages = JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
      await language.selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("lang",locale);
      await page.goto("/estudar/matematica");
      await expect(page.locator("h1")).toHaveText(messages.subjects.mathematics);
      await expect(page.getByRole("button",{name:messages.subject.quick + " →",exact:true})).toBeVisible();
      await page.goto(`/resultado/${data!.id}`);
      await expect(page.locator("h1")).toHaveText(messages.result.title);
      await expect(page.getByRole("heading",{name:messages.result.path})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),locale).toBe(true);
    }
  } finally {
    await language.selectOption("pt-BR");
  }
});
