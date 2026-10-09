import { requireProfile } from "@/lib/supabase";
import { Subjects } from "@/components/subjects";
import { StartForm } from "@/components/start-form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
export default async function Study() {
  const { db } = await requireProfile();
  const t = await getTranslations("study");
  const { data, error } = await db
    .from("subjects")
    .select("id,name,slug")
    .order("position");
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </div>
      <nav className="tabs" aria-label={t("modes")}>
        <Link href="/aprender" prefetch={false}>
          {t("learn")}
        </Link>
        <Link className="active" href="/estudar">
          {t("practice")}
        </Link>
        <Link href="/caderno" prefetch={false}>
          {t("review")}
        </Link>
        <Link href="/sos" prefetch={false}>
          {t("sos")}
        </Link>
      </nav>
      <div className="panel">
        <h3>{t("personalPractice")}</h3>
        <p style={{ margin: "12px 0 20px" }}>{t("tenQuestions")}</p>
        <StartForm />
      </div>
      <div className="section-heading">
        <h2>{t("subjects")}</h2>
      </div>
      <Subjects subjects={data || []} />
      <div className="section-heading">
        <h2>{t("workspace")}</h2>
      </div>
      <div className="workspace-links">
        {[
          ["/plano", "plan"],
          ["/missoes", "missions"],
          ["/desafios", "challenges"],
          ["/mapa", "map"],
          ["/flashcards", "flashcards"],
          ["/anotacoes", "notes"],
          ["/buscar", "search"],
        ].map(([href, key]) => (
          <Link key={href} href={href} prefetch={false}>
            {t(key)} →
          </Link>
        ))}
      </div>
    </>
  );
}
