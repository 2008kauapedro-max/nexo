import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { PlanForm } from "@/components/learning-workspace-forms";
import { StartForm } from "@/components/start-form";
export default async function Plan() {
  const { db } = await requireProfile();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const { data, error } = await db
    .from("study_plan_items")
    .select("*,topics(name,subject_id,subjects(slug))")
    .gte("day", today)
    .order("day")
    .limit(7);
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONSISTÊNCIA SEM PRESSA</span>
          <h1>Seu plano de estudos.</h1>
          <p>
            Sete dias, com um foco por vez. O plano prioriza assuntos com menor
            domínio nas matérias que você escolheu.
          </p>
        </div>
      </div>
      <details className="panel" open={!data.length}>
        <summary>Organizar minha semana</summary>
        <p>
          As sugestões já salvas são preservadas. Ajuste suas matérias nas
          preferências para os próximos dias adicionados.
        </p>
        <PlanForm />
      </details>
      {data.map((item) => (
        <article className="row-card" key={item.day}>
          <div>
            <span className="eyebrow">
              {new Date(item.day + "T12:00:00Z").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                timeZone: "America/Sao_Paulo",
              })}{" "}
              · {item.day === today ? "HOJE" : "PLANEJADO"}
            </span>
            <h2>{item.topics?.name}</h2>
            <p>
              {item.kind === "learn"
                ? "Entender o conceito"
                : item.kind === "review"
                  ? "Revisar o que precisa de atenção"
                  : `Praticar até ${item.target} questões`}
            </p>
          </div>
          {item.kind === "learn" ? (
            <Link
              className="button small secondary"
              href={`/aprender?assunto=${item.topic_id}`}
            >
              Aprender
            </Link>
          ) : (
            <StartForm
              mode={item.kind === "review" ? "review" : "practice"}
              subject={item.topics?.subject_id}
              topic={item.topic_id}
              target={item.target}
              label={item.kind === "review" ? "Revisar" : "Praticar"}
            />
          )}
        </article>
      ))}
      <nav className="workspace-links">
        <Link href="/preferencias">Ajustar preferências</Link>
        <Link href="/missoes">Missões de hoje</Link>
      </nav>
    </>
  );
}
