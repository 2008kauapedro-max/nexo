import { createHash } from "node:crypto";
import { z } from "zod";
import { adminDb } from "@/lib/admin-db";
import {
  parseAsaasEventDate,
  verifyAsaasWebhookToken,
} from "@/domain/asaas-webhook";

const payloadSchema = z
  .object({
    id: z.string().min(4).max(220),
    event: z.string().min(3).max(100),
    dateCreated: z.string().optional(),
    checkout: z
      .object({
        id: z.string(),
        customer: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
    subscription: z
      .object({
        id: z.string(),
        customer: z.string().optional(),
      })
      .passthrough()
      .optional(),
    payment: z
      .object({
        id: z.string(),
        customer: z.string().optional(),
        subscription: z.string().nullable().optional(),
        dueDate: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export async function POST(request: Request) {
  if (
    !verifyAsaasWebhookToken(
      request.headers.get("asaas-access-token"),
      process.env.ASAAS_WEBHOOK_TOKEN,
    )
  )
    return Response.json({ error: "Unauthorized." }, { status: 401 });

  const admin = adminDb();
  if (!admin)
    return Response.json({ error: "Billing not configured." }, { status: 503 });

  const raw = await request.text();

  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const eventAt = parseAsaasEventDate(parsed.dateCreated);

  const { error } = await admin.rpc("apply_asaas_billing_event", {
    p_event_id: parsed.id,
    p_hash: createHash("sha256").update(raw).digest("hex"),
    p_event: parsed.event,
    p_checkout_id: parsed.checkout?.id ?? null,
    p_customer:
      parsed.checkout?.customer ??
      parsed.subscription?.customer ??
      parsed.payment?.customer ??
      null,
    p_subscription:
      parsed.subscription?.id ?? parsed.payment?.subscription ?? null,
    p_payment_id: parsed.payment?.id ?? null,
    p_due_date: parsed.payment?.dueDate ?? null,
    p_event_at: eventAt.toISOString(),
  });

  if (error) {
    console.error("Asaas webhook persistence failed", {
      eventId: parsed.id,
      event: parsed.event,
      code: error.code,
    });
    return Response.json(
      { error: "Event persistence failed." },
      { status: 500 },
    );
  }

  return Response.json({ received: true });
}
