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
  for (const table of tables) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from(table)
        .select("*")
        .range(offset, offset + 499);
      if (error)
        return Response.json(
          { error: "Não foi possível exportar seus dados." },
          { status: 500 },
        );
      rows.push(...data);
      if (data.length < 500) break;
    }
    result[table] = rows;
  }
  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="meus-dados-nexo.json"',
      "Cache-Control": "no-store",
    },
  });
}
