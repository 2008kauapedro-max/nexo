import { it, expect } from "vitest";
import { contentSecurityPolicy } from "../../src/domain/security-headers";
it("limits production scripts, frames and connections to explicit trusted sources", () => {
  const csp = contentSecurityPolicy("abc123", {
    development: false,
    captcha: false,
  });
  expect(csp).toContain("'nonce-abc123' 'strict-dynamic'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp.split(";").find((p) => p.trim().startsWith("script-src"))).not.toContain(
    "unsafe-inline",
  );
  expect(csp).not.toContain("*.supabase.co");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("frame-src 'none'");
  expect(csp).not.toContain("cloudflare");
  expect(
    contentSecurityPolicy("abc", { development: false, captcha: true }),
  ).toContain("frame-src https://challenges.cloudflare.com");
  expect(() =>
    contentSecurityPolicy("'; connect-src *", {
      development: false,
      captcha: false,
    }),
  ).toThrow();
});
