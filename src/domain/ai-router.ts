export type TutorResult = {
  text: string;
  tokens: number;
  estimatedCostUsd?: number;
  provider: string;
  model: string;
};
export interface TutorProvider {
  explain(prompt: string, context: unknown): Promise<TutorResult>;
}
/** Tries explicitly configured providers; never fabricates a response. */
export class AiRouter implements TutorProvider {
  constructor(private readonly providers: readonly TutorProvider[]) {}
  async explain(prompt: string, context: unknown): Promise<TutorResult> {
    for (const provider of this.providers) {
      try {
        return await provider.explain(prompt, context);
      } catch {
        /* Try the next configured provider. */
      }
    }
    throw new Error("AI_UNAVAILABLE");
  }
}
