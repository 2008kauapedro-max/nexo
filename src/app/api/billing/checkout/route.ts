import { z } from "zod";
import { currentIdentity } from "@/lib/supabase";
import { adminDb } from "@/lib/admin-db";
import { stripeClient, stripePriceFor, type PaidPlanId } from "@/lib/stripe";

function target(request: Request, path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const base =
    configured && /^https?:\/\//.test(configured)
      ? new URL(configured).origin
      : new URL(request.url).origin;
  return new URL(path, base);
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Forbidden." }, { status: 403 });

  const { user } = await currentIdentity();
  if (!user) return Response.redirect(target(request, "/entrar"), 303);

  const stripe = stripeClient();
  const admin = adminDb();
  if (!stripe || !admin)
    return Response.redirect(target(request, "/planos?erro=config"), 303);

  const form = await request.formData();
  const parsed = z.enum(["pro", "premium"]).safeParse(form.get("plan"));
  if (!parsed.success)
    return Response.redirect(target(request, "/planos?erro=plano"), 303);

  const plan = parsed.data as PaidPlanId;
  const price = stripePriceFor(plan);
  if (!price)
    return Response.redirect(target(request, "/planos?erro=config"), 303);

  const { data: existing } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const alreadyPaid =
    existing &&
    ["active", "cancelled"].includes(existing.status) &&
    new Date(existing.period_end).getTime() > Date.now();

  if (alreadyPaid)
    return Response.redirect(target(request, "/planos?gerenciar=1"), 303);

  let customer = existing?.provider_customer_reference as string | undefined;

  if (!customer) {
    const created = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { nexo_user_id: user.id },
    });
    customer = created.id;

    if (existing) {
      await admin
        .from("subscriptions")
        .update({ provider_customer_reference: customer })
        .eq("user_id", user.id);
    } else {
      await admin.from("subscriptions").insert({
        user_id: user.id,
        plan_id: plan,
        status: "pending",
        provider_customer_reference: customer,
        period_end: new Date().toISOString(),
      });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: { nexo_user_id: user.id, plan_id: plan },
    subscription_data: {
      metadata: { nexo_user_id: user.id, plan_id: plan },
    },
    success_url: target(request, "/planos?checkout=sucesso").toString(),
    cancel_url: target(request, "/planos?checkout=cancelado").toString(),
  });

  if (!session.url)
    return Response.redirect(target(request, "/planos?erro=checkout"), 303);

  return Response.redirect(session.url, 303);
}
