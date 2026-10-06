import "server-only";
import { cache } from "react";
import { getLocale } from "next-intl/server";
import { requireProfile } from "@/lib/supabase";
import { isLocale, fallbackLocale } from "./config";
import { regionalDate, type RegionalPreferences } from "./format";
export const getRegionalFormats = cache(async () => {
  const [{ profile }, currentLocale] = await Promise.all([
    requireProfile(),
    getLocale(),
  ]);
  const preferences: RegionalPreferences = {
    locale: isLocale(currentLocale) ? currentLocale : fallbackLocale,
    timeZone: profile.time_zone,
    dateFormat: profile.date_format as RegionalPreferences["dateFormat"],
  };
  return {
    date: (value: string | Date) => regionalDate(value, preferences),
    dateTime: (value: string | Date) => regionalDate(value, preferences, true),
    number: (value: number) =>
      new Intl.NumberFormat(preferences.locale).format(value),
    percent: (value: number) =>
      new Intl.NumberFormat(preferences.locale, {
        style: "percent",
        maximumFractionDigits: 0,
      }).format(value),
    currency: (value: number, currency: string) =>
      new Intl.NumberFormat(preferences.locale, {
        style: "currency",
        currency,
      }).format(value),
  };
});
