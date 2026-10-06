import { useTranslations } from "next-intl";
export default function Loading() {
  const t = useTranslations("common");
  return (
    <section
      role="status"
      aria-label={t("loadingPage")}
      aria-busy="true"
      className="form-stack"
    >
      <div className="skeleton" style={{ width: "60%", height: 36 }} />
      <div className="skeleton" style={{ width: "100%", height: 160 }} />
      <div className="skeleton" style={{ width: "100%", height: 100 }} />
      <span className="muted">{t("loading")}</span>
    </section>
  );
}
