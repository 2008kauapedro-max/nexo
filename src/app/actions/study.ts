'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/supabase';
import { onboardingSchema } from '@/domain/validation';
import type { ActionState } from './auth';
export async function savePreferences(_previous: ActionState, form: FormData): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse({ name: form.get('name'), goal: form.get('goal'), subjects: form.getAll('subjects'), level: form.get('level'), dailyGoal: Number(form.get('dailyGoal')) });
  if (!parsed.success) return { error: 'Confira seu nome, objetivo e selecione ao menos uma matéria.' };
  const { db } = await requireUser(); const p = parsed.data;
  const { error } = await db.rpc('save_preferences',{ p_name: p.name, p_goal: p.goal, p_subjects: p.subjects, p_level: p.level, p_daily_goal: p.dailyGoal });
  if (error) return { error: 'Não foi possível salvar. Tente novamente.' };
  revalidatePath('/inicio'); redirect(p.level === 'unknown' ? '/diagnostico' : '/inicio');
}
const sessionSchema = z.object({ mode: z.enum(['practice','diagnostic','review','simulation']), subject: z.uuid().nullable(), topic: z.uuid().nullable(), target: z.number().int().min(5).max(180), minutes: z.number().int().min(5).max(300) });
export async function startStudy(_previous: ActionState, form: FormData): Promise<ActionState> {
  const parsed = sessionSchema.safeParse({ mode: form.get('mode'), subject: form.get('subject') || null, topic: form.get('topic') || null, target: Number(form.get('target') || 10), minutes: Number(form.get('minutes') || 30) });
  if (!parsed.success) return { error: 'Confira a configuração da sessão.' };
  const {db} = await requireUser(); const p=parsed.data;
  const {data,error} = await db.rpc('start_session',{p_mode:p.mode,p_subject:p.subject ?? undefined,p_topic:p.topic ?? undefined,p_target:p.target,p_minutes:p.minutes});
  if(error) return {error:error.message.includes('PLAN_LIMIT') ? 'Seu plano permite simulados de até 10 questões. Diminua a quantidade para continuar.' : 'Não foi possível iniciar. Tente novamente em alguns instantes.'};
  redirect(`/sessao/${data}`);
}
export async function answerQuestion(sessionId:string,questionId:string,selected:number) {
  if(!z.uuid().safeParse(sessionId).success || !z.uuid().safeParse(questionId).success || !z.number().int().min(0).max(4).safeParse(selected).success) return {error:'Resposta inválida.'};
  const {db}=await requireUser();
  const {data,error}=await db.rpc('submit_answer',{p_session:sessionId,p_question:questionId,p_selected:selected});
  if(error) return {error:error.message.includes('DAILY_LIMIT') ? 'Você atingiu seu limite diário de questões. Volte amanhã para continuar.' : 'Não foi possível registrar. A sessão pode ter expirado. Tente novamente.'};
  revalidatePath('/inicio');
  return {data:data as {correct:boolean|null;answer:number|null;explanation:string|null;xp:number}};
}
