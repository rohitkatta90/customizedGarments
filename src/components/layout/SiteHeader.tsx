"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { formatBrandText, siteConfig } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const LOGO_SRC = "/images/radha-creations-logo.png";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { dict } = useI18n();

  const nav = useMemo(() => {
    const items = [
      { href: "/", label: dict.nav.home },
      { href: "/gallery", label: dict.nav.gallery },
      { href: "/request", label: dict.nav.request },
      { href: "/pricing", label: dict.nav.pricing },
      { href: "/faq", label: dict.nav.faq },
      { href: "/book", label: dict.nav.book },
    ] as const;
    return siteConfig.showPublicPricing ? items : items.filter((i) => i.href !== "/pricing");
  }, [dict]);

  const wa = buildWhatsAppUrl(
    dict.wa.header.replace("{{name}}", siteConfig.name),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[#f7f3f0]/90 backdrop-blur-md">
      <div className="page-container flex items-center gap-2 py-3.5 sm:gap-3 md:py-3">
        <div className="min-w-0 flex-1">
          <Link
            href="/"
            className="group flex items-center gap-1 md:items-end md:gap-6 lg:gap-1"
            aria-label={`${siteConfig.name} — home`}
          >
            <img
              src={LOGO_SRC}
              alt={siteConfig.name}
              width={506}
              height={493}
              decoding="async"
              className="h-10 w-auto shrink-0 object-contain transition duration-200 ease-out group-hover:opacity-90 md:h-[calc(1.3*(1.875rem*1.15+0.125rem+1.125rem*1.35))] md:max-h-[5.5rem]"
            />
            <div className="min-w-0 flex max-w-[min(100%,20rem)] flex-col leading-tight sm:max-w-md md:max-w-lg">
              <span className="font-display text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-dark md:text-3xl md:leading-[1.15]">
                {siteConfig.name}
              </span>
              <p className="mt-0.5 hidden font-display text-[11px] font-normal italic leading-snug text-[#7a756f] md:mt-1 md:block md:text-lg md:leading-snug md:tracking-normal">
                {formatBrandText(dict.site.headerTagline)}
              </p>
              <p className="mt-1 hidden text-[10px] font-normal leading-snug tracking-wide text-[#8a8580] md:mt-1.5 md:block md:text-[11px] md:leading-relaxed [overflow-wrap:anywhere]">
                {dict.site.subtitle}
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden min-w-0 shrink items-center gap-0.5 md:flex md:overflow-x-auto lg:gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-medium transition-colors md:shrink-0 lg:px-3 lg:text-sm ${
                  active
                    ? "bg-white text-accent-dark shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark md:inline-flex"
          >
            {dict.header.whatsapp}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card md:hidden"
            aria-expanded={open}
            aria-label={dict.header.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{dict.header.menu}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-xl bg-accent px-3 py-3 text-center font-semibold text-white"
            >
              {dict.header.chatMobile}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
