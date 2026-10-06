import Link from "next/link";
import { useTranslations } from "next-intl";
const sections = [
  ["Conta e segurança", "/configuracoes/conta", "E-mail, senha e acesso"],
  ["Aprendizagem", "/preferencias", "Objetivos, matérias e meta diária"],
  [
    "Notificações",
    "/configuracoes/notificacoes",
    "Estudos, conquistas e novidades",
  ],
  [
    "Privacidade e dados",
    "/configuracoes/dados",
    "Exportar ou excluir seus dados",
  ],
  ["Assinatura", "/planos", "Planos, uso e disponibilidade"],
  [
    "Ajuda e sobre",
    "/configuracoes/ajuda",
    "Como funciona e informações do produto",
  ],
];
export default function Settings() {
  const t = useTranslations("settings.language");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DO SEU JEITO</span>
          <h1>Configurações.</h1>
          <p>Encontre o que precisa, uma escolha por vez.</p>
        </div>
      </div>
      {[
        [t("title"), "/configuracoes/idioma", t("description")],
        ...sections,
      ].map(([name, href, description]) => (
        <Link className="row-card" key={href} href={href}>
          <div>
            <h2>{name}</h2>
            <p>{description}</p>
          </div>
          <span>→</span>
        </Link>
      ))}
    </>
  );
}
