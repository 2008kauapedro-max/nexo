"use client";
import { useActionState } from "react";
import { recordCost, resolveReport } from "@/app/actions/operations";
export function CostForm() {
  const [state, action, pending] = useActionState(recordCost, {});
  return (
    <details className="panel">
      <summary>Registrar custo confirmado</summary>
      <form className="form-stack" action={action}>
        <p>
          Registre apenas valores conferidos em fatura. Este formulário não
          efetua pagamentos.
        </p>
        <label>
          Categoria
          <select name="category">
            {["IA", "Supabase", "Vercel", "Gateway", "Email", "Outros"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Valor
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            max="99999999"
            required
          />
        </label>
        <label>
          Moeda
          <select name="currency">
            <option>BRL</option>
            <option>USD</option>
          </select>
        </label>
        <label>
          Data de referência
          <input type="date" name="period" required />
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
          Registrar custo
        </button>
      </form>
    </details>
  );
}
export function ReportResolution({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(resolveReport, {});
  return (
    <form className="form-stack" action={action}>
      <input name="id" type="hidden" value={id} />
      <label>
        Encaminhamento
        <select
          name="status"
          defaultValue={status === "open" ? "review" : status}
        >
          <option value="review">Em revisão</option>
          <option value="resolved">Resolvido</option>
          <option value="rejected">Não procede</option>
        </select>
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
      <button className="button secondary" disabled={pending}>
        Salvar encaminhamento
      </button>
    </form>
  );
}
