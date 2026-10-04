import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
const db = new PGlite();
const alice = '00000000-0000-4000-8000-000000000001';
const bob = '00000000-0000-4000-8000-000000000002';
const subject = '10000000-0000-4000-8000-000000000001';
const topic = '20000000-0000-4000-8000-000000000001';
const question = '30000000-0000-4000-8000-000000000001';
async function asUser(uid: string, sql: string) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
  try { return await db.query(sql); } finally { await db.exec('reset role'); }
}
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon;`);
  await db.exec(readFileSync('supabase/migrations/20261004144210_nexo_core.sql','utf8'));
  await db.exec(`insert into auth.users values('${alice}'),('${bob}'); insert into public.subjects(id,name,slug) values('${subject}','Matemática','matematica'); insert into public.topics(id,subject_id,name) values('${topic}','${subject}','Álgebra'); insert into public.questions(id,subject_id,topic_id,statement,options,difficulty,status,fingerprint) values('${question}','${subject}','${topic}','Quanto vale 2 + 2?','["3","4"]',5,'published','test'); insert into private.question_answers values('${question}',1,'Dois mais dois são quatro.');`);
}, 30000);
afterAll(async () => { await db.close(); });
describe('database permissions with two independent identities', () => {
  it('each user reads only their profile', async () => {
    expect((await asUser(alice,'select id from public.profiles')).rows).toEqual([{ id: alice }]);
    expect((await asUser(bob,'select id from public.profiles')).rows).toEqual([{ id: bob }]);
    expect((await asUser(alice,`select * from public.profiles where id='${bob}'`)).rows).toHaveLength(0);
  });
  it('denies direct INSERT, UPDATE and DELETE even on owned privileged data', async () => {
    for (const sql of [`insert into public.profiles(id) values('${alice}')`,`update public.profiles set xp=10000 where id='${alice}'`,`delete from public.profiles where id='${bob}'`,`insert into public.subscriptions(user_id,plan_id,status,period_end) values('${alice}','premium','active','2099-01-01')`]) {
      await expect(asUser(alice,sql)).rejects.toThrow(/permission denied/);
    }
  });
  it('does not expose answers or admin roles', async () => {
    await expect(asUser(alice,'select * from private.question_answers')).rejects.toThrow(/permission denied/);
    expect((await asUser(alice,'select public.is_admin() as admin')).rows).toEqual([{ admin: false }]);
  });
  it('binds onboarding and sessions to caller and enforces Free plan', async () => {
    await asUser(alice,`select public.save_preferences('Alice','ENEM',array['${subject}'::uuid],'intermediate',10)`);
    await expect(asUser(alice,`select public.start_session('simulation',null,null,90,30)`)).rejects.toThrow(/PLAN_LIMIT/);
    const session = (await asUser(alice,`select public.start_session('practice','${subject}',null,5) as id`)).rows[0] as { id: string };
    await expect(asUser(bob,`select public.next_question('${session.id}')`)).rejects.toThrow(/NOT_FOUND/);
    const next = (await asUser(alice,`select public.next_question('${session.id}') as question`)).rows[0] as { question: { id: string; answer?: number } };
    expect(next.question.id).toBe(question); expect(next.question.answer).toBeUndefined();
    const sql = `select public.submit_answer('${session.id}','${question}',1) as feedback`;
    expect(((await asUser(alice,sql)).rows[0] as { feedback: { correct: boolean } }).feedback.correct).toBe(true);
    await asUser(alice,sql);
    expect((await asUser(alice,'select xp from public.profiles')).rows).toEqual([{ xp: 20 }]);
    expect((await asUser(bob,'select * from public.question_attempts')).rows).toHaveLength(0);
  });
});
