"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { CatalogItem } from "@/lib/types";
import { buildWhatsAppUrl, catalogInquiryTemplate } from "@/lib/whatsapp";

type Props = {
  item: CatalogItem;
};

export function CatalogCard({ item }: Props) {
  const { locale, dict } = useI18n();

  const message = catalogInquiryTemplate(
    {
      itemTitle: item.title,
      itemId: item.id,
    },
    locale,
  );
  const href = buildWhatsAppUrl(message);

  return (
    <article className="masonry-item overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 [color-scheme:light]"
        data-catalog-photo
      >
        {/* Native img avoids next/image optimizer issues (black tiles on some devices / hosts). */}
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
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
          {item.description}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            {dict.catalog.getStitched}
          </a>
          <Link
            href={`/request?catalog=${encodeURIComponent(item.id)}&service=stitching`}
            className="text-center text-xs font-medium text-accent-dark underline-offset-4 hover:underline"
          >
            {dict.catalog.addToRequest}
          </Link>
        </div>
      </div>
    </article>
  );
}
