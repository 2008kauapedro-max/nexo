import { readFileSync, writeFileSync } from "node:fs";
const core = readFileSync(
  "supabase/migrations/20261004144210_nexo_core.sql",
  "utf8",
);
const services = readFileSync(
  "supabase/migrations/20261004145738_nexo_services.sql",
  "utf8",
);
const extract = (text, name) =>
  text
    .match(
      new RegExp(`create function public\\.${name}\\([\\s\\S]*?end \\$\\$;`),
    )[0]
    .replace("create function", "create or replace function");
let sql = `-- Revision from adversarial review: scoped retries, answer secrecy, bounded sessions.\nalter table public.learning_sessions add column review_source uuid references public.learning_sessions(id) on delete set null;\ncreate index sessions_review_source_idx on public.learning_sessions(review_source);\n`;
sql +=
  extract(core, "next_question").replace(
    "and (s.mode<>'review' or exists(select 1 from public.question_attempts a where a.user_id=uid and a.question_id=qs.id and not a.correct))",
    "and (s.mode<>'review' or exists(select 1 from public.question_attempts a where a.user_id=uid and a.question_id=qs.id and not a.correct and (s.review_source is null or a.session_id=s.review_source)))",
  ) + "\n";
sql +=
  extract(services, "ai_context").replace(
    "'answer',a.answer,'explanation',a.explanation",
    "'answer',case when exists(select 1 from public.question_attempts where user_id=uid and session_id=p_session and question_id=p_question) then a.answer end,'explanation',case when exists(select 1 from public.question_attempts where user_id=uid and session_id=p_session and question_id=p_question) then a.explanation end",
  ) + "\n";
sql += `create function public.review_session(p_source uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare source public.learning_sessions;sid uuid;begin
 select * into source from public.learning_sessions where id=p_source and user_id=auth.uid() and finished_at is not null;
 if not found then raise exception 'NOT_FOUND';end if;
 sid:=public.start_session('review',source.subject_id,source.topic_id,least(20,greatest(5,source.answered-source.correct)),30);
 update public.learning_sessions set review_source=p_source where id=sid;return sid;
end $$;
revoke all on function public.review_session(uuid) from public,anon;
grant execute on function public.review_session(uuid) to authenticated;
`;
// Deny-by-default policies document the intentional private-table access model.
for (const table of [
  "admins",
  "question_answers",
  "audit_logs",
  "billing_events",
])
  sql += `create policy deny_client_access on private.${table} as restrictive for all to anon,authenticated using(false) with check(false);\n`;
writeFileSync("supabase/migrations/20261004150542_nexo_hardening.sql", sql);
