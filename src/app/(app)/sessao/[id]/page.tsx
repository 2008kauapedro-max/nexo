import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { Question } from "@/components/question";
export default async function Session({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireProfile();
  const { data: s } = await db
    .from("learning_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();
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
  return (
    <Question
      key={parsed.id}
      sessionId={id}
      question={parsed}
      answered={s.answered}
      target={s.target}
      mode={s.mode}
    />
  );
}
