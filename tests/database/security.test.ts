import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const subject = "10000000-0000-4000-8000-000000000001";
const topic = "20000000-0000-4000-8000-000000000001";
const question = "30000000-0000-4000-8000-000000000001";
async function asUser(uid: string, sql: string) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`,
  );
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  await db.exec(
    `create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon;`,
  );
  for (const file of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  await db.exec(
    `insert into auth.users values('${alice}'),('${bob}'); insert into public.subjects(id,name,slug) values('${subject}','Matemática','matematica'); insert into public.topics(id,subject_id,name) values('${topic}','${subject}','Álgebra'); insert into public.questions(id,subject_id,topic_id,statement,options,difficulty,status,fingerprint) values('${question}','${subject}','${topic}','Quanto vale 2 + 2?','["3","4"]',5,'published','test'); insert into private.question_answers values('${question}',1,'Dois mais dois são quatro.');`,
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("database permissions with two independent identities", () => {
  it("keeps notes and flashcards private across CRUD operations", async () => {
    const note = (
      await asUser(
        alice,
        `insert into public.notes(user_id,title,body) values('${alice}','Privado','Somente Alice') returning id`,
      )
    ).rows[0] as { id: string };
    expect(
      (await asUser(bob, `select * from public.notes where id='${note.id}'`))
        .rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(
          bob,
          `update public.notes set body='invasão' where id='${note.id}' returning id`,
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(
          bob,
          `delete from public.notes where id='${note.id}' returning id`,
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(
        bob,
        `insert into public.notes(user_id,title,body) values('${alice}','Falso','Falso')`,
      ),
    ).rejects.toThrow(/row-level security/);
    const card = (
      await asUser(
        alice,
        `insert into public.flashcards(user_id,front,back) values('${alice}','2+2','4') returning id`,
      )
    ).rows[0] as { id: string };
    await expect(
      asUser(bob, `select public.review_flashcard('${card.id}',true)`),
    ).rejects.toThrow(/NOT_FOUND/);
    await asUser(alice, `select public.review_flashcard('${card.id}',true)`);
    await asUser(alice, `select public.review_flashcard('${card.id}',true)`);
    expect(
      (
        await asUser(
          alice,
          `select interval_days from public.flashcards where id='${card.id}'`,
        )
      ).rows,
    ).toEqual([{ interval_days: 2 }]);
    await expect(
      asUser(
        alice,
        `update public.flashcards set interval_days=180 where id='${card.id}'`,
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("grades activities once and never exposes private keys", async () => {
    const lesson = "40000000-0000-4000-8000-000000000001",
      activity = "50000000-0000-4000-8000-000000000001";
    await db.exec(
      `insert into public.lessons(id,topic_id,title,explanation,example,status) values('${lesson}','${topic}','Somar','Explicação','Exemplo','published'); insert into public.learning_activities(id,lesson_id,kind,prompt,difficulty,status) values('${activity}','${lesson}','NUMERIC_INPUT','2+2',1,'published'); insert into private.activity_keys values('${activity}','{"value":4,"tolerance":0}','Somar dois e dois.');`,
    );
    await expect(
      asUser(alice, "select * from private.activity_keys"),
    ).rejects.toThrow(/permission denied/);
    const response = (
      await asUser(
        bob,
        `select public.submit_activity('${activity}','{"value":"4"}','sure') as result`,
      )
    ).rows[0] as { result: { correct: boolean; already_recorded: boolean } };
    expect(response.result).toMatchObject({
      correct: true,
      already_recorded: false,
    });
    const retry = (
      await asUser(
        bob,
        `select public.submit_activity('${activity}','{"value":"9"}','guess') as result`,
      )
    ).rows[0] as { result: { correct: boolean; already_recorded: boolean } };
    expect(retry.result).toMatchObject({
      correct: true,
      already_recorded: true,
    });
    expect(
      (await asUser(alice, "select * from public.activity_attempts")).rows,
    ).toHaveLength(0);
    expect((await asUser(bob, "select xp from public.profiles")).rows).toEqual([
      { xp: 10 },
    ]);
  });
  it("restricts finance, health and notifications to the intended roles", async () => {
    await expect(
      asUser(alice, "select public.admin_finance()"),
    ).rejects.toThrow(/FORBIDDEN/);
    await expect(
      asUser(
        alice,
        "select public.admin_record_cost('IA',10,'BRL','2026-10-01')",
      ),
    ).rejects.toThrow(/FORBIDDEN/);
    await db.exec(
      `insert into private.admins(user_id,role) values('${bob}','FINANCE_ADMIN')`,
    );
    expect(
      (await asUser(bob, "select public.is_admin() as allowed")).rows,
    ).toEqual([{ allowed: false }]);
    await expect(asUser(bob, "select public.admin_health()")).rejects.toThrow(
      /FORBIDDEN/,
    );
    expect(
      (await asUser(bob, "select public.admin_finance() as summary")).rows,
    ).toHaveLength(1);
    await asUser(
      bob,
      "select public.admin_record_cost('IA',10,'BRL','2026-10-01')",
    );
    expect(
      (await db.query("select amount::text from private.cost_entries")).rows,
    ).toEqual([{ amount: "10.00" }]);
    await expect(asUser(bob, "select public.admin_reports()")).rejects.toThrow(
      /FORBIDDEN/,
    );
    await db.exec(
      `delete from private.admins where user_id='${bob}'; insert into public.notifications(user_id,kind,title,body,href,dedupe_key) values('${alice}','TEST','Teste','Mensagem','/inicio','test')`,
    );
    expect(
      (await asUser(bob, "select * from public.notifications")).rows,
    ).toHaveLength(0);
    await expect(
      asUser(alice, "update public.notifications set title='Falso'"),
    ).rejects.toThrow(/permission denied/);
    await asUser(alice, "update public.notifications set read_at=now()");
    await asUser(alice, "select public.sync_notifications()");
    await asUser(alice, "select public.sync_notifications()");
    expect(
      (
        await asUser(
          alice,
          "select * from public.notifications where dedupe_key='test'",
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("each user reads only their profile", async () => {
    expect(
      (await asUser(alice, "select id from public.profiles")).rows,
    ).toEqual([{ id: alice }]);
    expect((await asUser(bob, "select id from public.profiles")).rows).toEqual([
      { id: bob },
    ]);
    expect(
      (await asUser(alice, `select * from public.profiles where id='${bob}'`))
        .rows,
    ).toHaveLength(0);
  });
  it("denies direct INSERT, UPDATE and DELETE even on owned privileged data", async () => {
    for (const sql of [
      `insert into public.profiles(id) values('${alice}')`,
      `update public.profiles set xp=10000 where id='${alice}'`,
      `delete from public.profiles where id='${bob}'`,
      `insert into public.subscriptions(user_id,plan_id,status,period_end) values('${alice}','premium','active','2099-01-01')`,
    ]) {
      await expect(asUser(alice, sql)).rejects.toThrow(/permission denied/);
    }
  });
  it("does not expose answers or admin roles", async () => {
    await expect(
      asUser(alice, "select * from private.question_answers"),
    ).rejects.toThrow(/permission denied/);
    expect(
      (await asUser(alice, "select public.is_admin() as admin")).rows,
    ).toEqual([{ admin: false }]);
  });
  it("binds onboarding and sessions to caller and enforces Free plan", async () => {
    await asUser(
      alice,
      `select public.save_preferences('Alice','ENEM',array['${subject}'::uuid],'intermediate',10)`,
    );
    await expect(
      asUser(
        alice,
        `select public.start_session('simulation',null,null,90,30)`,
      ),
    ).rejects.toThrow(/PLAN_LIMIT/);
    const session = (
      await asUser(
        alice,
        `select public.start_session('practice','${subject}',null,5) as id`,
      )
    ).rows[0] as { id: string };
    await expect(
      asUser(bob, `select public.next_question('${session.id}')`),
    ).rejects.toThrow(/NOT_FOUND/);
    const next = (
      await asUser(
        alice,
        `select public.next_question('${session.id}') as question`,
      )
    ).rows[0] as { question: { id: string; answer?: number } };
    expect(next.question.id).toBe(question);
    expect(next.question.answer).toBeUndefined();
    const sql = `select public.submit_answer('${session.id}','${question}',1) as feedback`;
    expect(
      ((await asUser(alice, sql)).rows[0] as { feedback: { correct: boolean } })
        .feedback.correct,
    ).toBe(true);
    await asUser(alice, sql);
    expect(
      (await asUser(alice, "select xp from public.profiles")).rows,
    ).toEqual([{ xp: 20 }]);
    expect(
      (await asUser(bob, "select * from public.question_attempts")).rows,
    ).toHaveLength(0);
  });
});
