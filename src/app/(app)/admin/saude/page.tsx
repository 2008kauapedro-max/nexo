import { getRegionalFormats } from "@/i18n/server-format";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
const schema = z.object({
  database: z.string(),
  profiles: z.number(),
  questions: z.number(),
  open_reports: z.number(),
  ai_failures_24h: z.number(),
  audit: z.array(
    z.object({
      action: z.string(),
      entity_id: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});
export default async function Health() {
  const { db } = await requireProfile();
  const format = await getRegionalFormats();
  const { data: role } = await db.rpc("admin_role");
  if (role !== "SUPER_ADMIN") notFound();
  const { data, error } = await db.rpc("admin_health");
  if (error) throw error;
  const health = schema.parse(data);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERAÇÃO · SUPER ADMIN</span>
          <h1>Saúde da plataforma.</h1>
          <p>Consulta atual ao banco de produção do NEXO.</p>
        </div>
      </div>
      <div className="health-grid">
        {[
          ["Banco", "Conectado"],
          ["Contas", health.profiles],
          ["Questões", health.questions],
          ["Relatos abertos", health.open_reports],
          ["Falhas do tutor · 24h", health.ai_failures_24h],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>Auditoria recente</h2>
      </div>
      {health.audit.length ? (
        health.audit.map((a, i) => (
          <div className="row-card" key={`${a.created_at}-${i}`}>
            <span>{a.action}</span>
            <time>{format.dateTime(a.created_at)}</time>
          </div>
        ))
      ) : (
        <p>Nenhum evento administrativo registrado.</p>
      )}
      <p className="notice">
        Esta visão confirma a conexão e os registros do banco. Disponibilidade
        externa, e-mails e logs da hospedagem exigem verificações próprias.
      </p>
    </>
  );
}
