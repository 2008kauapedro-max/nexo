import Link from "next/link";
import { Flame, Target, Zap, ArrowUpRight } from "lucide-react";
import { requireProfile } from "@/lib/supabase";
import { levelFromXp } from "@/domain/learning";
import { StartForm } from "@/components/start-form";
export default async function Home() {
  const { db, profile, user } = await requireProfile();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const [{ data: usage, error }, { data: sessions }] = await Promise.all([
    db
      .from("usage_counters")
      .select("*")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle(),
    db
      .from("learning_sessions")
      .select("*")
      .is("finished_at", null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("started_at", { ascending: false })
      .limit(1),
  ]);
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">HOJE · SEU PRÓXIMO PASSO</span>
          <h1>
            Olá, {profile.name.split(" ")[0]}
            <span className="muted">.</span>
          </h1>
          <p>Que tal dar mais um passo hoje?</p>
        </div>
        <span className="pill">Nível {levelFromXp(profile.xp)}</span>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span>
            <Flame size={14} /> Sequência
          </span>
          <strong>
            {profile.streak}{" "}
            <small style={{ fontSize: 12, letterSpacing: 0 }}>dias</small>
          </strong>
        </div>
        <div className="stat">
          <span>
            <Zap size={14} /> Conhecimento
          </span>
          <strong>
            {profile.xp}{" "}
            <small style={{ fontSize: 12, letterSpacing: 0 }}>XP</small>
          </strong>
        </div>
        <div className="stat">
          <span>
            <Target size={14} /> Meta de hoje
          </span>
          <strong>
            {usage?.questions || 0}
            <small style={{ fontSize: 14, letterSpacing: 0 }}>
              {" "}
              / {profile.daily_goal}
            </small>
          </strong>
        </div>
      </div>
      <section className="study-banner">
        <span className="eyebrow">
          {sessions?.[0]
            ? "SEU PROGRESSO ESTÁ SALVO"
            : "UMA SESSÃO CURTA JÁ FAZ DIFERENÇA"}
        </span>
        <h2>
          Seu próximo desafio
          <br />
          está aqui.
        </h2>
        <p>Uma questão de cada vez. No nível certo para você.</p>
        {sessions?.[0] ? (
          <Link className="button primary" href={`/sessao/${sessions[0].id}`}>
            Continuar estudando <ArrowUpRight size={18} />
          </Link>
        ) : (
          <StartForm />
        )}
      </section>
      <nav className="today-links" aria-label="Outros caminhos de estudo">
        <Link href="/aprender">
          Aprender <span>Conceitos e exemplos ↗</span>
        </Link>
        <Link href="/caderno">
          Revisar <span>Conectar o que faltou ↗</span>
        </Link>
        <Link href="/estudar">
          Explorar <span>Escolher uma matéria ↗</span>
        </Link>
      </nav>
    </>
  );
}
