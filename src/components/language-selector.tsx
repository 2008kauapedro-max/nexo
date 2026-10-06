"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { changeLocale } from "@/app/actions/locale";
import { locales, localeNames } from "@/i18n/config";
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("settings.language");
  const common = useTranslations("common");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div
      className={compact ? "language-selector compact" : "language-selector"}
    >
      <label>
        <span className={compact ? "sr-only" : ""}>{t("interface")}</span>
        <select
          value={locale}
          disabled={pending}
          aria-busy={pending}
          onChange={(e) => {
            const next = e.target.value;
            start(async () => {
              setError("");
              try {
                const result = await changeLocale(next);
                setError(result.error || "");
              } catch {
                setError(common("saveError"));
              }
            });
          }}
        >
          {locales.map((value) => (
            <option key={value} value={value} lang={value}>
              {localeNames[value]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
