# Importar questões

Acesse `/admin` com papel em `private.admins`. Acesso comum resulta em 404 e a RPC também recusa a operação.

O formulário aceita JSON (array) ou CSV com cabeçalho. Limites: 250 KB e 100 questões por envio. Todas as linhas são validadas antes das gravações. Erros de validação indicam linha/campo. Falhas de referências ou duplicações durante gravação são informadas por linha, juntamente com a quantidade salva; o lote não é atômico.

```json
[
  {
    "subject_id": "UUID_DA_MATERIA",
    "topic_id": "UUID_DO_ASSUNTO",
    "statement": "Quanto vale x em 3x + 6 = 21?",
    "options": ["3", "5", "7", "9"],
    "answer": 1,
    "explanation": "Subtraia 6: 3x = 15. Divida por 3: x = 5.",
    "difficulty": 2,
    "source": "Autoral NEXO",
    "source_year": 2026,
    "exam": "Geral",
    "status": "draft"
  }
]
```

`answer` é índice base zero. `status`: draft, published ou inactive. `source_year` e `subtopic_id` são opcionais. No CSV, `options` é um array JSON em um campo entre aspas, com aspas internas duplicadas. Campos com quebras de linha precisam de aspas.

Não importe conteúdo sem autorização. Questões oficiais devem guardar origem, ano, prova e identificação na fonte. O seed atual é autoral, não contém questões atribuídas a provas reais.

O fingerprint normaliza caixa e espaços externos do enunciado; não elimina todas as variantes semanticamente duplicadas. A desativação preserva histórico de respostas. Não há exclusão destrutiva de questões referenciadas por alunos.
