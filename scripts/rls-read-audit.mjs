import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
process.loadEnvFile(".env.local");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, "https://jseljonjvpkurvhwqsjh.supabase.co");
const users = JSON.parse(readFileSync(".local/qa-users.json", "utf8")).slice(0, 2);
assert.deepEqual(users.map(u => u.id), ["dbde8ccf-854d-4cf6-a7bb-77c9168ac4fe", "56df1b3a-990e-44f2-ab5a-2a14a118a811"]);
const clients = [];
for (const user of users) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {auth: {persistSession: false, autoRefreshToken: false}});
  const login = await client.auth.signInWithPassword({email: user.email, password: user.password});
  assert.equal(login.error, null, "QA login failed");
  clients.push(client);
}
const tables = ["profiles", "user_subjects", "learning_sessions", "question_attempts", "topic_mastery", "review_queue", "usage_counters", "user_achievements", "ai_threads", "ai_messages", "ai_usage", "subscriptions", "notes", "flashcards", "notification_preferences", "notifications", "error_annotations", "question_reports", "activity_attempts", "study_plan_items", "learning_reflections"];
const results = [];
for (const table of tables) {
  const owner = table === "profiles" ? "id" : "user_id";
  const counts = [];
  for (let i = 0; i < 2; i++) {
    const own = await clients[i].from(table).select(owner, {count: "exact"}).eq(owner, users[i].id).limit(1);
    assert.equal(own.error, null, `${table}: own query failed`);
    counts.push(own.count);
    const cross = await clients[1-i].from(table).select(owner, {count: "exact"}).eq(owner, users[i].id);
    assert.equal(cross.error, null, `${table}: unexpected cross query error`);
    assert.equal(cross.count, 0, `${table}: cross-user data visible`);
  }
  results.push({table, ownRowCounts: counts, crossSelect: "denied", coverage: counts.every(n => n > 0) ? "positive fixtures both directions" : "missing fixture in one or both directions"});
}
mkdirSync(".local/evidence", {recursive: true});
const report = {at: new Date().toISOString(), results, note: "Read-only audit. Empty tables are not proof of isolation; CRUD and missing fixtures require separate tests."};
writeFileSync(".local/evidence/rls-read-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
