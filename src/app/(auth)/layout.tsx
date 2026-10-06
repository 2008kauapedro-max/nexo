import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslations } from "next-intl";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("navigation");
  return (
    <div className="auth-shell">
      <header className="wrap public-header">
        <Logo />
        <LanguageSelector compact />
      </header>
      <main id="main" className="auth-main">
        {children}
      </main>
      <footer className="auth-footer">{t("motto")}</footer>
    </div>
  );
}
