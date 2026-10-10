import { redirect } from "next/navigation";
import { z } from "zod";
// Old bookmarks retain their question context; standalone chat is gone.
export default async function LegacyTutor({
  searchParams,
}: {
  searchParams: Promise<{ questao?: string; sessao?: string }>;
}) {
  const p = await searchParams;
  if (
    z.uuid().safeParse(p.questao).success &&
    z.uuid().safeParse(p.sessao).success
  )
    redirect("/sessao/" + p.sessao + "?questao=" + p.questao);
  redirect("/estudar");
}
