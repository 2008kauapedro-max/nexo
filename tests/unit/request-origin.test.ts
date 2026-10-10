import { it, expect } from "vitest";
import { isSameOriginRequest } from "../../src/domain/request-origin";
it("accepts actual browser hosts behind a proxy, including both NEXO aliases", () => {
  for (const origin of [
    "https://nexo-six-beta.vercel.app",
    "https://nexoteensina.vercel.app",
    "http://127.0.0.1:3001",
  ]) {
    expect(
      isSameOriginRequest(
        new Request("http://localhost:3001/api/tutor", {
          headers: { origin, host: new URL(origin).host },
        }),
      ),
    ).toBe(true);
  }
});
it("rejects cross-origin, null, malformed and insecure remote origins even with spoofed forwarded host", () => {
  for (const origin of [
    "https://evil.example",
    "null",
    "https://nexo-six-beta.vercel.app/path",
    "http://nexo-six-beta.vercel.app",
    "https://nexo-six-beta.vercel.app:444",
  ]) {
    expect(
      isSameOriginRequest(
        new Request("http://localhost:3001/api/tutor", {
          headers: {
            origin,
            host: "nexo-six-beta.vercel.app",
            "x-forwarded-host": new URL("https://evil.example").host,
          },
        }),
      ),
    ).toBe(false);
  }
  expect(
    isSameOriginRequest(
      new Request("https://nexo-six-beta.vercel.app/api/tutor"),
    ),
  ).toBe(false);
});
