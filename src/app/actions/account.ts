"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase";
import type { ActionState } from "./auth";
export async function deleteAccount(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (form.get("confirmation") !== "EXCLUIR")
    return { error: "Digite EXCLUIR para confirmar." };
  const { db } = await requireUser();
  const { error } = await db.rpc("delete_account");
  if (error)
    return { error: "Não foi possível excluir sua conta. Tente novamente." };
  await db.auth.signOut();
  redirect("/");
}
