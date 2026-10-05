import { requireProfile } from "@/lib/supabase";
import { NoteForm } from "@/components/workspace-forms";
import { removeArtifact } from "@/app/actions/workspace";
export default async function Notes() {
  const { db } = await requireProfile();
  const { data, error } = await db
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">IDEIAS QUE FICAM</span>
          <h1>Suas anotações.</h1>
          <p>Um espaço privado para conectar o que você aprendeu.</p>
        </div>
      </div>
      <details className="panel">
        <summary>Nova anotação</summary>
        <NoteForm />
      </details>
      {data.length ? (
        data.map((n) => (
          <article className="note" key={n.id}>
            <h2>{n.title}</h2>
            <p>{n.body}</p>
            <details>
              <summary>Excluir anotação</summary>
              <form action={removeArtifact}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="kind" value="note" />
                <p>Esta anotação será removida permanentemente.</p>
                <button className="button small danger-button secondary">
                  Confirmar exclusão
                </button>
              </form>
            </details>
          </article>
        ))
      ) : (
        <div className="empty-state">
          <p>Sua primeira descoberta pode começar com uma frase.</p>
        </div>
      )}
    </>
  );
}
