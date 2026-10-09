"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase";
import { onboardingSchema } from "@/domain/validation";
import type { ActionState } from "./auth";
import { getLocale, getTranslations } from "next-intl/server";
export async function savePreferences(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const t = await getTranslations();
  const parsed = onboardingSchema.safeParse({
    name: form.get("name"),
    goal: form.get("goal"),
    subjects: form.getAll("subjects"),
    level: form.get("level"),
    dailyGoal: Number(form.get("dailyGoal")),
  });
  if (!parsed.success)
    return {
      error: t("onboarding.invalid"),
    };
  const { db, user } = await requireUser();
  const { error: localeError } = await db
    .from("profiles")
    .update({ ui_locale: await getLocale() })
    .eq("id", user.id);
  if (localeError) return { error: t("common.saveError") };
  const p = parsed.data;
  const { error } = await db.rpc("save_preferences", {
    p_name: p.name,
    p_goal: p.goal,
    p_subjects: p.subjects,
    p_level: p.level,
    p_daily_goal: p.dailyGoal,
  });
  if (error) return { error: t("common.saveError") };
  revalidatePath("/inicio");
  redirect(p.level === "unknown" ? "/diagnostico" : "/inicio");
}
const sessionSchema = z.object({
  mode: z.enum(["practice", "diagnostic", "review", "simulation"]),
  subject: z.uuid().nullable(),
  topic: z.uuid().nullable(),
  target: z.number().int().min(5).max(180),
  minutes: z.number().int().min(5).max(300),
});
export async function startStudy(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const t = await getTranslations("question");
  const parsed = sessionSchema.safeParse({
    mode: form.get("mode"),
    subject: form.get("subject") || null,
    topic: form.get("topic") || null,
    target: Number(form.get("target") || 10),
    minutes: Number(form.get("minutes") || 30),
  });
  if (!parsed.success) return { error: t("configError") };
  const { db } = await requireUser();
  const p = parsed.data;
  const source = String(form.get("source") || "");
  if (source) {
    if (!z.uuid().safeParse(source).success)
      return { error: t("invalidSession") };
    const { data, error } = await db.rpc("review_session", {
      p_source: source,
    });
    if (error) return { error: t("reviewError") };
    return advanceStudy(data);
  }
  const { data, error } = await db.rpc("start_session", {
    p_mode: p.mode,
    p_subject: p.subject ?? undefined,
    p_topic: p.topic ?? undefined,
    p_target: p.target,
    p_minutes: p.minutes,
  });
  if (error)
    return {
      error: error.message.includes("PLAN_LIMIT")
        ? t("planLimit")
        : t("startError"),
    };
  return advanceStudy(data);
}
export async function answerQuestion(
  sessionId: string,
  questionId: string,
  selected: number,
) {
  const t = await getTranslations("question");
  if (
    !z.uuid().safeParse(sessionId).success ||
    !z.uuid().safeParse(questionId).success ||
    !z.number().int().min(0).max(4).safeParse(selected).success
  )
    return { error: t("invalidAnswer") };
  const { db } = await requireUser();
  const { data, error } = await db.rpc("submit_answer", {
    p_session: sessionId,
    p_question: questionId,
    p_selected: selected,
  });
  if (error)
    return {
      error: error.message.includes("DAILY_LIMIT")
        ? t("dailyLimit")
        : t("answerError"),
    };
  return {
    data: data as {
      correct: boolean | null;
      answer: number | null;
      explanation: string | null;
      xp: number;
    },
  };
}
export async function advanceStudy(sessionId: string): Promise<ActionState> {
  const t = await getTranslations("common");
  if (!z.uuid().safeParse(sessionId).success) return { error: t("invalid") };
  const { db } = await requireUser();
  const { data, error } = await db.rpc("next_question", {
    p_session: sessionId,
  });
  if (error) return { error: t("saveError") };
  if (!data) redirect(`/resultado/${sessionId}`);
  const q = z.object({ id: z.uuid() }).safeParse(data);
  if (!q.success) return { error: t("saveError") };
  redirect(`/sessao/${sessionId}?questao=${q.data.id}`);
}
