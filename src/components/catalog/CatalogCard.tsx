"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { CatalogItem } from "@/lib/types";
import { buildWhatsAppUrl, catalogInquiryTemplate } from "@/lib/whatsapp";

type Props = {
  item: CatalogItem;
};

export function CatalogCard({ item }: Props) {
  const { dict } = useI18n();

  const message = catalogInquiryTemplate({
    itemTitle: item.title,
    itemId: item.id,
  });
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
          <Link
            href={`/request?catalog=${encodeURIComponent(item.id)}&service=stitching`}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-4 text-sm font-semibold text-white shadow-[0_2px_12px_-2px_rgba(196,138,138,0.4)] transition hover:bg-accent-dark"
          >
            {dict.catalog.getStitched}
          </Link>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            {dict.catalog.chatOnWhatsApp}
          </a>
        </div>
      </div>
    </article>
  );
}
