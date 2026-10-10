import Link from "next/link";
import { requirePlanFeature } from "@/lib/plan-access";
import { getRegionalFormats } from "@/i18n/server-format";
import { withinLastDays } from "@/lib/time";

export default async function AdvancedReport() {
  const { db } = await requirePlanFeature("advanced_reports");
  const format = await getRegionalFormats();

  const [{ data: sessions, error }, { data: mastery }, { data: queue }] =
    await Promise.all([
      db
        .from("learning_sessions")
        .select("answered,correct,started_at,finished_at,mode")
        .not("finished_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(500),
      db
        .from("topic_mastery")
        .select("score,attempts,updated_at,topics(name)")
        .order("score", { ascending: false }),
      db.from("review_queue").select("next_review"),
    ]);

  if (error) throw error;

  const answered = sessions?.reduce((sum, row) => sum + row.answered, 0) || 0;
  const correct = sessions?.reduce((sum, row) => sum + row.correct, 0) || 0;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const due =
    queue?.filter((row) => new Date(row.next_review) <= new Date()).length || 0;
  const strongest = mastery?.[0];
  const weakest = mastery?.length ? mastery[mastery.length - 1] : null;

  const last30 = (sessions || []).filter((row) =>
    withinLastDays(row.started_at, 30),
  );
  const recentAnswered = last30.reduce((sum, row) => sum + row.answered, 0);
  const recentCorrect = last30.reduce((sum, row) => sum + row.correct, 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREMIUM · VISÃO COMPLETA</span>
          <h1>Seu relatório de aprendizagem.</h1>
          <p>Veja onde você avançou e onde vale concentrar o próximo estudo.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span>Questões analisadas</span>
          <strong>{format.number(answered)}</strong>
        </div>
        <div className="stat">
          <span>Acerto geral</span>
          <strong>{accuracy}%</strong>
        </div>
        <div className="stat">
          <span>Revisões pendentes</span>
          <strong>{format.number(due)}</strong>
        </div>
      </div>

      <div className="two-col report-grid">
        <section className="panel">
          <span className="eyebrow">ÚLTIMOS 30 DIAS</span>
          <h2>Ritmo recente</h2>
          <p>
            {recentAnswered
              ? `${recentCorrect}/${recentAnswered} respostas corretas nesse período.`
              : "Ainda não há sessões concluídas nos últimos 30 dias."}
          </p>
        </section>

        <section className="panel">
          <span className="eyebrow">PRÓXIMO FOCO</span>
          <h2>{weakest?.topics?.name || "Continue estudando"}</h2>
          <p>
            {weakest
              ? `Domínio estimado em ${Math.round(weakest.score)}%.`
              : "Complete mais atividades para o NEXO identificar seu próximo foco."}
          </p>
        </section>
      </div>

      {strongest && (
        <section className="panel report-highlight">
          <span className="eyebrow">PONTO FORTE</span>
          <h2>{strongest.topics?.name}</h2>
          <p>
            Domínio estimado em {Math.round(strongest.score)}% com{" "}
            {strongest.attempts} evidências registradas.
          </p>
        </section>
      )}

      <div className="toolbar">
        <Link className="button primary" href="/plano">
          Abrir meu plano
        </Link>
        <Link className="button secondary" href="/caderno">
          Revisar meus erros
        </Link>
      </div>
    </>
  );
}
