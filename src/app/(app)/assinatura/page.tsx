import Link from "next/link";
import { CreditCard, ShieldCheck } from "lucide-react";
import { getCurrentPlanAccess } from "@/lib/plan-access";
import { getRegionalFormats } from "@/i18n/server-format";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelado?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const { plan, subscription } = await getCurrentPlanAccess();
  const format = await getRegionalFormats();

  const paid = plan.id !== "free";
  const cancelled = subscription?.status === "cancelled";
  const providerReady = subscription?.provider_reference?.startsWith("sub_");

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ASSINATURA</span>
          <h1>Seu NEXO, sem surpresa.</h1>
          <p>Veja o plano atual, a renovaÃ§Ã£o e controle a recorrÃªncia.</p>
        </div>
      </div>

      {params.cancelado && (
        <p className="notice success">
          RenovaÃ§Ã£o cancelada. Seu acesso continua atÃ© o fim do perÃ­odo jÃ¡
          pago.
        </p>
      )}

      {params.erro === "sincronizando" && (
        <p className="notice">
          O Asaas ainda estÃ¡ finalizando a sincronizaÃ§Ã£o da assinatura. Tente
          novamente em alguns instantes.
        </p>
      )}

      {params.erro && params.erro !== "sincronizando" && (
        <p className="notice error">
          NÃ£o foi possÃ­vel concluir essa aÃ§Ã£o agora. Tente novamente.
        </p>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PLANO ATUAL</span>
            <h2>{plan.name}</h2>
          </div>
          <CreditCard size={22} />
        </div>

        {paid && subscription ? (
          <>
            <p>
              Status:{" "}
              <strong>{cancelled ? "RenovaÃ§Ã£o cancelada" : "Ativo"}</strong>
            </p>
            <p>
              Acesso garantido atÃ©{" "}
              <strong>{format.date(subscription.period_end)}</strong>.
            </p>

            {!cancelled && (
              <div className="toolbar">
                <form action="/api/billing/cancel" method="post">
                  <button
                    className="button secondary"
                    disabled={!providerReady}
                  >
                    Cancelar renovaÃ§Ã£o
                  </button>
                </form>
              </div>
            )}

            {!providerReady && !cancelled && (
              <p className="fine-print">
                A assinatura acabou de ser criada e ainda estÃ¡ sincronizando
                com o Asaas.
              </p>
            )}
          </>
        ) : (
          <>
            <p>
              VocÃª estÃ¡ no plano gratuito e nÃ£o possui cobranÃ§a recorrente.
            </p>
            <Link className="button primary" href="/planos">
              Conhecer planos
            </Link>
          </>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PAGAMENTO PROTEGIDO</span>
            <h2>Processado pelo Asaas</h2>
          </div>
          <ShieldCheck size={22} />
        </div>
        <p>
          O NEXO nÃ£o armazena os dados completos do seu cartÃ£o. A jornada de
          pagamento acontece na pÃ¡gina segura do provedor.
        </p>
      </section>
    </>
  );
}
