"use client";
import { useSyncExternalStore } from "react";
function subscribe(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
export function ConnectionStatus() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  return online ? null : (
    <div className="connection-status" role="status">
      Você está offline. Aguarde a conexão antes de enviar sua resposta. O
      progresso já confirmado está salvo.
    </div>
  );
}
