import { it, expect } from "vitest";
import {
  recentAuthentication,
  authenticationMethods,
} from "../../src/domain/reauthentication";
const now = Date.UTC(2026, 9, 9);
const uid = "00000000-0000-4000-8000-000000000001";
const token = {
  sub: uid,
  session_id: "00000000-0000-4000-8000-000000000002",
  exp: now / 1000 + 3600,
  aal: "aal1",
  amr: [{ method: "password", timestamp: now / 1000 }],
};
const policy = {
  userId: uid,
  hasMfa: false,
  enabledMethods: ["password"] as const,
};
it("requires matching identity, valid session claim and recent authentication, not fresh iat", () => {
  expect(recentAuthentication(token, policy, now)).toBe(true);
  expect(
    recentAuthentication({ ...token, session_id: null }, policy, now),
  ).toBe(false);
  expect(
    recentAuthentication(
      { ...token, sub: "00000000-0000-4000-8000-000000000003" },
      policy,
      now,
    ),
  ).toBe(false);
  expect(recentAuthentication({ ...token, exp: now / 1000 }, policy, now)).toBe(
    false,
  );
  expect(
    recentAuthentication(
      {
        ...token,
        iat: now / 1000,
        amr: [{ method: "password", timestamp: now / 1000 - 301 }],
      },
      policy,
      now,
    ),
  ).toBe(false);
  expect(
    recentAuthentication(
      { ...token, amr: [{ method: "token_refresh", timestamp: now / 1000 }] },
      policy,
      now,
    ),
  ).toBe(false);
  expect(
    authenticationMethods({
      ...token,
      amr: [{ method: "otp", timestamp: now / 1000 }],
    }),
  ).toEqual(["otp"]);
});
it("supports explicitly verified OAuth/OTP flows without mistaking them for password authentication", () => {
  for (const method of ["oauth", "otp", "magiclink"] as const) {
    const claims = { ...token, amr: [{ method, timestamp: now / 1000 }] };
    expect(recentAuthentication(claims, policy, now)).toBe(false);
    expect(
      recentAuthentication(
        claims,
        { ...policy, enabledMethods: [method] },
        now,
      ),
    ).toBe(true);
    expect(
      recentAuthentication(
        { ...claims, amr: [{ method, timestamp: now / 1000 - 3600 }] },
        { ...policy, enabledMethods: [method] },
        now,
      ),
    ).toBe(false);
  }
});
it("requires both recent primary authentication and recent TOTP with aal2 for MFA accounts", () => {
  const mfa = { ...policy, hasMfa: true };
  expect(recentAuthentication(token, mfa, now)).toBe(false);
  expect(recentAuthentication({ ...token, aal: "aal2" }, mfa, now)).toBe(false);
  expect(
    recentAuthentication(
      {
        ...token,
        aal: "aal2",
        amr: [...token.amr, { method: "totp", timestamp: now / 1000 - 301 }],
      },
      mfa,
      now,
    ),
  ).toBe(false);
  expect(
    recentAuthentication(
      {
        ...token,
        aal: "aal2",
        amr: [...token.amr, { method: "totp", timestamp: now / 1000 }],
      },
      mfa,
      now,
    ),
  ).toBe(true);
  expect(
    recentAuthentication(
      {
        ...token,
        aal: "aal2",
        amr: [
          { method: "password", timestamp: now / 1000 - 3600 },
          { method: "totp", timestamp: now / 1000 },
        ],
      },
      mfa,
      now,
    ),
  ).toBe(false);
});
