import "server-only";

const DEFAULT_BASE = "https://api.asaas.com/v3";

export type PaidPlanId = "pro" | "premium";

function baseUrl() {
  return (process.env.ASAAS_API_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
}

export function asaasBillingReady() {
  return Boolean(
    process.env.ASAAS_API_KEY &&
    process.env.ASAAS_WEBHOOK_TOKEN &&
    process.env.SUPABASE_SECRET_KEY,
  );
}

export async function asaasRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_NOT_CONFIGURED");

  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "User-Agent": "NEXO/1.0",
      access_token: key,
      ...init.headers,
    },
    signal: AbortSignal.timeout(15000),
  });

  const raw = await response.text();

  if (!response.ok) {
    console.error("Asaas request failed", {
      status: response.status,
      path,
    });
    throw new Error(`ASAAS_HTTP_${response.status}`);
  }

  return (raw ? JSON.parse(raw) : {}) as T;
}

export function asaasCheckoutUrl(id: string) {
  return `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(id)}`;
}

export function asaasNextDueDate() {
  return new Date(Date.now() + 5 * 60 * 1000).toLocaleString("sv-SE", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}
