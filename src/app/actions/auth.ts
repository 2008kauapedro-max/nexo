"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { brand } from "@/config/brand";
import { getTranslations } from "next-intl/server";
export interface ActionState {
  error?: string;
  success?: string;
}
const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});
export async function authenticate(
  mode: "login" | "signup" | "reset" | "update",
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const t = await getTranslations("auth");
  const db = await supabase();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (mode === "reset") {
    if (!z.email().max(254).safeParse(email).success)
      return { error: t("invalidEmail") };
    await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${brand.url}/auth/callback?next=/redefinir-senha`,
    });
    return {
      success: t("recoverySent"),
    };
  }
  if (mode === "update") {
    if (password.length < 10 || password.length > 128)
      return { error: t("invalidPassword") };
    const { error } = await db.auth.updateUser({ password });
    if (error)
      return {
        error: t("invalidSession"),
      };
    redirect("/inicio");
  }
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success)
    return {
      error: t(
        parsed.error.issues[0].path[0] === "email"
          ? "invalidEmail"
          : "invalidPassword",
      ),
    };
  const { data, error } =
    mode === "signup"
      ? await db.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${brand.url}/auth/callback` },
        })
      : await db.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error: mode === "login" ? t("loginError") : t("signupError"),
    };
  if (!data.session)
    return {
      success: t("confirmEmail"),
    };
  redirect("/inicio");
}
export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/entrar");
}
