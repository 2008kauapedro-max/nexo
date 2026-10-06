"use client";
import { useActionState } from "react";
import { savePreferences } from "@/app/actions/study";
import { goals } from "@/domain/validation";
import { LanguageSelector } from "./language-selector";
import { useTranslations } from "next-intl";
import { goalKeys, subjectKeys } from "@/i18n/taxonomy";
export function OnboardingForm({
  subjects,
  name = "",
  initial,
}: {
  subjects: { id: string; name: string }[];
  name?: string;
  initial?: {
    goal: string;
    level: string;
    daily_goal: number;
    subjects: string[];
  };
}) {
  const t = useTranslations("onboarding");
  const g = useTranslations("goals");
  const subjectLabel = useTranslations("subjects");
  const [state, action, pending] = useActionState(savePreferences, {});
  return (
    <form action={action} className="form-stack">
      <LanguageSelector />
      <label>
        {t("name")}
        <input
          name="name"
          autoComplete="given-name"
          required
          minLength={2}
          maxLength={60}
          defaultValue={name}
          placeholder={t("namePlaceholder")}
        />
      </label>
      <label>
        {t("title")}
        <select name="goal" defaultValue={initial?.goal || "ENEM"}>
          {goals.map((goal) => (
            <option key={goal} value={goal}>
              {g(goalKeys[goal])}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>{t("subjects")}</legend>
        <div className="choice-grid">
          {subjects.map((s) => (
            <label
              key={s.id}
              className="choice"
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <input
                style={{ width: 18, minHeight: 18 }}
                type="checkbox"
                name="subjects"
                value={s.id}
                defaultChecked={initial?.subjects.includes(s.id)}
              />
              {subjectKeys[s.name] ? subjectLabel(subjectKeys[s.name]) : s.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        {t("level")}
        <select name="level" defaultValue={initial?.level || "unknown"}>
          {["unknown", "initial", "intermediate", "advanced"].map((level) => (
            <option key={level} value={level}>
              {t(level)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("dailyGoal")}
        <select name="dailyGoal" defaultValue={initial?.daily_goal || 10}>
          {[5, 10, 20, 30].map((n) => (
            <option key={n} value={n}>
              {t(`goal${n}`)}
            </option>
          ))}
        </select>
      </label>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="button primary">
        {t(pending ? "saving" : "start")}
      </button>
    </form>
  );
}
