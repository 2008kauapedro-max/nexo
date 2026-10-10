"use client";
import { useActionState } from "react";
import {
  createStudyPlan,
  saveReflection,
  createQuestionDrafts,
} from "@/app/actions/learning-workspace";
export function PlanForm() {
  const [state, action, pending] = useActionState(createStudyPlan, {});
  return (
    <form action={action} className="form-stack">
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
      <button disabled={pending} className="button primary">
        {pending ? "Organizando…" : "Organizar os próximos sete dias"}
      </button>
    </form>
  );
}
export function ReflectionForm({
  lesson,
  initial,
  reference,
}: {
  lesson: string;
  initial: string;
  reference: string;
}) {
  const [state, action, pending] = useActionState(saveReflection, {});
  return (
    <>
      <form action={action} className="form-stack">
        <input type="hidden" name="lesson" value={lesson} />
        <label>
          Como você explicaria isso para alguém?
          <textarea
            name="explanation"
            defaultValue={initial}
            minLength={20}
            maxLength={3000}
            required
            rows={7}
          />
        </label>
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
        <button disabled={pending} className="button primary">
          {pending ? "Salvando…" : "Salvar e comparar meu raciocínio"}
        </button>
      </form>
      {(initial || state.success) && (
        <section className="worked-example">
          <h2>Compare as conexões.</h2>
          <p>{reference}</p>
          <ul>
            <li>Você explicou a ideia principal?</li>
            <li>Usou um exemplo correto?</li>
            <li>Consegue aplicar em uma situação diferente?</li>
          </ul>
          <p>
            A comparação é uma autoavaliação. A análise por IA ainda não está
            disponível; sua explicação não altera automaticamente o domínio do
            assunto.
          </p>
        </section>
      )}
    </>
  );
}
export function FactoryForm({
  topics,
}: {
  topics: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createQuestionDrafts, {});
  return (
    <form action={action} className="form-stack">
      <label>
        Assunto correspondente ao modelo
        <select name="topic" required>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Modelo
        <select name="kind">
          <option value="linear">Matemática · equação linear</option>
          <option value="motion">Física · movimento uniforme</option>
          <option value="molar_mass">Química · massa molar</option>
        </select>
      </label>
      <label>
        Semente do lote
        <input
          name="seed"
          type="number"
          min="1"
          max="10000"
          defaultValue="1"
          required
        />
      </label>
      <p>
        A mesma semente produz o mesmo lote. Cada alternativa é validada por
        cálculo e unicidade do gabarito. A publicação continua sendo uma decisão
        editorial.
      </p>
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
      <button disabled={pending || !topics.length} className="button primary">
        Gerar cinco rascunhos
      </button>
    </form>
  );
}
