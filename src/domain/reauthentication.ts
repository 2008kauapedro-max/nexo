import { z } from "zod";
const claimsSchema = z.object({
  sub: z.uuid(),
  session_id: z.uuid(),
  exp: z.number(),
  aal: z.enum(["aal1", "aal2"]),
  amr: z
    .array(z.object({ method: z.string(), timestamp: z.number().finite() }))
    .default([]),
});
export type ReauthenticationPolicy = {
  userId: string;
  hasMfa: boolean;
  // Enable a method only after its real provider/callback flow is verified.
  enabledMethods: readonly ("password" | "oauth" | "otp" | "magiclink")[];
};
/** Input must come from Auth.getClaims(), never a browser-decoded JWT or form field. */
export function recentAuthentication(
  claims: unknown,
  policy: ReauthenticationPolicy,
  now = Date.now(),
) {
  const parsed = claimsSchema.safeParse(claims);
  if (
    !parsed.success ||
    parsed.data.sub !== policy.userId ||
    parsed.data.exp <= now / 1000
  )
    return false;
  const fresh = (timestamp: number) =>
    timestamp >= now / 1000 - 300 && timestamp <= now / 1000 + 30;
  if (
    !parsed.data.amr.some(
      (m) =>
        policy.enabledMethods.some((method) => method === m.method) &&
        fresh(m.timestamp),
    )
  )
    return false;
  if (
    policy.hasMfa &&
    (parsed.data.aal !== "aal2" ||
      !parsed.data.amr.some((m) => m.method === "totp" && fresh(m.timestamp)))
  )
    return false;
  return true;
}
export function authenticationMethods(claims: unknown) {
  const parsed = claimsSchema.safeParse(claims);
  return parsed.success ? parsed.data.amr.map((m) => m.method) : [];
}
