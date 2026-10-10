import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { Admin } from "@/components/admin";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").slice(0, 256);
  const page = Math.max(
    0,
    Math.min(100000, Number.parseInt(params.page || "0", 10) || 0),
  );
  const { db } = await requireProfile();
  const { data: role } = await db.rpc("admin_role");
  if (role === "FINANCE_ADMIN") redirect("/admin/financeiro");
  if (role !== "SUPER_ADMIN" && role !== "CONTENT_ADMIN") notFound();
  const [{ data: subjects }, { data: topics }, { data: questions, error }] =
    await Promise.all([
      db.from("subjects").select("id,name"),
      db.from("topics").select("id,name,subject_id"),
      db.rpc("admin_questions_page", { p_search: query, p_page: page }),
    ]);
  if (error) throw error;
  const response = z
    .object({ rows: z.unknown(), total: z.number() })
    .parse(questions);
  const parsed = z
    .array(
      z.object({
        id: z.string(),
        statement: z.string(),
        subject_id: z.string(),
        topic_id: z.string(),
        difficulty: z.number(),
        status: z.string(),
        options: z.array(z.string()),
        answer: z.number(),
        explanation: z.string(),
        hint: z.string().optional(),
        key_concept: z.string().optional(),
        solution_steps: z.array(z.string()).optional(),
        option_explanations: z.array(z.string()).optional(),
        common_mistakes: z.array(z.string()).optional(),
        prerequisites: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
      }),
    )
    .parse(response.rows);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ÁREA RESTRITA</span>
          <h1>Qualidade começa no conteúdo.</h1>
          <p>Revise, publique e organize o banco de questões.</p>
        </div>
      </div>
      <details className="panel">
        <summary>Outras áreas de administração</summary>
        {role === "SUPER_ADMIN" && (
          <nav className="workspace-links">
            <Link href="/admin/financeiro">Financeiro</Link>
            <Link href="/admin/saude">Saúde da plataforma</Link>
          </nav>
        )}
        <nav className="workspace-links">
          <Link href="/admin/relatos">Relatos dos alunos</Link>
          <Link href="/admin/fabrica">Fábrica de questões</Link>
          <Link href="/admin/qualidade">Qualidade</Link>
        </nav>
      </details>
      <Admin
        subjects={subjects || []}
        topics={topics || []}
        questions={parsed}
        total={response.total}
        query={query}
        page={page}
      />
    </>
  );
}
