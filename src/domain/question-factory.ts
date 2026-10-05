import { questionSchema } from "./validation";
export function generateLinearQuestions(
  subject: string,
  topic: string,
  seed: number,
  count = 5,
) {
  if (
    !Number.isInteger(seed) ||
    seed < 1 ||
    seed > 10000 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 10
  )
    throw new Error("INVALID_FACTORY_INPUT");
  return Array.from({ length: count }, (_, i) => {
    const a = 2 + ((seed + i) % 8),
      x = 1 + ((seed * 3 + i * 7) % 19),
      b = 1 + ((seed + i * 3) % 20),
      c = a * x + b;
    const candidates = [x - 1, x + 2, x, x + 1];
    const shift = (seed + i) % 4;
    const options = [...candidates.slice(shift), ...candidates.slice(0, shift)];
    const answer = options.indexOf(x);
    if (options.filter((v) => a * v + b === c).length !== 1)
      throw new Error("NON_UNIQUE_ANSWER");
    return questionSchema.parse({
      subject_id: subject,
      topic_id: topic,
      statement: `Na equação ${a}x + ${b} = ${c}, qual é o valor de x?`,
      options: options.map(String),
      answer,
      explanation: `Subtraindo ${b} dos dois lados, obtemos ${a}x = ${c - b}. Dividindo por ${a}, x = ${x}. Conferindo: ${a} × ${x} + ${b} = ${c}.`,
      difficulty: 3,
      source: "Autoral NEXO · gerador determinístico linear-v1",
      exam: "Fundamentos",
      status: "draft",
    });
  });
}
