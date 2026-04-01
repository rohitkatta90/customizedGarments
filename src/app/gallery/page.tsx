import type { Metadata } from "next";
import Link from "next/link";

import { GalleryClient } from "@/components/catalog/GalleryClient";
import { CraftsmanshipSection } from "@/components/home/CraftsmanshipSection";
import { getCatalog } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { formatBrandText, siteConfig } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.gallery.title,
    description: formatBrandText(
      "{{name}} — browse blouse, kurti, dress, and custom design inspiration. Tap to message us on WhatsApp.",
    ),
  };
}

export default async function GalleryPage() {
  const items = await getCatalog();
  const dict = await getDictionary();

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-6">
        <header className="order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
            {formatBrandText(dict.gallery.eyebrow)}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">
            {dict.gallery.title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            {dict.gallery.subtitlePrefix} {siteConfig.name}. {dict.gallery.subtitleSuffix}
          </p>
        </header>

        {/* Mobile: audience, filters, and grid directly under the hero; md+: keep below pricing + craftsmanship */}
        <div className="order-2 mt-8 md:order-4 md:mt-10">
          <GalleryClient items={items} />
        </div>

        <div className="order-3 mt-8 max-w-2xl space-y-4 rounded-2xl border border-border/80 bg-card/50 px-4 py-4 sm:px-5 md:order-2 md:mt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {dict.styling.categoryLabel}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{dict.styling.pricingNotice}</p>
          </div>
          <div className="border-t border-border/60 pt-4">
            <Link
              href="/terms"
              className="text-sm font-semibold text-accent hover:text-accent-dark hover:underline"
            >
              {dict.gallery.termsLink}
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-muted">{dict.gallery.termsHint}</p>
          </div>
        </div>

        <div className="order-4 md:order-3 md:mt-5">
          <CraftsmanshipSection variant="compact" />
        </div>
      </div>
    </div>
  );
}
