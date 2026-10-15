import { Check, CreditCard, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getRegionalFormats } from "@/i18n/server-format";
import { planSchema } from "@/domain/plans";
import { getCurrentPlanAccess } from "@/lib/plan-access";
import { asaasBillingReady } from "@/lib/asaas";

const highlights: Record<string, string[]> = {
  free: ["saved_help", "basic_review", "daily_plan"],
  pro: [
    "adaptive_plan",
    "advanced_activities",
    "knowledge_map",
    "spaced_repetition",
    "topic_analytics",
  ],
  premium: [
    "prove_learning",
    "advanced_reports",
    "knowledge_map",
    "adaptive_plan",
  ],
};

export default async function Plans({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string;
    erro?: string;
    gerenciar?: string;
    recurso?: string;
  }>;
}) {
  const params = await searchParams;
  const { db, plan: currentPlan } = await getCurrentPlanAccess();
  const [format, t] = await Promise.all([
    getRegionalFormats(),
    getTranslations("plans"),
  ]);
  const { data, error } = await db
    .from("plans")
    .select("*")
    .order("daily_questions");
  if (error) throw error;

  const plans = planSchema.array().parse(data);
  const billingReady = asaasBillingReady();

  return (
    <>
      <div className="page-heading pricing-heading">
        <div>
          <span className="eyebrow">ESCOLHA O RITMO</span>
          <h1>Menos tabela. Mais diferença de verdade.</h1>
          <p>
            O plano muda o que o NEXO libera para você. O essencial continua
            funcionando no Free.
          </p>
        </div>
        <span className="current-plan-pill">
          Seu plano: <strong>{currentPlan.name}</strong>
        </span>
      </div>

      {params.checkout === "sucesso" && (
        <p className="notice success">
          Pagamento recebido. A Stripe está confirmando sua assinatura.
        </p>
      )}
      {params.checkout === "cancelado" && (
        <p className="notice">Tudo certo. Nenhuma assinatura foi concluída.</p>
      )}
      {params.recurso && (
        <p className="notice">
          Esse recurso faz parte de um plano superior. Você pode comparar
          abaixo.
        </p>
      )}
      {params.erro && (
        <p className="notice error">
          Não foi possível abrir a cobrança agora. Confira a configuração da
          Stripe.
        </p>
      )}

      <div className="pricing-grid">
        {plans.map((p) => {
          const current = p.id === currentPlan.id;
          const paid = p.id !== "free";
          const hasPaidSubscription = currentPlan.id !== "free";

          return (
            <article
              className={[
                "pricing-card",
                p.id === "pro" ? "featured" : "",
                current ? "current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={p.id}
            >
              <div className="pricing-card-top">
                <span className="pill">
                  {current
                    ? "Seu plano"
                    : p.id === "pro"
                      ? t("recommended")
                      : p.id === "free"
                        ? t("available")
                        : "Mais completo"}
                </span>
                {p.id === "pro" && <Sparkles size={18} />}
              </div>

              <h2>{p.name}</h2>
              <p className="plan-description">{t(p.id + "Description")}</p>

              <div className="plan-price">
                <strong>
                  {format.currency(p.monthly_price_cents / 100, p.currency)}
                </strong>
                <span>/ mês</span>
              </div>

              <ul className="plan-benefits">
                {highlights[p.id].map((key) => (
                  <li key={key}>
                    <Check size={17} />
                    <span>{t(`features.${key}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="plan-usage">
                <span>
                  {p.daily_questions.toLocaleString("pt-BR")} questões/dia
                </span>
                <span>{p.weekly_simulations} simulados/7 dias</span>
                <span>{p.daily_ai} ajudas do Tutor/dia</span>
              </div>

              <div className="plan-action">
                {current ? (
                  paid ? (
                    <form action="/api/billing/portal" method="post">
                      <button
                        className="button dark full"
                        disabled={!billingReady}
                      >
                        <CreditCard size={17} />
                        Gerenciar assinatura
                      </button>
                    </form>
                  ) : (
                    <span className="button secondary full" aria-current="true">
                      Plano atual
                    </span>
                  )
                ) : paid && hasPaidSubscription ? (
                  <form action="/api/billing/portal" method="post">
                    <button
                      className="button primary full"
                      disabled={!billingReady}
                    >
                      Gerenciar ou trocar plano
                    </button>
                  </form>
                ) : paid ? (
                  <form action="/api/billing/checkout" method="post">
                    <input type="hidden" name="plan" value={p.id} />
                    <button
                      className="button primary full"
                      disabled={!billingReady}
                    >
                      Assinar {p.name}
                    </button>
                  </form>
                ) : (
                  <span className="fine-print">
                    O Free continua disponível sem cobrança.
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!billingReady && (
        <p className="fine-print billing-note">
          A interface está pronta. A cobrança aparece assim que as credenciais e
          preços da Stripe forem configurados no ambiente.
        </p>
      )}
    </>
  );
}
