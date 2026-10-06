import ts from "typescript";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const candidates = [];
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.tsx?$/.test(path) || path.endsWith("database.types.ts")) continue;
    const text = readFileSync(path, "utf8");
    const source = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function visit(node) {
      let kind;
      if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) kind = "jsx-text";
      else if (
        ts.isStringLiteral(node) &&
        ts.isJsxAttribute(node.parent) &&
        ["aria-label", "placeholder", "title", "alt", "label"].includes(
          node.parent.name.getText(source),
        )
      )
        kind = "attribute";
      else if (
        (ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node)) &&
        /[áàâãéêíóôõúç]|\b(?:Não|Salvar|Carregando|Seu|Sua|Erro|Questões|Senha|Entrar)\b/u.test(
          node.text,
        )
      )
        kind = "review-literal";
      if (kind)
        candidates.push({
          file: path.replaceAll("\\", "/"),
          line:
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1,
          kind,
          text: node.text.replace(/\s+/g, " ").trim(),
        });
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
walk("src");
mkdirSync(".local/evidence", { recursive: true });
writeFileSync(
  ".local/evidence/i18n-candidates.json",
  JSON.stringify(candidates, null, 2),
);
const summary = {
  candidates: candidates.length,
  byKind: Object.fromEntries(
    ["jsx-text", "attribute", "review-literal"].map((k) => [
      k,
      candidates.filter((c) => c.kind === k).length,
    ]),
  ),
  note: "Candidates require review: identifiers, educational content, server logs and stored enum values must not be blindly translated.",
};
console.log(JSON.stringify(summary, null, 2));
