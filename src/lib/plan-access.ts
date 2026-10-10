import "server-only";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase";
import { featureLabels, planSchema, type Plan } from "@/domain/plans";

export async function getCurrentPlanAccess() {
  const { db, user, profile } = await requireProfile();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id,status,period_end,provider_reference")
    .eq("user_id", user.id)
    .maybeSingle();

  const active =
    subscription &&
    ["active", "cancelled"].includes(subscription.status) &&
    new Date(subscription.period_end).getTime() > Date.now();

  const planId = active ? subscription.plan_id : "free";
  const { data, error } = await db
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error)
    throw new Error("Não foi possível carregar seu plano. Tente novamente.");

  return {
    db,
    user,
    profile,
    plan: planSchema.parse(data),
    subscription,
  };
}

export async function requirePlanFeature(
  feature: keyof typeof featureLabels,
): Promise<Awaited<ReturnType<typeof getCurrentPlanAccess>> & { plan: Plan }> {
  const access = await getCurrentPlanAccess();
  if (!access.plan.features[feature])
    redirect(`/planos?recurso=${encodeURIComponent(feature)}`);
  return access;
}
