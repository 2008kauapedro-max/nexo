import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
const schema = z.array(
  z.object({
    id: z.string(),
    statement: z.string(),
    status: z.string(),
    difficulty: z.number(),
    attempts: z.number(),
    accuracy: z.number().nullable(),
    reports: z.number(),
  }),
);
export default async function Quality() {
  const { db } = await requireProfile();
  if (!(await db.rpc("is_admin")).data) notFound();
  const { data, error } = await db.rpc("admin_quality");
  if (error) throw error;
  const rows = schema.parse(data);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">REVISÃO EDITORIAL</span>
          <h1>Qualidade do conteúdo.</h1>
          <p>
            Últimas 100 questões. Amostras pequenas não permitem concluir que
            uma questão é boa ou ruim. Dados de QA também entram nesta base de
            implantação.
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Questão</th>
              <th>Status</th>
              <th>Tentativas</th>
              <th>Acerto</th>
              <th>Relatos abertos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id}>
                <td>{q.statement}</td>
                <td>{q.status}</td>
                <td>{q.attempts}</td>
                <td>
                  {q.accuracy === null ? "Sem amostra" : `${q.accuracy}%`}
                </td>
                <td>{q.reports}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
