import Link from "next/link";
import { Bell } from "lucide-react";
import { unreadNotifications } from "@/lib/notifications";
import { badgeCount } from "@/domain/notifications";
import { getTranslations } from "next-intl/server";
export async function NotificationBell() {
  const [count, t] = await Promise.all([
    unreadNotifications(),
    getTranslations("notifications"),
  ]);
  return (
    <Link
      className="notification-bell"
      href="/notificacoes"
      aria-label={
        count ? `${t("title")}, ${t("unread", { count })}` : t("title")
      }
    >
      <Bell size={20} />
      {!!count && <span>{badgeCount(count)}</span>}
    </Link>
  );
}
