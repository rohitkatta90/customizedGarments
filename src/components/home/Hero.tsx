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

      <div className="page-container section-y">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
          {/* Mobile: image first; desktop: text 60%, carousel 40% */}
          <div className="order-1 w-full lg:order-2 lg:w-[40%] lg:max-w-[440px] lg:shrink-0">
            <HeroCarousel
              items={ordered}
              fallbackSrc={FALLBACK_HERO_IMG}
              fallbackAlt={heroAlt}
            />
          </div>

          <div className="order-2 max-w-none animate-fade-up lg:order-1 lg:w-[60%] lg:min-w-0 lg:pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
              {formatBrandText(dict.hero.eyebrow)}
            </p>
            <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl xl:text-[2.75rem]">
              {dict.hero.headline}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg line-clamp-2 [overflow-wrap:anywhere]">
              {dict.hero.body}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={wa} external variant="primary" className="min-h-[52px] w-full sm:min-w-[200px] sm:flex-initial">
                {dict.hero.startWhatsapp}
              </Button>
              <Button href="/gallery" variant="secondary" className="min-h-[52px] w-full sm:w-auto">
                {dict.hero.explore}
              </Button>
            </div>
            <TrustChips variant="hero" className="mt-6" />
            <p className="mt-5 text-xs text-muted sm:text-sm">
              <Link
                href="/book"
                className="font-medium text-accent-dark underline-offset-4 hover:underline"
              >
                {dict.hero.bookFitting}
              </Link>
              <span className="mx-2 hidden sm:inline">·</span>
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
      </div>
    </section>
  );
}
