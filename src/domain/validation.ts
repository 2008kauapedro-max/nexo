import { z } from 'zod';
export const goals = ['Melhorar na escola', 'ENEM', 'Marinha', 'Concurso militar', 'Concurso público', 'Matéria específica', 'Outro'] as const;
export const onboardingSchema = z.object({ name: z.string().trim().min(2).max(60), goal: z.enum(goals), subjects: z.array(z.string().uuid()).min(1).max(7), level: z.enum(['initial', 'intermediate', 'advanced', 'unknown']), dailyGoal: z.number().int().min(5).max(30) });
export const questionSchema = z.object({ subject_id: z.string().uuid(), topic_id: z.string().uuid(), subtopic_id: z.string().uuid().nullable().optional(), statement: z.string().trim().min(10).max(10000), options: z.array(z.string().trim().min(1).max(2000)).min(2).max(5), answer: z.number().int().min(0).max(4), explanation: z.string().trim().min(10).max(5000), difficulty: z.number().int().min(1).max(10), source: z.string().max(200).default('Autoral NEXO'), source_year: z.number().int().min(1900).max(2100).nullable().optional(), exam: z.string().max(100).default('Geral'), status: z.enum(['draft', 'published', 'inactive']).default('draft') }).refine(q => q.answer < q.options.length, { message: 'Gabarito fora das alternativas', path: ['answer'] });
export function safeRedirect(path: string | null) {
  return path && /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(path) ? path : '/inicio';
}
