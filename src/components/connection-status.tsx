"use client";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
function subscribe(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
export function ConnectionStatus() {
  const t = useTranslations("errors");
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  return online ? null : (
    <div className="connection-status" role="status">
      {t("offline")}
    </div>
  );
}
