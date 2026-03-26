import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Noto_Sans_Devanagari } from "next/font/google";

import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const notoSansHi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = dictionaries[locale];

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
      locale: locale === "hi" ? "hi_IN" : "en_IN",
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
  const lang = locale === "hi" ? "hi" : "en";

  return (
    <html
      lang={lang}
      className={`${dmSans.variable} ${cormorant.variable} ${notoSansHi.variable} h-full`}
    >
      <body
        className={`flex min-h-full flex-col bg-background text-foreground antialiased ${
          locale === "hi" ? notoSansHi.className : dmSans.className
        }`}
      >
        <I18nProvider locale={locale} dict={dict}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
