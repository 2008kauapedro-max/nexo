import { writeFileSync } from "node:fs";
const lessons = [
  [
    "matematica",
    "Equações: mantenha os dois lados em equilíbrio",
    "Uma equação compara duas expressões iguais. Para descobrir a incógnita, faça a mesma operação dos dois lados. Isso preserva a igualdade.",
    "Em 3x + 6 = 21, subtraia 6 dos dois lados: 3x = 15. Depois divida os dois lados por 3: x = 5.",
    "NUMERIC_INPUT",
    "Resolva: 4x + 8 = 28. Digite o valor de x.",
    5,
    "Subtraia 8: 4x = 20. Divida por 4: x = 5.",
    "Subtrair o mesmo número dos dois lados mantém a igualdade.",
    true,
  ],
  [
    "portugues",
    "Encontre o núcleo do sujeito",
    "O sujeito é o termo sobre o qual se faz uma afirmação. Seu núcleo é a palavra central, geralmente um substantivo ou pronome. Artigos e adjetivos podem acompanhar esse núcleo.",
    "Em “Os alunos atentos chegaram”, o sujeito é “Os alunos atentos”. O núcleo é “alunos”.",
    "FILL_BLANK",
    "Complete com uma palavra: em “As meninas chegaram cedo”, o núcleo do sujeito é ____.",
    "meninas",
    "“Meninas” é o substantivo central. “As” é artigo e “cedo” indica circunstância de tempo.",
    "Em “Os alunos chegaram”, o núcleo do sujeito é “Os”.",
    false,
  ],
  [
    "fisica",
    "Força, massa e aceleração",
    "A força resultante determina como a velocidade muda. Na segunda lei de Newton, F = m × a. Para uma mesma força, um corpo com maior massa terá menor aceleração.",
    "Se uma força de 12 N atua em 3 kg, a = F/m = 12/3 = 4 m/s².",
    "NUMERIC_INPUT",
    "Uma força resultante de 20 N atua em 5 kg. Qual é a aceleração, em m/s²?",
    4,
    "Divida a força pela massa: 20/5 = 4 m/s².",
    "Mantendo a força resultante, dobrar a massa reduz a aceleração pela metade.",
    true,
  ],
  [
    "quimica",
    "Concentração: quanto há em cada litro?",
    "A concentração comum relaciona a massa de soluto ao volume total da solução: C = m/V. Antes de dividir, converta o volume para a unidade pedida.",
    "10 g em 500 mL: 500 mL = 0,5 L. Assim, C = 10/0,5 = 20 g/L.",
    "NUMERIC_INPUT",
    "Uma solução tem 6 g de soluto em 300 mL. Qual é a concentração em g/L?",
    20,
    "300 mL são 0,3 L. Logo, 6/0,3 = 20 g/L.",
    "Para calcular concentração em g/L, podemos usar mililitros diretamente sem converter.",
    false,
  ],
  [
    "biologia",
    "Da informação à proteína",
    "Ribossomos participam da síntese de proteínas. Eles leem a informação do RNA mensageiro e unem aminoácidos na sequência indicada.",
    "Pense no RNA mensageiro como uma sequência de instruções. O ribossomo acompanha essa sequência para montar uma cadeia de aminoácidos.",
    "FILL_BLANK",
    "Complete com uma palavra: a organela que participa diretamente da síntese de proteínas é o ____.",
    "ribossomo",
    "O ribossomo traduz a informação do RNA mensageiro em uma sequência de aminoácidos.",
    "Ribossomos participam da montagem de proteínas a partir de aminoácidos.",
    true,
  ],
  [
    "historia",
    "Uma fonte tem contexto",
    "Fontes históricas são registros produzidos por pessoas em situações específicas. Perguntar quem produziu, quando e com qual finalidade ajuda a interpretar o registro.",
    "Uma propaganda política revela discursos e interesses de quem a produziu. Ela não deve ser tratada como descrição neutra de toda a sociedade.",
    "FILL_BLANK",
    "Complete: autoria, finalidade e situação de produção ajudam a compreender o ____ de uma fonte.",
    "contexto",
    "O contexto conecta a fonte à situação histórica em que foi produzida.",
    "Toda fonte histórica descreve os acontecimentos de forma neutra.",
    false,
  ],
  [
    "geografia",
    "Escala: do mapa ao espaço",
    "A escala expressa a relação entre uma distância no mapa e a correspondente distância real, usando a mesma unidade. Em 1:100.000, 1 cm representa 100.000 cm.",
    "100.000 cm equivalem a 1.000 m, ou 1 km. Portanto, 2 cm nesse mapa representam 2 km.",
    "NUMERIC_INPUT",
    "Em escala 1:50.000, uma distância de 4 cm representa quantos quilômetros?",
    2,
    "4 × 50.000 = 200.000 cm = 2.000 m = 2 km.",
    "Escala 1:100.000 significa que 1 cm no mapa representa 1 km no espaço real.",
    true,
  ],
];
const q = (s) => "'" + String(s).replaceAll("'", "''") + "'";
let sql = "";
for (const [
  slug,
  title,
  explanation,
  example,
  kind,
  prompt,
  value,
  feedback,
  tf,
  truth,
] of lessons) {
  sql += `insert into public.lessons(topic_id,title,explanation,example,status) select t.id,${q(title)},${q(explanation)},${q(example)},'published' from public.topics t join public.subjects s on s.id=t.subject_id where s.slug=${q(slug)} on conflict(topic_id,title) do nothing;\n`;
  for (const [k, p, v, e, pos] of [
    [kind, prompt, value, feedback, 0],
    [
      "TRUE_FALSE",
      tf,
      truth,
      truth
        ? "A afirmação corresponde ao conceito apresentado."
        : "Releia o conceito: a afirmação altera uma parte importante da explicação.",
      1,
    ],
  ])
    sql += `with a as(insert into public.learning_activities(lesson_id,kind,prompt,difficulty,position,status) select id,${q(k)},${q(p)},4,${pos},'published' from public.lessons l where title=${q(title)} and not exists(select 1 from public.learning_activities x where x.lesson_id=l.id and x.position=${pos}) returning id) insert into private.activity_keys select id,${q(JSON.stringify({ value: v, tolerance: 0.001 }))}::jsonb,${q(e)} from a;\n`;
}
writeFileSync("supabase/lessons-seed.sql", sql);
process.stdout.write("Prepared 7 lessons and 14 varied activities.\n");
