import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import {
  detectLocale,
  isLocale,
  validTimeZone,
  locales,
} from "../../src/i18n/config";
import pt from "../../messages/pt-BR.json";
import ru from "../../messages/ru.json";
import { calendarDay, regionalDate } from "../../src/i18n/format";
describe("international preferences", () => {
  it("formats region preferences without moving calendar-only dates across time zones", () => {
    expect(
      calendarDay(new Date("2026-01-01T01:00:00Z"), "America/Sao_Paulo"),
    ).toBe("2025-12-31");
    expect(calendarDay(new Date("2026-01-01T01:00:00Z"), "Asia/Tokyo")).toBe(
      "2026-01-01",
    );
    expect(
      regionalDate("2026-01-01", {
        locale: "en-US",
        dateFormat: "dmy",
        timeZone: "Pacific/Honolulu",
      }),
    ).toBe("01/01/2026");
    expect(
      regionalDate("2026-02-03", {
        locale: "en-US",
        dateFormat: "mdy",
        timeZone: "Asia/Tokyo",
      }),
    ).toBe("02/03/2026");
    expect(
      regionalDate("2026-01-01T01:00:00Z", {
        locale: "ja",
        dateFormat: "ymd",
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe("2025/12/31");
  });
  it("detects supported browser languages by quality with a Portuguese fallback", () => {
    expect(detectLocale("es-MX, en;q=0.7")).toBe("es");
    expect(detectLocale("de;q=0.2, ja;q=0.9")).toBe("ja");
    expect(detectLocale("zh-TW")).toBe("zh-CN");
    expect(detectLocale("ar,fr;q=0")).toBe("pt-BR");
    expect(detectLocale(null)).toBe("pt-BR");
    expect(detectLocale("en;q=invalid,ko")).toBe("ko");
    for (const locale of locales) expect(detectLocale(locale)).toBe(locale);
    expect(isLocale("../../secret")).toBe(false);
  });
  it("uses ICU plurals including Russian one, few and many", () => {
    const t = createTranslator({ locale: "pt-BR", messages: pt });
    expect(t("notifications.unread", { count: 1 })).toBe("1 não lida");
    expect(t("notifications.unread", { count: 2 })).toBe("2 não lidas");
    const r = createTranslator({ locale: "ru", messages: ru });
    expect(r("notifications.unread", { count: 1 })).toBe("1 непрочитанное");
    expect(r("notifications.unread", { count: 2 })).toBe("2 непрочитанных");
    expect(r("notifications.unread", { count: 5 })).toBe("5 непрочитанных");
  });
  it("accepts real time zones without treating locale as a time zone", () => {
    expect(validTimeZone("Asia/Tokyo")).toBe(true);
    expect(validTimeZone("America/Sao_Paulo")).toBe(true);
    expect(validTimeZone("pt-BR")).toBe(false);
    expect(validTimeZone("Invalid/Zone")).toBe(false);
  });
});
