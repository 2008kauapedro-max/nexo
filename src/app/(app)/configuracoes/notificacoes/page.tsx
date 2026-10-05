import { requireProfile } from "@/lib/supabase";
import { NotificationPreferences } from "@/components/workspace-forms";
export default async function Preferences() {
  const { db } = await requireProfile();
  const { data } = await db
    .from("notification_preferences")
    .select("*")
    .maybeSingle();
  return (
    <section className="reading-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEM RUÍDO</span>
          <h1>Suas notificações.</h1>
        </div>
      </div>
      <NotificationPreferences
        preferences={data || { study: true, achievements: true, news: false }}
      />
    </section>
  );
}
