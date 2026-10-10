import { writeFileSync } from "node:fs";
// Original development questions; no third-party exam content is reproduced.
import {content} from "./original-question-content.mjs";

const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'";
let sql =
  "-- Original NEXO seed. Safe to reapply; fingerprints prevent duplicates.\n";
content.forEach(([name, slug, topic, questions], position) => {
  sql += `insert into public.subjects(name,slug,position) values(${quote(name)},${quote(slug)},${position}) on conflict(slug) do nothing;\n`;
  sql += `insert into public.topics(subject_id,name) select id,${quote(topic)} from public.subjects where slug=${quote(slug)} on conflict(subject_id,name) do nothing;\n`;
  questions.forEach(([difficulty, statement, options, answer, explanation]) => {
    sql += `with q as (insert into public.questions(subject_id,topic_id,statement,options,difficulty,status,fingerprint) select s.id,t.id,${quote(statement)},${quote(JSON.stringify(options))}::jsonb,${difficulty},'published',md5(lower(trim(${quote(statement)}))) from public.subjects s join public.topics t on t.subject_id=s.id where s.slug=${quote(slug)} and t.name=${quote(topic)} on conflict(fingerprint) do update set updated_at=public.questions.updated_at returning id) insert into private.question_answers(question_id,answer,explanation) select id,${answer},${quote(explanation)} from q on conflict(question_id) do nothing;\n`;
  });
});
writeFileSync("supabase/seed.sql", sql);
process.stdout.write(
  `Prepared ${content.reduce((n, s) => n + s[3].length, 0)} original questions.\n`,
);
