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

/** Catalog reference: mom & daughter matching western dresses (warm, premium feel). */
const MOM_ME_MOMENTS_IMAGE = {
  src: "/images/catalog/her-styles-western/mom-daughter-dusty-rose-tiered-embroidery-dresses.png",
  width: 683,
  height: 1024,
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

  /** Little Princess has no blouse-only looks — hide that chip so the row matches available items. */
  const categoryFilters = useMemo(
    () =>
      audience === "girls" ? allCategories.filter((c) => c !== "blouses") : allCategories,
    [audience],
  );

  const searchFiltered = useMemo(
    () => audienceItems.filter((i) => matchesCatalogSearch(i, searchQuery)),
    [audienceItems, searchQuery],
  );

  /** Girls catalog has no blouses chip; if state still says "blouses", treat as "all" for filtering. */
  const activeForFilter = audience === "girls" && active === "blouses" ? "all" : active;

  const filtered = useMemo(() => {
    if (activeForFilter === "all") return searchFiltered;
    return searchFiltered.filter((i) => i.category === activeForFilter);
  }, [activeForFilter, searchFiltered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    queueMicrotask(() => {
      setPage(0);
    });
  }, [audience, active, searchQuery]);

  useEffect(() => {
    const prev = prevPageSizeRef.current;
    if (prev !== pageSize) {
      prevPageSizeRef.current = pageSize;
      queueMicrotask(() => {
        setPage((p) => Math.floor((p * prev) / pageSize));
      });
    }
  }, [pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
    });
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
      case "skirt-top":
        return c.skirtTop;
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
          const momMeHint =
            key === "women" ? g.herStylesMomMeHint : g.littlePrincessMomMeHint;
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
              <p className="mt-3 text-xs leading-relaxed text-muted/90">{momMeHint}</p>
            </button>
          );
        })}
      </div>

      <section className="mt-8" aria-labelledby="gallery-mom-me-heading">
        <div className="overflow-hidden rounded-[18px] border border-rose-200/50 bg-gradient-to-br from-[#fdeef2] via-[#fdf8f6] to-[#f7f0eb] shadow-[0_1px_0_rgba(255,255,255,0.65)_inset,0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(165,85,98,0.14)]">
          <div className="flex flex-col md:flex-row md:items-stretch">
            {/* Mobile: image first; md: text left (order-1), image right (order-2) */}
            <div className="relative order-1 aspect-[5/6] w-full shrink-0 overflow-hidden bg-[#f5e8ec]/40 md:order-2 md:aspect-auto md:w-[min(44%,26rem)] md:max-w-md md:min-h-[15rem] md:self-stretch">
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#fdf8f6]/25 via-transparent to-transparent md:bg-gradient-to-l"
                aria-hidden
              />
              <img
                src={MOM_ME_MOMENTS_IMAGE.src}
                alt={g.momMeMomentsImageAlt}
                width={MOM_ME_MOMENTS_IMAGE.width}
                height={MOM_ME_MOMENTS_IMAGE.height}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-[center_30%] md:h-full md:min-h-[15rem]"
              />
            </div>
            <div className="order-2 flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-9 md:order-1 md:flex-1 md:px-10 md:py-10 lg:pl-12 lg:pr-8 lg:py-11">
              <h2
                id="gallery-mom-me-heading"
                className="font-display text-[1.375rem] font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-[1.75rem] lg:text-3xl"
              >
                <span aria-hidden className="mr-2 inline-block translate-y-px">
                  💖
                </span>
                {g.momMeMomentsTitle}
              </h2>
              <p className="mt-4 max-w-[26rem] text-sm leading-relaxed text-muted sm:text-base sm:leading-relaxed">
                {g.momMeMomentsBody}
              </p>
              <p className="mt-7 sm:mt-8">
                <Link
                  href="/request?momAndMe=1"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-md shadow-accent/15 ring-1 ring-white/10 transition hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/20"
                >
                  {g.momMeMomentsCta}
                  <span aria-hidden className="text-base font-medium leading-none">
                    →
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

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
            activeForFilter === "all"
              ? "bg-accent text-white shadow-sm"
              : "bg-white text-muted ring-1 ring-border hover:text-foreground"
          }`}
        >
          {dict.gallery.all}
        </button>
        {categoryFilters.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeForFilter === c
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
