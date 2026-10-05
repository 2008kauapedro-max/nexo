"use client";
import { useActionState } from "react";
import Link from "next/link";
import { authenticate, type ActionState } from "@/app/actions/auth";
export function AuthForm({
  mode,
}: {
  mode: "login" | "signup" | "reset" | "update";
}) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    {} as ActionState,
  );
  return (
    <form action={action} className="form-stack">
      {mode !== "update" && (
        <label>
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
            maxLength={254}
          />
        </label>
      )}
      {mode !== "reset" && (
        <label>
          Senha
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={10}
            maxLength={128}
            required
            placeholder="Pelo menos 10 caracteres"
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
        {pending
          ? "Aguarde…"
          : {
              login: "Entrar",
              signup: "Criar minha conta",
              reset: "Enviar link de recuperação",
              update: "Salvar nova senha",
            }[mode]}
      </button>
      {mode === "login" && (
        <Link className="text-link" href="/esqueci-senha">
          Esqueci minha senha
        </Link>
      )}
    </form>
  );
}
