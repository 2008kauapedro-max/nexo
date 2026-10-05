import Link from "next/link";
import { Bell } from "lucide-react";
import { unreadNotifications } from "@/lib/notifications";
import { badgeCount } from "@/domain/notifications";
export async function NotificationBell() {
  const count = await unreadNotifications();
  return (
    <Link
      className="notification-bell"
      href="/notificacoes"
      aria-label={`Notificações${count ? `, ${count} não lidas` : ""}`}
    >
      <Bell size={20} />
      {!!count && <span>{badgeCount(count)}</span>}
    </Link>
  );
}
