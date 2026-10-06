import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { Logo } from "@/components/logo";
import { Navigation } from "@/components/navigation";
import { logout } from "@/app/actions/auth";
import { NotificationBell } from "@/components/notification-bell";
import { ConnectionStatus } from "@/components/connection-status";
import { Suspense } from "react";
import { Bell } from "lucide-react";
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
  const { profile } = await requireProfile();
  const t = await getTranslations("navigation");
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
          <Link href="/planos">{t("plans")}</Link>
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
