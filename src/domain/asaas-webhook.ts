import { timingSafeEqual } from "node:crypto";

export function verifyAsaasWebhookToken(
  received: string | null,
  expected: string | undefined,
) {
  if (!received || !expected) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function parseAsaasEventDate(value: string | undefined) {
  if (!value) return new Date();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(" ", "T") + "-03:00"
    : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
