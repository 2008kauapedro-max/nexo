import { getRegionalFormats } from "@/i18n/server-format";
import { requireProfile } from "@/lib/supabase";
import { FlashcardForm } from "@/components/workspace-forms";
import { Flashcard } from "@/components/flashcard";
import { removeArtifact } from "@/app/actions/workspace";
export default async function Flashcards() {
  const { db } = await requireProfile();
  const format = await getRegionalFormats();
  const { data, error } = await db
    .from("flashcards")
    .select("*")
    .order("next_review")
    .limit(100);
  if (error) throw error;
  const due = data.filter(
    (c) => !c.last_reviewed || new Date(c.next_review) <= new Date(),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TRAGA DE VOLTA À MEMÓRIA</span>
          <h1>Flashcards.</h1>
          <p>{due.length} para revisar agora.</p>
        </div>
      </div>
      <details className="panel">
        <summary>Criar meu flashcard</summary>
        <FlashcardForm />
      </details>
      {due.map((c) => (
        <Flashcard card={c} key={c.id} />
      ))}
      {!due.length && (
        <div className="empty-state">
          <h2>Memória em dia.</h2>
          <p>Crie um cartão ou volte quando sua próxima revisão chegar.</p>
        </div>
      )}
      <details className="panel">
        <summary>Meus cartões ({data.length})</summary>
        {data.map((c) => (
          <div className="row-card" key={c.id}>
            <div>
              <h3>{c.front}</h3>
              <p>Próxima revisão: {format.date(c.next_review)}</p>
            </div>
            <details>
              <summary>Excluir</summary>
              <form action={removeArtifact}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="kind" value="flashcard" />
                <button className="button small danger-button secondary">
                  Confirmar exclusão
                </button>
              </form>
            </details>
          </div>
        ))}
      </details>
    </>
  );
}
