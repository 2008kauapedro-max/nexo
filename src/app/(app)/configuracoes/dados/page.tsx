import Link from "next/link";
import { DeleteAccount } from "@/components/delete-account";
export default function Data() {
  return (
    <section className="reading-container">
      <h1>Seus dados.</h1>
      <p>
        Seu histórico pertence a você. Baixe uma cópia ou gerencie sua conta.
      </p>
      <a className="button primary" href="/api/dados">
        Baixar meus dados
      </a>
      <Link className="row-card" href="/privacidade">
        Ler a política de privacidade →
      </Link>
      <DeleteAccount />
    </section>
  );
}
