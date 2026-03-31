import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteConfig.name} — ${dict.meta.title}`,
      template: `%s · ${siteConfig.name}`,
    },
    description: dict.meta.description,
    openGraph: {
      title: `${siteConfig.name} — ${dict.meta.title}`,
      description: dict.meta.description,
      url: siteUrl,
      siteName: siteConfig.name,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.name} — ${dict.meta.title}`,
      description: dict.meta.description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <I18nProvider locale={locale} dict={dict}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
