import type { Metadata, Viewport } from "next";
import { brand } from "@/config/brand";
import "./globals.css";
import { Pwa } from "@/components/pwa";
import { headers } from "next/headers";
export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} — ${brand.slogan}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: brand.name,
    description: brand.description,
    locale: "pt_BR",
    type: "website",
  },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141817",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await headers();
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Pular para o conteúdo
        </a>
        {children}
        <Pwa />
      </body>
    </html>
  );
}
