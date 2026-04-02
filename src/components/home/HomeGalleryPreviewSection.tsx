import Link from "next/link";

import type { Dictionary } from "@/lib/i18n/types";
import { getDictionary } from "@/lib/i18n/server";
import type { CatalogCategory, CatalogItem } from "@/lib/types";

type Props = {
  items: CatalogItem[];
};

function categoryLabel(category: CatalogCategory, dict: Dictionary) {
  const s = dict.categoriesSingular;
  switch (category) {
    case "blouses":
      return s.blouses;
    case "kurtis":
      return s.kurtis;
    case "dresses":
      return s.dresses;
    case "custom-designs":
    default:
      return s.customDesigns;
  }
}

export async function HomeGalleryPreviewSection({ items }: Props) {
  const dict = await getDictionary();
  const s = dict.homeGalleryPreview;
  const slice = items.slice(0, 5);
  const showDesktop = slice.length > 0;

  return (
    <>
      <section
        className="border-b border-border/50 bg-gradient-to-b from-[#fdf8f6] to-card py-6 md:hidden"
        aria-labelledby="home-gallery-teaser-heading"
      >
        <div className="page-container">
          <h2 id="home-gallery-teaser-heading" className="sr-only">
            {s.title}
          </h2>
          <div className="mx-auto max-w-[22rem] space-y-4 text-center font-display text-[1.05rem] leading-relaxed text-pretty text-[#5c5855] sm:max-w-md sm:text-lg">
            <p>
              {s.mobileTeaserLine1Before}
              <Link
                href="/gallery"
                className="font-semibold text-accent-dark underline decoration-accent/40 underline-offset-[0.2em] transition hover:text-accent hover:decoration-accent"
              >
                {dict.nav.gallery}
              </Link>
              {s.mobileTeaserLine1After}
            </p>
            <p>{s.mobileTeaserLine2}</p>
          </div>
        </div>
      </section>

      {showDesktop ? (
        <section className="section-y hidden border-b border-border/50 bg-card md:block">
          <div className="page-container">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {s.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted">{s.subtitle}</p>

            <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
              {slice.map((item) => (
                <article
                  key={item.id}
                  className="w-[min(78vw,280px)] shrink-0 snap-center sm:w-auto sm:shrink"
                >
                  <div className="ds-card flex h-full flex-col overflow-hidden p-0">
                    <div className="relative aspect-[3/4] w-full bg-[#f0ebe6]">
                      <img
                        src={item.image.src}
                        alt={item.image.alt}
                        width={item.image.width}
                        height={item.image.height}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-dark">
                        {categoryLabel(item.category, dict)}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                        {item.title}
                      </h3>
                      <Link
                        href={`/request?catalog=${encodeURIComponent(item.id)}&service=stitching`}
                        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-4 text-sm font-semibold text-white shadow-[0_2px_12px_-2px_rgba(196,138,138,0.4)] transition hover:bg-accent-dark"
                      >
                        {dict.catalog.getStitchedArrow}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-8">
              <Link
                href="/gallery"
                className="text-sm font-semibold text-accent-dark underline-offset-4 hover:underline"
              >
                {dict.hero.explore} →
              </Link>
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
