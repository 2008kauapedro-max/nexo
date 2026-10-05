import { writeFileSync } from "node:fs";
// Original development questions; no third-party exam content is reproduced.
const content = [
  [
    "Matemática",
    "matematica",
    "Álgebra",
    [
      [
        2,
        "Quanto vale x na equação 3x + 6 = 21?",
        ["3", "5", "7", "9"],
        1,
        "Subtraia 6 dos dois lados: 3x = 15. Divida por 3: x = 5.",
      ],
      [
        4,
        "Um produto de R$ 200 recebe desconto de 15%. Qual é o preço final?",
        ["R$ 150", "R$ 165", "R$ 170", "R$ 185"],
        2,
        "15% de 200 são 30. Portanto, 200 − 30 = R$ 170.",
      ],
      [
        6,
        "Quais são as raízes de x² − 5x + 6 = 0?",
        ["1 e 6", "2 e 3", "−2 e −3", "−1 e −6"],
        1,
        "A fatoração é (x − 2)(x − 3) = 0. Assim, x = 2 ou x = 3.",
      ],
      [
        8,
        "Se log₂(x − 1) + log₂(x + 1) = 3, com x > 1, qual é x?",
        ["2", "3", "4", "8"],
        1,
        "Somando logaritmos: log₂(x² − 1) = 3. Logo x² − 1 = 8, x² = 9. No domínio x > 1, x = 3.",
      ],
      [
        5,
        "Uma progressão aritmética tem primeiro termo 4 e razão 3. Qual é o décimo termo?",
        ["27", "28", "30", "31"],
        3,
        "Use aₙ = a₁ + (n − 1)r: a₁₀ = 4 + 9 × 3 = 31.",
      ],
      [
        9,
        "Quantos números inteiros x satisfazem |2x − 3| < 5?",
        ["3", "4", "5", "6"],
        1,
        "−5 < 2x − 3 < 5 equivale a −1 < x < 4. Os inteiros são 0, 1, 2 e 3: quatro números.",
      ],
    ],
  ],
  [
    "Português",
    "portugues",
    "Linguagem e interpretação",
    [
      [
        2,
        "Em “As meninas chegaram cedo”, qual termo é o núcleo do sujeito?",
        ["As", "meninas", "chegaram", "cedo"],
        1,
        "O sujeito é “As meninas”; seu núcleo é o substantivo “meninas”.",
      ],
      [
        4,
        "Qual frase apresenta linguagem conotativa?",
        [
          "O ônibus chegou às oito.",
          "A água ferveu na panela.",
          "Seu sorriso iluminou o dia.",
          "O livro tem cem páginas.",
        ],
        2,
        "“Iluminou o dia” expressa uma sensação positiva em sentido figurado, não uma iluminação física.",
      ],
      [
        6,
        "Qual alternativa emprega corretamente a crase?",
        [
          "Voltei à pé.",
          "Entreguei o livro à professora.",
          "Cheguei à tempo.",
          "Comecei à estudar.",
        ],
        1,
        "O verbo entregar exige a preposição a para o destinatário. Com o artigo a de “a professora”, ocorre à.",
      ],
      [
        8,
        "Em “Embora chovesse, saímos”, a oração introduzida por “embora” expressa:",
        ["Causa", "Finalidade", "Concessão", "Consequência"],
        2,
        "A chuva é um obstáculo que não impediu a saída. “Embora” introduz uma concessão.",
      ],
      [
        5,
        "Qual frase apresenta concordância verbal correta?",
        [
          "Fazem dois anos que estudo.",
          "Houveram muitos candidatos.",
          "Existem boas oportunidades.",
          "Havia chegado os alunos.",
        ],
        2,
        "O verbo existir concorda com “boas oportunidades”. Fazer indicando tempo e haver no sentido de existir são impessoais.",
      ],
      [
        9,
        "Em “Vendem-se livros usados”, qual é a função do “se”?",
        [
          "Índice de indeterminação do sujeito",
          "Partícula apassivadora",
          "Pronome reflexivo",
          "Conjunção integrante",
        ],
        1,
        "A frase equivale a “Livros usados são vendidos”. O sujeito paciente é “livros usados” e o se é apassivador.",
      ],
    ],
  ],
  [
    "Física",
    "fisica",
    "Movimento e energia",
    [
      [
        2,
        "Um carro percorre 120 km em 2 horas. Qual é sua velocidade média?",
        ["30 km/h", "60 km/h", "90 km/h", "240 km/h"],
        1,
        "Velocidade média é distância dividida pelo tempo: 120 ÷ 2 = 60 km/h.",
      ],
      [
        4,
        "Uma força resultante de 12 N atua em um corpo de 3 kg. Qual é a aceleração?",
        ["3 m/s²", "4 m/s²", "9 m/s²", "36 m/s²"],
        1,
        "Pela segunda lei de Newton, F = ma. Assim, a = 12/3 = 4 m/s².",
      ],
      [
        6,
        "Um corpo de 2 kg está a 5 m de altura. Adote g = 10 m/s². Qual é sua energia potencial gravitacional?",
        ["10 J", "25 J", "50 J", "100 J"],
        3,
        "A energia potencial gravitacional é mgh = 2 × 10 × 5 = 100 J.",
      ],
      [
        8,
        "Um corpo parte do repouso com aceleração constante de 2 m/s². Qual é o deslocamento após 6 s?",
        ["12 m", "18 m", "36 m", "72 m"],
        2,
        "Para velocidade inicial nula, Δs = at²/2 = 2 × 36 / 2 = 36 m.",
      ],
      [
        5,
        "Um resistor de 6 Ω é ligado a 12 V. Qual corrente o atravessa?",
        ["0,5 A", "2 A", "6 A", "72 A"],
        1,
        "Pela lei de Ohm, I = V/R = 12/6 = 2 A.",
      ],
      [
        9,
        "Dois corpos de massas iguais colidem e ficam unidos. Antes, um se movia a 8 m/s e o outro estava parado. Sem força externa resultante, a velocidade final é:",
        ["2 m/s", "4 m/s", "8 m/s", "16 m/s"],
        1,
        "Conservando o momento linear: m × 8 + m × 0 = 2m × v. Logo v = 4 m/s.",
      ],
    ],
  ],
  [
    "Química",
    "quimica",
    "Matéria e transformações",
    [
      [
        2,
        "Qual partícula do átomo possui carga elétrica negativa?",
        ["Próton", "Nêutron", "Elétron", "Núcleo"],
        2,
        "Elétrons têm carga negativa. Prótons têm carga positiva e nêutrons são eletricamente neutros.",
      ],
      [
        4,
        "Qual mistura pode ser separada por filtração simples?",
        [
          "Água e sal dissolvido",
          "Água e areia",
          "Água e álcool",
          "Oxigênio e nitrogênio",
        ],
        1,
        "A areia é um sólido insolúvel na água, retido pelo filtro. O líquido atravessa o material filtrante.",
      ],
      [
        6,
        "Uma solução contém 10 g de soluto em 500 mL de solução. Qual sua concentração comum?",
        ["5 g/L", "10 g/L", "20 g/L", "50 g/L"],
        2,
        "500 mL = 0,5 L. A concentração é massa por volume: 10/0,5 = 20 g/L.",
      ],
      [
        8,
        "Na reação 2 H₂ + O₂ → 2 H₂O, quantos mols de água podem ser formados a partir de 3 mols de H₂ e O₂ em excesso?",
        ["1 mol", "1,5 mol", "3 mol", "6 mol"],
        2,
        "A proporção estequiométrica entre H₂ e H₂O é 2:2, ou 1:1. Portanto, formam-se 3 mols de água.",
      ],
      [
        5,
        "Uma solução aquosa a 25 °C tem pH 3. Ela é:",
        ["Ácida", "Neutra", "Básica", "Sempre saturada"],
        0,
        "A 25 °C, soluções com pH inferior a 7 são ácidas. pH não informa se a solução está saturada.",
      ],
      [
        9,
        "Em um equilíbrio gasoso, aumentar a pressão favorece o lado com:",
        [
          "Mais mols de gás",
          "Menos mols de gás",
          "Maior massa molar sempre",
          "Maior temperatura sempre",
        ],
        1,
        "Pelo princípio de Le Chatelier, o sistema favorece a diminuição do número de partículas gasosas para contrapor a compressão.",
      ],
    ],
  ],
  [
    "Biologia",
    "biologia",
    "Vida e sistemas",
    [
      [
        2,
        "Qual organela é responsável principalmente pela síntese de proteínas?",
        ["Ribossomo", "Lisossomo", "Centríolo", "Vacúolo"],
        0,
        "Ribossomos traduzem o RNA mensageiro, unindo aminoácidos para formar proteínas.",
      ],
      [
        4,
        "Na fotossíntese, plantas convertem energia luminosa principalmente em:",
        [
          "Energia nuclear",
          "Energia química",
          "Energia sonora",
          "Energia gravitacional",
        ],
        1,
        "A energia luminosa é utilizada para produzir compostos orgânicos que armazenam energia química.",
      ],
      [
        6,
        "No cruzamento Aa × Aa, qual é a probabilidade de um descendente aa?",
        ["0%", "25%", "50%", "75%"],
        1,
        "As combinações possíveis são AA, Aa, Aa e aa. Uma em quatro é aa: 25%.",
      ],
      [
        8,
        "Uma população sofre redução drástica por um evento aleatório, alterando frequências alélicas. Esse fenômeno é um exemplo de:",
        [
          "Deriva genética",
          "Mutação direcionada",
          "Uso e desuso",
          "Seleção artificial",
        ],
        0,
        "O efeito gargalo é um caso de deriva genética: frequências alélicas mudam por amostragem aleatória em uma população reduzida.",
      ],
      [
        5,
        "Em uma cadeia alimentar, qual grupo introduz energia química produzida a partir de fontes externas, como a luz?",
        [
          "Decompositores",
          "Consumidores secundários",
          "Produtores",
          "Parasitas",
        ],
        2,
        "Produtores, como plantas e algas, convertem energia externa em matéria orgânica que sustenta a cadeia alimentar.",
      ],
      [
        9,
        "Uma fita de DNA tem sequência 5′-ATGC-3′. Qual é a fita complementar corretamente orientada?",
        ["5′-TACG-3′", "3′-TACG-5′", "3′-ATGC-5′", "5′-UACG-3′"],
        1,
        "As fitas são antiparalelas e as bases se pareiam A–T e G–C. Assim, a complementar é 3′-TACG-5′.",
      ],
    ],
  ],
  [
    "História",
    "historia",
    "Sociedade e mudanças",
    [
      [
        2,
        "A abolição legal da escravidão no Brasil ocorreu com qual lei?",
        ["Lei Áurea", "Lei de Terras", "Lei de Cotas", "Lei do Ventre Livre"],
        0,
        "A Lei Áurea aboliu legalmente a escravidão em 13 de maio de 1888. A Lei do Ventre Livre foi anterior e teve alcance limitado.",
      ],
      [
        4,
        "A Revolução Industrial iniciada na Inglaterra caracterizou-se principalmente por:",
        [
          "Retorno ao trabalho artesanal",
          "Expansão da produção mecanizada em fábricas",
          "Fim das cidades",
          "Abandono da energia a vapor",
        ],
        1,
        "A mecanização e o sistema fabril transformaram a produção e as relações de trabalho, com destaque inicial para a indústria têxtil.",
      ],
      [
        6,
        "Uma característica central do Iluminismo europeu foi:",
        [
          "Defesa irrestrita do absolutismo",
          "Valorização da razão e crítica aos privilégios",
          "Rejeição de toda ciência",
          "Restauração do feudalismo",
        ],
        1,
        "Pensadores iluministas valorizavam a razão e questionavam privilégios e formas tradicionais de autoridade.",
      ],
      [
        8,
        "A Constituição brasileira de 1988 é associada à redemocratização porque:",
        [
          "Extinguiu eleições diretas",
          "Ampliou direitos e garantias democráticas",
          "Instituiu monarquia",
          "Proibiu organizações civis",
        ],
        1,
        "A Constituição de 1988 ampliou direitos civis, políticos e sociais após o regime militar, consolidando instituições democráticas.",
      ],
      [
        5,
        "A Guerra Fria foi marcada principalmente pela rivalidade entre:",
        [
          "Portugal e Espanha",
          "Estados Unidos e União Soviética",
          "Brasil e Argentina",
          "França e Itália",
        ],
        1,
        "Estados Unidos e União Soviética lideraram blocos rivais em disputas políticas, econômicas, militares e ideológicas.",
      ],
      [
        9,
        "Ao analisar uma fonte histórica, por que é necessário considerar seu contexto de produção?",
        [
          "Para presumir que toda fonte é neutra",
          "Para identificar interesses, limites e perspectivas do registro",
          "Para ignorar a autoria",
          "Para substituir evidências por opinião",
        ],
        1,
        "Fontes são produzidas em situações específicas. Autoria, finalidade e contexto ajudam a interpretar seus significados e limites.",
      ],
    ],
  ],
  [
    "Geografia",
    "geografia",
    "Espaço e ambiente",
    [
      [
        2,
        "Qual linha imaginária divide a Terra em hemisférios Norte e Sul?",
        [
          "Trópico de Capricórnio",
          "Meridiano de Greenwich",
          "Linha do Equador",
          "Círculo Polar Ártico",
        ],
        2,
        "A Linha do Equador corresponde à latitude 0° e separa os hemisférios Norte e Sul.",
      ],
      [
        4,
        "Em um mapa de escala 1:100.000, uma distância de 2 cm representa:",
        ["200 m", "1 km", "2 km", "20 km"],
        2,
        "Cada centímetro representa 100.000 cm, ou 1 km. Logo, 2 cm representam 2 km.",
      ],
      [
        6,
        "O processo de crescimento da proporção da população que vive em cidades é chamado de:",
        ["Urbanização", "Desertificação", "Intemperismo", "Sedimentação"],
        0,
        "Urbanização é o aumento da participação da população urbana no total populacional.",
      ],
      [
        8,
        "Ilhas de calor urbanas estão associadas principalmente a:",
        [
          "Aumento da vegetação e evapotranspiração",
          "Impermeabilização e materiais que retêm calor",
          "Redução das construções",
          "Ausência de atividades humanas",
        ],
        1,
        "Asfalto, concreto, pouca vegetação e atividades urbanas favorecem retenção de calor e temperaturas mais elevadas.",
      ],
      [
        5,
        "Qual fonte de energia é renovável?",
        ["Carvão mineral", "Petróleo", "Gás natural", "Solar"],
        3,
        "A energia solar se renova continuamente em escala humana. Carvão, petróleo e gás são combustíveis fósseis finitos.",
      ],
      [
        9,
        "Uma pirâmide etária com base estreita e maior proporção de idosos indica, em geral:",
        [
          "Alta natalidade recente",
          "Envelhecimento populacional e menor natalidade",
          "Ausência de transição demográfica",
          "Crescimento natural necessariamente elevado",
        ],
        1,
        "A base estreita indica menos nascimentos relativos, e o topo mais largo indica maior participação de idosos, associada ao envelhecimento.",
      ],
    ],
  ],
];
const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'";
let sql =
  "-- Original NEXO seed. Safe to reapply; fingerprints prevent duplicates.\n";
content.forEach(([name, slug, topic, questions], position) => {
  sql += `insert into public.subjects(name,slug,position) values(${quote(name)},${quote(slug)},${position}) on conflict(slug) do nothing;\n`;
  sql += `insert into public.topics(subject_id,name) select id,${quote(topic)} from public.subjects where slug=${quote(slug)} on conflict(subject_id,name) do nothing;\n`;
  questions.forEach(([difficulty, statement, options, answer, explanation]) => {
    sql += `with q as (insert into public.questions(subject_id,topic_id,statement,options,difficulty,status,fingerprint) select s.id,t.id,${quote(statement)},${quote(JSON.stringify(options))}::jsonb,${difficulty},'published',md5(lower(trim(${quote(statement)}))) from public.subjects s join public.topics t on t.subject_id=s.id where s.slug=${quote(slug)} and t.name=${quote(topic)} on conflict(fingerprint) do update set updated_at=public.questions.updated_at returning id) insert into private.question_answers(question_id,answer,explanation) select id,${answer},${quote(explanation)} from q on conflict(question_id) do nothing;\n`;
  });
});
writeFileSync("supabase/seed.sql", sql);
process.stdout.write(
  `Prepared ${content.reduce((n, s) => n + s[3].length, 0)} original questions.\n`,
);
