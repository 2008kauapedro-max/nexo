import { z } from "zod";
import { supabase } from "@/lib/supabase";
const schema = z.object({
  today: z.number(),
  month: z.number(),
  by_plan: z.array(
    z.object({
      plan_id: z.string().nullable(),
      helps: z.number(),
      tokens: z.number().nullable(),
      estimated_cost_usd: z.number().nullable(),
      failures: z.number(),
      latency_ms: z.number().nullable(),
    }),
  ),
  top_users: z.array(z.object({ user_id: z.string(), helps: z.number() })),
});
export async function TutorMetrics() {
  const db = await supabase();
  const { data, error } = await db.rpc("admin_tutor_metrics");
  if (error) throw error;
  const report = schema.parse(data);
  return (
    <section className="panel">
      <h2>Tutor contextual</h2>
      <p>
        {report.today} ajudas hoje · {report.month} neste mês (horário de São
        Paulo).
      </p>
      <p className="fine-print">
        Demais métricas: últimos 30 dias. Custo estimado em USD, sem descontos
        de cache; confira a fatura. Receita permanece indisponível sem gateway.
      </p>
      {report.by_plan.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Plano</th>
                <th>Ajudas</th>
                <th>Tokens</th>
                <th>Estimativa USD</th>
                <th>Falhas</th>
                <th>Latência média</th>
              </tr>
            </thead>
            <tbody>
              {report.by_plan.map((p) => (
                <tr key={p.plan_id}>
                  <td>{p.plan_id}</td>
                  <td>{p.helps}</td>
                  <td>{p.tokens ?? "—"}</td>
                  <td>
                    {p.estimated_cost_usd?.toFixed(6) ?? "Não disponível"}
                  </td>
                  <td>{p.failures}</td>
                  <td>{p.latency_ms ?? "—"} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          Nenhum pedido contextual registrado. Isso não comprova integração
          real.
        </p>
      )}
      <details>
        <summary>Maiores usos no período</summary>
        <ul>
          {report.top_users.map((u) => (
            <li key={u.user_id}>
              {u.user_id}: {u.helps} ajudas
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
