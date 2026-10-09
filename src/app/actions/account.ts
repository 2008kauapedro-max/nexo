"use server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { accountSecurity } from "@/lib/account-security";
import { captchaToken } from "@/domain/captcha";
import { recentAuthentication } from "@/domain/reauthentication";
import { securityEvent } from "@/lib/security-events";
export type DeletionState = { error?: string; verified?: boolean };
export async function reauthenticateDeletion(
  _previous: DeletionState,
  form: FormData,
): Promise<DeletionState> {
  const t = await getTranslations("security");
  const access = await accountSecurity();
  if (!access.ready) return { error: t("reauthError") };
  if (access.admin) return { error: t("adminDeletion") };
  if (!access.password) return { error: t("methodPending") };
  const password = z.string().min(10).max(128).safeParse(form.get("password"));
  if (!password.success || !access.user.email)
    return { error: t("reauthError") };
  let token: string | undefined;
  try {
    token = captchaToken(
      form.get("captchaToken"),
      !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    );
  } catch {
    return { error: t("captchaError") };
  }
  const { data, error } = await access.db.auth.signInWithPassword({
    email: access.user.email,
    password: password.data,
    options: { captchaToken: token },
  });
  if (error || data.user.id !== access.user.id) {
    securityEvent("reauth_rejected");
    return { error: t("reauthError") };
  }
  if (access.hasMfa) {
    const code = z
      .string()
      .regex(/^\d{6}$/)
      .safeParse(form.get("factorCode"));
    if (!code.success || !access.totp.length)
      return { error: t("factorError") };
    const verified = await access.db.auth.mfa.challengeAndVerify({
      factorId: access.totp[0],
      code: code.data,
    });
    if (verified.error) {
      securityEvent("reauth_rejected");
      return { error: t("factorError") };
    }
  }
  const claims = await access.db.auth.getClaims();
  // This action has just verified the credential directly with Auth. Its signed
  // issuance time avoids workstation clock drift in this UI-only proof. Never
  // reuse this time basis to authorize deletion: the DB must use its own now()
  // and validate the live session again for every destructive request.
  const issuedAt = claims.data?.claims.iat;
  if (
    claims.error ||
    typeof issuedAt !== "number" ||
    !Number.isFinite(issuedAt) ||
    !recentAuthentication(
      claims.data?.claims,
      {
        userId: access.user.id,
        hasMfa: access.hasMfa,
        enabledMethods: ["password"],
      },
      issuedAt * 1000,
    )
  )
    return { error: t("reauthError") };
  return { verified: true };
}
// Await the separately approved DB gate; never call the older RPC from this staged flow.
export async function deleteAccount(
  _previous: DeletionState,
  form: FormData,
): Promise<DeletionState> {
  const t = await getTranslations("security");
  if (form.get("confirmation") !== "EXCLUIR")
    return { error: t("deleteConfirm") };
  await accountSecurity();
  return { error: t("deletionPending") };
}
