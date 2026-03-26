"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { siteConfig } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

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
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <Link href="/" className="group flex flex-col leading-tight">
            <span className="truncate font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent-dark sm:text-xl md:text-2xl">
              {siteConfig.name}
            </span>
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.2em]">
              {dict.site.subtitle}
            </span>
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
            className="hidden rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark sm:inline-flex"
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
