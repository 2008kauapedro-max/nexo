import { currentIdentity } from "@/lib/supabase";
import { adminDb } from "@/lib/admin-db";
import { stripeClient } from "@/lib/stripe";

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

  const { data } = await admin
    .from("subscriptions")
    .select("provider_customer_reference")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.provider_customer_reference)
    return Response.redirect(target(request, "/planos?erro=cliente"), 303);

  const session = await stripe.billingPortal.sessions.create({
    customer: data.provider_customer_reference,
    return_url: target(request, "/planos").toString(),
  });

  return Response.redirect(session.url, 303);
}
