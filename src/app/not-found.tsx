import Link from "next/link";
import { useTranslations } from "next-intl";
export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <main id="main" className="empty-state">
      <span className="eyebrow">404</span>
      <h1>{t("notFound")}</h1>
      <Link className="button primary" href="/inicio">
        {t("backHome")}
      </Link>
    </main>
  );
}
