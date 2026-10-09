import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { recentAuthentication } from "../src/domain/reauthentication.ts";
process.loadEnvFile(".env.local");
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://jseljonjvpkurvhwqsjh.supabase.co",
);
const user = JSON.parse(readFileSync(".local/qa-users.json", "utf8"))[1];
assert.equal(user.id, "56df1b3a-990e-44f2-ab5a-2a14a118a811");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
assert.equal(
  (
    await db.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })
  ).error,
  null,
);
const initial = await db.auth.mfa.listFactors();
assert.equal(initial.error, null);
assert.equal(
  initial.data.all.length,
  0,
  "Do not touch a QA account with existing factors",
);
const claims = (await db.auth.getClaims()).data.claims;
const originTime = performance.now();
const serverNow = () => claims.iat + (performance.now() - originTime) / 1000;
const enrolled = await db.auth.mfa.enroll({
  factorType: "totp",
  friendlyName: "NEXO isolated security audit",
});
assert.equal(enrolled.error, null);
const factorId = enrolled.data.id;
function code() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...enrolled.data.totp.secret.toUpperCase().replace(/=+$/, "")]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(serverNow() / 30)));
  const hash = createHmac("sha1", key).update(counter).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(
    6,
    "0",
  );
}
const passed = [];
let cleanupSession;
try {
  const verified = await db.auth.mfa.challengeAndVerify({
    factorId,
    code: code(),
  });
  assert.equal(verified.error, null, "Initial QA factor verification failed");
  cleanupSession = (await db.auth.getSession()).data.session;
  passed.push("official enrollment and factor verification");
  assert.equal(
    (
      await db.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      })
    ).error,
    null,
  );
  let token = (await db.auth.getClaims()).data.claims;
  const policy = {
    userId: user.id,
    hasMfa: true,
    enabledMethods: ["password"],
  };
  assert.equal(recentAuthentication(token, policy, token.iat * 1000), false);
  passed.push("fresh password without second factor rejected");
  // TOTP codes are single-use: advance to the next actual server time window.
  await new Promise((resolve) =>
    setTimeout(resolve, (31 - (serverNow() % 30)) * 1000),
  );
  const correct = code();
  const wrong = String((Number(correct) + 1) % 1000000).padStart(6, "0");
  assert.ok(
    (await db.auth.mfa.challengeAndVerify({ factorId, code: wrong })).error,
  );
  passed.push("incorrect factor rejected by Auth");
  assert.equal(
    (await db.auth.mfa.challengeAndVerify({ factorId, code: correct })).error,
    null,
  );
  token = (await db.auth.getClaims()).data.claims;
  assert.equal(token.aal, "aal2");
  assert.equal(recentAuthentication(token, policy, token.iat * 1000), true);
  passed.push("real fresh password plus TOTP accepted at aal2");
} finally {
  // Keep the verified audit session in memory so a failed second challenge
  // cannot leave the temporary factor behind at an insufficient assurance level.
  if (cleanupSession) {
    assert.equal(
      (
        await db.auth.setSession({
          access_token: cleanupSession.access_token,
          refresh_token: cleanupSession.refresh_token,
        })
      ).error,
      null,
    );
  }
  const removed = await db.auth.mfa.unenroll({ factorId });
  assert.equal(removed.error, null, "QA factor cleanup requires attention");
  assert.equal((await db.auth.mfa.listFactors()).data.all.length, 0);
}
const result = {
  at: new Date().toISOString(),
  passed,
  cleanup: "created QA factor removed",
  limits:
    "Auth API plus pure policy test, not browser MFA or database deletion authorization; no account deleted",
};
writeFileSync(
  ".local/evidence/mfa-security-live.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
