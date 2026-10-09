import { describe, it, expect } from "vitest";
import {
  updateMastery,
  nextReview,
  earnedXp,
  levelFromXp,
  nextStreak,
  selectQuestion,
} from "../../src/domain/learning";
import { effectivePlan } from "../../src/domain/billing";
import { safeRedirect, questionSchema } from "../../src/domain/validation";
describe("adaptive engine", () => {
  it("does not let one answer destroy or inflate mastery", () => {
    for (let score = 0; score <= 100; score++)
      for (const correct of [true, false]) {
        const result = updateMastery(
          { score, attempts: 5, streak: 0 },
          { correct, difficulty: 5, seconds: 30, hint: false, attempts: 1 },
        );
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(Math.abs(result.score - score)).toBeLessThanOrEqual(7);
      }
  });
  it("reduces evidence from hints, retries and instant answers", () => {
    const previous = { score: 50, attempts: 0, streak: 0 };
    const answer = {
      correct: true,
      difficulty: 5,
      seconds: 30,
      hint: false,
      attempts: 1,
    };
    const full = updateMastery(previous, answer).score;
    expect(
      updateMastery(previous, { ...answer, hint: true }).score,
    ).toBeLessThan(full);
    expect(
      updateMastery(previous, { ...answer, seconds: 1 }).score,
    ).toBeLessThan(full);
    expect(
      updateMastery(previous, { ...answer, attempts: 2 }).score,
    ).toBeLessThan(full);
  });
  it("does not repeat a recent question when a fresh question exists", () => {
    expect(
      selectQuestion(
        [
          { id: "a", difficulty: 5, mastery: 50, due: true },
          { id: "b", difficulty: 6, mastery: 50, due: false },
        ],
        ["a"],
        () => 0.7,
      )?.id,
    ).toBe("b");
    expect(selectQuestion([], [])).toBeUndefined();
  });
  it("schedules errors for tomorrow and caps long intervals", () => {
    expect(nextReview(false, 30)).toBe(1);
    expect(nextReview(true, 100)).toBe(180);
    expect(nextReview(true, 10, true)).toBeLessThan(nextReview(true, 10));
  });
  it("computes levels and XP predictably", () => {
    expect(earnedXp(false, 8, false)).toBe(3);
    expect(earnedXp(true, 5, true)).toBe(10);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(400)).toBe(3);
  });
  it("counts streak once per server calendar day", () => {
    expect(nextStreak("2026-10-04", "2026-10-04", 4)).toBe(4);
    expect(nextStreak("2026-10-03", "2026-10-04", 4)).toBe(5);
    expect(nextStreak("2026-10-01", "2026-10-04", 4)).toBe(1);
  });
});
describe("trust boundaries", () => {
  it("rejects external and protocol-relative redirects", () => {
    for (const path of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "/%2f%2fevil.test",
      "/auth/callback",
      "/admin",
      "/entrar",
      "/redefinir-senha?next=https://evil.test",
      null,
    ])
      expect(safeRedirect(path)).toBe("/inicio");
    expect(safeRedirect("/redefinir-senha")).toBe("/redefinir-senha");
  });
  it("expires plans and denies past-due subscriptions", () => {
    expect(
      effectivePlan({ status: "active", plan: "pro", periodEnd: "2020-01-01" }),
    ).toBe("free");
    expect(
      effectivePlan({
        status: "past_due",
        plan: "pro",
        periodEnd: "2099-01-01",
      }),
    ).toBe("free");
    expect(
      effectivePlan({ status: "active", plan: "pro", periodEnd: "2099-01-01" }),
    ).toBe("pro");
  });
  it("rejects malformed imported questions", () => {
    expect(
      questionSchema.safeParse({ statement: "x", answer: 7 }).success,
    ).toBe(false);
  });
});
