import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireProfile } from "@/lib/supabase";
import { Admin } from "@/components/admin";
export default async function AdminPage() {
  const { db } = await requireProfile();
  const { data: role } = await db.rpc("admin_role");
  if (role === "FINANCE_ADMIN") redirect("/admin/financeiro");
  const { data: admin } = await db.rpc("is_admin");
  if (!admin) notFound();
  const [{ data: subjects }, { data: topics }, { data: questions, error }] =
    await Promise.all([
      db.from("subjects").select("*"),
      db.from("topics").select("*"),
      db.rpc("admin_questions"),
    ]);
  if (error) throw error;
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
      }),
    )
    .parse(questions);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ÁREA RESTRITA</span>
          <h1>Qualidade começa no conteúdo.</h1>
          <p>Revise, publique e organize o banco de questões.</p>
        </div>
      </div>
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
      <Admin
        subjects={subjects || []}
        topics={topics || []}
        questions={parsed}
      />
    </>
  );
}
