"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { answerQuestion, advanceStudy } from "@/app/actions/study";
import { QuestionReport } from "@/components/workspace-forms";
import { useTranslations } from "next-intl";
type Feedback = {
  correct: boolean | null;
  answer: number | null;
  explanation: string | null;
  xp: number;
};
export function Question({
  sessionId,
  question,
  answered,
  target,
  mode,
  initialSelected = null,
  initialFeedback = null,
}: {
  sessionId: string;
  question: {
    id: string;
    statement: string;
    options: string[];
    difficulty: number;
  };
  answered: number;
  target: number;
  mode: string;
  initialSelected?: number | null;
  initialFeedback?: Feedback | null;
}) {
  const t = useTranslations("question");
  const [selected, setSelected] = useState<number | null>(initialSelected);
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit() {
    if (selected === null) return;
    startTransition(async () => {
      setError("");
      try {
        const result = await answerQuestion(sessionId, question.id, selected);
        if (result.error) setError(result.error);
        else if (result.data) {
          setFeedback(result.data);
          if (result.data.correct && "vibrate" in navigator)
            navigator.vibrate(20);
        }
      } catch {
        setError(t("connectionError"));
      }
    });
  }
  return (
    <section className="question-container">
      <div className="question-top">
        <span>
          {mode === "diagnostic"
            ? t("diagnostic")
            : mode === "simulation"
              ? t("simulation")
              : t("practice")}{" "}
          ·{" "}
          {question.difficulty <= 3
            ? t("easy")
            : question.difficulty <= 7
              ? t("medium")
              : t("hard")}
        </span>
        <span>{t("position", { current: answered + 1, total: target })}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={t("progress")}
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <span style={{ width: `${(answered / target) * 100}%` }} />
      </div>
      <h1>{question.statement}</h1>
      <div className="answers">
        {question.options.map((option, i) => (
          <button
            key={i}
            disabled={pending || !!feedback}
            aria-pressed={selected === i}
            className={`answer ${feedback?.answer === i ? "correct" : feedback && selected === i && feedback.correct === false ? "incorrect" : ""}`}
            onClick={() => setSelected(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            <span>{option}</span>
            {feedback?.answer === i && (
              <CheckCircle2 size={18} aria-label={t("correctOption")} />
            )}
            {feedback && selected === i && feedback.correct === false && (
              <XCircle size={18} aria-label={t("incorrectOption")} />
            )}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="notice error" style={{ marginTop: 20 }}>
          {error}
        </p>
      )}
      {feedback && (
        <div
          role="status"
          className={`feedback ${feedback.correct === null ? "panel" : feedback.correct ? "success" : "error"}`}
        >
          <strong>
            {feedback.correct === null ? (
              t("recorded")
            ) : feedback.correct ? (
              <>
                <CheckCircle2 size={20} />
                {t("correct", { xp: feedback.xp })}
              </>
            ) : (
              <>
                <XCircle size={20} />
                {t("incorrect")}
              </>
            )}
          </strong>
          <p>{feedback.explanation || t("examFeedback")}</p>
        </div>
      )}
      <div className="question-actions">
        {mode !== "simulation" && (
          <Link
            href={`/ia?questao=${question.id}&sessao=${sessionId}`}
            className="button secondary"
          >
            <Sparkles size={17} /> {feedback ? t("understand") : t("hint")}
          </Link>
        )}
        {!feedback ? (
          <button
            disabled={selected === null || pending}
            onClick={submit}
            className="button primary"
          >
            {pending ? t("saving") : t("confirm")}
          </button>
        ) : (
          <button
            disabled={pending}
            className="button primary"
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = await advanceStudy(sessionId);
                  if (result.error) setError(result.error);
                } catch {
                  setError(t("connectionError"));
                }
              })
            }
          >
            {pending
              ? t("loading")
              : answered + 1 >= target
                ? t("result")
                : t("next")}
            <ArrowRight size={17} />
          </button>
        )}
      </div>
      <QuestionReport id={question.id} />
    </section>
  );
}
