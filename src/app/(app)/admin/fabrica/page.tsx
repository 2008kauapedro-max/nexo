import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase";
import { FactoryForm } from "@/components/learning-workspace-forms";
export default async function Factory() {
  const { db } = await requireProfile();
  if (!(await db.rpc("is_admin")).data) notFound();
  const { data: subject } = await db
    .from("subjects")
    .select("id")
    .eq("slug", "matematica")
    .maybeSingle();
  const { data: topics } = await db
    .from("topics")
    .select("id,name")
    .eq("subject_id", subject?.id || "00000000-0000-0000-0000-000000000000");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTEÚDO COM VERIFICAÇÃO</span>
          <h1>Fábrica de questões.</h1>
          <p>
            Geração autoral de equações lineares. Os gabaritos passam por
            validação matemática e o lote entra somente como rascunho.
          </p>
        </div>
      </div>
      <section className="panel">
        <FactoryForm topics={topics || []} />
      </section>
      <nav className="workspace-links">
        <Link href="/admin">Revisar os rascunhos</Link>
        <Link href="/admin/qualidade">Métricas de qualidade</Link>
      </nav>
    </>
  );
}
