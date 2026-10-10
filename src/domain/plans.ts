import { z } from "zod";
export const featureLabels = {
  saved_help: "Dicas e explicações salvas",
  basic_review: "Revisão e caderno de erros",
  daily_plan: "Plano diário",
  adaptive_plan: "Plano adaptativo",
  advanced_activities: "Atividades variadas",
  knowledge_map: "Mapa de conhecimento",
  spaced_repetition: "Repetição espaçada",
  real_exam: "Prova Real",
  topic_analytics: "Análise por assunto",
  prove_learning: "Me prove que aprendeu",
  advanced_reports: "Relatórios avançados",
  multiple_goals: "Múltiplos objetivos",
  custom_missions: "Missões personalizadas",
} as const;
export const planSchema = z.object({
  id: z.enum(["free", "pro", "premium"]),
  name: z.string(),
  monthly_price_cents: z.number().int().min(0),
  annual_price_cents: z.number().int().min(0).nullable(),
  currency: z.literal("BRL"),
  daily_questions: z.number().int().min(5).max(5000),
  daily_ai: z.number().int().min(0).max(200),
  max_simulation: z.number().int().min(5).max(180),
  weekly_simulations: z.number().int().min(0).max(100),
  ai_burst_per_minute: z.number().int().min(1).max(10),
  features: z.record(z.string(), z.boolean()),
});
export type Plan = z.infer<typeof planSchema>;
export function hasFeature(
  plan: Pick<Plan, "features">,
  feature: keyof typeof featureLabels,
) {
  return plan.features[feature] === true;
}
