"use client";
import { useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
export function Tutor({
  question,
  session,
}: {
  question?: string;
  session?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    [],
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function send(text: string) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, question, session }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await response.json();
      if (!response.ok)
        setError(data.error || "Não foi possível responder agora.");
      else {
        setMessages((m) => [
          ...m,
          { role: "user", text },
          { role: "assistant", text: data.text },
        ]);
        setPrompt("");
      }
    } catch {
      setError("A conexão falhou. Tente novamente.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="question-container">
      <div className="panel">
        <Sparkles size={26} />
        <h2 style={{ fontSize: 25, margin: "18px 0" }}>Entender muda tudo.</h2>
        <p>
          {question
            ? "Vamos olhar juntos para essa questão. Por onde você quer começar?"
            : "Traga uma dúvida ou abra o tutor a partir de uma questão para uma explicação com contexto."}
        </p>
      </div>
      <div className="quick-actions">
        {[
          "Me dê uma dica",
          "Explique de outro jeito",
          "Resolva comigo",
          "Crie uma parecida",
          "Me teste nesse assunto",
          "Por que eu errei?",
        ].map((t) => (
          <button
            disabled={pending}
            className="button secondary small"
            key={t}
            onClick={() => {
              setPrompt(t);
              void send(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.text}
          </div>
        ))}
        {pending && <p role="status">Pensando no próximo passo…</p>}
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <form
        className="form-stack"
        style={{ marginTop: 20 }}
        onSubmit={(e) => {
          e.preventDefault();
          void send(prompt);
        }}
      >
        <label>
          Sua dúvida
          <textarea
            maxLength={1500}
            minLength={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="O que você gostaria de entender melhor?"
          />
        </label>
        <button disabled={pending} className="button primary">
          Enviar pergunta <ArrowUp size={17} />
        </button>
      </form>
      <p className="fine-print">
        A IA pode cometer erros. Confira os passos e compare com a explicação da
        questão.
      </p>
    </div>
  );
}
