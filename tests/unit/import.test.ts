import { it, expect } from "vitest";
import { parseQuestionImport } from "../../src/domain/import";
it("parses quoted CSV with escaped quotes and multiline statements", () => {
  const r = parseQuestionImport(
    'statement,options,answer,difficulty\r\n"Linha 1\nLinha 2","[""a"",""b""]",1,5',
  );
  expect(r).toEqual([
    {
      statement: "Linha 1\nLinha 2",
      options: ["a", "b"],
      answer: 1,
      difficulty: 5,
    },
  ]);
});
it("rejects malformed rows and handles JSON", () => {
  expect(() => parseQuestionImport('statement,answer\n"unclosed,1')).toThrow();
  expect(() => parseQuestionImport("statement,answer\na,1,2")).toThrow();
  expect(parseQuestionImport('[{"statement":"Questão"}]')).toEqual([
    { statement: "Questão" },
  ]);
});
