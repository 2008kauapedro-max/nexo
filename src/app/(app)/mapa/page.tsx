import Link from "next/link";
import { requirePlanFeature } from "@/lib/plan-access";
import { retentionEstimate } from "@/domain/retention";

export default async function Knowledge({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const { materia } = await searchParams;
  const { db } = await requirePlanFeature("knowledge_map");
  const [
    { data: subjects },
    { data: topics },
    { data: mastery },
    { data: lessons },
  ] = await Promise.all([
    db.from("subjects").select("*").order("position"),
    db.from("topics").select("*"),
    db.from("topic_mastery").select("*"),
    db.from("lessons").select("id,title,topic_id"),
  ]);
  const subject = subjects?.find((s) => s.slug === materia);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRO Â· O QUE VOCÃŠ JÃ CONECTOU</span>
          <h1>{subject ? subject.name : "Mapa de conhecimento."}</h1>
          <p>
            {subject
              ? "Explore um assunto por vez."
              : "Escolha uma matÃ©ria para abrir seu caminho."}
          </p>
        </div>
      </div>

      {subject ? (
        <>
          <Link href="/mapa" className="text-link">
            â† Todas as matÃ©rias
          </Link>
          {topics
            ?.filter((t) => t.subject_id === subject.id)
            .map((t) => {
              const m = mastery?.find((row) => row.topic_id === t.id);
              return (
                <section className="note" key={t.id}>
                  <h2>
                    {t.name}{" "}
                    <span className="pill">
                      {m ? `${Math.round(m.score)}%` : "A descobrir"}
                    </span>
                  </h2>
                  <p>
                    {m
                      ? `${m.attempts} evidÃªncias de aprendizagem. DomÃ­nio Ã© uma estimativa, nÃ£o uma nota.`
                      : "Comece uma atividade para conhecer seu ponto de partida."}
                  </p>
                  {m &&
                    retentionEstimate(
                      m.score,
                      m.updated_at,
                      new Date(),
                      m.attempts,
                    ) <
                      m.score * 0.8 && (
                      <p className="notice">
                        Este assunto estÃ¡ hÃ¡ algum tempo sem prÃ¡tica. Uma
                        revisÃ£o curta pode ajudar a consolidar a memÃ³ria.
                      </p>
                    )}
                  {lessons
                    ?.filter((l) => l.topic_id === t.id)
                    .map((l) => (
                      <Link
                        key={l.id}
                        href={`/aprender/${l.id}`}
                        className="row-card"
                      >
                        {l.title} â†’
                      </Link>
                    ))}
                </section>
              );
            })}
        </>
      ) : (
        subjects?.map((s) => (
          <Link
            className="row-card"
            key={s.id}
            href={`/mapa?materia=${s.slug}`}
          >
            <h2>{s.name}</h2>
            <span>Explorar â†’</span>
          </Link>
        ))
      )}
    </>
  );
}
