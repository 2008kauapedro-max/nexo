import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { ReflectionForm } from "@/components/learning-workspace-forms";
export default async function Prove({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireProfile();
  const [{ data: lesson }, { data: reflection }] = await Promise.all([
    db.from("lessons").select("*").eq("id", id).maybeSingle(),
    db
      .from("learning_reflections")
      .select("explanation")
      .eq("lesson_id", id)
      .maybeSingle(),
  ]);
  if (!lesson) notFound();
  return (
    <article className="reading-container">
      <Link className="text-link" href={`/aprender/${id}`}>
        ← Voltar à lição
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ME PROVE QUE APRENDEU</span>
          <h1>Agora, com suas palavras.</h1>
          <p>
            {lesson.title}. Explique a ideia e dê um exemplo, sem copiar a
            definição.
          </p>
        </div>
      </div>
      <ReflectionForm
        lesson={id}
        initial={reflection?.explanation || ""}
        reference={lesson.explanation}
      />
    </article>
  );
}
