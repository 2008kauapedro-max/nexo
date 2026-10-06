import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Database } from "./database.types";
export async function supabase() {
  const jar = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (updates) => {
          try {
            updates.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server Components refresh through proxy. */
          }
        },
      },
    },
  );
}
export const currentIdentity = cache(async function currentIdentity() {
  const db = await supabase();
  const { data, error } = await db.auth.getUser();
  return { db, user: error ? null : data.user };
});
export const requireUser = cache(async function requireUser() {
  const identity = await currentIdentity();
  if (!identity.user) redirect("/entrar");
  return { db: identity.db, user: identity.user };
});
export const currentProfile = cache(async function currentProfile() {
  const { db, user } = await requireUser();
  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error)
    throw new Error("Não foi possível carregar seu perfil. Tente novamente.");
  return { db, user, profile };
});
export const requireProfile = cache(async function requireProfile() {
  const result = await currentProfile();
  if (!result.profile.onboarding_complete) redirect("/onboarding");
  return result;
});
