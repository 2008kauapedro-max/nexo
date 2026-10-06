import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
export default async function Update() {
  await requireUser();
  const t = await getTranslations("auth");
  return (
    <section className="auth-card">
      <h1>{t("updateTitle")}</h1>
      <p>{t("updateDescription")}</p>
      <AuthForm mode="update" />
    </section>
  );
}
