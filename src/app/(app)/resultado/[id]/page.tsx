import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { StartForm } from "@/components/start-form";
export default async function Result({
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
  if (!s.finished_at) redirect(`/sessao/${id}`);
  const { data: attempts, error } = await db
    .from("question_attempts")
    .select("*, questions(statement,topic_id,topics(name))")
    .eq("session_id", id);
  if (error) throw error;
  const { data: feedbackData } = await db.rpc("session_feedback", {
    p_session: id,
  });
  const feedback = z
    .array(
      z.object({
        question_id: z.string(),
        answer: z.number(),
        explanation: z.string(),
      }),
    )
    .parse(feedbackData || []);
  const xp = attempts?.reduce((n, a) => n + a.xp, 0) || 0;
  const seconds = attempts?.reduce((n, a) => n + a.seconds, 0) || 0;
  return (
    <>
      <div className="result-header">
        <span className="eyebrow" style={{ justifyContent: "center" }}>
          CADA PASSO CONTA
        </span>
        <h1>{s.answered ? "Você avançou." : "Tudo em dia por aqui."}</h1>
        <div className="metric-big">
          {s.answered ? Math.round((s.correct / s.answered) * 100) : 0}
          <span style={{ fontSize: 25 }}>%</span>
        </div>
        <p>
          {s.answered
            ? `${s.correct} acertos em ${s.answered} questões. Continue construindo seu caminho.`
            : "Não há questões disponíveis para este filtro. Escolha outra matéria ou um treino geral."}
        </p>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span>XP conquistado</span>
          <strong>+{xp}</strong>
        </div>
        <div className="stat">
          <span>Tempo em questões</span>
          <strong>{Math.ceil(seconds / 60)} min</strong>
        </div>
        <div className="stat">
          <span>Para revisar</span>
          <strong>{s.answered - s.correct}</strong>
        </div>
      </div>
      <div className="toolbar">
        <Link className="button dark" href="/inicio">
          Voltar ao início
        </Link>
        {s.answered > s.correct && (
          <StartForm
            mode="review"
            source={s.id}
            subject={s.subject_id || undefined}
            label="Revisar meus erros"
          />
        )}
      </div>
      <div className="section-heading">
        <h2>Seu caminho nesta sessão</h2>
      </div>
      <div className="panel">
        {attempts?.map((a) => (
          <div key={a.id} className="row-card">
            <div>
              <span className="pill">
                {a.correct ? "✓ Acertou" : "↻ Para revisar"} ·{" "}
                {a.questions?.topics?.name}
              </span>
              <p style={{ marginTop: 10 }}>{a.questions?.statement}</p>
              <p style={{ marginTop: 8 }}>
                Gabarito:{" "}
                {String.fromCharCode(
                  65 +
                    (feedback.find((f) => f.question_id === a.question_id)
                      ?.answer || 0),
                )}
                .{" "}
                {
                  feedback.find((f) => f.question_id === a.question_id)
                    ?.explanation
                }
              </p>
            </div>
            <Link
              className="button small secondary"
              href={`/ia?questao=${a.question_id}&sessao=${s.id}`}
            >
              Entender
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
