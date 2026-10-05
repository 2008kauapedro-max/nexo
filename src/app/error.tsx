"use client";
export default function ErrorPage({
  reset,
  error,
}: {
  reset: () => void;
  error: Error & { digest?: string };
}) {
  return (
    <main id="main" className="empty-state">
      <h1>Não conseguimos carregar agora.</h1>
      <p>Seus dados continuam salvos. Tente novamente em alguns instantes.</p>
      {error.digest && <p>Referência do erro: {error.digest}</p>}
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
