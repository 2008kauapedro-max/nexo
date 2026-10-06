import { useTranslations } from "next-intl";
export default function Loading() {
  const t = useTranslations("common");
  return (
    <main id="main" className="loading-screen" role="status">
      <div className="skeleton" />
      <p>{t("loading")}</p>
    </main>
  );
}
