"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { allCategories } from "@/lib/categories";
import type { CatalogAudience, CatalogCategory, CatalogItem } from "@/lib/types";

import { CatalogCard } from "./CatalogCard";

type Props = {
  items: CatalogItem[];
};

/** Mobile: 2×2 grid. md+: 2 rows × 4 columns = 8 designs per page. */
const PAGE_SIZE_MOBILE = 4;
const PAGE_SIZE_DESKTOP = 8;

const MD_MIN_WIDTH = "(min-width: 768px)";

function subscribeMd(cb: () => void) {
  const mq = window.matchMedia(MD_MIN_WIDTH);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMdMatches() {
  return window.matchMedia(MD_MIN_WIDTH).matches;
}

/** Matches Tailwind `md`; server snapshot false to align with mobile-first SSR. */
function useIsMdBreakpoint() {
  return useSyncExternalStore(subscribeMd, getMdMatches, () => false);
}

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

function catalogSearchHaystack(item: CatalogItem): string {
  const cat = item.category;
  /** e.g. south-indian → also match "south indian" */
  const catSpaced = cat.replace(/-/g, " ");
  const parts = [
    item.title,
    item.description,
    cat,
    catSpaced,
    ...(item.searchKeywords ?? []),
  ];
  return parts.join(" ").toLowerCase();
}

/** Strip wrapping punctuation so "kurti," or pasted "linen…" still match. */
function normalizeSearchToken(t: string): string {
  return t.replace(/^[,;.…'"«»]+|[,;.…'"«»]+$/g, "").toLowerCase();
}

/** Every whitespace-separated term must appear somewhere in title, description, category, or keywords. */
function matchesCatalogSearch(item: CatalogItem, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const hay = catalogSearchHaystack(item);
  const terms = q
    .split(/\s+/)
    .map(normalizeSearchToken)
    .filter((t) => t.length > 0);
  if (terms.length === 0) return true;
  return terms.every((t) => hay.includes(t));
}

export function GalleryClient({ items }: Props) {
  const { dict } = useI18n();
  const isMd = useIsMdBreakpoint();
  const pageSize = isMd ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE;
  const prevPageSizeRef = useRef(pageSize);

  const [audience, setAudience] = useState<CatalogAudience>("women");
  const [active, setActive] = useState<CatalogCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const audienceItems = useMemo(
    () => items.filter((i) => (i.audience ?? "women") === audience),
    [items, audience],
  );

  const searchFiltered = useMemo(
    () => audienceItems.filter((i) => matchesCatalogSearch(i, searchQuery)),
    [audienceItems, searchQuery],
  );

  const filtered = useMemo(() => {
    if (active === "all") return searchFiltered;
    return searchFiltered.filter((i) => i.category === active);
  }, [active, searchFiltered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(0);
  }, [audience, active, searchQuery]);

  useEffect(() => {
    const prev = prevPageSizeRef.current;
    if (prev !== pageSize) {
      prevPageSizeRef.current = pageSize;
      setPage((p) => Math.floor((p * prev) / pageSize));
    }
  }, [pageSize]);

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
      case "south-indian":
        return c.southIndian;
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

      <div className="mt-8">
        <label htmlFor="gallery-search" className="mb-2 block text-sm font-medium text-foreground">
          {g.searchLabel}
        </label>
        <input
          id="gallery-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={g.searchPlaceholder}
          autoComplete="off"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none ring-accent transition-colors placeholder:text-muted focus:ring-2 sm:text-sm"
        />
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
        searchQuery.trim() ? (
          <div
            className="mt-8 rounded-2xl border border-border/80 bg-[#fdf8f6] px-5 py-8 text-center sm:px-8"
            role="status"
          >
            <p className="font-display text-lg font-semibold text-foreground sm:text-xl">
              {g.searchNoResultsTitle}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              {g.searchNoResultsBody}
            </p>
            <p className="mt-6">
              <Link
                href="/request"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
              >
                {g.searchNoResultsCta}
              </Link>
            </p>
            <p className="mt-4 text-xs text-muted">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActive("all");
                }}
                className="font-medium text-accent-dark underline-offset-4 hover:underline"
              >
                {g.searchClearFilters}
              </button>
            </p>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-muted">{dict.gallery.empty}</p>
        )
      ) : null}
    </div>
  );
}
