export const locales = [
  "pt-BR",
  "en-US",
  "es",
  "fr",
  "de",
  "it",
  "ja",
  "ko",
  "zh-CN",
  "ru",
] as const;
export type Locale = (typeof locales)[number];
export const fallbackLocale: Locale = "pt-BR";
export const localeNames: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  "en-US": "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  "zh-CN": "简体中文",
  ru: "Русский",
};
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}
export function detectLocale(header: string | null): Locale {
  const languages = (header || "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((p) => p.trim().startsWith("q="));
      const q = quality ? Number(quality.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), q, index };
    })
    .filter((l) => Number.isFinite(l.q) && l.q > 0 && l.q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of languages) {
    const exact = locales.find((l) => l.toLowerCase() === tag);
    if (exact) return exact;
    const base = locales.find((l) => l.split("-")[0] === tag.split("-")[0]);
    if (base) return base;
  }
  return fallbackLocale;
}
export function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
