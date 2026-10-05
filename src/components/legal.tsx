import Link from "next/link";
import { Logo } from "./logo";
export function Legal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="public-header wrap">
        <Logo />
      </header>
      <main id="main" className="wrap legal-copy" style={{ maxWidth: 740 }}>
        <span className="eyebrow">TRANSPARÊNCIA · VERSÃO DE IMPLANTAÇÃO</span>
        <h1>{title}</h1>
        {children}
        <p className="notice">
          Texto técnico provisório. Identificação do responsável, contato
          oficial e condições comerciais precisam ser definidos e revisados
          antes do lançamento público.
        </p>
        <nav className="workspace-links" aria-label="Documentos do NEXO">
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/uso-aceitavel">Uso aceitável</Link>
        </nav>
      </main>
    </>
  );
}
