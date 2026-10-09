import "server-only";
type Event = "auth_rejected" | "captcha_required" | "admin_denied" | "rate_limited" | "invalid_origin" | "payload_rejected" | "webhook_rejected" | "reauth_rejected";
/** Deliberately accepts no request, payload, email, IP, token or arbitrary message. */
export function securityEvent(event: Event) {
  const id = crypto.randomUUID();
  console.warn("nexo_security", {id,event,at:new Date().toISOString()});
  return id;
}
