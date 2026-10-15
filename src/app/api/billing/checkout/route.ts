import { z } from "zod";
import { currentIdentity } from "@/lib/supabase";
import { adminDb } from "@/lib/admin-db";
import {
  asaasCheckoutUrl,
  asaasNextDueDate,
  asaasRequest,
  type PaidPlanId,
} from "@/lib/asaas";
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

  const { db, user } = await currentIdentity();
  if (!user) return Response.redirect(target(request, "/entrar"), 303);

  const admin = adminDb();
  if (!admin || !process.env.ASAAS_API_KEY)
    return Response.redirect(target(request, "/planos?erro=config"), 303);

  const form = await request.formData();
  const parsed = z.enum(["pro", "premium"]).safeParse(form.get("plan"));
  if (!parsed.success)
    return Response.redirect(target(request, "/planos?erro=plano"), 303);

  const planId = parsed.data as PaidPlanId;

  const [{ data: plan, error: planError }, { data: existing }] =
    await Promise.all([
      db
        .from("plans")
        .select("id,name,monthly_price_cents,currency")
        .eq("id", planId)
        .single(),
      admin
        .from("subscriptions")
        .select("plan_id,status,period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (planError || !plan)
    return Response.redirect(target(request, "/planos?erro=plano"), 303);

  const monthlyPriceCents = plan.monthly_price_cents;

  if (monthlyPriceCents == null || monthlyPriceCents <= 0)
    return Response.redirect(target(request, "/planos?erro=plano"), 303);

  const alreadyPaid =
    existing &&
    ["active", "cancelled"].includes(existing.status) &&
    new Date(existing.period_end).getTime() > Date.now();

  if (alreadyPaid)
    return Response.redirect(target(request, "/assinatura"), 303);

  let checkout: { id: string } | null = null;

  try {
    checkout = await asaasRequest<{ id: string }>("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        billingTypes: ["CREDIT_CARD"],
        chargeTypes: ["RECURRENT"],
        minutesToExpire: 60,
        externalReference: `nexo:${user.id}:${planId}`,
        callback: {
          successUrl: target(request, "/planos?checkout=sucesso").toString(),
          cancelUrl: target(request, "/planos?checkout=cancelado").toString(),
          expiredUrl: target(request, "/planos?checkout=expirado").toString(),
        },
        items: [
          {
            name: `NEXO ${plan.name}`,
            description: `Assinatura mensal do plano ${plan.name}`,
            quantity: 1,
            value: monthlyPriceCents / 100,
          },
        ],
        subscription: {
          cycle: "MONTHLY",
          nextDueDate: asaasNextDueDate(),
        },
      }),
    });

    if (!checkout?.id) throw new Error("ASAAS_NO_CHECKOUT_ID");

    const { error: recordError } = await admin.rpc("record_asaas_checkout", {
      p_checkout_id: checkout.id,
      p_user: user.id,
      p_plan: planId,
      p_amount_cents: monthlyPriceCents,
    });

    if (recordError) {
      try {
        await asaasRequest(`/checkouts/${encodeURIComponent(checkout.id)}`, {
          method: "DELETE",
        });
      } catch {}
      throw recordError;
    }

    const checkoutUrl = asaasCheckoutUrl(checkout.id);

    return new Response(
      `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta http-equiv="refresh" content="0;url=${checkoutUrl}" />
    <title>Abrindo pagamento seguro...</title>
  </head>
  <body>
    <main style="font-family:system-ui,sans-serif;max-width:560px;margin:64px auto;padding:24px;text-align:center">
      <h1>Abrindo pagamento seguro...</h1>
      <p>Você será redirecionado para o checkout do Asaas.</p>
      <p><a href="${checkoutUrl}">Continuar para o pagamento</a></p>
    </main>
    <script>window.location.replace(${JSON.stringify(checkoutUrl)});</script>
  </body>
</html>`,
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, max-age=0",
          "referrer-policy": "no-referrer",
        },
      },
    );
  } catch (error) {
    console.error("Failed to create Asaas checkout", {
      userId: user.id,
      planId,
      checkoutId: checkout?.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.redirect(target(request, "/planos?erro=checkout"), 303);
  }
}
