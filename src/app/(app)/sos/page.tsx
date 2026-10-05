import { requireProfile } from "@/lib/supabase";
import { StartForm } from "@/components/start-form";
export default async function Sos() {
  const { db } = await requireProfile();
  const { data } = await db
    .from("topic_mastery")
    .select("*,topics(name,subject_id)")
    .order("score")
    .limit(1);
  const weakest = data?.[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">POUCO TEMPO, FOCO NO ESSENCIAL</span>
          <h1>SOS prova.</h1>
          <p>
            Escolha o tempo disponível. Vamos concentrar o treino em um ponto de
            melhoria.
          </p>
        </div>
      </div>
      {weakest && (
        <p className="notice">
          Prioridade sugerida pelo seu histórico:{" "}
          <strong>{weakest.topics?.name}</strong>. Não é uma previsão do que
          cairá na prova.
        </p>
      )}
      <div className="lesson-list">
        {[
          [5, "Tenho cerca de 10 minutos"],
          [10, "Tenho cerca de 20 minutos"],
          [20, "Tenho cerca de 45 minutos"],
        ].map(([target, title]) => (
          <section className="row-card" key={target}>
            <div>
              <h2>{title}</h2>
              <p>{target} questões · ritmo de resposta estimado</p>
            </div>
            <StartForm
              target={Number(target)}
              topic={weakest?.topic_id}
              subject={weakest?.topics?.subject_id}
              label="Focar agora"
            />
          </section>
        ))}
      </div>
    </>
  );
}
