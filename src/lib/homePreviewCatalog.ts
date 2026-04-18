import { allCategories } from "@/lib/categories";
import type { CatalogCategory, CatalogItem } from "@/lib/types";

/**
 * Extra hero / gallery picks (shown first), then the legacy “first five” list
 * from women-first catalog order — deduped by id.
 */
const HOME_PREVIEW_CATALOG_IDS = [
  "bl-007",
  "bl-008",
  "gc-001",
  "si-003",
] as const;

const LEGACY_PREVIEW_COUNT = 5;

/** Max designs per category when filling the home gallery strip (excludes hero carousel IDs). */
const GALLERY_STRIP_PER_CATEGORY = 5;

/** Total designs shown in “Designs you can start from” — keeps the home page light. */
const GALLERY_STRIP_MAX_TOTAL = 7;

const ZERO_COUNTS = (): Map<CatalogCategory, number> =>
  new Map(allCategories.map((c) => [c, 0]));

function womenFirstCatalog(catalog: CatalogItem[]) {
  return [...catalog].sort((a, b) => {
    const ag = a.audience === "girls" ? 1 : 0;
    const bg = b.audience === "girls" ? 1 : 0;
    return ag - bg;
  });
}

export function buildHomePreviewItems(catalog: CatalogItem[]): CatalogItem[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const ordered: CatalogItem[] = [];

  for (const id of HOME_PREVIEW_CATALOG_IDS) {
    const item = byId.get(id);
    if (item && !seen.has(item.id)) {
      ordered.push(item);
      seen.add(item.id);
    }
  }

  for (const item of womenFirstCatalog(catalog).slice(0, LEGACY_PREVIEW_COUNT)) {
    if (!seen.has(item.id)) {
      ordered.push(item);
      seen.add(item.id);
    }
  }

  if (ordered.length > 0) return ordered;
  return womenFirstCatalog(catalog).slice(0, LEGACY_PREVIEW_COUNT);
}

/**
 * Home gallery strip: designs not shown in the hero carousel — women-first walk,
 * up to {@link GALLERY_STRIP_PER_CATEGORY} per category, capped at
 * {@link GALLERY_STRIP_MAX_TOTAL} overall.
 */
export function buildGalleryPreviewStripItems(
  catalog: CatalogItem[],
  excludeIds: ReadonlySet<string>,
): CatalogItem[] {
  const counts = ZERO_COUNTS();
  const strip: CatalogItem[] = [];

  for (const item of womenFirstCatalog(catalog)) {
    if (strip.length >= GALLERY_STRIP_MAX_TOTAL) break;
    if (excludeIds.has(item.id)) continue;
    const n = counts.get(item.category) ?? 0;
    if (n >= GALLERY_STRIP_PER_CATEGORY) continue;
    strip.push(item);
    counts.set(item.category, n + 1);
  }

  if (strip.length === 0) {
    const wf = womenFirstCatalog(catalog).filter((item) => !excludeIds.has(item.id));
    return wf.slice(0, GALLERY_STRIP_MAX_TOTAL);
  }

  const byCat = new Map<CatalogCategory, CatalogItem[]>();
  for (const cat of allCategories) byCat.set(cat, []);
  for (const item of strip) {
    byCat.get(item.category)?.push(item);
  }
  const grouped = allCategories.flatMap((cat) => byCat.get(cat) ?? []);
  return grouped.slice(0, GALLERY_STRIP_MAX_TOTAL);
}
