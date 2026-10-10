import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase";
import { FactoryForm } from "@/components/learning-workspace-forms";
export default async function Factory() {
  const { db } = await requireProfile();
  if (!(await db.rpc("is_admin")).data) notFound();
  const { data: topics } = await db
    .from("topics")
    .select("id,name,subjects(name,slug)");
  const supported = topics?.filter((t) =>
    ["matematica", "fisica", "quimica"].includes(t.subjects?.slug || ""),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTEÚDO COM VERIFICAÇÃO</span>
          <h1>Fábrica de questões.</h1>
          <p>
            Geração autoral de equações, movimento uniforme e massa molar. Os
            gabaritos passam por validação matemática e o lote entra somente
            como rascunho.
          </p>
        </div>
      </div>
      <section className="panel">
        <FactoryForm
          topics={
            supported?.map((t) => ({
              ...t,
              name: (t.subjects?.name || "") + " · " + t.name,
            })) || []
          }
        />
      </section>
      <nav className="workspace-links">
        <Link href="/admin">Revisar os rascunhos</Link>
        <Link href="/admin/qualidade">Métricas de qualidade</Link>
      </nav>
    </>
  );
}
