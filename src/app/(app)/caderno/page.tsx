import { QuestionHelp } from "@/components/question-help";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { ErrorAnnotation } from "@/components/workspace-forms";
import { StartForm } from "@/components/start-form";
export default async function ErrorBook({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "revisar" } = await searchParams;
  const { db } = await requireProfile();
  const [{ data: attempts, error }, { data: annotations }, { data: queue }] =
    await Promise.all([
      db
        .from("question_attempts")
        .select("question_id,session_id,created_at,questions(statement)")
        .eq("correct", false)
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("error_annotations").select("*"),
      db.from("review_queue").select("*"),
    ]);
  if (error) throw error;
  const unique = [
    ...new Map(
      [...(attempts || [])].reverse().map((a) => [a.question_id, a]),
    ).values(),
  ];
  const rows = unique.filter(
    (a) =>
      tab === "recentes" ||
      (tab === "resolvidos"
        ? annotations?.find((n) => n.question_id === a.question_id)?.resolved
        : !annotations?.find((n) => n.question_id === a.question_id)?.resolved),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ERROS TAMBÉM ENSINAM</span>
          <h1>Caderno de erros.</h1>
          <p>
            {unique.length} questões para entender melhor ·{" "}
            {queue?.filter((q) => new Date(q.next_review) <= new Date())
              .length || 0}{" "}
            revisões no momento certo.
          </p>
        </div>
      </div>
      <nav className="tabs" aria-label="Caderno de erros">
        {[
          ["revisar", "Para revisar"],
          ["recentes", "Recentes"],
          ["resolvidos", "Resolvidos"],
        ].map(([id, title]) => (
          <Link
            key={id}
            href={`/caderno?tab=${id}`}
            className={tab === id ? "active" : ""}
          >
            {title}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <>
          <StartForm mode="review" label="Revisar meus erros" />
          {rows.map((a) => {
            const n = annotations?.find((n) => n.question_id === a.question_id);
            return (
              <article className="note" key={a.question_id}>
                <h2>{a.questions?.statement}</h2>
                <details>
                  <summary>Entender e classificar meu erro</summary>
                  <ErrorAnnotation
                    question={a.question_id}
                    reason={n?.reason}
                    resolved={n?.resolved}
                  />
                </details>
                <QuestionHelp question={a.question_id} session={a.session_id} />
              </article>
            );
          })}
        </>
      ) : (
        <div className="empty-state">
          <h2>Nada por aqui agora.</h2>
          <p>
            Quando uma questão pedir mais atenção, você pode revisitá-la neste
            espaço.
          </p>
          <Link className="button primary" href="/estudar">
            Continuar aprendendo
          </Link>
        </div>
      )}
    </>
  );
}
