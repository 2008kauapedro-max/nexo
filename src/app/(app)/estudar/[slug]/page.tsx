import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase";
import { StartForm } from "@/components/start-form";
export default async function Subject({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { db } = await requireProfile();
  const { data: subject } = await db
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!subject) notFound();
  const [{ data: topics, error }, { data: mastery }] = await Promise.all([
    db.from("topics").select("*").eq("subject_id", subject.id),
    db.from("topic_mastery").select("*"),
  ]);
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU CAMINHO, ASSUNTO POR ASSUNTO</span>
          <h1>{subject.name}</h1>
          <p>Consolide o que sabe. Descubra o que vem depois.</p>
        </div>
      </div>
      <div className="toolbar">
        <StartForm subject={subject.id} />
        <StartForm subject={subject.id} mode="review" label="Revisar erros" />
        <StartForm subject={subject.id} target={5} label="Treino rápido" />
      </div>
      <div className="section-heading">
        <h2>Assuntos</h2>
      </div>
      <div className="panel">
        {topics?.map((t) => {
          const m = mastery?.find((m) => m.topic_id === t.id);
          return (
            <div className="row-card" key={t.id}>
              <div>
                <h3>{t.name}</h3>
                <p>
                  {m
                    ? `${Math.round(m.score)}% de domínio · ${m.attempts} respostas`
                    : "Seu ponto de partida ainda será descoberto."}
                </p>
                {m && (
                  <div className="progress">
                    <span style={{ width: `${m.score}%` }} />
                  </div>
                )}
              </div>
              <StartForm
                subject={subject.id}
                topic={t.id}
                label="Treinar"
                target={5}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
