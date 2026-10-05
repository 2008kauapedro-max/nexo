import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { verifySignedEvent } from "@/domain/webhook";
import { boundedText } from "@/lib/request";
export async function POST(request: Request) {
  // Development contract only. A real provider adapter must be activated explicitly.
  if (
    process.env.BILLING_PROVIDER !== "signed-development" ||
    process.env.NODE_ENV === "production" ||
    !process.env.BILLING_WEBHOOK_SECRET ||
    !process.env.SUPABASE_SECRET_KEY
  )
    return Response.json(
      { error: "Billing provider not configured." },
      { status: 503 },
    );
  let raw: string;
  try {
    raw = await boundedText(request, 16000);
  } catch {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }
  try {
    const e = verifySignedEvent(
      raw,
      request.headers.get("x-nexo-signature") || "",
      process.env.BILLING_WEBHOOK_SECRET,
    );
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY,
      { auth: { persistSession: false } },
    );
    const { data, error } = await db.rpc("apply_billing_event", {
      p_id: e.id,
      p_hash: createHash("sha256").update(raw).digest("hex"),
      p_user: e.userId,
      p_plan: e.plan,
      p_status: e.status,
      p_period_end: e.periodEnd,
      p_created_at: e.createdAt,
    });
    if (error)
      return Response.json({ error: "Event rejected." }, { status: 400 });
    return Response.json({ status: data });
  } catch {
    return Response.json(
      { error: "Invalid event or signature." },
      { status: 400 },
    );
  }
}
