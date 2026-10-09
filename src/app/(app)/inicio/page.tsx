import Link from "next/link";
import { Flame, Target, Zap, ArrowUpRight } from "lucide-react";
import { requireProfile } from "@/lib/supabase";
import { levelFromXp } from "@/domain/learning";
import { StartForm } from "@/components/start-form";
import { getTranslations } from "next-intl/server";
import { getRegionalFormats } from "@/i18n/server-format";
export default async function Home() {
  const { db, profile, user } = await requireProfile();
  const [t, study, format] = await Promise.all([
    getTranslations("home"),
    getTranslations("study"),
    getRegionalFormats(),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const [{ data: usage, error }, { data: sessions }] = await Promise.all([
    db
      .from("usage_counters")
      .select("questions")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle(),
    db
      .from("learning_sessions")
      .select("id")
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
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>
            {t("greeting", { name: profile.name.split(" ")[0] })}
            <span className="muted">.</span>
          </h1>
          <p>{t("description")}</p>
        </div>
        <span className="pill">
          {t("level", { level: format.number(levelFromXp(profile.xp)) })}
        </span>
      </div>
      <div className="stat-row">
        <div className="stat">
          <span>
            <Flame size={14} /> {t("streak")}
          </span>
          <strong>{t("days", { count: profile.streak })}</strong>
        </div>
        <div className="stat">
          <span>
            <Zap size={14} /> {t("knowledge")}
          </span>
          <strong>
            {format.number(profile.xp)}{" "}
            <small style={{ fontSize: 12, letterSpacing: 0 }}>XP</small>
          </strong>
        </div>
        <div className="stat">
          <span>
            <Target size={14} /> {t("dailyGoal")}
          </span>
          <strong>
            {format.number(usage?.questions || 0)}
            <small style={{ fontSize: 14, letterSpacing: 0 }}>
              {" "}
              / {format.number(profile.daily_goal)}
            </small>
          </strong>
        </div>
      </div>
      <section className="study-banner">
        <span className="eyebrow">
          {t(sessions?.[0] ? "saved" : "shortSession")}
        </span>
        <h2>{t("challenge")}</h2>
        <p>{t("challengeDescription")}</p>
        {sessions?.[0] ? (
          <Link
            prefetch={false}
            className="button primary"
            href={`/sessao/${sessions[0].id}`}
          >
            {t("resume")} <ArrowUpRight size={18} />
          </Link>
        ) : (
          <StartForm />
        )}
      </section>
      <nav className="today-links" aria-label={t("otherPaths")}>
        <Link href="/aprender" prefetch={false}>
          {study("learn")} <span>{t("concepts")}</span>
        </Link>
        <Link href="/caderno" prefetch={false}>
          {study("review")} <span>{t("connect")}</span>
        </Link>
        <Link href="/estudar">
          {study("explore")} <span>{t("chooseSubject")}</span>
        </Link>
      </nav>
      <nav className="workspace-links" aria-label={t("organize")}>
        <Link href="/plano" prefetch={false}>
          {t("week")}
        </Link>
        <Link href="/missoes" prefetch={false}>
          {t("missions")}
        </Link>
      </nav>
    </>
  );
}
