import { requireProfile } from "@/lib/supabase";
import { Subjects } from "@/components/subjects";
import { StartForm } from "@/components/start-form";
import Link from "next/link";
export default async function Study() {
  const { db } = await requireProfile();
  const { data, error } = await db
    .from("subjects")
    .select("*")
    .order("position");
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CURIOSIDADE EM PRÁTICA</span>
          <h1>O que vamos aprender?</h1>
          <p>Escolha uma matéria ou deixe seu progresso guiar o treino.</p>
        </div>
      </div>
      <nav className="tabs" aria-label="Modos de estudo">
        <Link href="/aprender">Aprender</Link>
        <Link className="active" href="/estudar">
          Praticar
        </Link>
        <Link href="/caderno">Revisar</Link>
        <Link href="/sos">SOS prova</Link>
      </nav>
      <div className="panel">
        <h3>Um treino feito para o seu momento.</h3>
        <p style={{ margin: "12px 0 20px" }}>
          10 questões para trabalhar seus próximos passos.
        </p>
        <StartForm />
      </div>
      <div className="section-heading">
        <h2>Explore as matérias</h2>
      </div>
      <Subjects subjects={data || []} />
      <div className="section-heading">
        <h2>Seu espaço de estudo</h2>
      </div>
      <div className="workspace-links">
        <Link href="/plano">Plano de estudos →</Link>
        <Link href="/missoes">Missões →</Link>
        <Link href="/desafios">Desafios →</Link>
        <Link href="/mapa">Mapa de conhecimento →</Link>
        <Link href="/flashcards">Flashcards →</Link>
        <Link href="/anotacoes">Anotações →</Link>
        <Link href="/buscar">Buscar um assunto →</Link>
      </div>
    </>
  );
}
