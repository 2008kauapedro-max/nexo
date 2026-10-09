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
  await db.exec(`create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade);
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`);
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
  it("validates reports, keeps duplicates idempotent at the limit and isolates reporters", async () => {
    const reporter = "00000000-0000-4000-8000-000000000088";
    await db.exec(`insert into auth.users values('${reporter}');
      insert into public.questions(subject_id,topic_id,statement,options,difficulty,status,fingerprint)
      select '${subject}','${topic}','Security report fixture '||n,'["a","b"]',1,case when n=13 then 'draft' else 'published' end,'report-test-'||n from generate_series(1,13)n;
      insert into private.question_answers(question_id,answer,explanation) select id,0,'Isolated report test fixture answer.' from public.questions where fingerprint like 'report-test-%';`);
    const fixtures = (
      await db.query<{ id: string; status: string }>(
        "select id,status from public.questions where fingerprint like 'report-test-%' order by fingerprint",
      )
    ).rows;
    const published = fixtures.filter((q) => q.status === "published");
    const report = (
      id: string,
      reason = "'Outro'",
      detail = "'security-test'",
    ) => `select public.report_question('${id}',${reason},${detail})`;
    await expect(asUser(reporter, report(question, "null"))).rejects.toThrow(
      /INVALID_INPUT/,
    );
    await expect(
      asUser(reporter, report(question, "'invalid'")),
    ).rejects.toThrow(/INVALID_INPUT/);
    await expect(
      asUser(reporter, report(question, "'Outro'", "repeat('x',1001)")),
    ).rejects.toThrow(/INVALID_INPUT/);
    await expect(
      asUser(reporter, report("99999999-9999-4999-8999-999999999999")),
    ).rejects.toThrow(/NOT_FOUND/);
    await expect(
      asUser(reporter, report(fixtures.find((q) => q.status === "draft")!.id)),
    ).rejects.toThrow(/NOT_FOUND/);
    for (const q of published.slice(0, 10))
      await asUser(reporter, report(q.id));
    await asUser(
      reporter,
      report(
        published[0].id,
        "'Outro'",
        "'changed detail must not replace original'",
      ),
    );
    await expect(asUser(reporter, report(published[10].id))).rejects.toThrow(
      /RATE_LIMIT/,
    );
    expect(
      (
        await asUser(
          reporter,
          "select count(*)::int as count from public.question_reports",
        )
      ).rows,
    ).toEqual([{ count: 10 }]);
    expect(
      (
        await asUser(
          reporter,
          `select detail from public.question_reports where question_id='${published[0].id}'`,
        )
      ).rows,
    ).toEqual([{ detail: "security-test" }]);
    expect(
      (
        await asUser(
          bob,
          `select id from public.question_reports where user_id='${reporter}'`,
        )
      ).rows,
    ).toEqual([]);
    await asUser(bob, report(published[0].id));
  });
  it("stores locale independently without granting access to progress or other profiles", async () => {
    await asUser(
      alice,
      `update public.profiles set ui_locale='ja',region='BR',date_format='ymd',time_zone='Asia/Tokyo' where id='${alice}'`,
    );
    const own = await asUser(
      alice,
      `select ui_locale,content_locale,region,time_zone from public.profiles`,
    );
    expect(own.rows[0]).toMatchObject({
      ui_locale: "ja",
      content_locale: "pt-BR",
      region: "BR",
      time_zone: "Asia/Tokyo",
    });
    expect(
      (
        await asUser(
          bob,
          `update public.profiles set ui_locale='de' where id='${alice}' returning id`,
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(alice, `update public.profiles set xp=99999 where id='${alice}'`),
    ).rejects.toThrow();
    await expect(
      asUser(
        alice,
        `update public.profiles set ui_locale='xx' where id='${alice}'`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        alice,
        `update public.profiles set time_zone='Invalid/Zone' where id='${alice}'`,
      ),
    ).rejects.toThrow();
    await asUser(
      alice,
      `update public.profiles set ui_locale='pt-BR',time_zone='America/Sao_Paulo' where id='${alice}'`,
    );
  });
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
  it("generates an idempotent private study plan and stores reflections without granting XP", async () => {
    await asUser(alice, "select public.generate_study_plan()");
    await asUser(alice, "select public.generate_study_plan()");
    expect(
      (await asUser(alice, "select * from public.study_plan_items")).rows,
    ).toHaveLength(7);
    expect(
      (await asUser(bob, "select * from public.study_plan_items")).rows,
    ).toHaveLength(0);
    const lesson = "40000000-0000-4000-8000-000000000001";
    await asUser(
      alice,
      `insert into public.learning_reflections(user_id,lesson_id,explanation) values('${alice}','${lesson}','Somar significa reunir quantidades em um total.')`,
    );
    expect(
      (await asUser(bob, "select * from public.learning_reflections")).rows,
    ).toHaveLength(0);
    await expect(
      asUser(
        bob,
        `insert into public.learning_reflections(user_id,lesson_id,explanation) values('${alice}','${lesson}','Uma tentativa de escrever na conta de outra pessoa.')`,
      ),
    ).rejects.toThrow(/row-level security/);
    expect(
      (await asUser(alice, "select xp from public.profiles")).rows,
    ).toEqual([{ xp: 20 }]);
    await expect(
      asUser(alice, "select public.admin_quality()"),
    ).rejects.toThrow(/FORBIDDEN/);
  });
  it("honors paid limits only for current subscriptions and ignores forged JWT roles", async () => {
    await db.exec(
      `select set_config('request.jwt.claims','{"role":"SUPER_ADMIN","user_metadata":{"role":"SUPER_ADMIN","plan":"premium"}}',false)`,
    );
    expect(
      (await asUser(alice, "select public.is_admin() as allowed")).rows,
    ).toEqual([{ allowed: false }]);
    await expect(
      asUser(
        alice,
        "select public.start_session('simulation',null,null,180,30)",
      ),
    ).rejects.toThrow(/PLAN_LIMIT/);
    await db.exec(
      `insert into public.subscriptions(user_id,plan_id,status,period_end) values('${alice}','premium','active',now()+interval '1 day')`,
    );
    expect(
      (
        await asUser(
          alice,
          "select public.start_session('simulation',null,null,180,30)",
        )
      ).rows,
    ).toHaveLength(1);
    await db.exec(
      `update public.subscriptions set period_end=now()-interval '1 day' where user_id='${alice}'`,
    );
    await expect(
      asUser(
        alice,
        "select public.start_session('simulation',null,null,180,30)",
      ),
    ).rejects.toThrow(/PLAN_LIMIT/);
    await db.exec(`delete from public.subscriptions where user_id='${alice}'`);
  });
  it("resumes owned activity feedback and grades ordering without leaking another user's answers", async () => {
    const lesson = "40000000-0000-4000-8000-000000000001";
    const activity = "50000000-0000-4000-8000-000000000099";
    await db.exec(
      `insert into public.learning_activities(id,lesson_id,kind,prompt,payload,difficulty,status) values('${activity}','${lesson}','ORDERING','Ordene as etapas','{"items":["fim","inicio"]}',2,'published'); insert into private.activity_keys values('${activity}','{"value":["inicio","fim"]}','Comece pelo inicio e avance até o fim.');`,
    );
    const before = (
      await asUser(
        alice,
        `select public.activity_feedback('${lesson}') as feedback`,
      )
    ).rows[0] as { feedback: unknown[] };
    expect(before.feedback).toEqual([]);
    await asUser(
      alice,
      `select public.submit_activity('${activity}','{"value":["inicio","fim"]}','sure')`,
    );
    const saved = (
      await asUser(
        alice,
        `select public.activity_feedback('${lesson}') as feedback`,
      )
    ).rows[0] as {
      feedback: { activity_id: string; correct: boolean; response: unknown }[];
    };
    expect(saved.feedback).toEqual([
      expect.objectContaining({
        activity_id: activity,
        correct: true,
        response: { value: ["inicio", "fim"] },
      }),
    ]);
    const others = (
      await asUser(
        bob,
        `select public.activity_feedback('${lesson}') as feedback`,
      )
    ).rows[0] as { feedback: { activity_id: string }[] };
    expect(others.feedback.some((row) => row.activity_id === activity)).toBe(
      false,
    );
  });
  it("deletes only the caller and cascades private study records", async () => {
    const disposable = "00000000-0000-4000-8000-000000000099";
    await db.exec(`insert into auth.users values('${disposable}');`);
    await asUser(
      disposable,
      `insert into public.notes(user_id,title,body) values('${disposable}','Descartável','Teste isolado de exclusão')`,
    );
    await asUser(disposable, "select public.delete_account()");
    expect(
      (await db.query(`select id from auth.users where id='${disposable}'`))
        .rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          `select id from public.notes where user_id='${disposable}'`,
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(disposable, "select id from public.profiles")).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          `select id from auth.users where id in ('${alice}','${bob}')`,
        )
      ).rows,
    ).toHaveLength(2);
  });
  it("restricts billing to the server and makes replay and out-of-order events safe", async () => {
    const event = `select public.apply_billing_event('qa-event',repeat('a',64),'${bob}','pro','active',now()+interval '1 day',now()) as result`;
    await expect(asUser(bob, event)).rejects.toThrow(/permission denied/);
    await db.exec("set role service_role");
    try {
      expect((await db.query(event)).rows).toEqual([{ result: "accepted" }]);
      expect((await db.query(event)).rows).toEqual([{ result: "duplicate" }]);
      await expect(
        db.query(event.replace("repeat('a',64)", "repeat('b',64)")),
      ).rejects.toThrow(/EVENT_COLLISION/);
      await db.query(
        `select public.apply_billing_event('qa-old-event',repeat('c',64),'${bob}','free','expired',now()-interval '1 day',now()-interval '2 days')`,
      );
    } finally {
      await db.exec("reset role");
    }
    expect(
      (
        await db.query(
          `select plan_id,status from public.subscriptions where user_id='${bob}'`,
        )
      ).rows,
    ).toEqual([{ plan_id: "pro", status: "active" }]);
    await db.exec(`delete from public.subscriptions where user_id='${bob}'`);
  });
  it("restores the visible question without advancing or leaking answers", async () => {
    await db.exec(`delete from public.usage_counters where user_id='${alice}'`);
    for (const mode of ["practice", "simulation"]) {
      const sid = (
        await asUser(
          alice,
          `select public.start_session('${mode}','${subject}','${topic}',5,30) as id`,
        )
      ).rows[0] as { id: string };
      const served = (
        await asUser(alice, `select public.next_question('${sid.id}') as q`)
      ).rows[0] as { q: { id: string } };
      const call = `select public.session_question_view('${sid.id}','${served.q.id}') as view`;
      const before = (await asUser(alice, call)).rows[0] as {
        view: { feedback: unknown };
      };
      expect(before.view.feedback).toBeNull();
      await expect(asUser(bob, call)).rejects.toThrow(/NOT_FOUND/);
      await asUser(
        alice,
        `select public.submit_answer('${sid.id}','${served.q.id}',0)`,
      );
      const restored = (await asUser(alice, call)).rows[0] as {
        view: {
          selected: number;
          feedback: { answer: number | null; correct: boolean | null };
        };
      };
      expect(restored.view.selected).toBe(0);
      if (mode === "simulation")
        expect(restored.view.feedback).toMatchObject({
          answer: null,
          correct: null,
        });
      else expect(restored.view.feedback.answer).not.toBeNull();
      expect(
        (
          await asUser(
            alice,
            `select current_question_id,answered from public.learning_sessions where id='${sid.id}'`,
          )
        ).rows[0],
      ).toMatchObject({ current_question_id: null, answered: 1 });
    }
  });
  it("paginates editorial search on the server and denies students", async () => {
    await expect(
      asUser(bob, "select public.admin_questions_page('',0)"),
    ).rejects.toThrow(/FORBIDDEN/);
    await db.exec(`insert into private.admins(user_id,role) values('${alice}','CONTENT_ADMIN') on conflict(user_id) do update set role='CONTENT_ADMIN';
      insert into public.questions(subject_id,topic_id,statement,options,difficulty,fingerprint) select '${subject}','${topic}','Paginação QA '||n,'["a","b"]',1,'pagination-'||n from generate_series(1,13)n;
      insert into private.question_answers(question_id,answer,explanation) select id,0,'Explicação de teste isolado.' from public.questions where fingerprint like 'pagination-%';`);
    const first = (
      await asUser(
        alice,
        "select public.admin_questions_page('Paginação QA',0) as page",
      )
    ).rows[0] as { page: { total: number; rows: { id: string }[] } };
    const second = (
      await asUser(
        alice,
        "select public.admin_questions_page('Paginação QA',1) as page",
      )
    ).rows[0] as typeof first;
    expect(first.page.total).toBe(13);
    expect(first.page.rows).toHaveLength(10);
    expect(second.page.rows).toHaveLength(3);
    expect(
      new Set([...first.page.rows, ...second.page.rows].map((r) => r.id)).size,
    ).toBe(13);
    await expect(
      asUser(alice, "select public.admin_questions_page('',-1)"),
    ).rejects.toThrow(/INVALID_INPUT/);
    await db.exec(
      `delete from public.questions where fingerprint like 'pagination-%';delete from private.admins where user_id='${alice}';`,
    );
  });
  it("requires review and provenance before a translated question can be published", async () => {
    await expect(
      db.exec(
        `insert into public.questions(subject_id,topic_id,statement,options,difficulty,fingerprint,status,locale,translation_of,translation_status) values('${subject}','${topic}','A translated question?','["a","b"]',1,'translation-test','published','en-US','${question}','draft')`,
      ),
    ).rejects.toThrow(/reviewed_translation_publication/);
    await db.exec(
      `insert into public.questions(subject_id,topic_id,statement,options,difficulty,fingerprint,status,locale,translation_of,translation_status) values('${subject}','${topic}','A translated question?','["a","b"]',1,'translation-test','draft','en-US','${question}','draft')`,
    );
    await expect(
      db.exec(
        "update public.questions set status='published' where fingerprint='translation-test'",
      ),
    ).rejects.toThrow();
    await db.exec(
      "update public.questions set translation_status='reviewed',review_status='approved',translation_source='Human editorial review',status='published' where fingerprint='translation-test'",
    );
    expect(
      (
        await db.query(
          "select source_language,translation_status from public.questions where fingerprint='translation-test'",
        )
      ).rows[0],
    ).toMatchObject({
      source_language: "pt-BR",
      translation_status: "reviewed",
    });
    await db.exec(
      "delete from public.questions where fingerprint='translation-test'",
    );
  });
});
