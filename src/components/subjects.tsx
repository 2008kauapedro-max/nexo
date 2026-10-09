import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { subjectKeys } from "@/i18n/taxonomy";
export function Subjects({
  subjects,
}: {
  subjects: { id: string; slug: string; name: string }[];
}) {
  const t = useTranslations("study");
  const subjectLabel = useTranslations("subjects");
  return (
    <div className="subject-grid">
      {subjects.map((s) => (
        <Link
          prefetch={false}
          className="subject-card"
          href={`/estudar/${s.slug}`}
          key={s.id}
        >
          <span className="subject-icon">
            <BookOpen size={18} />
          </span>
          <h3>
            {subjectKeys[s.name] ? subjectLabel(subjectKeys[s.name]) : s.name}
          </h3>
          <p>
            {t("exploreTopics")}{" "}
            <ArrowUpRight size={12} style={{ display: "inline" }} />
          </p>
        </Link>
      ))}
    </div>
  );
}
