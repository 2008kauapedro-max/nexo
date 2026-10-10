"use client";
import { useActionState, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  importQuestions,
  saveQuestion,
  saveCatalog,
} from "@/app/actions/admin";
type Row = {
  id: string;
  statement: string;
  subject_id: string;
  topic_id: string;
  difficulty: number;
  status: string;
  options: string[];
  answer: number;
  explanation: string;
  hint?: string;
  key_concept?: string;
  solution_steps?: string[];
  common_mistakes?: string[];
  option_explanations?: string[];
  prerequisites?: string[];
  skills?: string[];
};
export function Admin({
  subjects,
  topics,
  questions,
  total,
  query,
  page,
}: {
  subjects: { id: string; name: string }[];
  topics: { id: string; name: string; subject_id: string }[];
  questions: Row[];
  total: number;
  query: string;
  page: number;
}) {
  const [importState, importAction, importing] = useActionState(
    importQuestions,
    {},
  );
  const [state, action, pending] = useActionState(saveQuestion, {});
  const [catalog, catalogAction, saving] = useActionState(saveCatalog, {});
  const [editing, setEditing] = useState<Row | null>(null);
  const [search, setSearch] = useState(query);
  const router = useRouter();
  const [searching, startSearch] = useTransition();
  const [section, setSection] = useState("questions");
  function goToPage(next: number) {
    startSearch(() =>
      router.replace(`/admin?q=${encodeURIComponent(search)}&page=${next}`, {
        scroll: false,
      }),
    );
  }
  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(
      () =>
        startSearch(() =>
          router.replace(`/admin?q=${encodeURIComponent(search)}&page=0`, {
            scroll: false,
          }),
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, query, router]);
  return (
    <div className="form-stack">
      <nav className="tabs" aria-label="Ferramentas de conteúdo">
        {[
          ["questions", "Questões"],
          ["edit", "Criar questão"],
          ["import", "Importar"],
          ["catalog", "Catálogo"],
        ].map(([id, label]) => (
          <button
            type="button"
            className={`button small ${section === id ? "primary" : "secondary"}`}
            key={id}
            onClick={() => setSection(id)}
            aria-pressed={section === id}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="panel" hidden={section !== "questions"}>
        <h2 style={{ marginBottom: 20 }}>Banco de questões</h2>
        <label>
          Pesquisar
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Buscar no enunciado"
            maxLength={256}
          />
        </label>
        <div className="table-scroll" aria-busy={searching || search !== query}>
          <table>
            <thead>
              <tr>
                <th>Questão</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.statement.slice(0, 90)}</td>
                  <td>{q.status}</td>
                  <td>
                    <button
                      className="button small secondary"
                      onClick={() => {
                        setEditing(q);
                        setSection("edit");
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="toolbar">
          <button
            className="button small secondary"
            disabled={page === 0 || searching}
            onClick={() => goToPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.max(1, Math.ceil(total / 10))}
          </span>
          <button
            className="button small secondary"
            disabled={(page + 1) * 10 >= total || searching}
            onClick={() => goToPage(page + 1)}
          >
            Próxima
          </button>
        </div>
      </section>
      <section className="panel" hidden={section !== "edit"}>
        <h2 style={{ marginBottom: 20 }}>
          {editing ? "Editar questão" : "Nova questão"}
        </h2>
        <form key={editing?.id || "new"} action={action} className="form-stack">
          <input type="hidden" name="id" value={editing?.id || ""} />
          <label>
            Matéria
            <select name="subject" defaultValue={editing?.subject_id}>
              {subjects.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assunto
            <select name="topic" defaultValue={editing?.topic_id}>
              {topics.map((t) => (
                <option value={t.id} key={t.id}>
                  {subjects.find((s) => s.id === t.subject_id)?.name} / {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Enunciado
            <textarea
              name="statement"
              required
              minLength={10}
              maxLength={10000}
              defaultValue={editing?.statement}
            />
          </label>
          <label>
            Alternativas (uma por linha)
            <textarea
              name="options"
              required
              defaultValue={editing?.options.join("\n")}
            />
          </label>
          <label>
            Gabarito (0 = A, 1 = B…)
            <input
              name="answer"
              type="number"
              min={0}
              max={4}
              defaultValue={editing?.answer || 0}
            />
          </label>
          <label>
            Explicação
            <textarea
              name="explanation"
              required
              minLength={10}
              maxLength={5000}
              defaultValue={editing?.explanation}
            />
          </label>
          <label>
            Dica salva (sem revelar a resposta)
            <textarea
              name="hint"
              minLength={10}
              maxLength={1500}
              defaultValue={editing?.hint}
            />
          </label>
          <label>
            Conceito principal
            <textarea
              name="key_concept"
              minLength={3}
              maxLength={1500}
              defaultValue={editing?.key_concept}
            />
          </label>
          {(
            [
              ["solution_steps", "Passo a passo"],
              [
                "option_explanations",
                "Explicações das alternativas, na mesma ordem",
              ],
              ["common_mistakes", "Erros comuns"],
              ["prerequisites", "Pré-requisitos"],
              ["skills", "Habilidades"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label} (uma entrada por linha)
              <textarea
                name={key}
                maxLength={12000}
                defaultValue={editing?.[key]?.join("\n")}
              />
            </label>
          ))}
          <p className="fine-print">
            Para publicar conteúdo novo, cadastre dica e conceito revisados.
          </p>
          <label>
            Dificuldade (1–10)
            <input
              name="difficulty"
              type="number"
              min={1}
              max={10}
              defaultValue={editing?.difficulty || 5}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={editing?.status || "draft"}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicada</option>
              <option value="inactive">Desativada</option>
            </select>
          </label>
          {state.error && (
            <p role="alert" className="notice error">
              {state.error}
            </p>
          )}
          {state.success && (
            <p role="status" className="notice success">
              {state.success}
            </p>
          )}
          <button disabled={pending} className="button primary">
            Salvar questão
          </button>
          {editing && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing(null)}
            >
              Criar outra questão
            </button>
          )}
        </form>
      </section>
      <section className="panel" hidden={section !== "import"}>
        <h2 style={{ marginBottom: 20 }}>Importar JSON ou CSV</h2>
        <p style={{ marginBottom: 20 }}>
          Até 100 questões por lote. Use os campos do modelo em docs/IMPORT.md.
          Os erros identificam a linha e o campo.
        </p>
        <form action={importAction} className="form-stack">
          <label>
            Lista de questões
            <textarea
              name="json"
              required
              maxLength={250000}
              placeholder='[{"subject_id":"…","topic_id":"…",…}]'
            />
          </label>
          {importState.error && (
            <p role="alert" className="notice error">
              {importState.error}
            </p>
          )}
          {importState.success && (
            <p role="status" className="notice success">
              {importState.success}
            </p>
          )}
          <button disabled={importing} className="button primary">
            Validar e importar
          </button>
        </form>
      </section>
      <section className="panel" hidden={section !== "catalog"}>
        <h2 style={{ marginBottom: 20 }}>Ampliar o catálogo</h2>
        <form action={catalogAction} className="form-stack">
          <label>
            Categoria
            <select name="kind">
              <option value="subject">Matéria</option>
              <option value="topic">Assunto</option>
              <option value="subtopic">Subassunto</option>
            </select>
          </label>
          <label>
            Nome
            <input name="name" required minLength={2} maxLength={80} />
          </label>
          <label>
            Vínculo
            <select name="parent">
              <option value="">Nenhum (nova matéria)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  Matéria: {s.name}
                </option>
              ))}
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  Assunto: {t.name}
                </option>
              ))}
            </select>
          </label>
          {catalog.error && (
            <p role="alert" className="notice error">
              {catalog.error}
            </p>
          )}
          {catalog.success && (
            <p role="status" className="notice success">
              {catalog.success}
            </p>
          )}
          <button disabled={saving} className="button primary">
            Salvar catálogo
          </button>
        </form>
      </section>
    </div>
  );
}
