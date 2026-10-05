import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
export default async function Missions() {
  const { db, profile } = await requireProfile();
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const start = day + "T00:00:00-03:00";
  const results = await Promise.all([
    db.from("usage_counters").select("questions").eq("day", day).maybeSingle(),
    db
      .from("activity_attempts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start),
    db
      .from("learning_sessions")
      .select("*", { count: "exact", head: true })
      .eq("mode", "review")
      .not("finished_at", "is", null)
      .gte("started_at", start)
      .gt("answered", 0),
  ]);
  if (results.some((result) => result.error))
    throw new Error("Não foi possível carregar suas missões.");
  const [{ data: usage }, { count: activities }, { count: reviews }] = results;
  const missions = [
    {
      name: "Seu compromisso de hoje",
      current: usage?.questions || 0,
      target: profile.daily_goal,
      href: "/estudar",
      text: "Responda questões no seu ritmo.",
    },
    {
      name: "Conecte uma ideia",
      current: activities || 0,
      target: 1,
      href: "/aprender",
      text: "Experimente uma microatividade.",
    },
    {
      name: "Transforme um erro",
      current: reviews || 0,
      target: 1,
      href: "/caderno",
      text: "Conclua uma sessão de revisão, se houver erros no seu caderno.",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEQUENAS VITÓRIAS</span>
          <h1>Missões de hoje.</h1>
          <p>
            Seu progresso é contado pelas atividades registradas. Não há
            penalidade por deixar uma missão para depois.
          </p>
        </div>
      </div>
      {missions.map((m) => (
        <article className="note" key={m.href}>
          <span className="pill">
            {Math.min(m.current, m.target)} / {m.target}
          </span>
          <h2>{m.name}</h2>
          <p>{m.text}</p>
          {m.current >= m.target ? (
            <p role="status">Concluída hoje.</p>
          ) : (
            <Link className="button secondary" href={m.href}>
              Dar o próximo passo
            </Link>
          )}
        </article>
      ))}
      <Link className="text-link" href="/desafios">
        Experimentar um desafio curto →
      </Link>
    </>
  );
}
