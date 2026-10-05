import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { ReportResolution } from "@/components/operations-forms";
const schema = z.array(
  z.object({
    id: z.string(),
    question_id: z.string(),
    statement: z.string(),
    reason: z.string(),
    detail: z.string(),
    status: z.string(),
    created_at: z.string(),
  }),
);
export default async function Reports() {
  const { db } = await requireProfile();
  const { data: allowed } = await db.rpc("is_admin");
  if (!allowed) notFound();
  const { data, error } = await db.rpc("admin_reports");
  if (error) throw error;
  const reports = schema.parse(data);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">QUALIDADE DE CONTEÚDO</span>
          <h1>Relatos dos alunos.</h1>
          <p>
            Revise a questão antes de concluir o atendimento. Últimos 100
            relatos.
          </p>
        </div>
      </div>
      {reports.length ? (
        reports.map((r) => (
          <article className="note" key={r.id}>
            <span className="eyebrow">
              {r.reason} · {r.status}
            </span>
            <h2>{r.statement}</h2>
            <p>{r.detail || "Nenhum detalhe adicional."}</p>
            <ReportResolution id={r.id} status={r.status} />
          </article>
        ))
      ) : (
        <div className="empty-state">
          <p>Nenhum relato recebido.</p>
        </div>
      )}
    </>
  );
}
