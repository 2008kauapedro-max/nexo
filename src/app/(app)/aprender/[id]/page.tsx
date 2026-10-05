import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { Activity } from "@/components/activity";
import { StartForm } from "@/components/start-form";
export default async function Lesson({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireProfile();
  const { data: l } = await db
    .from("lessons")
    .select("*,topics(subject_id,name)")
    .eq("id", id)
    .maybeSingle();
  if (!l) notFound();
  const { data: activities, error } = await db
    .from("learning_activities")
    .select("*")
    .eq("lesson_id", id)
    .order("position");
  if (error) throw error;
  return (
    <article className="reading-container">
      <Link href="/aprender" className="text-link">
        ← Aprender
      </Link>
      <span className="eyebrow" style={{ marginTop: 25 }}>
        {l.topics?.name}
      </span>
      <h1>{l.title}</h1>
      <section className="lesson-explanation">
        <h2>Conecte a ideia.</h2>
        <p>{l.explanation}</p>
      </section>
      <section className="worked-example">
        <span className="eyebrow">UM EXEMPLO</span>
        <p>{l.example}</p>
      </section>
      {activities.map((a) => (
        <Activity activity={a} key={a.id} />
      ))}
      <section className="lesson-next">
        <h2>Agora, mude o contexto.</h2>
        <p>
          Pratique com outras questões para descobrir se o conceito ficou claro.
        </p>
        <StartForm
          topic={l.topic_id}
          subject={l.topics?.subject_id}
          label="Praticar este assunto"
          target={5}
        />
      </section>
    </article>
  );
}
