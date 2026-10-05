"use client";
import { useActionState } from "react";
import { deleteAccount } from "@/app/actions/account";
export function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteAccount, {});
  return (
    <details className="panel" style={{ marginTop: 35 }}>
      <summary>Excluir minha conta</summary>
      <form className="form-stack" action={action} style={{ marginTop: 20 }}>
        <p>
          Esta ação remove sua conta e seu histórico de estudos permanentemente.
          Baixe seus dados antes de continuar.
        </p>
        <label>
          Digite EXCLUIR para confirmar
          <input
            name="confirmation"
            required
            pattern="EXCLUIR"
            autoComplete="off"
          />
        </label>
        {state.error && (
          <p role="alert" className="notice error">
            {state.error}
          </p>
        )}
        <button disabled={pending} className="button secondary danger-button">
          Excluir minha conta permanentemente
        </button>
      </form>
    </details>
  );
}
