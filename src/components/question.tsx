"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { answerQuestion } from "@/app/actions/study";
import { QuestionReport } from "@/components/workspace-forms";
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
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit() {
    if (selected === null) return;
    startTransition(async () => {
      const result = await answerQuestion(sessionId, question.id, selected);
      if (result.error) setError(result.error);
      else if (result.data) {
        setFeedback(result.data);
        if (result.data.correct && "vibrate" in navigator)
          navigator.vibrate(20);
      }
    });
  }
  return (
    <section className="question-container">
      <div className="question-top">
        <span>
          {mode === "diagnostic"
            ? "Diagnóstico"
            : mode === "simulation"
              ? "Modo prova"
              : "Seu treino"}{" "}
          ·{" "}
          {question.difficulty <= 3
            ? "Fácil"
            : question.difficulty <= 7
              ? "Médio"
              : "Difícil"}
        </span>
        <span>
          Questão {answered + 1} de {target}
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Progresso da sessão"
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
              <CheckCircle2 size={18} aria-label="Alternativa correta" />
            )}
            {feedback && selected === i && feedback.correct === false && (
              <XCircle size={18} aria-label="Sua resposta estava incorreta" />
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
              "Resposta registrada."
            ) : feedback.correct ? (
              <>
                <CheckCircle2 size={20} />
                Isso! Mais um passo. +{feedback.xp} XP
              </>
            ) : (
              <>
                <XCircle size={20} />
                Faz parte do caminho.
              </>
            )}
          </strong>
          <p>
            {feedback.explanation ||
              "Você verá a correção ao finalizar o simulado."}
          </p>
        </div>
      )}
      <div className="question-actions">
        {mode !== "simulation" && (
          <Link
            href={`/ia?questao=${question.id}&sessao=${sessionId}`}
            className="button secondary"
          >
            <Sparkles size={17} />{" "}
            {feedback ? "Entender melhor" : "Pedir uma dica"}
          </Link>
        )}
        {!feedback ? (
          <button
            disabled={selected === null || pending}
            onClick={submit}
            className="button primary"
          >
            {pending ? "Registrando…" : "Confirmar resposta"}
          </button>
        ) : (
          <button
            disabled={pending}
            className="button primary"
            onClick={() => startTransition(() => router.refresh())}
          >
            {pending
              ? "Carregando…"
              : answered + 1 >= target
                ? "Ver resultado"
                : "Próxima questão"}
            <ArrowRight size={17} />
          </button>
        )}
      </div>
      <QuestionReport id={question.id} />
    </section>
  );
}
