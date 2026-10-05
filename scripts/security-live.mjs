import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
process.loadEnvFile(".env.local");
const users = JSON.parse(readFileSync(".local/qa-users.json", "utf8"));
const clients = [];
const results = [];
for (const u of users) {
  const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } },
  );
  const { error } = await c.auth.signInWithPassword({
    email: u.email,
    password: u.password,
  });
  assert.equal(error, null, "QA login must work");
  clients.push(c);
}
const [a, b, admin] = clients;
for (const [client, index] of [
  [a, 0],
  [b, 1],
]) {
  const { data, error } = await client.from("profiles").select("*");
  assert.equal(error, null);
  assert.equal(data.length, 1);
  assert.equal(data[0].id, users[index].id);
  const other = users[1 - index].id;
  const cross = await client.from("profiles").select("*").eq("id", other);
  assert.deepEqual(cross.data, []);
  for (const op of [
    client.from("profiles").update({ xp: 999999 }).eq("id", other),
    client.from("profiles").delete().eq("id", other),
    client.from("subscriptions").insert({
      user_id: users[index].id,
      plan_id: "premium",
      status: "active",
      period_end: "2099-01-01",
    }),
  ])
    assert.ok((await op).error);
  assert.equal((await client.rpc("is_admin")).data, false);
  assert.ok((await client.rpc("admin_questions")).error);
  const subjects = (await client.from("subjects").select("id")).data;
  assert.equal(
    (
      await client.rpc("save_preferences", {
        p_name: users[index].name,
        p_goal: "ENEM",
        p_subjects: subjects.map((s) => s.id),
        p_level: "intermediate",
        p_daily_goal: 10,
      })
    ).error,
    null,
  );
  assert.match(
    (
      await client.rpc("start_session", {
        p_mode: "simulation",
        p_target: 90,
        p_minutes: 30,
      })
    ).error.message,
    /PLAN_LIMIT/,
  );
  results.push(
    `User ${index + 1}: own SELECT passes, cross-user SELECT empty, forbidden INSERT/UPDATE/DELETE denied, admin denied, paid limit denied`,
  );
}
const s = await a.rpc("start_session", { p_mode: "practice", p_target: 5 });
assert.equal(s.error, null);
assert.match(
  (await b.rpc("next_question", { p_session: s.data })).error.message,
  /NOT_FOUND/,
);
const q = (await a.rpc("next_question", { p_session: s.data })).data;
assert.ok(q.id);
assert.equal(q.answer, undefined);
const ctx = await a.rpc("ai_context", { p_question: q.id, p_session: s.data });
assert.equal(ctx.error, null);
assert.equal(ctx.data.answer, null);
assert.equal(ctx.data.explanation, null);
const ans = await a.rpc("submit_answer", {
  p_session: s.data,
  p_question: q.id,
  p_selected: 0,
});
assert.equal(ans.error, null);
const before = (await a.from("profiles").select("xp").single()).data.xp;
await a.rpc("submit_answer", {
  p_session: s.data,
  p_question: q.id,
  p_selected: 0,
});
assert.equal((await a.from("profiles").select("xp").single()).data.xp, before);
assert.equal(
  (await b.from("question_attempts").select("*").eq("session_id", s.data)).data
    .length,
  0,
);
assert.equal((await admin.rpc("is_admin")).data, true);
const subs = (await admin.from("subjects").select("id")).data;
await admin.rpc("save_preferences", {
  p_name: "QA Admin",
  p_goal: "ENEM",
  p_subjects: subs.map((s) => s.id),
  p_level: "intermediate",
  p_daily_goal: 10,
});
results.push(
  "Cross-session IDOR denied; answer key hidden before response including hint context; answer retry is idempotent; real admin authorized.",
);
writeFileSync(
  ".local/security-report.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
process.stdout.write(results.join("\n") + "\n");
