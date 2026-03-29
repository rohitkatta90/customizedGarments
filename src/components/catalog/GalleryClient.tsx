"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { allCategories } from "@/lib/categories";
import type { CatalogAudience, CatalogCategory, CatalogItem } from "@/lib/types";

import { CatalogCard } from "./CatalogCard";

type Props = {
  items: CatalogItem[];
};

/** English-only gallery collection labels (site may still use Hindi elsewhere). */
const GALLERY_AUDIENCE = {
  women: {
    title: "Her Styles",
    description:
      "Women's blouses, kurtis, dresses, and bespoke tailoring — made to your measurements.",
  },
  girls: {
    title: "Little Princess",
    description:
      "Girl's occasion wear, festive pieces, and custom looks — same care and finish, sized for children.",
  },
} as const;

export function GalleryClient({ items }: Props) {
  const { dict } = useI18n();
  const [audience, setAudience] = useState<CatalogAudience>("women");
  const [active, setActive] = useState<CatalogCategory | "all">("all");

  const audienceItems = useMemo(
    () => items.filter((i) => (i.audience ?? "women") === audience),
    [items, audience],
  );

  const filtered = useMemo(() => {
    if (active === "all") return audienceItems;
    return audienceItems.filter((i) => i.category === active);
  }, [active, audienceItems]);

  function labelFor(cat: CatalogCategory): string {
    const c = dict.categories;
    switch (cat) {
      case "blouses":
        return c.blouses;
      case "kurtis":
        return c.kurtis;
      case "dresses":
        return c.dresses;
      case "custom-designs":
        return c.customDesigns;
      default:
        return cat;
    }
  }

  return (
    <div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {(Object.keys(GALLERY_AUDIENCE) as CatalogAudience[]).map((key) => {
          const copy = GALLERY_AUDIENCE[key];
          const selected = audience === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setAudience(key);
                setActive("all");
              }}
              className={`rounded-2xl border px-4 py-4 text-left transition sm:px-5 sm:py-5 ${
                selected
                  ? "border-accent bg-[#fff9f8] shadow-sm ring-1 ring-accent/25"
                  : "border-border bg-card hover:border-accent/30 hover:bg-white"
              }`}
            >
              <span className="font-display text-lg font-semibold text-foreground sm:text-xl">
                {copy.title}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active === "all"
              ? "bg-accent text-white shadow-sm"
              : "bg-white text-muted ring-1 ring-border hover:text-foreground"
          }`}
        >
          {dict.gallery.all}
        </button>
        {allCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === c
                ? "bg-accent text-white shadow-sm"
                : "bg-white text-muted ring-1 ring-border hover:text-foreground"
            }`}
          >
            {labelFor(c)}
          </button>
        ))}
      </div>

      <div className="masonry mt-8">
        {filtered.map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>

      {audienceItems.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          More styles coming soon — send us a reference on WhatsApp and we&apos;ll confirm if we can take
          the piece.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">{dict.gallery.empty}</p>
      ) : null}
    </div>
  );
}
