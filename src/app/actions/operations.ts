"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase";
import type { ActionState } from "./auth";
export async function recordCost(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      category: z.enum([
        "IA",
        "Supabase",
        "Vercel",
        "Gateway",
        "Email",
        "Outros",
      ]),
      amount: z.coerce.number().min(0).max(99999999),
      currency: z.enum(["BRL", "USD"]),
      period: z.iso.date(),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Confira categoria, valor, moeda e data." };
  const { db } = await requireUser();
  const { error } = await db.rpc("admin_record_cost", {
    p_category: p.data.category,
    p_amount: p.data.amount,
    p_currency: p.data.currency,
    p_period: p.data.period,
  });
  if (error)
    return {
      error: "Não foi possível registrar o custo. Verifique sua permissão.",
    };
  revalidatePath("/admin/financeiro");
  return { success: "Custo registrado e auditado." };
}
export async function resolveReport(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      id: z.uuid(),
      status: z.enum(["review", "resolved", "rejected"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Relato inválido." };
  const { db } = await requireUser();
  const { error } = await db.rpc("admin_resolve_report", {
    p_id: p.data.id,
    p_status: p.data.status,
  });
  if (error) return { error: "Não foi possível atualizar o relato." };
  revalidatePath("/admin/relatos");
  return { success: "Revisão registrada." };
}
