import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV !== "production";
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.supabase.co${dev ? " ws: http://localhost:*" : ""}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; worker-src 'self';`;
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers } });
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: {
          httpOnly: true,
          secure: !dev,
          sameSite: "lax",
          path: "/",
        },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (updates) => {
            updates.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            headers.set("cookie", request.cookies.toString());
            response = NextResponse.next({ request: { headers } });
            updates.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    if (request.cookies.getAll().some((c) => c.name.startsWith("sb-")))
      await client.auth.getClaims();
  }
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|.*\\.(?:svg|png|ico)$).*)",
  ],
};
