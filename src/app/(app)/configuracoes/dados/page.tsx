import Link from "next/link";
import { DeleteAccount } from "@/components/delete-account";
import { accountSecurity } from "@/lib/account-security";
export default async function Data() {
  const access = await accountSecurity();
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
      <DeleteAccount
        password={access.password}
        hasMfa={access.hasMfa}
        admin={access.admin}
      />
    </section>
  );
}
