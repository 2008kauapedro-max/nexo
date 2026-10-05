import { StartForm } from "@/components/start-form";
export default function Challenges() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TESTE SUAS CONEXÕES</span>
          <h1>Cinco questões. Um desafio.</h1>
          <p>
            Um simulado curto para aplicar o que você sabe, sem pistas. O
            gabarito aparece no resultado.
          </p>
        </div>
      </div>
      <section className="study-banner">
        <h2>O próximo passo é seu.</h2>
        <p>
          Cinco questões adaptadas ao seu histórico. Você tem 30 minutos. O
          progresso é salvo após cada resposta confirmada.
        </p>
        <StartForm mode="simulation" target={5} label="Começar meu desafio" />
      </section>
    </>
  );
}
