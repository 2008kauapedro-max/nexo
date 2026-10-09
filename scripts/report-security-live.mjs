import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
process.loadEnvFile(".env.local");
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://jseljonjvpkurvhwqsjh.supabase.co",
  "NEXO only",
);
const qa = JSON.parse(readFileSync(".local/qa-users.json", "utf8"));
const results = [];
const runId = "security-report-audit:" + new Date().toISOString();
const clients = [];
for (const account of qa) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  assert.equal(error, null, "QA authentication");
  assert.equal(data.user.id, account.id);
  clients.push(client);
}
const [a, b, admin] = clients;
const before = await a
  .from("question_reports")
  .select("id,question_id,detail,created_at");
assert.equal(before.error, null);
const active = before.data.filter(
  (r) => Date.parse(r.created_at) > Date.now() - 3600000,
).length;
assert.ok(
  active < 9,
  "Need a QA account with capacity; do not reset user counters to force a pass",
);
const catalog = await a
  .from("questions")
  .select("id")
  .eq("status", "published")
  .limit(100);
assert.equal(catalog.error, null);
const available = catalog.data.filter(
  (q) => !before.data.some((r) => r.question_id === q.id),
);
assert.ok(
  available.length >= 20,
  "Enough distinct published QA targets required",
);
const report = (client, id, detail = runId, reason = "Outro") =>
  client.rpc("report_question", {
    p_question: id,
    p_reason: reason,
    p_detail: detail,
  });
try {
  const first = available.shift().id;
  assert.equal((await report(a, first)).error, null);
  results.push({ case: "single request", status: "PASS" });
  const duplicates = await Promise.all(
    Array.from({ length: 10 }, () => report(a, first, runId + ":duplicate")),
  );
  assert.ok(duplicates.every((r) => !r.error));
  const saved = await a
    .from("question_reports")
    .select("id,detail")
    .eq("question_id", first);
  assert.equal(saved.data.length, 1);
  assert.equal(saved.data[0].detail, runId);
  results.push({
    case: "10 duplicate requests",
    status: "PASS",
    rows: 1,
    originalPreserved: true,
  });
  const cross = await b
    .from("question_reports")
    .select("id")
    .eq("id", saved.data[0].id);
  assert.deepEqual(cross.data, []);
  const denied = await b
    .from("question_reports")
    .update({ detail: "forged" })
    .eq("id", saved.data[0].id);
  assert.ok(denied.error);
  const forged = await b
    .from("question_reports")
    .insert({
      user_id: qa[0].id,
      question_id: first,
      reason: "Outro",
      detail: "forged",
    });
  assert.ok(forged.error);
  assert.equal((await report(b, first)).error, null);
  const bob = await b
    .from("question_reports")
    .select("id,user_id")
    .eq("question_id", first);
  assert.equal(bob.data.length, 1);
  assert.equal(bob.data[0].user_id, qa[1].id);
  results.push({
    case: "A/B ownership and independent report",
    status: "PASS",
  });
  for (let count = active + 1; count < 9; count++)
    assert.equal((await report(a, available.shift().id)).error, null);
  const competing = await Promise.all(
    available.splice(0, 10).map((q) => report(a, q.id)),
  );
  assert.equal(competing.filter((r) => !r.error).length, 1);
  assert.equal(
    competing.filter((r) => r.error?.message === "RATE_LIMIT").length,
    9,
  );
  assert.equal((await report(a, first)).error, null);
  results.push({
    case: "one remaining allowance, 10 simultaneous distinct requests",
    status: "PASS",
    accepted: 1,
    limited: 9,
    duplicateAtLimit: "PASS",
  });
  assert.match(
    (await report(a, "99999999-9999-4999-8999-999999999999")).error.message,
    /NOT_FOUND/,
  );
  const editorial = await admin.rpc("admin_questions");
  assert.equal(editorial.error, null);
  const draft = editorial.data.find((q) => q.status !== "published");
  assert.ok(draft, "Existing unpublished QA fixture required");
  assert.match((await report(a, draft.id)).error.message, /NOT_FOUND/);
  for (const [reason, detail] of [
    [null, runId],
    ["invalid", runId],
    ["Outro", null],
    ["Outro", "x".repeat(1001)],
  ]) {
    assert.match(
      (await report(a, first, detail, reason)).error.message,
      /INVALID_INPUT/,
    );
  }
  assert.ok((await report(a, "invalid-uuid")).error);
  results.push({
    case: "missing/unpublished question and invalid/null/oversized payload",
    status: "PASS",
  });
} finally {
  const created = await Promise.all(
    [a, b].map((c) =>
      c
        .from("question_reports")
        .select("id,user_id,question_id")
        .eq("detail", runId),
    ),
  );
  const evidence = {
    at: new Date().toISOString(),
    runId,
    results,
    createdQaReports: created.flatMap((r) => r.data || []),
  };
  mkdirSync(".local/evidence", { recursive: true });
  writeFileSync(
    ".local/evidence/report-security-live.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    JSON.stringify(
      { runId, results, createdQaReports: evidence.createdQaReports.length },
      null,
      2,
    ),
  );
  // Retain identified QA evidence; no DELETE, global reset or alteration of other users.
}
