import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const { db } = await requireProfile();
  const [{ data: lessons }, { data: topics }] = await Promise.all([
    db.from("lessons").select("id,title,explanation").limit(100),
    db.from("topics").select("id,name,subjects(slug)").limit(100),
  ]);
  const found =
    lessons?.filter((l) =>
      (l.title + " " + l.explanation)
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
    ) || [];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SIGA SUA CURIOSIDADE</span>
          <h1>O que quer entender?</h1>
        </div>
      </div>
      <form className="form-stack" action="/buscar">
        <label>
          Buscar no NEXO
          <input
            name="q"
            required
            maxLength={100}
            defaultValue={query}
            placeholder="Equações, força, escala…"
          />
        </label>
        <button className="button primary">Buscar</button>
      </form>
      {query && (
        <>
          <div className="section-heading">
            <h2>Aprender</h2>
          </div>
          {found.length ? (
            found.map((l) => (
              <Link href={`/aprender/${l.id}`} key={l.id} className="row-card">
                <h3>{l.title}</h3>
                <span>→</span>
              </Link>
            ))
          ) : (
            <p>Ainda não há uma aula com esse termo no catálogo.</p>
          )}
          <div className="section-heading">
            <h2>Assuntos para praticar</h2>
          </div>
          {topics
            ?.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
            .map((t) => (
              <Link
                key={t.id}
                className="row-card"
                href={`/estudar/${t.subjects?.slug}`}
              >
                {t.name} →
              </Link>
            ))}
        </>
      )}
    </>
  );
}
