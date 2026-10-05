"use client";
import { useState, useTransition } from "react";
import { reviewCard } from "@/app/actions/workspace";
export function Flashcard({
  card,
}: {
  card: { id: string; front: string; back: string };
}) {
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  function answer(remembered: boolean) {
    start(async () => {
      setError("");
      try {
        const r = await reviewCard(card.id, remembered);
        if (r.error) setError(r.error);
        else setDone(true);
      } catch {
        setError("A conexão falhou. Tente registrar novamente quando voltar.");
      }
    });
  }
  return (
    <article className="flashcard">
      <span className="eyebrow">
        {done
          ? "REVISÃO REGISTRADA"
          : flipped
            ? "VERSO"
            : "LEMBRE ANTES DE VIRAR"}
      </span>
      <h2>{card.front}</h2>
      {flipped && <p>{card.back}</p>}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {done ? (
        <p role="status">Pronto. A próxima revisão já está agendada.</p>
      ) : flipped ? (
        <div className="toolbar">
          <button
            disabled={pending}
            className="button secondary"
            onClick={() => answer(false)}
          >
            Ainda não lembrei
          </button>
          <button
            disabled={pending}
            className="button primary"
            onClick={() => answer(true)}
          >
            Lembrei
          </button>
        </div>
      ) : (
        <button className="button primary" onClick={() => setFlipped(true)}>
          Ver resposta
        </button>
      )}
    </article>
  );
}
