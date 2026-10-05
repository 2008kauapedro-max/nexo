import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function Signup() {
  return (
    <section className="auth-card">
      <span className="eyebrow">SEU NOVO COMEÇO</span>
      <h1>Aprender começa com você.</h1>
      <p>Crie sua conta gratuita e encontre seu ritmo.</p>
      <AuthForm mode="signup" />
      <p className="fine-print">
        Ao criar sua conta, você declara que leu nossa{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
      <p className="auth-switch">
        Já faz parte? <Link href="/entrar">Entrar</Link>
      </p>
    </section>
  );
}
