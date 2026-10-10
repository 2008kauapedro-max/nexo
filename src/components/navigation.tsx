"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  BookOpen,
  ClipboardList,
  RotateCcw,
  UserRound,
} from "lucide-react";
const items = [
  { href: "/inicio", label: "home", icon: Home },
  { href: "/estudar", label: "study", icon: BookOpen },
  { href: "/caderno", label: "review", icon: RotateCcw },
  { href: "/simulados", label: "simulations", icon: ClipboardList },
  { href: "/perfil", label: "profile", icon: UserRound },
];
export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  const t = useTranslations("navigation");
  return (
    <nav
      className={mobile ? "bottom-nav" : ""}
      aria-label={t(mobile ? "mobile" : "main")}
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className={path.startsWith(href) ? "active" : ""}
          aria-current={path.startsWith(href) ? "page" : undefined}
        >
          <Icon size={19} />
          <span>{t(label)}</span>
        </Link>
      ))}
    </nav>
  );
}
