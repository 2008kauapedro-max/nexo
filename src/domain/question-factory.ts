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
      hint: `Comece desfazendo a soma de ${b}, aplicando a mesma operação nos dois lados da igualdade.`,
      key_concept:
        "Equações equivalentes preservam a igualdade quando aplicamos a mesma operação nos dois membros.",
      solution_steps: [
        `Subtraia ${b} dos dois lados: ${a}x = ${c - b}.`,
        `Divida os dois lados por ${a}: x = ${x}.`,
        `Verifique substituindo: ${a} × ${x} + ${b} = ${c}.`,
      ],
      option_explanations: options.map((value) =>
        value === x
          ? `Correta: a substituição resulta em ${c}, igual ao segundo membro.`
          : `Ao substituir x por ${value}, o primeiro membro fica ${a * value + b}, diferente de ${c}. Refaça as operações inversas.`,
      ),
      common_mistakes: [
        "Subtrair uma parcela em apenas um lado da igualdade.",
        "Dividir apenas uma parte do membro pelo coeficiente.",
      ],
      prerequisites: ["Operações inversas", "Igualdade"],
      skills: ["Isolar a incógnita", "Verificar uma solução"],
      generator_seed: seed,
      generator_version: "linear-v2",
      difficulty: 3,
      source: "Autoral NEXO · gerador determinístico linear-v2",
      exam: "Fundamentos",
      status: "draft",
    });
  });
}

export function generateQuantitativeQuestions(
  subject: string,
  topic: string,
  seed: number,
  kind: "motion" | "molar_mass",
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
    const first = 2 + ((seed + i * 3) % 18),
      second = 3 + ((seed * 7 + i * 11) % 27);
    const motion = kind === "motion";
    const molar = [
      { name: "água (H₂O)", mass: 18 },
      { name: "dióxido de carbono (CO₂)", mass: 44 },
      { name: "oxigênio molecular (O₂)", mass: 32 },
    ][(seed + i) % 3];
    const factor = motion ? second : molar.mass,
      answer = first * factor;
    const values = [
      answer - factor,
      answer + factor,
      answer,
      answer + 2 * factor,
    ];
    const shift = (seed + i) % 4,
      options = [...values.slice(shift), ...values.slice(0, shift)];
    if (
      new Set(options).size !== 4 ||
      options.filter((v) => v / factor === first).length !== 1
    )
      throw new Error("NON_UNIQUE_ANSWER");
    const unit = motion ? "m" : "g";
    const statement = motion
      ? `Um móvel mantém velocidade de ${first} m/s durante ${second} s, em linha reta e sem inverter o sentido. Qual distância ele percorre, em metros?`
      : `Uma amostra contém ${first} mol de ${molar.name}. Considere a massa molar igual a ${molar.mass} g/mol. Qual é a massa da amostra, em gramas?`;
    const formula = motion
      ? "distância = velocidade × tempo"
      : "massa = quantidade de matéria × massa molar";
    return questionSchema.parse({
      subject_id: subject,
      topic_id: topic,
      statement,
      options: options.map(String),
      answer: options.indexOf(answer),
      explanation: `Use ${formula}. Substituindo os dados: ${first} × ${factor} = ${answer} ${unit}.`,
      hint: motion
        ? "A velocidade informa quantos metros são percorridos a cada segundo. Relacione essa taxa com a duração."
        : "A massa molar informa a massa correspondente a um mol. Relacione-a com a quantidade de matéria.",
      key_concept: motion
        ? "No movimento uniforme, a velocidade permanece constante e a distância é proporcional ao tempo."
        : "A massa de uma amostra é proporcional à quantidade de matéria quando a substância é a mesma.",
      solution_steps: [
        `Identifique a relação: ${formula}.`,
        `Substitua os valores: ${first} × ${factor}.`,
        `Calcule e indique a unidade: ${answer} ${unit}.`,
      ],
      option_explanations: options.map((v) =>
        v === answer
          ? `Correta: ${first} × ${factor} = ${v} ${unit}.`
          : `Esse valor corresponderia a ${v / factor}, e não ao valor ${first} informado. Confira a multiplicação e as unidades.`,
      ),
      common_mistakes: [
        "Somar grandezas em vez de usar a relação de proporcionalidade.",
        "Omitir ou trocar a unidade do resultado.",
      ],
      prerequisites: ["Multiplicação", "Grandezas e unidades"],
      skills: ["Interpretar dados quantitativos", "Usar proporcionalidade"],
      difficulty: 3,
      source: `Autoral NEXO · gerador determinístico ${kind}-v1`,
      exam: "Fundamentos",
      status: "draft",
      generator_seed: seed,
      generator_version: `${kind}-v1`,
    });
  });
}
