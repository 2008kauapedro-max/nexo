"use client";
import { useState, useTransition } from "react";
import { submitActivity } from "@/app/actions/workspace";
export function Activity({
  activity,
}: {
  activity: { id: string; kind: string; prompt: string };
}) {
  const [value, setValue] = useState("");
  const [confidence, setConfidence] = useState<"sure" | "unsure" | "guess">(
    "unsure",
  );
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <section className="activity">
      <span className="eyebrow">AGORA É COM VOCÊ</span>
      <h2>{activity.prompt}</h2>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await submitActivity(
              activity.id,
              activity.kind === "TRUE_FALSE" ? value === "true" : value,
              confidence,
            );
            if (r.error) setError(r.error);
            else if (r.data) setFeedback(r.data);
          });
        }}
      >
        {activity.kind === "TRUE_FALSE" ? (
          <fieldset className="boolean-options">
            <legend>A afirmação está correta?</legend>
            {[
              ["true", "Verdadeiro"],
              ["false", "Falso"],
            ].map(([v, label]) => (
              <label key={v}>
                <input
                  type="radio"
                  name={activity.id}
                  value={v}
                  required
                  checked={value === v}
                  onChange={() => setValue(v)}
                  disabled={!!feedback}
                />
                {label}
              </label>
            ))}
          </fieldset>
        ) : (
          <label>
            Sua resposta
            <input
              type={activity.kind === "NUMERIC_INPUT" ? "number" : "text"}
              step="any"
              inputMode={
                activity.kind === "NUMERIC_INPUT" ? "decimal" : undefined
              }
              required
              maxLength={200}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!!feedback}
            />
          </label>
        )}
        <label>
          Como você se sente sobre a resposta?
          <select
            disabled={!!feedback}
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as typeof confidence)}
          >
            <option value="sure">Tenho certeza</option>
            <option value="unsure">Acho que sei</option>
            <option value="guess">Chutei</option>
          </select>
        </label>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        {feedback ? (
          <div
            className={`notice ${feedback.correct ? "success" : "error"}`}
            role="status"
          >
            <strong>
              {feedback.correct
                ? "Você conectou as ideias."
                : "Vamos olhar de outro jeito."}
            </strong>
            <p>{feedback.explanation}</p>
          </div>
        ) : (
          <button disabled={pending} className="button primary">
            {pending ? "Verificando…" : "Verificar meu entendimento"}
          </button>
        )}
      </form>
    </section>
  );
}
