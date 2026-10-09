"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase";
import type { ActionState } from "./auth";
import { getTranslations } from "next-intl/server";
export async function saveNote(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      title: z.string().trim().min(1).max(120),
      body: z.string().trim().min(1).max(10000),
      topic: z.uuid().nullable(),
    })
    .safeParse({
      title: form.get("title"),
      body: form.get("body"),
      topic: form.get("topic") || null,
    });
  if (!p.success) return { error: "Confira o título e o texto da nota." };
  const { db, user } = await requireUser();
  const { error } = await db.from("notes").insert({
    user_id: user.id,
    title: p.data.title,
    body: p.data.body,
    topic_id: p.data.topic,
  });
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/anotacoes");
  return { success: "Anotação salva na sua conta." };
}
export async function saveFlashcard(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      front: z.string().trim().min(1).max(1000),
      back: z.string().trim().min(1).max(3000),
    })
    .safeParse({ front: form.get("front"), back: form.get("back") });
  if (!p.success) return { error: "Preencha a frente e o verso do cartão." };
  const { db, user } = await requireUser();
  const { error } = await db
    .from("flashcards")
    .insert({ user_id: user.id, ...p.data });
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/flashcards");
  return { success: "Flashcard criado." };
}
export async function removeArtifact(form: FormData) {
  const id = String(form.get("id"));
  if (!z.uuid().safeParse(id).success) return;
  const kind = form.get("kind");
  const { db, user } = await requireUser();
  if (kind !== "note" && kind !== "flashcard") return;
  const { error } = await db
    .from(kind === "note" ? "notes" : "flashcards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("Não foi possível excluir. Tente novamente.");
  revalidatePath(kind === "note" ? "/anotacoes" : "/flashcards");
}
export async function reviewCard(id: string, remembered: boolean) {
  if (!z.uuid().safeParse(id).success) return { error: "Cartão inválido." };
  const { db } = await requireUser();
  const { error } = await db.rpc("review_flashcard", {
    p_id: id,
    p_remembered: remembered,
  });
  if (error) return { error: "Não foi possível registrar a revisão." };
  revalidatePath("/flashcards");
  return { success: true };
}
export async function notificationAction(form: FormData) {
  const { db, user } = await requireUser();
  const action = form.get("action");
  const id = form.get("id");
  if (id && !z.uuid().safeParse(id).success) return;
  let query = db
    .from("notifications")
    .update(
      action === "dismiss"
        ? { dismissed_at: new Date().toISOString() }
        : { read_at: new Date().toISOString() },
    )
    .eq("user_id", user.id);
  if (id) query = query.eq("id", String(id));
  const { error } = await query;
  if (error) throw new Error("Não foi possível atualizar suas notificações.");
  revalidatePath("/notificacoes");
}
export async function saveNotifications(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db, user } = await requireUser();
  const { error } = await db.from("notification_preferences").upsert({
    user_id: user.id,
    study: form.get("study") === "on",
    achievements: form.get("achievements") === "on",
    news: form.get("news") === "on",
  });
  if (error) return { error: "Não foi possível salvar." };
  return { success: "Preferências salvas." };
}
export async function annotateError(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      question: z.uuid(),
      reason: z.enum([
        "Conceito",
        "Interpretação",
        "Cálculo",
        "Distração",
        "Fórmula esquecida",
        "Outro",
      ]),
      resolved: z.boolean(),
    })
    .safeParse({
      question: form.get("question"),
      reason: form.get("reason"),
      resolved: form.get("resolved") === "on",
    });
  if (!p.success) return { error: "Confira a categoria." };
  const { db, user } = await requireUser();
  const { error } = await db.from("error_annotations").upsert({
    user_id: user.id,
    question_id: p.data.question,
    reason: p.data.reason,
    resolved: p.data.resolved,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Não foi possível atualizar." };
  revalidatePath("/caderno");
  return { success: "Seu caderno foi atualizado." };
}
export async function reportQuestion(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const t = await getTranslations("report");
  const p = z
    .object({
      question: z.uuid(),
      reason: z.enum([
        "Resposta incorreta",
        "Enunciado incorreto",
        "Imagem quebrada",
        "Questão duplicada",
        "Explicação ruim",
        "Outro",
      ]),
      detail: z.string().max(1000),
    })
    .safeParse({
      question: form.get("question"),
      reason: form.get("reason"),
      detail: form.get("detail") || "",
    });
  if (!p.success) return { error: t("invalid") };
  const { db } = await requireUser();
  const { error } = await db.rpc("report_question", {
    p_question: p.data.question,
    p_reason: p.data.reason,
    p_detail: p.data.detail,
  });
  if (error)
    return {
      error: t("error"),
    };
  const { data: report, error: readError } = await db
    .from("question_reports")
    .select("detail")
    .eq("question_id", p.data.question)
    .single();
  if (readError) return { error: t("unconfirmed") };
  if (report.detail !== p.data.detail)
    return {
      success: t("existing"),
    };
  return {
    success: t("received"),
  };
}
export async function submitActivity(
  id: string,
  value: string | boolean | string[],
  confidence: "sure" | "unsure" | "guess",
) {
  if (!z.uuid().safeParse(id).success || JSON.stringify(value).length > 2000)
    return { error: "Resposta inválida." };
  const { db } = await requireUser();
  const { data, error } = await db.rpc("submit_activity", {
    p_activity: id,
    p_response: { value },
    p_confidence: confidence,
  });
  if (error)
    return {
      error: error.message.includes("DAILY_LIMIT")
        ? "Seu limite de atividades de hoje foi atingido."
        : "Não foi possível registrar. Confira sua resposta.",
    };
  return {
    data: data as {
      correct: boolean;
      explanation: string;
      already_recorded: boolean;
    },
  };
}
