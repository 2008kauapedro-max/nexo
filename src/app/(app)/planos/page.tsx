import { requireProfile } from "@/lib/supabase";
import { planSchema, featureLabels } from "@/domain/plans";
import { getRegionalFormats } from "@/i18n/server-format";
import { getTranslations } from "next-intl/server";
export default async function Plans() {
  const { db } = await requireProfile();
  const format = await getRegionalFormats();
  const t = await getTranslations("plans");
  const { data, error } = await db
    .from("plans")
    .select("*")
    .order("daily_questions");
  if (error) throw error;
  const plans = planSchema.array().parse(data);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </div>
      <div className="subject-grid">
        {plans.map((p) => (
          <article className="panel" key={p.id}>
            <span className="pill">
              {p.id === "pro"
                ? t("recommended")
                : p.id === "free"
                  ? t("available")
                  : t("preparing")}
            </span>
            <h2>{p.name}</h2>
            <p>{t(p.id + "Description")}</p>
            <strong>
              {format.currency(p.monthly_price_cents / 100, p.currency)} /{" "}
              {t("month")}
            </strong>
            <ul>
              {Object.entries(featureLabels)
                .filter(([key]) => p.features[key])
                .map(([key]) => (
                  <li key={key}>{t("features." + key)}</li>
                ))}
            </ul>
            <p>{t("practice", { count: p.daily_questions })}</p>
            <p>
              {t("simulation", {
                count: p.weekly_simulations,
                max: p.max_simulation,
              })}
            </p>
            <p>{t("ai", { count: p.daily_ai })}</p>
            <p className="fine-print">
              {p.id === "free" ? t("noCharge") : t("reference")}
            </p>
          </article>
        ))}
      </div>
      <p className="notice">{t("notice")}</p>
    </>
  );
}
