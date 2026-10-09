"use client";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  reauthenticateDeletion,
  deleteAccount,
  type DeletionState,
} from "@/app/actions/account";
import { Captcha } from "./captcha";
function DeletionSteps({
  hasMfa,
  onCancel,
}: {
  hasMfa: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations("security");
  const common = useTranslations("common");
  const [reauth, reauthAction, pending] = useActionState(
    reauthenticateDeletion,
    {} as DeletionState,
  );
  const [deletion, deleteAction] = useActionState(
    deleteAccount,
    {} as DeletionState,
  );
  return (
    <>
      <form action={reauthAction} className="form-stack">
        <label>
          {t("password")}
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
            maxLength={128}
          />
        </label>
        {hasMfa && (
          <label>
            {t("factorCode")}
            <input
              name="factorCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
            />
          </label>
        )}
        <Captcha resetKey={reauth} />
        {reauth.error && (
          <p role="alert" className="notice error">
            {reauth.error}
          </p>
        )}
        <div className="toolbar">
          <button
            type="button"
            className="button secondary"
            disabled={pending}
            onClick={onCancel}
          >
            {t("cancel")}
          </button>
          <button className="button secondary" disabled={pending}>
            {pending ? common("wait") : t("verifyIdentity")}
          </button>
        </div>
      </form>
      {reauth.verified && (
        <form
          action={deleteAction}
          className="form-stack"
          style={{ marginTop: 20 }}
        >
          <p role="status">{t("identityVerified")}</p>
          <label>
            {t("deleteConfirm")}
            <input
              name="confirmation"
              required
              pattern="EXCLUIR"
              maxLength={7}
              autoComplete="off"
            />
          </label>
          <p className="notice">{t("deletionPending")}</p>
          {deletion.error && (
            <p role="alert" className="notice error">
              {deletion.error}
            </p>
          )}
          <button disabled className="button secondary danger-button">
            {t("deleteButton")}
          </button>
        </form>
      )}
    </>
  );
}
export function DeleteAccount({
  password,
  hasMfa,
  admin,
}: {
  password: boolean;
  hasMfa: boolean;
  admin: boolean;
}) {
  const t = useTranslations("security");
  const [started, setStarted] = useState(false);
  return (
    <section className="panel" style={{ marginTop: 35 }}>
      <h2>{t("dangerZone")}</h2>
      <details
        onToggle={(e) => {
          if (!e.currentTarget.open) setStarted(false);
        }}
      >
        <summary>{t("deleteTitle")}</summary>
        <p>{t("deleteWarning")}</p>
        {admin ? (
          <p role="status" className="notice">
            {t("adminDeletion")}
          </p>
        ) : !password ? (
          <p role="status" className="notice">
            {t("methodPending")}
          </p>
        ) : !started ? (
          <div className="toolbar">
            <button
              type="button"
              className="button secondary"
              onClick={(e) =>
                e.currentTarget.closest("details")?.removeAttribute("open")
              }
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setStarted(true)}
            >
              {t("continue")}
            </button>
          </div>
        ) : (
          <DeletionSteps hasMfa={hasMfa} onCancel={() => setStarted(false)} />
        )}
      </details>
    </section>
  );
}
