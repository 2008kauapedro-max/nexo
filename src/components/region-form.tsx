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
    <form action={action} className="form-stack panel">
      <label>
        {t("interface")}
        <select name="ui_locale" defaultValue={locale}>
          {locales.map((l) => (
            <option key={l} value={l} lang={l}>
              {localeNames[l]}
            </option>
          ))}
        </select>
      </label>
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
      <p>{t("contentNote")}</p>
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
      <button className="button primary" disabled={pending}>
        {common(pending ? "saving" : "save")}
      </button>
    </form>
  );
}
