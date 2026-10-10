import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createTranslator } from "next-intl";
import { locales } from "../../src/i18n/config";
it("contextual help and plans have complete, renderable translations in every supported locale", () => {
  const base = JSON.parse(readFileSync("messages/pt-BR.json", "utf8"));
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(`messages/${locale}.json`, "utf8"),
    );
    for (const group of ["contextual", "plans"])
      expect(Object.keys(messages[group]).sort()).toEqual(
        Object.keys(base[group]).sort(),
      );
    expect(Object.keys(messages.plans.features).sort()).toEqual(
      Object.keys(base.plans.features).sort(),
    );
    const errors: unknown[] = [];
    const t = createTranslator({
      locale,
      messages,
      onError: (error) => errors.push(error),
    });
    for (const key of Object.keys(messages.contextual))
      expect(t(`contextual.${key}`).length).toBeGreaterThan(1);
    for (const key of ["practice", "simulation", "ai"])
      expect(t(`plans.${key}`, { count: 5, max: 180 })).toContain("5");
    expect(errors).toEqual([]);
    expect(messages.navigation.ai).toBeUndefined();
  }
});
