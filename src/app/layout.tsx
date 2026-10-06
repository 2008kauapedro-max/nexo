import type { Metadata, Viewport } from "next";
import { brand } from "@/config/brand";
import "./globals.css";
import { Pwa } from "@/components/pwa";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("landing"),
    getLocale(),
  ]);
  return {
    metadataBase: new URL(brand.url),
    title: {
      default: `${brand.name} — ${t("slogan")}`,
      template: `%s | ${brand.name}`,
    },
    description: t("metaDescription"),
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: brand.name,
      description: t("metaDescription"),
      locale: locale.replace("-", "_"),
      type: "website",
    },
    icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  };
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141817",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await headers();
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("navigation"),
  ]);
  return (
    <html lang={locale} dir="ltr" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          {t("skip")}
        </a>
        <NextIntlClientProvider>
          {children}
          <Pwa />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
