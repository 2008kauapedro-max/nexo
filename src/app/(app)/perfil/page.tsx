import { getRegionalFormats } from "@/i18n/server-format";
import Link from "next/link";
import { DeleteAccount } from "@/components/delete-account";
import { requireProfile } from "@/lib/supabase";
import { levelFromXp } from "@/domain/learning";
import { logout } from "@/app/actions/auth";
export default async function Profile() {
  const { db, profile } = await requireProfile();
  const format = await getRegionalFormats();
  const [
    { data: sessions, error },
    { data: mastery },
    { data: badges },
    { data: admin },
  ] = await Promise.all([
    db
      .from("learning_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100),
    db
      .from("topic_mastery")
      .select("*,topics(name)")
      .order("score", { ascending: false }),
    db.from("user_achievements").select("*,achievements(name,description)"),
    db.rpc("admin_role"),
  ]);
  if (error) throw error;
  const answered = sessions?.reduce((n, s) => n + s.answered, 0) || 0;
  const correct = sessions?.reduce((n, s) => n + s.correct, 0) || 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SUA HISTÓRIA ATÉ AQUI</span>
          <h1>{profile.name}</h1>
          <p>
            {profile.goal} · Nível {levelFromXp(profile.xp)}
          </p>
        </div>
        <span className="avatar">{profile.name.charAt(0)}</span>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span>Questões*</span>
          <strong>{answered}</strong>
        </div>
        <div className="stat">
          <span>Taxa de acerto*</span>
          <strong>
            {answered ? Math.round((correct / answered) * 100) : 0}%
          </strong>
        </div>
        <div className="stat">
          <span>XP total</span>
          <strong>{profile.xp}</strong>
        </div>
      </div>
      <p className="fine-print">
        *Últimas 100 sessões. Seu XP inclui todo o histórico.
      </p>
      <div className="section-heading">
        <h2>Seu conhecimento, em perspectiva</h2>
      </div>
      <div className="panel">
        {mastery?.length ? (
          mastery.map((m) => (
            <div className="row-card" key={m.topic_id}>
              <div style={{ flex: 1 }}>
                <h3>{m.topics?.name}</h3>
                <div className="progress">
                  <span style={{ width: `${m.score}%` }} />
                </div>
              </div>
              <strong>{Math.round(m.score)}%</strong>
            </div>
          ))
        ) : (
          <p>
            Complete seu primeiro treino para descobrir seus pontos fortes e
            oportunidades.
          </p>
        )}
      </div>
      <div className="section-heading">
        <h2>Pequenas grandes conquistas</h2>
      </div>
      <div className="subject-grid">
        {badges?.length ? (
          badges.map((b) => (
            <div className="subject-card" key={b.achievement_id}>
              <h3>{b.achievements?.name}</h3>
              <p>{b.achievements?.description}</p>
            </div>
          ))
        ) : (
          <p>Seu primeiro marco está a uma sessão de distância.</p>
        )}
      </div>
      <div className="section-heading">
        <h2>Sua conta</h2>
      </div>
      <div className="toolbar">
        <Link className="button secondary" href="/configuracoes">
          Configurações
        </Link>
        <Link className="button secondary" href="/preferencias">
          Editar preferências
        </Link>
        <Link className="button secondary" href="/planos">
          Planos
        </Link>
        <a className="button secondary" href="/api/dados">
          Baixar meus dados
        </a>
        {admin && (
          <Link className="button secondary" href="/admin">
            Administração
          </Link>
        )}
        <form action={logout}>
          <button className="button secondary">Sair da conta</button>
        </form>
      </div>
      <div className="section-heading">
        <h2>Histórico recente</h2>
      </div>
      {sessions
        ?.filter((s) => s.finished_at)
        .slice(0, 10)
        .map((s) => (
          <Link key={s.id} href={`/resultado/${s.id}`} className="row-card">
            <span>
              {format.date(s.started_at)} ·{" "}
              {s.mode === "simulation" ? "Simulado" : "Treino"}
            </span>
            <span>
              {s.correct}/{s.answered} ↗
            </span>
          </Link>
        ))}
      <DeleteAccount />
    </>
  );
}
