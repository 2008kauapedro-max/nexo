import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { StartForm } from "@/components/start-form";
import { getTranslations } from "next-intl/server";
import { getRegionalFormats } from "@/i18n/server-format";
export default async function Result({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireProfile();
  const [t, format, study] = await Promise.all([
    getTranslations("result"),
    getRegionalFormats(),
    getTranslations("study"),
  ]);
  const { data: s } = await db
    .from("learning_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();
  if (!s.finished_at) redirect(`/sessao/${id}`);
  const [
    { data: attempts, error },
    { data: feedbackData, error: feedbackError },
  ] = await Promise.all([
    db
      .from("question_attempts")
      .select("*, questions(statement,topic_id,topics(name))")
      .eq("session_id", id),
    db.rpc("session_feedback", { p_session: id }),
  ]);
  if (error) throw error;
  if (feedbackError) throw feedbackError;
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
  const feedbackByQuestion = new Map(feedback.map((f) => [f.question_id, f]));
  return (
    <>
      <div className="result-header">
        <span className="eyebrow" style={{ justifyContent: "center" }}>
          {t("eyebrow")}
        </span>
        <h1>{t(s.answered ? "title" : "emptyTitle")}</h1>
        <div className="metric-big">
          {format.percent(s.answered ? s.correct / s.answered : 0)}
        </div>
        <p>
          {s.answered
            ? t("description", { correct: s.correct, total: s.answered })
            : t("empty")}
        </p>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span>{t("xp")}</span>
          <strong>+{format.number(xp)}</strong>
        </div>
        <div className="stat">
          <span>{t("time")}</span>
          <strong>{study("minutes", {count: Math.ceil(seconds / 60)})}</strong>
        </div>
        <div className="stat">
          <span>{t("review")}</span>
          <strong>{format.number(s.answered - s.correct)}</strong>
        </div>
      </div>
      <div className="toolbar">
        <Link className="button dark" href="/inicio">
          {t("home")}
        </Link>
        {s.answered > s.correct && (
          <StartForm
            mode="review"
            source={s.id}
            subject={s.subject_id || undefined}
            label={t("reviewErrors")}
          />
        )}
      </div>
      <div className="section-heading">
        <h2>{t("path")}</h2>
      </div>
      <div className="panel">
        {attempts?.map((a) => (
          <div key={a.id} className="row-card">
            <div>
              <span className="pill">
                {a.correct ? t("correct") : `↻ ${t("review")}`} ·{" "}
                {a.questions?.topics?.name}
              </span>
              <p style={{ marginTop: 10 }}>{a.questions?.statement}</p>
              {feedbackByQuestion.has(a.question_id) && (
                <p style={{ marginTop: 8 }}>
                  {t("answer")}{" "}
                  {String.fromCharCode(
                    65 + feedbackByQuestion.get(a.question_id)!.answer,
                  )}
                  . {feedbackByQuestion.get(a.question_id)!.explanation}
                </p>
              )}
            </div>
            <Link
              className="button small secondary"
              href={`/ia?questao=${a.question_id}&sessao=${s.id}`}
            >
              {t("understand")}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
