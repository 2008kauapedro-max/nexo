"use client";
import { useState, useTransition } from "react";
import { submitActivity } from "@/app/actions/workspace";
export function Activity({
  activity,
  saved,
}: {
  activity: { id: string; kind: string; prompt: string; items?: string[] };
  saved?: {
    response: { value: string | boolean | string[] };
    confidence: "sure" | "unsure" | "guess";
    correct: boolean;
    explanation: string;
  };
}) {
  const [value, setValue] = useState(
    typeof saved?.response.value === "string" ||
      typeof saved?.response.value === "boolean"
      ? String(saved.response.value)
      : "",
  );
  const [ordered, setOrdered] = useState<string[]>(
    Array.isArray(saved?.response.value)
      ? saved.response.value
      : activity.items || [],
  );
  const [confidence, setConfidence] = useState<"sure" | "unsure" | "guess">(
    saved?.confidence || "unsure",
  );
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(saved || null);
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
            setError("");
            try {
              const r = await submitActivity(
                activity.id,
                activity.kind === "ORDERING"
                  ? ordered
                  : activity.kind === "TRUE_FALSE"
                    ? value === "true"
                    : value,
                confidence,
              );
              if (r.error) setError(r.error);
              else if (r.data) setFeedback(r.data);
            } catch {
              setError(
                "A conexão falhou. Sua resposta continua aqui; tente novamente.",
              );
            }
          });
        }}
      >
        {activity.kind === "ORDERING" ? (
          <fieldset className="ordering-options">
            <legend>Use as setas para colocar os passos na ordem.</legend>
            <ol>
              {ordered.map((item, index) => (
                <li key={item}>
                  <span>{item}</span>
                  <div className="toolbar">
                    {[-1, 1].map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        className="button small secondary"
                        disabled={
                          pending ||
                          !!feedback ||
                          index + direction < 0 ||
                          index + direction >= ordered.length
                        }
                        aria-label={`${direction < 0 ? "Subir" : "Descer"} passo ${index + 1}`}
                        onClick={() =>
                          setOrdered((current) => {
                            const next = [...current];
                            [next[index], next[index + direction]] = [
                              next[index + direction],
                              next[index],
                            ];
                            return next;
                          })
                        }
                      >
                        {direction < 0 ? "↑" : "↓"}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </fieldset>
        ) : activity.kind === "TRUE_FALSE" ? (
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
            {!feedback.correct && confidence === "sure" && (
              <p>
                Você estava confiante, mas este ponto merece revisão. Tente
                explicar o conceito com suas palavras antes de avançar.
              </p>
            )}
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
