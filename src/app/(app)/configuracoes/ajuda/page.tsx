import Link from "next/link";
import { brand } from "@/config/brand";
export default function Help() {
  return (
    <section className="reading-container">
      <h1>Um pouco de clareza.</h1>
      <details className="note">
        <summary>Como meu nível é calculado?</summary>
        <p>
          O NEXO considera dificuldade, acertos, tempo e dicas. Seu domínio muda
          gradualmente; uma resposta não define o que você sabe.
        </p>
      </details>
      <details className="note">
        <summary>Por que uma questão apareceu de novo?</summary>
        <p>
          Revisar ajuda a consolidar a memória. Questões também podem reaparecer
          quando o catálogo do assunto ainda é pequeno.
        </p>
      </details>
      <details className="note">
        <summary>Encontrei um erro no conteúdo.</summary>
        <p>
          Abra a questão e use “Reportar problema”. Seu relato entra na fila de
          revisão.
        </p>
      </details>
      <h2>{brand.name} · versão 1.0</h2>
      <p>Produto em implantação. Não há cobrança ativa nesta versão.</p>
      <div className="workspace-links">
        {["termos", "privacidade", "cookies", "uso-aceitavel"].map((p) => (
          <Link key={p} href={`/${p}`}>
            {p.replaceAll("-", " ")} →
          </Link>
        ))}
      </div>
    </section>
  );
}
