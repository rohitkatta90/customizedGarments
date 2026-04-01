"use client";

import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { allCategories } from "@/lib/categories";
import type { CatalogAudience, CatalogCategory, CatalogItem } from "@/lib/types";

import { CatalogCard } from "./CatalogCard";

type Props = {
  items: CatalogItem[];
};

const PAGE_SIZE = 4;

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

function formatPageOf(template: string, current: number, total: number): string {
  return template.replace(/\{\{current\}\}/g, String(current)).replace(/\{\{total\}\}/g, String(total));
}

export function GalleryClient({ items }: Props) {
  const { dict } = useI18n();
  const [audience, setAudience] = useState<CatalogAudience>("women");
  const [active, setActive] = useState<CatalogCategory | "all">("all");
  const [page, setPage] = useState(0);

  const audienceItems = useMemo(
    () => items.filter((i) => (i.audience ?? "women") === audience),
    [items, audience],
  );

  const filtered = useMemo(() => {
    if (active === "all") return audienceItems;
    return audienceItems.filter((i) => i.category === active);
  }, [active, audienceItems]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [audience, active]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

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

  const g = dict.gallery;
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

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

      {filtered.length > 0 ? (
        <>
          <div
            className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
            aria-live="polite"
          >
            {pageItems.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-8 flex flex-col items-center gap-4"
              aria-label="Gallery pages"
            >
              <p className="text-sm font-medium tracking-wide text-muted">
                {formatPageOf(g.paginationPageOf, currentPage + 1, totalPages)}
              </p>
              <div className="flex w-full max-w-sm items-center justify-center gap-3 sm:max-w-none">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-white disabled:pointer-events-none disabled:opacity-40 sm:min-w-[8rem] sm:flex-none"
                >
                  {g.paginationPrev}
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-white disabled:pointer-events-none disabled:opacity-40 sm:min-w-[8rem] sm:flex-none"
                >
                  {g.paginationNext}
                </button>
              </div>
            </nav>
          ) : null}
        </>
      ) : null}

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
