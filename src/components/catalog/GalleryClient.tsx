"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { allCategories } from "@/lib/categories";
import type { CatalogCategory, CatalogItem } from "@/lib/types";

import { CatalogCard } from "./CatalogCard";

type Props = {
  items: CatalogItem[];
};

export function GalleryClient({ items }: Props) {
  const { dict } = useI18n();
  const [active, setActive] = useState<CatalogCategory | "all">("all");

  const filtered = useMemo(() => {
    if (active === "all") return items;
    return items.filter((i) => i.category === active);
  }, [active, items]);

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
      <div className="flex flex-wrap gap-2">
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

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">{dict.gallery.empty}</p>
      ) : null}
    </div>
  );
}
