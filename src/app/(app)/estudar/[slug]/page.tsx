import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase";
import { StartForm } from "@/components/start-form";
import { getTranslations } from "next-intl/server";
import { subjectKeys } from "@/i18n/taxonomy";
import { getRegionalFormats } from "@/i18n/server-format";
export default async function Subject({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { db } = await requireProfile();
  const [text, taxonomy, format] = await Promise.all([
    getTranslations("subject"),
    getTranslations("subjects"),
    getRegionalFormats(),
  ]);
  const { data: subject } = await db
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!subject) notFound();
  const [{ data: topics, error }, { data: mastery }] = await Promise.all([
    db.from("topics").select("*").eq("subject_id", subject.id),
    db.from("topic_mastery").select("*"),
  ]);
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{text("eyebrow")}</span>
          <h1>
            {subjectKeys[subject.name]
              ? taxonomy(subjectKeys[subject.name])
              : subject.name}
          </h1>
          <p>{text("description")}</p>
        </div>
      </div>
      <div className="toolbar">
        <StartForm subject={subject.id} />
        <StartForm subject={subject.id} mode="review" label={text("review")} />
        <StartForm subject={subject.id} target={5} label={text("quick")} />
      </div>
      <div className="section-heading">
        <h2>{text("topics")}</h2>
      </div>
      <div className="panel">
        {topics?.map((t) => {
          const m = mastery?.find((m) => m.topic_id === t.id);
          return (
            <div className="row-card" key={t.id}>
              <div>
                <h3>{t.name}</h3>
                <p>
                  {m
                    ? text("mastery", {
                        score: format.number(Math.round(m.score)),
                        count: m.attempts,
                      })
                    : text("starting")}
                </p>
                {m && (
                  <div className="progress">
                    <span style={{ width: `${m.score}%` }} />
                  </div>
                )}
              </div>
              <StartForm
                subject={subject.id}
                topic={t.id}
                label={text("practice")}
                target={5}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
