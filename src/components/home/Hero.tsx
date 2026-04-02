import Link from "next/link";

import { HeroCarousel } from "@/components/home/HeroCarousel";
import { TrustChips } from "@/components/home/TrustChips";
import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { formatBrandText, siteConfig } from "@/lib/site";
import type { CatalogItem } from "@/lib/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80";

type Props = {
  previewItems: CatalogItem[];
};

function sortWomenFirst(items: CatalogItem[]) {
  return [...items].sort((a, b) => {
    const ag = a.audience === "girls" ? 1 : 0;
    const bg = b.audience === "girls" ? 1 : 0;
    return ag - bg;
  });
}

export async function Hero({ previewItems }: Props) {
  const dict = await getDictionary();
  const wa = buildWhatsAppUrl(dict.wa.hero.replace("{{name}}", siteConfig.name));

  const ordered = sortWomenFirst(previewItems).slice(0, 5);
  const heroAlt = ordered[0]?.image.alt ?? dict.hero.imageAria;

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent/[0.12] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#e8dfd6]/50 blur-3xl"
        aria-hidden
      />

      <div className="page-container py-6 pb-6 md:section-y">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
          {/* Copy column: mobile defers primary WhatsApp to sticky bar; desktop shows hero CTA */}
          <div className="order-1 w-full max-w-xl animate-fade-up md:max-w-none lg:order-1 lg:w-[60%] lg:min-w-0 lg:pr-4">
            {/* Same hierarchy as desktop: tagline (+ service lines on mobile only — md+ shows those in header) → headline */}
            <div className="mb-1 space-y-1 text-center md:mb-2 md:text-left">
              <p className="font-display text-sm font-normal italic leading-snug text-[#7a756f] sm:text-base md:text-lg">
                {formatBrandText(dict.site.headerTagline)}
              </p>
              <p className="mx-auto max-w-[22rem] text-[11px] leading-snug text-pretty text-[#94908c] sm:text-xs md:hidden">
                {dict.site.subtitle}
              </p>
            </div>

            <h1 className="text-center font-display text-[1.65rem] font-semibold leading-[1.18] tracking-tight text-pretty text-foreground sm:text-[1.85rem] md:text-left md:text-4xl xl:text-[2.75rem]">
              {dict.hero.headline}
            </h1>

            {/* Hero WhatsApp CTA: desktop only — mobile uses sticky bar to avoid duplicate */}
            <div className="mt-4 hidden md:mt-5 md:block">
              <Button
                href={wa}
                external
                variant="primary"
                className="min-h-[52px] w-full rounded-xl px-5 text-base shadow-[0_4px_16px_-2px_rgba(196,138,138,0.55)] md:max-w-md md:rounded-2xl md:px-6"
              >
                {dict.hero.startWhatsapp}
              </Button>
            </div>

            <p className="mx-auto mt-4 max-w-[22rem] text-center text-sm leading-relaxed text-pretty text-muted md:mt-3 md:mx-0 md:max-w-xl md:text-left md:text-lg">
              {dict.hero.body}
            </p>

            <div className="mt-4 md:mt-5">
              <Button
                href="/gallery"
                variant="secondary"
                className="min-h-11 w-full rounded-xl px-5 py-2.5 text-sm md:min-h-12 md:w-auto md:rounded-2xl md:px-6 md:text-sm"
              >
                {dict.hero.explore}
              </Button>
            </div>

            <TrustChips
              variant="hero"
              className="mt-4 justify-center md:justify-start [&_li]:px-2.5 [&_li]:py-1.5 [&_li]:text-[11px] sm:[&_li]:px-3 sm:[&_li]:py-2 sm:[&_li]:text-xs"
            />

            <div className="mt-5 md:mt-6">
              <div className="flex flex-col items-center gap-1 sm:hidden">
                <Link
                  href="/book"
                  className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-medium text-accent-dark underline-offset-4 hover:underline"
                >
                  {dict.hero.bookFitting}
                </Link>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-medium text-accent-dark underline-offset-4 hover:underline"
                >
                  {dict.hero.messageWa}
                </a>
              </div>
              <p className="hidden flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted sm:flex md:justify-start md:text-left md:text-sm">
                <Link
                  href="/book"
                  className="font-medium text-accent-dark underline-offset-4 hover:underline"
                >
                  {dict.hero.bookFitting}
                </Link>
                <span aria-hidden className="select-none text-muted">
                  ·
                </span>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent-dark underline-offset-4 hover:underline"
                >
                  {dict.hero.messageWa}
                </a>
              </p>
            </div>
          </div>

          <div className="order-2 w-full lg:w-[40%] lg:max-w-[440px] lg:shrink-0">
            <HeroCarousel
              items={ordered}
              fallbackSrc={FALLBACK_HERO_IMG}
              fallbackAlt={heroAlt}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
