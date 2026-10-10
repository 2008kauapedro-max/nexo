import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { Question } from "@/components/question";
export default async function Session({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ questao?: string }>;
}) {
  const { id } = await params;
  const { questao } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireProfile();
  const { data: s } = await db
    .from("learning_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();
  if (questao) {
    if (!z.uuid().safeParse(questao).success) notFound();
    const { data, error } = await db.rpc("session_question_view", {
      p_session: id,
      p_question: questao,
    });
    if (error) notFound();
    const restored = z
      .object({
        question: z.object({
          id: z.uuid(),
          statement: z.string(),
          options: z.array(z.string()),
          difficulty: z.number(),
        }),
        answered: z.number(),
        selected: z.number().nullable(),
        feedback: z
          .object({
            correct: z.boolean().nullable(),
            answer: z.number().nullable(),
            explanation: z.string().nullable(),
            xp: z.number(),
          })
          .nullable(),
      })
      .parse(data);
    return (
      <Question
        key={restored.question.id}
        sessionId={id}
        question={restored.question}
        answered={restored.answered}
        target={s.target}
        mode={s.mode}
        allowHelp={s.mode !== "simulation" || s.finished_at !== null}
        initialSelected={restored.selected}
        initialFeedback={restored.feedback}
      />
    );
  }
  if (s.finished_at) redirect(`/resultado/${id}`);
  const { data: q, error } = await db.rpc("next_question", { p_session: id });
  if (error) throw error;
  if (!q) redirect(`/resultado/${id}`);
  const parsed = z
    .object({
      id: z.uuid(),
      statement: z.string(),
      options: z.array(z.string()),
      difficulty: z.number(),
    })
    .parse(q);
  redirect(`/sessao/${id}?questao=${parsed.id}`);
}
