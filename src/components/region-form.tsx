"use client";
import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { saveRegion } from "@/app/actions/locale";
import { locales, localeNames } from "@/i18n/config";

export function RegionForm({
  initial,
}: {
  initial: { region: string; date_format: string; time_zone: string };
}) {
  const locale = useLocale();
  const t = useTranslations("settings.language");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState(saveRegion, {});
  const [zone, setZone] = useState(initial.time_zone);

  const countries = [
    "BR",
    "US",
    "GB",
    "ES",
    "FR",
    "DE",
    "IT",
    "JP",
    "KR",
    "CN",
    "RU",
    "PT",
    "AR",
    "MX",
    "CA",
    "AU",
    "IN",
  ];
  if (!countries.includes(initial.region)) countries.push(initial.region);
  const names = new Intl.DisplayNames([locale], { type: "region" });

  return (
    <form action={action} className="language-settings">
      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div>
            <span className="eyebrow">IDIOMA DO NEXO</span>
            <h2>{t("interface")}</h2>
          </div>
          <span className="pill">
            {localeNames[locale as keyof typeof localeNames]}
          </span>
        </div>

        <div className="language-grid">
          {locales.map((value) => (
            <label className="language-option" key={value}>
              <input
                type="radio"
                name="ui_locale"
                value={value}
                defaultChecked={value === locale}
              />
              <span>{localeNames[value]}</span>
              <small>{value}</small>
            </label>
          ))}
        </div>
      </section>

      <details className="settings-panel advanced-settings">
        <summary>
          <span>
            <strong>Região e formatos</strong>
            <small>Fuso horário, datas e localização regional</small>
          </span>
          <span>+</span>
        </summary>

        <div className="advanced-settings-body">
          <label>
            {t("region")}
            <select name="region" defaultValue={initial.region}>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {names.of(c)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("dateFormat")}
            <select name="date_format" defaultValue={initial.date_format}>
              <option value="auto">{t("automatic")}</option>
              {["dmy", "mdy", "ymd"].map((f) => (
                <option key={f} value={f}>
                  {t(f)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("timeZone")}
            <input
              name="time_zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              maxLength={100}
              required
              autoComplete="off"
            />
          </label>

          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
            }
          >
            {t("detectZone")}
          </button>
        </div>
      </details>

      <p className="settings-note">{t("contentNote")}</p>

      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice success" role="status">
          {common("saved")}
        </p>
      )}

      <button className="button primary language-save" disabled={pending}>
        {common(pending ? "saving" : "save")}
      </button>
    </form>
  );
}
