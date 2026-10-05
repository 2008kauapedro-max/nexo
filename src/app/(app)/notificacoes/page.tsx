import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { notificationAction } from "@/app/actions/workspace";
import { notificationGroup } from "@/domain/notifications";
export default async function Notifications({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro = "todas" } = await searchParams;
  const { db } = await requireProfile();
  await db.rpc("sync_notifications");
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = data.filter(
    (n) => filtro === "todas" || notificationGroup(n.kind) === filtro,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">NO SEU TEMPO</span>
          <h1>Notificações.</h1>
          <p>O que merece sua atenção, sem ruído.</p>
        </div>
        <Link
          href="/configuracoes/notificacoes"
          className="button small secondary"
        >
          Preferências
        </Link>
      </div>
      <nav className="tabs" aria-label="Filtrar notificações">
        {["todas", "estudos", "conquistas", "conta"].map((f) => (
          <Link
            key={f}
            className={filtro === f ? "active" : ""}
            href={`/notificacoes?filtro=${f}`}
          >
            {f}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <>
          <form action={notificationAction}>
            <input type="hidden" name="action" value="read" />
            <button className="text-button">Marcar todas como lidas</button>
          </form>
          <div className="notification-list">
            {rows.map((n) => (
              <article
                key={n.id}
                className={`notification-item ${n.read_at ? "" : "unread"}`}
              >
                <Link href={n.href}>
                  <span className="eyebrow">
                    {new Date(n.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <h2>{n.title}</h2>
                  <p>{n.body}</p>
                </Link>
                <div className="toolbar">
                  <form action={notificationAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="action" value="read" />
                    <button className="text-button" disabled={!!n.read_at}>
                      {n.read_at ? "Lida" : "Marcar como lida"}
                    </button>
                  </form>
                  <form action={notificationAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="action" value="dismiss" />
                    <button className="text-button">Dispensar</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h2>Você está em dia.</h2>
          <p>Se surgir um próximo passo importante, ele aparece aqui.</p>
          <Link className="button primary" href="/inicio">
            Ir para hoje
          </Link>
        </div>
      )}
    </>
  );
}
