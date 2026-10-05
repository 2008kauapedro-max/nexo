import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { logout } from "@/app/actions/auth";
export default async function Account() {
  const { user, profile } = await requireProfile();
  return (
    <section className="reading-container">
      <h1>Conta e segurança.</h1>
      <div className="note">
        <h2>{profile.name}</h2>
        <p>{user.email}</p>
        <p>Método de acesso: e-mail e senha.</p>
      </div>
      <div className="workspace-links">
        <Link href="/preferencias">Alterar meu nome e preferências →</Link>
        <Link href="/esqueci-senha">Receber link para redefinir senha →</Link>
      </div>
      <form action={logout}>
        <button className="button secondary">Sair de todas as sessões</button>
      </form>
      <p className="fine-print">
        O encerramento global revoga a renovação das sessões. Tokens já emitidos
        podem persistir até expirar; ações sensíveis verificam o usuário no
        servidor.
      </p>
    </section>
  );
}
