import { AuthForm } from "@/components/auth-form";
import { useTranslations } from "next-intl";
export default function Reset() {
  const t = useTranslations("auth");
  return (
    <section className="auth-card">
      <span className="eyebrow">{t("resetEyebrow")}</span>
      <h1>{t("resetTitle")}</h1>
      <p>{t("resetDescription")}</p>
      <AuthForm mode="reset" />
    </section>
  );
}
