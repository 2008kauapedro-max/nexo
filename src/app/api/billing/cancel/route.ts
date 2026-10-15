import { currentIdentity } from "@/lib/supabase";
import { adminDb } from "@/lib/admin-db";
import { asaasRequest } from "@/lib/asaas";
import { isSameOriginRequest } from "@/domain/request-origin";

function target(request: Request, path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const base =
    configured && /^https?:\/\//.test(configured)
      ? new URL(configured).origin
      : new URL(request.url).origin;
  return new URL(path, base);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return Response.json({ error: "Forbidden." }, { status: 403 });

  const { user } = await currentIdentity();
  if (!user) return Response.redirect(target(request, "/entrar"), 303);

  const admin = adminDb();
  if (!admin || !process.env.ASAAS_API_KEY)
    return Response.redirect(target(request, "/assinatura?erro=config"), 303);

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("provider_reference,status,period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !subscription)
    return Response.redirect(
      target(request, "/assinatura?erro=assinatura"),
      303,
    );

  if (subscription.status === "cancelled")
    return Response.redirect(target(request, "/assinatura?cancelado=1"), 303);

  if (!subscription.provider_reference?.startsWith("sub_"))
    return Response.redirect(
      target(request, "/assinatura?erro=sincronizando"),
      303,
    );

  try {
    await asaasRequest(
      `/subscriptions/${encodeURIComponent(subscription.provider_reference)}`,
      { method: "DELETE" },
    );

    await admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return Response.redirect(target(request, "/assinatura?cancelado=1"), 303);
  } catch (cause) {
    console.error("Failed to cancel Asaas subscription", {
      userId: user.id,
      error: cause instanceof Error ? cause.message : "unknown",
    });
    return Response.redirect(
      target(request, "/assinatura?erro=cancelamento"),
      303,
    );
  }
}
