import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <section className="auth-card">
      <span className="eyebrow">BOM TER VOCÊ AQUI</span>
      <h1>Continue de onde parou.</h1>
      <p>Seu próximo passo está esperando.</p>
      {erro && (
        <p role="alert" className="notice error">
          Não foi possível confirmar o acesso. O link pode ter expirado. Tente
          entrar ou recuperar sua senha.
        </p>
      )}
      <AuthForm mode="login" />
      <p className="auth-switch">
        Ainda não tem conta? <Link href="/cadastro">Comece gratuitamente</Link>
      </p>
    </section>
  );
}
