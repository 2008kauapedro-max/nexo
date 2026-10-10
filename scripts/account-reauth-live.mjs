// NEXO QA only. No user is deleted; only this script's own session is signed out.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.equal(url, "https://jseljonjvpkurvhwqsjh.supabase.co");
const users = JSON.parse(readFileSync(".local/qa-users.json", "utf8"));
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const passed = [];
async function login() {
  const result = await db.auth.signInWithPassword(users[1]);
  assert.equal(result.error, null, "Isolated QA authentication failed");
  return result.data.session;
}
const session = await login();
assert.equal((await db.rpc("account_deletion_readiness")).data, true);
passed.push("fresh real password session accepted by database");
// Never probe the destructive legacy RPC here: permissions are audited through
// pg_proc/has_function_privilege, and direct-call regressions use PGlite only.
console.log(
  "Fresh-session check passed; waiting for the five-minute reauthentication window to expire.",
);
await new Promise((resolve) => setTimeout(resolve, 310000));
assert.equal(
  (await db.rpc("account_deletion_readiness")).error?.message,
  "REAUTH_REQUIRED",
);
passed.push("genuinely aged unexpired JWT rejected after five minutes");
const recent = await login();
assert.notEqual(recent.access_token, session.access_token);
assert.equal((await db.rpc("account_deletion_readiness")).data, true);
passed.push("new password reauthentication accepted again");
assert.equal((await db.auth.signOut({ scope: "local" })).error, null);
const response = await fetch(`${url}/rest/v1/rpc/account_deletion_readiness`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${recent.access_token}`,
    "Content-Type": "application/json",
  },
  body: "{}",
});
const revoked = await response.json();
assert.equal(response.ok, false);
assert.equal(revoked.message, "SESSION_REVOKED");
passed.push("revoked session rejected while its signed JWT is still unexpired");
const result = {
  at: new Date().toISOString(),
  passed,
  deletedAccounts: 0,
  scope: "NEXO isolated QA user only; no tokens stored",
};
mkdirSync(".local/evidence", { recursive: true });
writeFileSync(
  ".local/evidence/account-reauth-live.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
