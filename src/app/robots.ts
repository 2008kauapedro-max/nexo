import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacidade"],
      disallow: [
        "/inicio",
        "/estudar",
        "/perfil",
        "/sessao",
        "/resultado",
        "/admin",
        "/api",
        "/ia",
        "/onboarding",
        "/simulados",
        "/preferencias",
        "/diagnostico",
      ],
    },
  };
}
