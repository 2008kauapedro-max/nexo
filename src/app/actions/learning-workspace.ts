"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase";
import { generateLinearQuestions } from "@/domain/question-factory";
import type { ActionState } from "./auth";
export async function createStudyPlan(
  _state: ActionState,
): Promise<ActionState> {
  void _state;
  const { db } = await requireUser();
  const { error } = await db.rpc("generate_study_plan");
  if (error)
    return {
      error:
        "Não foi possível criar seu plano. Confira suas matérias nas preferências.",
    };
  revalidatePath("/plano");
  return { success: "Seu plano de sete dias está salvo." };
}
export async function saveReflection(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      lesson: z.uuid(),
      explanation: z.string().trim().min(20).max(3000),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success)
    return { error: "Explique a ideia com pelo menos 20 caracteres." };
  const { db, user } = await requireUser();
  const { error } = await db.from("learning_reflections").upsert({
    user_id: user.id,
    lesson_id: p.data.lesson,
    explanation: p.data.explanation,
    updated_at: new Date().toISOString(),
  });
  if (error)
    return {
      error:
        "Não foi possível salvar. Sua explicação continua no campo para tentar novamente.",
    };
  revalidatePath(`/provar/${p.data.lesson}`);
  return {
    success: "Explicação salva. Compare seu raciocínio com o conceito abaixo.",
  };
}
export async function createQuestionDrafts(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const p = z
    .object({
      topic: z.uuid(),
      seed: z.coerce.number().int().min(1).max(10000),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Confira o assunto e a semente de geração." };
  const { db } = await requireUser();
  if (!(await db.rpc("is_admin")).data) return { error: "Acesso restrito." };
  const { data: topic } = await db
    .from("topics")
    .select("id,subject_id,subjects(slug)")
    .eq("id", p.data.topic)
    .single();
  if (!topic || topic.subjects?.slug !== "matematica")
    return { error: "Este gerador atende somente matemática." };
  const rows = generateLinearQuestions(topic.subject_id, topic.id, p.data.seed);
  let saved = 0;
  for (const row of rows) {
    const { error } = await db.rpc("admin_upsert_question", {
      p_question: row,
    });
    if (!error) saved++;
    else if (error.code !== "23505")
      return {
        error: `${saved} rascunhos salvos. A geração foi interrompida por um erro de gravação.`,
      };
  }
  revalidatePath("/admin");
  return {
    success: `${saved} rascunhos novos salvos; ${rows.length - saved} já existentes. Revise conteúdo e assunto antes de publicar.`,
  };
}
