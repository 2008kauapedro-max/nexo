import { getRegionalFormats } from "@/i18n/server-format";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase";
import { SimulationForm } from "@/components/simulation-form";
export default async function Simulations() {
  const { db } = await requireProfile();
  const format = await getRegionalFormats();
  const [{ data: subjects, error }, { data: history }] = await Promise.all([
    db.from("subjects").select("*").order("position"),
    db
      .from("learning_sessions")
      .select("*")
      .eq("mode", "simulation")
      .not("finished_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);
  if (error) throw error;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREPARE-SE PARA IR ALÉM</span>
          <h1>Seu momento de testar.</h1>
          <p>Concentre-se. Respire. Descubra o quanto já avançou.</p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2 style={{ fontSize: 22, marginBottom: 25 }}>Monte seu simulado</h2>
          <SimulationForm subjects={subjects || []} />
        </section>
        <section>
          <h2 style={{ fontSize: 22, marginBottom: 20 }}>
            Seus últimos simulados
          </h2>
          {history?.length ? (
            history.map((s) => (
              <Link className="row-card" href={`/resultado/${s.id}`} key={s.id}>
                <span>{format.date(s.started_at)}</span>
                <strong>
                  {s.correct}/{s.answered} acertos ↗
                </strong>
              </Link>
            ))
          ) : (
            <div className="panel">
              <p>
                Sua história começa no primeiro simulado. Seus resultados
                ficarão aqui.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
