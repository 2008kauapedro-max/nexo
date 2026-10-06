import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { detectLocale, isLocale } from "./config";
import { currentIdentity, currentProfile } from "@/lib/supabase";
export default getRequestConfig(async () => {
  const jar = await cookies();
  const visitor = jar.get("nexo-locale")?.value;
  let locale = isLocale(visitor)
    ? visitor
    : detectLocale((await headers()).get("accept-language"));
  let timeZone = "America/Sao_Paulo";
  if (jar.getAll().some((c) => c.name.startsWith("sb-"))) {
    const { user } = await currentIdentity();
    if (user) {
      const { profile } = await currentProfile();
      if (isLocale(profile?.ui_locale)) locale = profile.ui_locale;
      if (profile?.time_zone) timeZone = profile.time_zone;
    }
  }
  const base = (await import("../../messages/pt-BR.json")).default;
  const localized = (await import(`../../messages/${locale}.json`)).default;
  return { locale, timeZone, messages: merge(base, localized) };
});
function merge(
  base: Record<string, unknown>,
  localized: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      typeof value === "object" && value !== null
        ? merge(
            value as Record<string, unknown>,
            (localized[key] || {}) as Record<string, unknown>,
          )
        : (localized[key] ?? value),
    ]),
  );
}
