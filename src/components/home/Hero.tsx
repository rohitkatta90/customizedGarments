import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/server";
import { siteConfig } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function Hero() {
  const dict = await getDictionary();
  const wa = buildWhatsAppUrl(
    dict.wa.hero.replace("{{name}}", siteConfig.name),
  );

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-[#fdf8f6] to-background">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[#f5e6e8]/80 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#e8dfd6]/70 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-xl animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-dark">
            {dict.hero.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            {dict.hero.headline}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{dict.hero.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/gallery" variant="primary">
              {dict.hero.explore}
            </Button>
            <Button href="/request?service=stitching" variant="secondary">
              {dict.hero.requestStitching}
            </Button>
            <Button href="/request?service=alteration" variant="secondary">
              {dict.hero.requestAlteration}
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-dark underline-offset-4 hover:underline"
            >
              {dict.hero.messageWa}
            </a>
            <span className="hidden sm:inline">·</span>
            <Link
              href="/book"
              className="font-medium text-accent-dark underline-offset-4 hover:underline"
            >
              {dict.hero.bookFitting}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:flex-1">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_20px_60px_-20px_rgba(45,36,36,0.25)]">
            <div
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80')] bg-cover bg-center"
              role="img"
              aria-label={dict.hero.imageAria}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-sm">
              <p className="font-display text-lg font-semibold text-foreground">
                {dict.hero.cardTitle}
              </p>
              <p className="mt-1 text-sm text-muted">{dict.hero.cardSubtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
