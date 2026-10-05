"use client";
import { useActionState } from "react";
import {
  saveNote,
  saveFlashcard,
  saveNotifications,
  annotateError,
  reportQuestion,
} from "@/app/actions/workspace";
function Feedback({ state }: { state: { error?: string; success?: string } }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice success">
          {state.success}
        </p>
      )}
    </>
  );
}
export function NoteForm() {
  const [state, action, pending] = useActionState(saveNote, {});
  return (
    <form action={action} className="form-stack">
      <label>
        Título
        <input name="title" required maxLength={120} />
      </label>
      <label>
        Sua anotação
        <textarea name="body" required maxLength={10000} />
      </label>
      <Feedback state={state} />
      <button className="button primary" disabled={pending}>
        {pending ? "Salvando…" : "Salvar anotação"}
      </button>
    </form>
  );
}
export function FlashcardForm() {
  const [state, action, pending] = useActionState(saveFlashcard, {});
  return (
    <form action={action} className="form-stack">
      <label>
        Frente · pergunta
        <textarea name="front" required maxLength={1000} />
      </label>
      <label>
        Verso · resposta
        <textarea name="back" required maxLength={3000} />
      </label>
      <Feedback state={state} />
      <button className="button primary" disabled={pending}>
        {pending ? "Salvando…" : "Criar flashcard"}
      </button>
    </form>
  );
}
export function NotificationPreferences({
  preferences,
}: {
  preferences: { study: boolean; achievements: boolean; news: boolean };
}) {
  const [state, action, pending] = useActionState(saveNotifications, {});
  return (
    <form action={action} className="form-stack">
      {[
        { id: "study", name: "Estudos e revisões" },
        { id: "achievements", name: "Conquistas" },
        { id: "news", name: "Novidades de conteúdo" },
      ].map(({ id, name }) => (
        <label className="toggle-row" key={id}>
          <span>{name}</span>
          <input
            name={id}
            type="checkbox"
            defaultChecked={preferences[id as keyof typeof preferences]}
          />
        </label>
      ))}
      <p>
        As notificações ficam dentro do NEXO. Push no celular ainda não está
        ativado.
      </p>
      <Feedback state={state} />
      <button className="button primary" disabled={pending}>
        Salvar preferências
      </button>
    </form>
  );
}
export function ErrorAnnotation({
  question,
  reason = "Conceito",
  resolved = false,
}: {
  question: string;
  reason?: string;
  resolved?: boolean;
}) {
  const [state, action, pending] = useActionState(annotateError, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="question" value={question} />
      <label>
        O que aconteceu?
        <select name="reason" defaultValue={reason}>
          {[
            "Conceito",
            "Interpretação",
            "Cálculo",
            "Distração",
            "Fórmula esquecida",
            "Outro",
          ].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="toggle-row">
        <span>Já entendi este erro</span>
        <input name="resolved" type="checkbox" defaultChecked={resolved} />
      </label>
      <Feedback state={state} />
      <button disabled={pending} className="button small secondary">
        Salvar reflexão
      </button>
    </form>
  );
}
export function QuestionReport({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reportQuestion, {});
  return (
    <details className="report-details">
      <summary>Reportar problema</summary>
      <form action={action} className="form-stack">
        <input type="hidden" name="question" value={id} />
        <label>
          Motivo
          <select name="reason">
            {[
              "Resposta incorreta",
              "Enunciado incorreto",
              "Imagem quebrada",
              "Questão duplicada",
              "Explicação ruim",
              "Outro",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Detalhes (opcional)
          <textarea name="detail" maxLength={1000} />
        </label>
        <Feedback state={state} />
        <button className="button secondary" disabled={pending}>
          Enviar relato
        </button>
      </form>
    </details>
  );
}
