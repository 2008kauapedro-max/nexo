import { z } from "zod";
import { tutorConfig, tutorIntents } from "../config/tutor";
export const tutorRequestSchema = z
  .object({
    question: z.uuid(),
    session: z.uuid(),
    requestId: z.uuid(),
    intent: z.enum(tutorIntents),
    observation: z
      .string()
      .trim()
      .max(tutorConfig.maxInputCharacters)
      .default(""),
  })
  .strict();
export function contextualGuard(
  input: string,
): "off_topic" | "one_question" | null {
  const text = input.normalize("NFKC").toLowerCase();
  if (
    /(?:crie|faça|construa|create|build|make).{0,30}(?:site|saas|website|app\b)|(?:ignore|ignorez|ignora).{0,25}(?:instru|regras|rules|previous)|(?:api[ _-]?key|service[ _-]?role|system prompt)/u.test(
      text,
    )
  )
    return "off_topic";
  if (
    (text.match(/\?/g) || []).length > 2 ||
    /(?:responda|answer).{0,20}(?:\d{2,}|todas|all).{0,20}(?:perguntas|questões|questions)/u.test(
      text,
    )
  )
    return "one_question";
  return null;
}
