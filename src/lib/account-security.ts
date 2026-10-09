import "server-only";
import { cache } from "react";
import { requireUser } from "./supabase";
import { authenticationMethods } from "@/domain/reauthentication";
export const accountSecurity = cache(async () => {
  const { db, user } = await requireUser();
  const [claims, factors, role] = await Promise.all([
    db.auth.getClaims(),
    db.auth.mfa.listFactors(),
    db.rpc("admin_role"),
  ]);
  if (claims.error || factors.error || role.error)
    return {
      db,
      user,
      ready: false,
      password: false,
      oauth: false,
      totp: [] as string[],
      hasMfa: false,
      admin: false,
    };
  const methods = authenticationMethods(claims.data?.claims);
  const verified = factors.data.all.filter((f) => f.status === "verified");
  return {
    db,
    user,
    ready: true,
    password: methods.includes("password"),
    oauth: (user.identities || []).some(
      (i) => i.provider !== "email" && i.provider !== "phone",
    ),
    totp: verified.filter((f) => f.factor_type === "totp").map((f) => f.id),
    hasMfa: verified.length > 0,
    admin: !!role.data,
  };
});
