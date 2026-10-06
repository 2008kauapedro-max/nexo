"use client";
import { useTranslations } from "next-intl";
export default function ErrorPage({
  reset,
  error,
}: {
  reset: () => void;
  error: Error & { digest?: string };
}) {
  const t = useTranslations("errors");
  return (
    <main id="main" className="empty-state">
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      {error.digest && <p>{t("reference", { id: error.digest })}</p>}
      <button className="button primary" onClick={reset}>
        {t("retry")}
      </button>
    </main>
  );
}
