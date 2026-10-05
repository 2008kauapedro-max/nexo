import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase";

// React cache is scoped to this server render, never shared across accounts.
export const syncNotifications = cache(async () => {
  const { db } = await requireUser();
  return db.rpc("sync_notifications");
});
export const unreadNotifications = cache(async () => {
  const { db } = await requireUser();
  await syncNotifications();
  const { count, error } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .is("dismissed_at", null);
  return error ? null : count;
});
