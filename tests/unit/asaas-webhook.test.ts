import { describe, expect, it } from "vitest";
import {
  parseAsaasEventDate,
  verifyAsaasWebhookToken,
} from "../../src/domain/asaas-webhook";

describe("Asaas webhook boundary", () => {
  it("accepts only the exact webhook token", () => {
    const secret = "a".repeat(64);
    expect(verifyAsaasWebhookToken(secret, secret)).toBe(true);
    expect(verifyAsaasWebhookToken("b".repeat(64), secret)).toBe(false);
    expect(verifyAsaasWebhookToken("short", secret)).toBe(false);
    expect(verifyAsaasWebhookToken(null, secret)).toBe(false);
  });

  it("parses Asaas local timestamps as Brazil time", () => {
    expect(parseAsaasEventDate("2026-10-15 01:30:00").toISOString()).toBe(
      "2026-10-15T04:30:00.000Z",
    );
  });
});
