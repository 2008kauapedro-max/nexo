// Public limits, never credentials. Model and provider are chosen only by the server.
export const tutorConfig = {
  model: "openai/gpt-oss-20b",
  baseUrl: "https://api.groq.com/openai/v1",
  maxInputCharacters: 300,
  maxCompletionTokens: 900,
  maxOutputCharacters: 2600,
  inputUsdPerMillion: 0.075,
  outputUsdPerMillion: 0.3,
  timeoutMs: 18000,
} as const;
export const tutorIntents = [
  "hint",
  "concept",
  "start",
  "mistake",
  "rephrase",
  "steps",
  "why_correct",
] as const;
export type TutorIntent = (typeof tutorIntents)[number];
