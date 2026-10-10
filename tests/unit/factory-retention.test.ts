import { it, expect } from "vitest";
import {
  generateLinearQuestions,
  generateQuantitativeQuestions,
} from "../../src/domain/question-factory";
import { retentionEstimate } from "../../src/domain/retention";
it("generates reproducible drafts with one mathematically correct alternative", () => {
  const id = "10000000-0000-4000-8000-000000000001";
  for (let seed = 1; seed <= 100; seed++) {
    const batch = generateLinearQuestions(id, id, seed);
    expect(batch).toEqual(generateLinearQuestions(id, id, seed));
    for (const q of batch) {
      const [a, b, c] = q.statement.match(/\d+/g)!.map(Number);
      expect(q.status).toBe("draft");
      expect(q.options.filter((v) => a * Number(v) + b === c)).toHaveLength(1);
      expect(a * Number(q.options[q.answer]) + b).toBe(c);
    }
  }
  expect(() => generateLinearQuestions(id, id, -1)).toThrow();
});
it("review estimate decays gradually without changing measured mastery", () => {
  const date = "2026-10-01T00:00:00Z";
  expect(retentionEstimate(80, date, new Date(date), 5)).toBe(80);
  expect(
    retentionEstimate(80, date, new Date("2026-10-02"), 5),
  ).toBeGreaterThan(75);
  expect(retentionEstimate(80, date, new Date("2026-11-01"), 5)).toBeLessThan(
    80,
  );
  expect(retentionEstimate(80, date, new Date("2026-09-01"), 5)).toBe(80);
});
it("validates physics and chemistry templates with saved pedagogy and reproducible seeds", () => {
  const id = "10000000-0000-4000-8000-000000000001";
  for (const kind of ["motion", "molar_mass"] as const)
    for (let seed = 1; seed <= 200; seed++) {
      const batch = generateQuantitativeQuestions(id, id, seed, kind);
      expect(batch).toEqual(generateQuantitativeQuestions(id, id, seed, kind));
      expect(new Set(batch.map((q) => q.statement)).size).toBe(batch.length);
      for (const q of batch) {
        const numbers = q.statement.match(/\d+/g)!.map(Number);
        const first = numbers[0],
          factor = kind === "motion" ? numbers[1] : numbers.at(-1)!;
        expect(Number(q.options[q.answer])).toBe(first * factor);
        expect(new Set(q.options).size).toBe(4);
        expect(q.option_explanations).toHaveLength(4);
        expect(q.solution_steps).toHaveLength(3);
        expect(q.hint!.length).toBeGreaterThan(10);
        expect(q.generator_seed).toBe(seed);
      }
    }
});
