import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Database,
  Globe2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Settings() {
  const t = await getTranslations("settings.language");
  const sections = [
    {
      name: t("title"),
      href: "/configuracoes/idioma",
      description: t("description"),
      icon: Globe2,
    },
    {
      name: "Conta e seguranÃ§a",
      href: "/configuracoes/conta",
      description: "E-mail, senha e acesso",
      icon: ShieldCheck,
    },
    {
      name: "Aprendizagem",
      href: "/preferencias",
      description: "Objetivos, matÃ©rias e meta diÃ¡ria",
      icon: Target,
    },
    {
      name: "NotificaÃ§Ãµes",
      href: "/configuracoes/notificacoes",
      description: "Estudos, conquistas e novidades",
      icon: Bell,
    },
    {
      name: "Privacidade e dados",
      href: "/configuracoes/dados",
      description: "ExportaÃ§Ã£o, privacidade e conta",
      icon: Database,
    },
    {
      name: "Assinatura",
      href: "/planos",
      description: "Seu plano, benefÃ­cios e cobranÃ§a",
      icon: CreditCard,
    },
    {
      name: "Ajuda e sobre",
      href: "/configuracoes/ajuda",
      description: "Como funciona e informaÃ§Ãµes do produto",
      icon: CircleHelp,
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DO SEU JEITO</span>
          <h1>ConfiguraÃ§Ãµes.</h1>
          <p>Tudo organizado por assunto, sem caÃ§a ao menu.</p>
        </div>
      </div>

      <div className="settings-grid">
        {sections.map(({ name, href, description, icon: Icon }) => (
          <Link className="settings-card" key={href} href={href}>
            <span className="settings-icon">
              <Icon size={20} />
            </span>
            <div>
              <h2>{name}</h2>
              <p>{description}</p>
            </div>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
    </>
  );
}
