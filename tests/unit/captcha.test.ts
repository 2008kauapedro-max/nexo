import { it, expect } from "vitest";
import { captchaToken } from "../../src/domain/captcha";
it("requires a bounded token when captcha is configured without claiming local verification", () => {
  expect(captchaToken(null, false)).toBeUndefined();
  for (const value of [null, "", "x".repeat(2049), new File(["x"], "token")]) {
    expect(() => captchaToken(value, true)).toThrow("CAPTCHA_REQUIRED");
  }
  expect(captchaToken("untrusted-challenge-token", true)).toBe(
    "untrusted-challenge-token",
  );
});
