import Link from "next/link";
import { brand } from "@/config/brand";
import { useTranslations } from "next-intl";
export function Logo() {
  const t = useTranslations("navigation");
  return (
    <Link href="/" className="logo" aria-label={`${brand.name} — ${t("home")}`}>
      <svg
        className="brand-symbol"
        viewBox="0 0 40 40"
        width="34"
        height="34"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="11" fill="currentColor" />
        <path
          d="M10 29V12h5v3c2-3 4-4 7-4 6 0 9 4 9 10v8h-5v-8c0-4-2-6-5-6s-6 3-6 6v8z"
          fill="#d7f472"
        />
      </svg>
      <span className="brand-wordmark">
        {brand.name}
        <span>.</span>
      </span>
    </Link>
  );
}
