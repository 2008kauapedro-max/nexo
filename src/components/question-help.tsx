"use client";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";
const Tutor = dynamic(() => import("./tutor").then((m) => m.Tutor), {
  ssr: false,
});
export function QuestionHelp({
  question,
  session,
  label,
}: {
  question: string;
  session: string;
  label?: string;
}) {
  const t = useTranslations("contextual");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="button secondary"
        onClick={() => setOpen(true)}
      >
        {label || t("title")}
      </button>
      {open && (
        <Tutor
          question={question}
          session={session}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
