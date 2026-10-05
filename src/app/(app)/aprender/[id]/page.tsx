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
  const { data: l, error: lessonError } = await db
    .from("lessons")
    .select("*,topics(subject_id,name)")
    .eq("id", id)
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!l) notFound();
  const { data: activities, error } = await db
    .from("learning_activities")
    .select("*")
    .eq("lesson_id", id)
    .in("kind", [
      "TRUE_FALSE",
      "NUMERIC_INPUT",
      "SHORT_ANSWER",
      "FILL_BLANK",
      "ORDERING",
    ])
    .order("position");
  if (error) throw error;
  const { data: feedback, error: feedbackError } = await db.rpc(
    "activity_feedback",
    { p_lesson: id },
  );
  if (feedbackError) throw feedbackError;
  const saved = z
    .array(
      z.object({
        activity_id: z.string(),
        response: z.object({
          value: z.union([
            z.string(),
            z.number().transform(String),
            z.boolean(),
            z.array(z.string()),
          ]),
        }),
        confidence: z.enum(["sure", "unsure", "guess"]),
        correct: z.boolean(),
        explanation: z.string(),
      }),
    )
    .parse(feedback);
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
      {activities.map((a) => {
        const payload = z
          .object({ items: z.array(z.string().min(1).max(500)).min(2).max(10) })
          .safeParse(a.payload);
        if (a.kind === "ORDERING" && !payload.success) return null;
        return (
          <Activity
            activity={{
              id: a.id,
              kind: a.kind,
              prompt: a.prompt,
              items: payload.success ? payload.data.items : undefined,
            }}
            saved={saved.find((row) => row.activity_id === a.id)}
            key={a.id}
          />
        );
      })}
      <section className="lesson-next">
        <Link className="button secondary" href={`/provar/${id}`}>
          Me prove que aprendeu →
        </Link>
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
