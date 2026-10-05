// RFC 4180 field quoting, including escaped quotes and embedded newlines.
export function parseQuestionImport(raw: string): unknown {
  const text = raw.trim();
  if (text.startsWith("[")) return JSON.parse(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Aspas não fechadas no CSV.");
  row.push(field);
  rows.push(row);
  const headers = rows.shift();
  if (!headers?.includes("statement"))
    throw new Error("O CSV precisa de cabeçalho, incluindo statement.");
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r, index) => {
      if (r.length !== headers.length)
        throw new Error(
          `Linha ${index + 2}: quantidade de campos diferente do cabeçalho.`,
        );
      const o: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        if (h === "options") o[h] = JSON.parse(r[i]);
        else if (["answer", "difficulty", "source_year"].includes(h))
          o[h] = r[i] ? Number(r[i]) : null;
        else if (r[i]) o[h] = r[i];
      });
      return o;
    });
}
