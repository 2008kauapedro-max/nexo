'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { brand } from '@/config/brand';
export interface ActionState { error?: string; success?: string }
const credentials = z.object({ email: z.email().max(254), password: z.string().min(10,'Use pelo menos 10 caracteres.').max(128) });
export async function authenticate(mode: 'login' | 'signup' | 'reset' | 'update', _previous: ActionState, form: FormData): Promise<ActionState> {
  const db = await supabase();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (mode === 'reset') {
    if (!z.email().max(254).safeParse(email).success) return { error: 'Digite um e-mail válido.' };
    await db.auth.resetPasswordForEmail(email, { redirectTo: `${brand.url}/auth/callback?next=/redefinir-senha` });
    return { success: 'Se existir uma conta com esse e-mail, você receberá um link para redefinir sua senha.' };
  }
  if (mode === 'update') {
    if (password.length < 10 || password.length > 128) return { error: 'Use entre 10 e 128 caracteres.' };
    const { error } = await db.auth.updateUser({ password });
    if (error) return { error: 'Link expirado ou sessão inválida. Solicite um novo link.' };
    redirect('/inicio');
  }
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = mode === 'signup' ? await db.auth.signUp({ ...parsed.data, options: { emailRedirectTo: `${brand.url}/auth/callback` } }) : await db.auth.signInWithPassword(parsed.data);
  if (error) return { error: mode === 'login' ? 'Não foi possível entrar. Confira seus dados ou tente novamente mais tarde.' : 'Não foi possível criar sua conta. Tente novamente mais tarde ou recupere sua senha.' };
  if (!data.session) return { success: 'Confira seu e-mail para confirmar o cadastro e começar.' };
  redirect('/inicio');
}
export async function logout() { const db = await supabase(); await db.auth.signOut(); redirect('/entrar'); }
