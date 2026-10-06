import { requireUser } from "@/lib/supabase";
export async function GET() {
  const { db, user } = await requireUser();
  const tables = [
    "profiles",
    "user_subjects",
    "learning_sessions",
    "question_attempts",
    "topic_mastery",
    "review_queue",
    "usage_counters",
    "user_achievements",
    "ai_threads",
    "ai_messages",
    "ai_usage",
    "subscriptions",
    "notes",
    "flashcards",
    "notification_preferences",
    "notifications",
    "error_annotations",
    "question_reports",
    "activity_attempts",
    "study_plan_items",
    "learning_reflections",
  ] as const;
  const result: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    email: user.email,
  };
  const ordering: Record<string, string> = {
    profiles: "id",
    user_subjects: "subject_id",
    topic_mastery: "topic_id",
    review_queue: "question_id",
    usage_counters: "day",
    user_achievements: "achievement_id",
    subscriptions: "user_id",
    notification_preferences: "user_id",
    error_annotations: "question_id",
    activity_attempts: "activity_id",
    learning_reflections: "lesson_id",
    study_plan_items: "day",
  };
  async function exportTable(table: (typeof tables)[number]) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 500) {
      const query =
        table === "profiles"
          ? db.from("profiles").select("*").eq("id", user.id)
          : db.from(table).select("*").eq("user_id", user.id);
      const { data, error } = await query
        .order(ordering[table] || "id")
        .range(offset, offset + 499);
      if (error) throw new Error("EXPORT_QUERY_FAILED");
      rows.push(...data);
      if (data.length < 500) break;
    }
    result[table] = rows;
  }
  try {
    // Bound concurrency to four requests. Each table is paginated sequentially.
    for (let offset = 0; offset < tables.length; offset += 4) {
      await Promise.all(tables.slice(offset, offset + 4).map(exportTable));
    }
  } catch {
    return Response.json(
      { error: "Não foi possível exportar seus dados." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="meus-dados-nexo.json"',
      "Cache-Control": "no-store",
    },
  });
}
