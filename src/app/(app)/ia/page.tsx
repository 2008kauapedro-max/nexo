import { Tutor } from "@/components/tutor";
import { z } from "zod";
export default async function AI({
  searchParams,
}: {
  searchParams: Promise<{ questao?: string; sessao?: string }>;
}) {
  const p = await searchParams;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROFESSOR NEXO</span>
          <h1>Vamos pensar juntos.</h1>
          <p>Uma dica. Uma nova perspectiva. Um passo de cada vez.</p>
        </div>
      </div>
      <Tutor
        question={z.uuid().safeParse(p.questao).success ? p.questao : undefined}
        session={z.uuid().safeParse(p.sessao).success ? p.sessao : undefined}
      />
    </>
  );
}
