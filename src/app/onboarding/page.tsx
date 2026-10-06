import { requireUser } from "@/lib/supabase";
import { OnboardingForm } from "@/components/onboarding-form";
import { Logo } from "@/components/logo";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
export default async function Onboarding() {
  const { db, user } = await requireUser();
  const t = await getTranslations("onboarding");
  const [{ data: subjects, error }, { data: profile }] = await Promise.all([
    db.from("subjects").select("*").order("position"),
    db.from("profiles").select("*").eq("id", user.id).single(),
  ]);
  if (profile?.onboarding_complete) redirect("/inicio");
  if (error) throw error;
  return (
    <>
      <header className="public-header wrap">
        <Logo />
      </header>
      <main id="main" className="wrap">
        <section className="onboarding">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
          <OnboardingForm subjects={subjects || []} />
        </section>
      </main>
    </>
  );
}
