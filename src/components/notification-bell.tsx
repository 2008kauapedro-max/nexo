import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/supabase";
import { badgeCount } from "@/domain/notifications";
export async function NotificationBell() {
  const { db } = await requireUser();
  const { count } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .is("dismissed_at", null);
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
