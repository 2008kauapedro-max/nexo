"use server";
import { requireUser } from "@/lib/supabase";
import { planSchema } from "@/domain/plans";
import { revalidatePath } from "next/cache";
import type { ActionState } from "./auth";
export async function configurePlan(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireUser();
  const role = (await db.rpc("admin_role")).data;
  if (!["SUPER_ADMIN", "FINANCE_ADMIN"].includes(role || ""))
    return { error: "Acesso restrito." };
  let features: unknown;
  try {
    features = JSON.parse(String(form.get("features") || "{}"));
  } catch {
    return { error: "Recursos inválidos." };
  }
  const parsed = planSchema.safeParse({
    ...Object.fromEntries(form),
    currency: "BRL",
    features,
    ...Object.fromEntries(
      [
        "monthly_price_cents",
        "daily_questions",
        "daily_ai",
        "max_simulation",
        "weekly_simulations",
        "ai_burst_per_minute",
      ].map((k) => [k, Number(form.get(k))]),
    ),
    annual_price_cents: form.get("annual_price_cents")
      ? Number(form.get("annual_price_cents"))
      : null,
  });
  if (!parsed.success)
    return {
      error: "Confira os limites e preços. Informe preços em centavos.",
    };
  const { id, ...config } = parsed.data;
  const { error } = await db.rpc("admin_configure_plan", {
    p_id: id,
    p_config: config,
  });
  if (error) return { error: "Não foi possível salvar a configuração." };
  revalidatePath("/planos");
  revalidatePath("/admin/financeiro");
  return { success: "Configuração salva. Nenhuma cobrança foi ativada." };
}
