"use client";
import { useActionState, useState } from "react";
import { configurePlan } from "@/app/actions/plans";
import { featureLabels, type Plan } from "@/domain/plans";
export function PlanSettings({ plan }: { plan: Plan }) {
  const [state, action, pending] = useActionState(configurePlan, {});
  const [features, setFeatures] = useState(plan.features);
  const fields = [
    ["monthly_price_cents", "Preço mensal (centavos)", 0, 1000000],
    ["annual_price_cents", "Preço anual futuro (centavos)", 0, 10000000],
    ["daily_questions", "Questões de prática por dia · uso justo", 5, 5000],
    ["daily_ai", "Ajudas IA por dia", 0, 200],
    ["max_simulation", "Questões por simulado", 5, 180],
    ["weekly_simulations", "Simulados em 7 dias", 0, 100],
    ["ai_burst_per_minute", "Pedidos IA por minuto", 1, 10],
  ] as const;
  return (
    <details className="panel">
      <summary>Configurar {plan.name}</summary>
      <form action={action} className="form-stack">
        <input type="hidden" name="id" value={plan.id} />
        <input type="hidden" name="name" value={plan.name} />
        <input type="hidden" name="features" value={JSON.stringify(features)} />
        {fields.map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type="number"
              min={min}
              max={max}
              required={key !== "annual_price_cents"}
              defaultValue={plan[key] ?? ""}
            />
          </label>
        ))}
        <fieldset>
          <legend>Recursos do plano</legend>
          {Object.entries(featureLabels).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={features[key] === true}
                onChange={(e) =>
                  setFeatures({ ...features, [key]: e.target.checked })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
        <p className="fine-print">
          O preço anual fica reservado; a cobrança permanece desativada.
          Recursos em desenvolvimento não ficam disponíveis apenas por habilitar
          esta opção.
        </p>
        {state.error && <p role="alert">{state.error}</p>}
        {state.success && <p role="status">{state.success}</p>}
        <button className="button primary" disabled={pending}>
          Salvar configuração
        </button>
      </form>
    </details>
  );
}
