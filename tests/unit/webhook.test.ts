import { it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifySignedEvent } from "../../src/domain/webhook";
const event = {
  id: "evt_test",
  userId: "00000000-0000-4000-8000-000000000001",
  plan: "pro",
  status: "active",
  periodEnd: "2026-11-01T00:00:00Z",
  createdAt: "2026-10-04T00:00:00Z",
};
const raw = JSON.stringify(event);
const now = 1791072000000;
const t = now / 1000;
const secret = "unit-test-only-secret";
const signature = `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex")}`;
it("verifies a signed billing event", () =>
  expect(verifySignedEvent(raw, signature, secret, now)).toEqual(event));
it("rejects forged, stale and altered payloads", () => {
  expect(() => verifySignedEvent(raw, signature, "wrong", now)).toThrow();
  expect(() =>
    verifySignedEvent(raw, signature, secret, now + 301000),
  ).toThrow();
  expect(() =>
    verifySignedEvent(raw.replace("pro", "premium"), signature, secret, now),
  ).toThrow();
  expect(() => verifySignedEvent(raw, "t=x,v1=x", secret, now)).toThrow();
});
