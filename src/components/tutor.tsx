"use client";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { tutorConfig, type TutorIntent } from "@/config/tutor";
type Help = {
  statement: string;
  options: string[];
  hint: string | null;
  key_concept: string | null;
  explanation: string | null;
  answer: number | null;
  selected: number | null;
  solution_steps: string[] | null;
  option_explanations: string[] | null;
  common_mistakes: string[] | null;
};
export function Tutor({
  question,
  session,
  onClose,
}: {
  question: string;
  session: string;
  onClose: () => void;
}) {
  const t = useTranslations("contextual");
  const dialog = useRef<HTMLDialogElement>(null);
  const [help, setHelp] = useState<Help | null>(null),
    [error, setError] = useState(""),
    [text, setText] = useState("");
  const [personal, setPersonal] = useState(false),
    [intent, setIntent] = useState<TutorIntent>("concept"),
    [observation, setObservation] = useState(""),
    [pending, setPending] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const request = useRef<{ key: string; id: string } | null>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    fetch("/api/question-help", {
      signal: controller.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, session }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setHelp(data.help);
        setEnabled(data.enabled);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t("error"));
      });
    return () => controller.abort();
  }, [question, session, t]);
  async function send() {
    if (pending || !enabled) return;
    const key = JSON.stringify({ intent, observation });
    if (request.current?.key !== key)
      request.current = { key, id: crypto.randomUUID() };
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          session,
          intent,
          observation,
          requestId: request.current!.id,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || t("error"));
        if (response.status !== 409) request.current = null;
      } else setText(data.text);
    } catch {
      setError(t("connection"));
    } finally {
      setPending(false);
    }
  }
  const answered = help?.answer !== null && help?.answer !== undefined;
  const choices: TutorIntent[] = answered
    ? [
        help?.selected === help?.answer ? "why_correct" : "mistake",
        "rephrase",
        "steps",
      ]
    : ["hint", "concept", "start"];
  return (
    <dialog
      ref={dialog}
      className="help-dialog"
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="help-title"
    >
      <header className="help-heading">
        <h2 id="help-title">{t("title")}</h2>
        <button
          type="button"
          className="button secondary small"
          onClick={onClose}
          aria-label={t("close")}
        >
          {t("close")}
        </button>
      </header>
      {!help && !error && <p role="status">{t("loading")}</p>}
      {help && (
        <>
          <p className="fine-print">{t("free")}</p>
          <p>{help.statement}</p>
          <section className="panel">
            <h3>{t("hint")}</h3>
            <p>{help.hint || t("fallback")}</p>
            {help.key_concept && (
              <>
                <h3>{t("concept")}</h3>
                <p>{help.key_concept}</p>
              </>
            )}
          </section>
          {answered ? (
            <section className="panel">
              <h3>{t("answer")}</h3>
              <p>{help.explanation}</p>
              {!!help.option_explanations?.length && (
                <details>
                  <summary>{t("alternatives")}</summary>
                  <ol type="A">
                    {help.option_explanations.map((explanation, index) => (
                      <li key={index}>
                        <strong>{help.options[index]}</strong>: {explanation}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {!!help.solution_steps?.length && (
                <ol>
                  {help.solution_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
              {!!help.common_mistakes?.length && (
                <details>
                  <summary>{t("mistakes")}</summary>
                  <ul>
                    {help.common_mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          ) : (
            <p>{t("locked")}</p>
          )}
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setPersonal(true);
              setIntent(choices[0]);
            }}
          >
            {t("personal")}
          </button>
          {personal && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              {!enabled && (
                <p className="notice" role="status">
                  {t("unavailable")}
                </p>
              )}
              <label>
                {t("intent")}
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value as TutorIntent)}
                >
                  {choices.map((value) => (
                    <option key={value} value={value}>
                      {t(value + "Intent")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("observation")}
                <textarea
                  maxLength={tutorConfig.maxInputCharacters}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </label>
              <span className="fine-print">
                {observation.length}/{tutorConfig.maxInputCharacters} ·{" "}
                {t("cost")}
              </span>
              <button className="button primary" disabled={!enabled || pending}>
                {pending ? t("pending") : t("ask")}
              </button>
              <p className="fine-print">{t("notice")}</p>
            </form>
          )}
        </>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {text && (
        <p
          className="panel"
          style={{ whiteSpace: "pre-wrap" }}
          aria-live="polite"
        >
          {text}
        </p>
      )}
    </dialog>
  );
}
