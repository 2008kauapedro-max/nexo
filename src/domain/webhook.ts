import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export const billingEventSchema = z.object({
  id: z.string().min(1).max(150),
  userId: z.uuid(),
  plan: z.enum(["free", "pro", "premium"]),
  status: z.enum([
    "pending",
    "active",
    "past_due",
    "cancelled",
    "expired",
    "failed",
  ]),
  periodEnd: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});
export function verifySignedEvent(
  raw: string,
  signature: string,
  secret: string,
  now = Date.now(),
) {
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=")),
  );
  const timestamp = Number(parts.t);
  if (
    !Number.isFinite(timestamp) ||
    Math.abs(now / 1000 - timestamp) > 300 ||
    !parts.v1 ||
    !/^[a-f0-9]{64}$/.test(parts.v1)
  )
    throw new Error("Invalid signature");
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${raw}`)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(parts.v1, "hex")))
    throw new Error("Invalid signature");
  return billingEventSchema.parse(JSON.parse(raw));
}
