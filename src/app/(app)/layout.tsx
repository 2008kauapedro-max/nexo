import Link from "next/link";
import { getCurrentPlanAccess } from "@/lib/plan-access";
import { Logo } from "@/components/logo";
import { Navigation } from "@/components/navigation";
import { logout } from "@/app/actions/auth";
import { NotificationBell } from "@/components/notification-bell";
import { ConnectionStatus } from "@/components/connection-status";
import { Suspense } from "react";
import { Bell, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LanguageSelector } from "@/components/language-selector";

function BellPlaceholder() {
  const t = useTranslations("notifications");
  return (
    <Link
      href="/notificacoes"
      className="notification-bell"
      aria-label={t("title")}
    >
      <Bell size={20} />
    </Link>
  );
}

export const metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, plan } = await getCurrentPlanAccess();
  const t = await getTranslations("navigation");
  const planName = plan.name;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo />
          <Suspense fallback={<BellPlaceholder />}>
            <NotificationBell />
          </Suspense>
        </div>

        <Navigation />

        <div className="sidebar-footer">
          <p>{t("motto")}</p>
          <LanguageSelector compact />

          <Link href="/planos" className="sidebar-plan-card">
            <span className="sidebar-plan-icon">
              <CreditCard size={16} />
            </span>
            <span>
              <small>Seu plano</small>
              <strong>{planName}</strong>
            </span>
            <b>Ã¢â€ â€™</b>
          </Link>

          <form action={logout}>
            <button
              className="button small secondary"
              style={{ marginTop: 16 }}
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>

      <header className="mobile-header">
        <Logo />
        <div className="header-actions">
          <LanguageSelector compact />
          <Suspense fallback={<BellPlaceholder />}>
            <NotificationBell />
          </Suspense>
          <Link href="/perfil" className="avatar" aria-label={t("openProfile")}>
            {profile.name.charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>

      <main id="main" className="app-main page-enter">
        <ConnectionStatus />
        {children}
      </main>

      <Navigation mobile />
    </div>
  );
}
