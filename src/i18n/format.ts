import type { Locale } from "./config";
export interface RegionalPreferences {
  locale: Locale;
  timeZone: string;
  dateFormat: "auto" | "dmy" | "mdy" | "ymd";
}
export function calendarDay(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "iso8601",
    numberingSystem: "latn",
  }).formatToParts(value);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
}
export function regionalDate(
  value: string | Date,
  preferences: RegionalPreferences,
  withTime = false,
): string {
  const dateOnly =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(value + "T12:00:00Z") : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  const timeZone = dateOnly ? "UTC" : preferences.timeZone;
  if (preferences.dateFormat === "auto")
    return new Intl.DateTimeFormat(preferences.locale, {
      timeZone,
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" as const } : {}),
    }).format(date);
  const parts = new Intl.DateTimeFormat(preferences.locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "gregory",
  }).formatToParts(date);
  const fields = { d: "day", m: "month", y: "year" };
  const result = preferences.dateFormat
    .split("")
    .map(
      (k) =>
        parts.find((p) => p.type === fields[k as keyof typeof fields])!.value,
    )
    .join("/");
  return withTime
    ? result +
        " " +
        new Intl.DateTimeFormat(preferences.locale, {
          timeZone,
          timeStyle: "short",
        }).format(date)
    : result;
}
