import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Focus,
  RotateCcw,
  Check,
  MoveUpRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/language-selector";
export default function Landing() {
  const t = useTranslations("landing");
  const auth = useTranslations("auth");
  return (
    <div className="landing">
      <header className="public-header wrap">
        <Logo />
        <nav aria-label={t("publicNavigation")}>
          <LanguageSelector compact />
          <Link href="/entrar">{auth("login")}</Link>
          <Link href="/cadastro" className="button small dark">
            {t("start")} <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="live-dot" /> {t("eyebrow")}
            </span>
            <h1>
              {t("pace")}
              <br />
              {t("path")}
              <br />
              <span>{t("level")}</span>
            </h1>
            <p>{t("description")}</p>
            <Link className="button primary" href="/cadastro">
              {t("startFree")} <ArrowRight size={19} />
            </Link>
            <div className="hero-note">{t("noCard")}</div>
          </div>
          <div className="hero-art" aria-label={t("illustration")}>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-label">{t("motion")}</span>
            <div className="art-core">
              <span>n</span>
              <i />
            </div>
            <div className="floating-card card-top">
              <span className="mini-icon">
                <Focus size={20} />
              </span>
              <div>
                <b>{t("challenge")}</b>
                <small>{t("timing")}</small>
              </div>
            </div>
            <div className="floating-card card-bottom">
              <div className="mini-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div>
                <b>{t("steps")}</b>
                <small>{t("progress")}</small>
              </div>
              <MoveUpRight size={20} />
            </div>
            <span className="art-coordinate">{t("possibilities")}</span>
          </div>
        </section>
        <section className="manifesto wrap">
          <span className="eyebrow">{t("focus")}</span>
          <h2>{t("meaning")}</h2>
          <div className="feature-grid">
            <article>
              <Focus />
              <h3>{t("adaptiveTitle")}</h3>
              <p>{t("adaptiveDescription")}</p>
            </article>
            <article>
              <RotateCcw />
              <h3>{t("memoryTitle")}</h3>
              <p>{t("memoryDescription")}</p>
            </article>
            <article>
              <Sparkles />
              <h3>{t("clarityTitle")}</h3>
              <p>{t("clarityDescription")}</p>
            </article>
          </div>
        </section>
        <section className="cta wrap">
          <div>
            <span className="eyebrow">{t("ctaEyebrow")}</span>
            <h2>{t("slogan")}</h2>
            <p>
              <Check size={16} /> {t("features")}
            </p>
          </div>
          <Link href="/cadastro" className="button primary">
            {t("nextLevel")} <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="wrap public-footer">
        <Logo />
        <span>{t("footer")}</span>
        <Link href="/privacidade">{t("privacy")}</Link>
      </footer>
    </div>
  );
}
