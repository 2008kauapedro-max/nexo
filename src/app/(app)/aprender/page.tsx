import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { ArrowUpRight } from "lucide-react";
export default async function Learn({
  searchParams,
}: {
  searchParams: Promise<{ assunto?: string }>;
}) {
  const { assunto } = await searchParams;
  const { db } = await requireProfile();
  const { data, error } = await db
    .from("lessons")
    .select("*,topics(name,subjects(name))")
    .order("title");
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ENTENDER ANTES DE RESPONDER</span>
          <h1>Aprender.</h1>
          <p>Uma ideia. Um exemplo. Uma pequena descoberta.</p>
        </div>
      </div>
      <div className="lesson-list">
        {data
          .filter((l) => !assunto || l.topic_id === assunto)
          .map((l) => (
            <Link className="row-card" key={l.id} href={`/aprender/${l.id}`}>
              <div>
                <span className="eyebrow">{l.topics?.subjects?.name}</span>
                <h2>{l.title}</h2>
                <p>Explicação + exemplo + atividades</p>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          ))}
      </div>
    </>
  );
}
