import { it, expect } from "vitest";
import { boundedText } from "../../src/lib/request";
it("caps actual bytes, including chunked bodies", async () => {
  const r = new Request("https://example.test", {
    method: "POST",
    body: "abcdefgh",
  });
  await expect(boundedText(r, 4)).rejects.toThrow("BODY_LIMIT");
  expect(
    await boundedText(
      new Request("https://example.test", { method: "POST", body: "abc" }),
      4,
    ),
  ).toBe("abc");
});
