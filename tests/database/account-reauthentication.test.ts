import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, it, expect } from "vitest";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const sid = "00000000-0000-4000-8000-000000000003";
let now: number;
let claims: Record<string, unknown>;
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key,banned_until timestamptz,deleted_at timestamptz);
    create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz,aal text);
    create table auth.mfa_amr_claims(session_id uuid,authentication_method text,updated_at timestamptz);
    create table auth.mfa_factors(user_id uuid,status text);
    create table private.admins(user_id uuid);
    create function auth.jwt() returns jsonb language sql as $$select current_setting('request.jwt.claims')::jsonb$$;
    create function auth.uid() returns uuid language sql as $$select (auth.jwt()->>'sub')::uuid$$;
    create function public.delete_account() returns void language sql as $$select null::void$$;
    create function public.reserve_ai() returns uuid language sql as $$select null::uuid$$;
    grant execute on function public.delete_account(),public.reserve_ai() to authenticated,service_role;
    insert into auth.users(id) values('${alice}'),('${bob}');`);
  const sql = readFileSync(
    "supabase/migrations/20261010170456_account_reauthentication_guard.sql",
    "utf8",
  );
  await db.exec(sql);
  await db.exec(sql); // Idempotent permission tightening and function replacement.
}, 30000);
beforeEach(async () => {
  await db.exec(`truncate auth.sessions,auth.mfa_amr_claims,auth.mfa_factors,private.admins;
    update auth.users set banned_until=null,deleted_at=null;
    insert into auth.sessions values('${sid}','${alice}',null,'aal1');
    insert into auth.mfa_amr_claims values('${sid}','password',now());`);
  now = Number(
    (await db.query<{ now: string }>("select extract(epoch from now()) as now"))
      .rows[0].now,
  );
  claims = {
    sub: alice,
    session_id: sid,
    exp: now + 3600,
    aal: "aal1",
    amr: [{ method: "password", timestamp: now }],
  };
});
afterAll(() => db.close());
async function probe(
  role = "authenticated",
  sql = "select public.account_deletion_readiness() as ready",
) {
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify(claims),
  ]);
  await db.exec(`set role ${role}`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
}
it("accepts a live recent password session without mutating users", async () => {
  expect((await probe()).rows).toEqual([{ ready: true }]);
  expect((await db.query("select id from auth.users")).rows).toHaveLength(2);
});
it("rejects an old authentication even with newly issued or refreshed JWT", async () => {
  claims.iat = now;
  claims.amr = [{ method: "password", timestamp: now - 301 }];
  await expect(probe()).rejects.toThrow(/REAUTH_REQUIRED/);
  claims.amr = [{ method: "password", timestamp: now }];
  await db.exec(
    "update auth.mfa_amr_claims set updated_at=now()-interval '6 minutes'",
  );
  await expect(probe()).rejects.toThrow(/REAUTH_REQUIRED/);
});
it("rejects revoked and expired sessions although their JWT is unexpired", async () => {
  await db.exec(
    `update auth.sessions set not_after=now()-interval '1 second' where id='${sid}'`,
  );
  await expect(probe()).rejects.toThrow(/SESSION_REVOKED/);
  await db.exec(`delete from auth.sessions where id='${sid}'`);
  await expect(probe()).rejects.toThrow(/SESSION_REVOKED/);
});
it("rejects another user's session and missing or expired JWT claims", async () => {
  claims.sub = bob;
  await expect(probe()).rejects.toThrow(/SESSION_REVOKED/);
  claims.sub = alice;
  claims.exp = now - 1;
  await expect(probe()).rejects.toThrow(/SESSION_EXPIRED/);
  claims.exp = now + 3600;
  delete claims.session_id;
  await expect(probe()).rejects.toThrow(/SESSION_REVOKED/);
});
it("rejects anonymous, banned, deleted and administrative accounts", async () => {
  claims.is_anonymous = true;
  await expect(probe()).rejects.toThrow(/AUTH_REQUIRED/);
  claims.is_anonymous = false;
  await db.exec(
    `update auth.users set banned_until=now()+interval '1 day' where id='${alice}'`,
  );
  await expect(probe()).rejects.toThrow(/SESSION_REVOKED/);
  await db.exec(
    `update auth.users set banned_until=null,deleted_at=now() where id='${alice}'`,
  );
  await expect(probe()).rejects.toThrow(/SESSION_REVOKED/);
  await db.exec(
    `update auth.users set deleted_at=null where id='${alice}'; insert into private.admins values('${alice}')`,
  );
  await expect(probe()).rejects.toThrow(/ADMIN_TRANSFER_REQUIRED/);
});
it("does not enable OAuth, OTP, magic link or refresh as password reauthentication", async () => {
  for (const method of ["oauth", "otp", "magiclink", "token_refresh"]) {
    claims.amr = [{ method, timestamp: now }];
    await expect(probe()).rejects.toThrow(/REAUTH_REQUIRED/);
  }
});
it("requires fresh verified TOTP in both the JWT and live Auth session for MFA", async () => {
  await db.exec(`insert into auth.mfa_factors values('${alice}','verified')`);
  await expect(probe()).rejects.toThrow(/MFA_REAUTH_REQUIRED/);
  claims.aal = "aal2";
  claims.amr = [
    { method: "password", timestamp: now },
    { method: "totp", timestamp: now },
  ];
  await expect(probe()).rejects.toThrow(/MFA_REAUTH_REQUIRED/);
  await db.exec(
    `update auth.sessions set aal='aal2' where id='${sid}'; insert into auth.mfa_amr_claims values('${sid}','totp',now())`,
  );
  expect((await probe()).rows).toEqual([{ ready: true }]);
  await db.exec(
    "update auth.mfa_amr_claims set updated_at=now()-interval '6 minutes' where authentication_method='totp'",
  );
  await expect(probe()).rejects.toThrow(/MFA_REAUTH_REQUIRED/);
});
it("blocks direct legacy deletion, retired reservation and private gate for every API role", async () => {
  for (const role of ["anon", "authenticated", "service_role"])
    for (const fn of [
      "public.delete_account",
      "public.reserve_ai",
      "private.assert_account_reauthentication",
    ])
      await expect(probe(role, `select ${fn}()`)).rejects.toThrow(
        /permission denied/,
      );
  await expect(probe("anon")).rejects.toThrow(/permission denied/);
});

it("verifies the unapplied deletion draft on disposable in-memory records only", async () => {
  // This is a separate in-memory database; never apply this draft through MCP.
  await db.exec(
    readFileSync("docs/pending-sql/enable_account_deletion.sql", "utf8"),
  );
  await db.exec(`create table public.disposable_progress(user_id uuid references auth.users(id) on delete cascade, xp integer);
    insert into public.disposable_progress values('${alice}',50),('${bob}',80);`);
  await expect(
    probe("authenticated", "select public.delete_account_confirmed('NO')"),
  ).rejects.toThrow(/CONFIRMATION_REQUIRED/);
  claims.amr = [{ method: "password", timestamp: now - 301 }];
  await expect(
    probe("authenticated", "select public.delete_account_confirmed('EXCLUIR')"),
  ).rejects.toThrow(/REAUTH_REQUIRED/);
  expect((await db.query("select id from auth.users")).rows).toHaveLength(2);
  claims.amr = [{ method: "password", timestamp: now }];
  await probe(
    "authenticated",
    "select public.delete_account_confirmed('EXCLUIR')",
  );
  expect((await db.query("select id from auth.users")).rows).toEqual([
    { id: bob },
  ]);
  expect(
    (await db.query("select * from public.disposable_progress")).rows,
  ).toEqual([{ user_id: bob, xp: 80 }]);
  expect(
    (await db.query(`select id from auth.sessions where user_id='${alice}'`))
      .rows,
  ).toHaveLength(0);
  await expect(
    probe("authenticated", "select public.delete_account_confirmed('EXCLUIR')"),
  ).rejects.toThrow(/SESSION_REVOKED/);
});
