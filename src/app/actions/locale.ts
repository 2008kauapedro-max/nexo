"use server";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { currentIdentity } from "@/lib/supabase";
import { isLocale, validTimeZone, type Locale } from "@/i18n/config";
import type { ActionState } from "./auth";
async function writeLocaleCookie(locale: Locale) {
  (await cookies()).set("nexo-locale", locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 31536000,
  });
}
export async function changeLocale(locale: string): Promise<ActionState> {
  const t = await getTranslations("common");
  if (!isLocale(locale)) return { error: t("invalid") };
  const { db, user } = await currentIdentity();
  if (user) {
    const { error } = await db
      .from("profiles")
      .update({ ui_locale: locale })
      .eq("id", user.id);
    if (error) return { error: t("saveError") };
  }
  await writeLocaleCookie(locale);
  return {};
}
export async function saveRegion(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const t = await getTranslations("common");
  const locale = form.get("ui_locale");
  const region = String(form.get("region") || "").toUpperCase();
  const timeZone = form.get("time_zone");
  const dateFormat = String(form.get("date_format"));
  if (
    !isLocale(locale) ||
    !/^[A-Z]{2}$/.test(region) ||
    !validTimeZone(timeZone) ||
    !["auto", "dmy", "mdy", "ymd"].includes(dateFormat)
  )
    return { error: t("invalid") };
  const { db, user } = await currentIdentity();
  if (!user) return { error: t("saveError") };
  const { error } = await db
    .from("profiles")
    .update({
      ui_locale: locale,
      region,
      time_zone: timeZone,
      date_format: dateFormat,
    })
    .eq("id", user.id);
  if (error) return { error: t("saveError") };
  await writeLocaleCookie(locale);
  return { success: "saved" };
}
