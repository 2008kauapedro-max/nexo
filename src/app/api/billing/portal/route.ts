import { currentIdentity } from "@/lib/supabase";
import { isSameOriginRequest } from "@/domain/request-origin";

function target(request: Request, path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const base =
    configured && /^https?:\/\//.test(configured)
      ? new URL(configured).origin
      : new URL(request.url).origin;
  return new URL(path, base);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return Response.json({ error: "Forbidden." }, { status: 403 });

  const { user } = await currentIdentity();
  if (!user) return Response.redirect(target(request, "/entrar"), 303);

  return Response.redirect(target(request, "/assinatura"), 303);
}
