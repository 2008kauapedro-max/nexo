"use client";
import { useActionState } from "react";
import Link from "next/link";
import { authenticate, type ActionState } from "@/app/actions/auth";
import { useTranslations } from "next-intl";
export function AuthForm({
  mode,
}: {
  mode: "login" | "signup" | "reset" | "update";
}) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    {} as ActionState,
  );
  return (
    <form action={action} className="form-stack">
      {mode !== "update" && (
        <label>
          {t("email")}
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            required
            maxLength={254}
          />
        </label>
      )}
      {mode !== "reset" && (
        <label>
          {t("password")}
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={10}
            maxLength={128}
            required
            placeholder={t("passwordPlaceholder")}
          />
        </label>
      )}
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice success">
          {state.success}
        </p>
      )}
      <button className="button primary full" disabled={pending}>
        {pending ? common("wait") : t(mode)}
      </button>
      {mode === "login" && (
        <Link className="text-link" href="/esqueci-senha">
          {t("forgot")}
        </Link>
      )}
    </form>
  );
}
