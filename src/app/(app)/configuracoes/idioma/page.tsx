import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/supabase";
import { RegionForm } from "@/components/region-form";
export default async function LanguageSettings() {
  const [{ profile }, t] = await Promise.all([
    requireProfile(),
    getTranslations("settings.language"),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </div>
      <RegionForm initial={profile} />
    </>
  );
}
