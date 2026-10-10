import { createHash } from "node:crypto";
import { boundedText } from "@/lib/request";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { createTutorRouter } from "@/lib/ai";
import { tutorRequestSchema, contextualGuard } from "@/domain/contextual-tutor";
import type { Database } from "@/lib/database.types";
import { getLocale } from "next-intl/server";
import { isLocale, fallbackLocale } from "@/i18n/config";
import { z } from "zod";
import { isSameOriginRequest } from "@/domain/request-origin";
const reservationSchema = z.object({
  id: z.uuid(),
  status: z.enum(["reserved", "success", "failed"]),
  reused: z.boolean(),
  text: z.string().nullable().optional(),
});
const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return reply({ error: "Origem inválida." }, 403);
  let body: unknown;
  try {
    body = JSON.parse(await boundedText(request, 4000));
  } catch {
    return reply({ error: "Pedido inválido ou muito longo." }, 400);
  }
  const parsed = tutorRequestSchema.safeParse(body);
  if (!parsed.success)
    return reply(
      {
        error:
          "Escolha uma intenção e escreva no máximo 300 caracteres sobre a questão.",
      },
      400,
    );
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return reply({ error: "Entre na sua conta." }, 401);
  const p = parsed.data;
  const { data: context, error: contextError } = await db.rpc("question_help", {
    p_question: p.question,
    p_session: p.session,
  });
  if (contextError || !context)
    return reply(
      { error: "Contexto indisponível ou simulado em andamento." },
      403,
    );
  const guard = contextualGuard(p.observation);
  if (guard)
    return reply({
      text:
        guard === "off_topic"
          ? "Posso te ajudar com esta questão e com os conceitos necessários para entendê-la."
          : "Vamos por uma dúvida de cada vez.",
      counted: false,
    });
  if (!process.env.GROQ_API_KEY || !process.env.SUPABASE_SECRET_KEY)
    return reply(
      {
        error:
          "A ajuda personalizada está indisponível. Continue com as dicas e explicações salvas; nenhuma ajuda foi consumida.",
      },
      503,
    );
  const service = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false } },
  );
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        question: p.question,
        session: p.session,
        intent: p.intent,
        observation: p.observation,
      }),
    )
    .digest("hex");
  const { data: raw, error } = await service.rpc("reserve_contextual_help", {
    p_user: user.id,
    p_question: p.question,
    p_session: p.session,
    p_request: p.requestId,
    p_intent: p.intent,
    p_hash: hash,
  });
  if (error) {
    const conflict = /REQUEST_CONFLICT|IN_PROGRESS/.test(error.message);
    return reply(
      {
        error: /DAILY_LIMIT/.test(error.message)
          ? "Você usou suas ajudas do Tutor neste período. Dicas, soluções e revisão continuam disponíveis."
          : "Espere alguns segundos antes de pedir outra explicação.",
      },
      conflict ? 409 : 429,
    );
  }
  const reservation = reservationSchema.safeParse(raw);
  if (!reservation.success)
    return reply({ error: "Não foi possível preparar a ajuda." }, 503);
  const usage = reservation.data;
  if (usage.reused) {
    if (usage.status === "success" && usage.text)
      return reply({ text: usage.text, reused: true });
    return reply(
      {
        error:
          usage.status === "reserved"
            ? "Esta ajuda ainda está sendo preparada."
            : "O pedido anterior não terminou. Faça um novo pedido; ele não consumiu a cota.",
      },
      usage.status === "reserved" ? 409 : 503,
    );
  }
  const started = performance.now();
  try {
    const locale = await getLocale();
    const result = await createTutorRouter(
      isLocale(locale) ? locale : fallbackLocale,
    ).explain(
      JSON.stringify({ intent: p.intent, observation: p.observation }),
      context,
    );
    const { data: saved, error: saveError } = await service.rpc(
      "finish_contextual_help",
      {
        p_usage: usage.id,
        p_user: user.id,
        p_success: true,
        p_answer: result.text,
        p_tokens: result.tokens,
        p_cost: result.estimatedCostUsd,
        p_latency: Math.round(performance.now() - started),
      },
    );
    if (saveError || !saved)
      return reply(
        {
          error:
            "Não foi possível confirmar a resposta. Tente o mesmo pedido novamente.",
        },
        409,
      );
    return reply({ text: result.text });
  } catch {
    const { error: refundError } = await service.rpc("finish_contextual_help", {
      p_usage: usage.id,
      p_user: user.id,
      p_success: false,
      p_answer: "",
      p_tokens: 0,
      p_latency: Math.round(performance.now() - started),
      p_error: "provider_failed",
    });
    if (refundError)
      console.error("nexo_ai_refund_pending", { code: refundError.code });
    return reply(
      {
        error: refundError
          ? "O Tutor está indisponível. A reserva pendente expira automaticamente; continue com o conteúdo salvo."
          : "O Tutor não respondeu. Nenhuma ajuda foi consumida; as explicações salvas continuam disponíveis.",
      },
      503,
    );
  }
}
