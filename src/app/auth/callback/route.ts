import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { safeRedirect } from "@/domain/validation";
import { brand } from "@/config/brand";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!url.searchParams.has("error") && code && code.length <= 2048) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeRedirect(url.searchParams.get("next")), brand.url),
      );
  }
  return NextResponse.redirect(new URL("/entrar?erro=callback", brand.url));
}
