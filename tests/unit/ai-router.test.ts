import { it, expect, vi } from "vitest";
import { AiRouter, type TutorProvider } from "../../src/domain/ai-router";
const result = {
  text: "Resposta de teste",
  tokens: 4,
  provider: "test-only",
  model: "mock",
};
it("uses primary without calling fallback on success", async () => {
  const fallback = { explain: vi.fn() };
  expect(
    await new AiRouter([{ explain: async () => result }, fallback]).explain(
      "pergunta",
      {},
    ),
  ).toEqual(result);
  expect(fallback.explain).not.toHaveBeenCalled();
});
it("preserves context on fallback and never invents an answer", async () => {
  const fail: TutorProvider = {
    explain: async () => {
      throw Error("offline");
    },
  };
  const fallback = { explain: vi.fn(async () => result) };
  expect(
    await new AiRouter([fail, fallback]).explain("dica", { topic: "fração" }),
  ).toEqual(result);
  expect(fallback.explain).toHaveBeenCalledWith("dica", { topic: "fração" });
  await expect(new AiRouter([fail]).explain("dica", {})).rejects.toThrow(
    "AI_UNAVAILABLE",
  );
  await expect(new AiRouter([]).explain("dica", {})).rejects.toThrow(
    "AI_UNAVAILABLE",
  );
});
