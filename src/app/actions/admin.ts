"use server";
import { z } from "zod";
import { parseQuestionImport } from "@/domain/import";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase";
import { questionSchema } from "@/domain/validation";
import type { ActionState } from "./auth";
export async function importQuestions(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireUser();
  const { data: admin } = await db.rpc("is_admin");
  if (!admin) return { error: "Acesso restrito." };
  const raw = String(form.get("json") || "");
  if (raw.length > 250000)
    return { error: "Arquivo muito grande. Limite de 250 KB." };
  let content: unknown;
  try {
    content = parseQuestionImport(raw);
  } catch {
    return {
      error:
        "JSON ou CSV inválido. Confira o cabeçalho, as aspas e as vírgulas.",
    };
  }
  const rows = z.array(questionSchema).min(1).max(100).safeParse(content);
  if (!rows.success)
    return {
      error: rows.error.issues
        .map(
          (i) =>
            `Linha ${Number(i.path[0]) + 1}, ${i.path.slice(1).join(".")}: ${i.message}`,
        )
        .join(" · ")
        .slice(0, 2000),
    };
  let saved = 0;
  const errors: string[] = [];
  for (const [index, q] of rows.data.entries()) {
    const { error } = await db.rpc("admin_upsert_learning_question", {
      p_question: q,
    });
    if (error)
      errors.push(
        `Linha ${index + 1}: ${error.code === "23505" ? "questão duplicada" : "dados ou referências inválidas"}`,
      );
    else saved++;
  }
  revalidatePath("/admin");
  return errors.length
    ? { error: `${saved} salvas. ${errors.join(" · ")}` }
    : { success: `${saved} questões importadas com sucesso.` };
}
export async function saveQuestion(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireUser();
  const { data: admin } = await db.rpc("is_admin");
  if (!admin) return { error: "Acesso restrito." };
  const parsed = questionSchema.safeParse({
    subject_id: form.get("subject"),
    topic_id: form.get("topic"),
    statement: form.get("statement"),
    options: String(form.get("options"))
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    answer: Number(form.get("answer")),
    explanation: form.get("explanation"),
    hint: form.get("hint") || undefined,
    key_concept: form.get("key_concept") || undefined,
    ...Object.fromEntries(
      [
        "solution_steps",
        "common_mistakes",
        "option_explanations",
        "prerequisites",
        "skills",
      ].map((key) => [
        key,
        form.get(key)
          ? String(form.get(key))
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      ]),
    ),
    difficulty: Number(form.get("difficulty")),
    status: form.get("status"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const id = String(form.get("id") || "");
  if (id && !z.uuid().safeParse(id).success) return { error: "ID inválido." };
  const { error } = await db.rpc("admin_upsert_learning_question", {
    p_question: parsed.data,
    p_id: id || undefined,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Essa questão já existe."
          : "Não foi possível salvar. Confira matéria e assunto.",
    };
  revalidatePath("/admin");
  return { success: "Questão salva." };
}
export async function saveCatalog(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireUser();
  const { data: admin } = await db.rpc("is_admin");
  if (!admin) return { error: "Acesso restrito." };
  const p = z
    .object({
      kind: z.enum(["subject", "topic", "subtopic"]),
      name: z.string().trim().min(2).max(80),
      parent: z.uuid().optional(),
    })
    .safeParse({
      kind: form.get("kind"),
      name: form.get("name"),
      parent: form.get("parent") || undefined,
    });
  if (!p.success) return { error: "Confira o nome e a categoria." };
  const { error } = await db.rpc("admin_catalog", {
    p_kind: p.data.kind,
    p_name: p.data.name,
    p_parent: p.data.parent,
  });
  if (error)
    return {
      error: "Não foi possível salvar. Confira a categoria e o vínculo.",
    };
  revalidatePath("/admin");
  return { success: "Catálogo atualizado." };
}
