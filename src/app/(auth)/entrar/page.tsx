import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { getTranslations } from "next-intl/server";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const t = await getTranslations("auth");
  return (
    <section className="auth-card">
      <span className="eyebrow">{t("welcome")}</span>
      <h1>{t("loginTitle")}</h1>
      <p>{t("loginDescription")}</p>
      {erro && (
        <p role="alert" className="notice error">
          {t("expired")}
        </p>
      )}
      <AuthForm mode="login" />
      <p className="auth-switch">
        {t("noAccount")} <Link href="/cadastro">{t("startFree")}</Link>
      </p>
    </section>
  );
}
