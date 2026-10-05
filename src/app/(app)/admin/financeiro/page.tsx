import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { CostForm } from "@/components/operations-forms";
const schema = z.object({
  active_subscriptions: z.number(),
  revenue: z.null(),
  mrr: z.null(),
  costs: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      amount: z.number(),
      currency: z.string(),
      period: z.string(),
    }),
  ),
});
export default async function Finance() {
  const { db } = await requireProfile();
  const { data: role } = await db.rpc("admin_role");
  if (!["SUPER_ADMIN", "FINANCE_ADMIN"].includes(role || "")) notFound();
  const { data, error } = await db.rpc("admin_finance");
  if (error) throw error;
  const report = schema.parse(data);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GESTÃO · ACESSO RESTRITO</span>
          <h1>Financeiro.</h1>
          <p>Valores confirmados, com origem e período.</p>
        </div>
      </div>
      <div className="health-grid">
        <div className="panel">
          <p>Assinaturas ativas</p>
          <strong>{report.active_subscriptions}</strong>
        </div>
        <div className="panel">
          <p>Receita e MRR</p>
          <strong>Não disponível</strong>
          <p>Gateway ainda não conectado.</p>
        </div>
      </div>
      <div className="section-heading">
        <h2>Custos registrados</h2>
      </div>
      <CostForm />
      {report.costs.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Período</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {report.costs.map((c) => (
                <tr key={c.id}>
                  <td>{c.category}</td>
                  <td>{c.period}</td>
                  <td>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: c.currency,
                    }).format(c.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel">
          <p>
            Nenhum custo foi registrado. Isso não significa custo zero. Os
            valores precisam ser conferidos nas faturas dos fornecedores.
          </p>
        </div>
      )}
      <nav className="workspace-links">
        {role === "SUPER_ADMIN" && <Link href="/admin">Conteúdo</Link>}
        <Link href="/configuracoes">Configurações</Link>
      </nav>
    </>
  );
}
