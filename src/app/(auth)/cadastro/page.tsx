import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { useTranslations } from "next-intl";
export default function Signup() {
  const t = useTranslations("auth");
  return (
    <section className="auth-card">
      <span className="eyebrow">{t("signupEyebrow")}</span>
      <h1>{t("signupTitle")}</h1>
      <p>{t("signupDescription")}</p>
      <AuthForm mode="signup" />
      <p className="fine-print">
        {t.rich("privacyConsent", {
          privacy: (chunks) => <Link href="/privacidade">{chunks}</Link>,
        })}
      </p>
      <p className="auth-switch">
        {t("alreadyMember")} <Link href="/entrar">{t("login")}</Link>
      </p>
    </section>
  );
}
