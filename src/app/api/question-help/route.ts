import { z } from "zod";
import { boundedText } from "@/lib/request";
import { supabase } from "@/lib/supabase";
import { isSameOriginRequest } from "@/domain/request-origin";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  let body: unknown;
  try {
    body = JSON.parse(await boundedText(request, 1000));
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const p = z.object({ question: z.uuid(), session: z.uuid() }).safeParse(body);
  if (!p.success)
    return Response.json({ error: "Questão inválida." }, { status: 400 });
  const db = await supabase();
  if (!(await db.auth.getUser()).data.user)
    return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  const { data, error } = await db.rpc("question_help", {
    p_question: p.data.question,
    p_session: p.data.session,
  });
  if (error || !data)
    return Response.json(
      { error: "Ajuda indisponível para esta questão ou durante o simulado." },
      { status: 403 },
    );
  return Response.json(
    {
      help: data,
      enabled: !!(process.env.GROQ_API_KEY && process.env.SUPABASE_SECRET_KEY),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
