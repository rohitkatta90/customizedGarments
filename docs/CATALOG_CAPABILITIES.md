# Catalog — full capabilities

The **catalog** is not a shopping cart. It is a **design gallery** plus **structured references** so customers can name a look, request stitching via WhatsApp, and have that choice stored on the order. This document lists **every capability** tied to `public/data/catalog.json` and the `CatalogItem` type.

---

## 1. Data source & schema

| Aspect | Detail |
|--------|--------|
| **File** | `public/data/catalog.json` — JSON array of items. |
| **Type** | `CatalogItem` in `src/lib/types.ts` |
| **Required fields** | `id` (stable string), `category`, `title`, `description`, `image` (`src`, `alt`, `width`, `height`). |
| **Categories** | Exactly one of: `blouses`, `kurtis`, `dresses`, `custom-designs` (see `src/lib/categories.ts`). |
| **Deploy** | Edit JSON → commit → redeploy (or save locally and refresh in dev). **No database** for catalog content. |

Invalid `category` values can break TypeScript/build — keep to the four enums above.

---

## 2. Where the catalog appears (customer-facing)

| Capability | Where | Behavior |
|------------|-------|----------|
| **Gallery browse** | `/gallery` | Lists all items; **category filter** (client-side). Uses `next/image` for thumbnails. |
| **EN / हि** | Gallery + cards | UI strings from i18n (`dictionaries.ts`) — e.g. “Get This Stitched”, category labels. |
| **Deep link to request** | From each card | **“Add to request”** → `/request?catalog=<id>&service=stitching` pre-selects that design on the multi-item form. |
| **WhatsApp inquiry (single design)** | “Get This Stitched” on card | Opens WhatsApp with a **prefilled message** naming title + ID (`catalogInquiryTemplate` in `src/lib/whatsapp.ts`). |
| **Legacy stitching URL** | `/stitching?design=<id>` | Redirects into `/request` with catalog hint (see `src/app/stitching/page.tsx`). |
| **Multi-item service request** | `/request` | **Stitching** line items can choose **Design source: From catalog** → dropdown lists **every** catalog row (`ServiceRequestForm` + `OrderItemFields`). |
| **WhatsApp order summary** | After building the request | `buildMultiItemOrderMessage` resolves **catalog ID → title** for each stitching item so WhatsApp shows readable names. |
| **Public tracking** | `/track/[token]` | Does **not** show catalog images; only status and high-level info. |

---

## 3. Where the catalog appears (admin & receipts)

| Capability | Where | Behavior |
|------------|-------|----------|
| **Order detail** | `/admin/orders/[id]` | Server loads catalog via `getCatalog()` so **stitching lines** show human-readable **design titles** in context (and in **Copy WhatsApp receipt**). |
| **Receipt text** | Order detail → Copy WhatsApp receipt | `describeOrderItemLinesForReceipt` uses catalog to print **“Pearl-button silk blouse (ID: bl-001)”** style lines for `designSource === "catalog"`. |

If an order references a **deleted** catalog `id`, the UI falls back to a generic “(catalog xyz)” style string — avoid reusing IDs; prefer retiring items by removing from new requests only after old orders complete.

---

## 4. Images & performance

| Topic | Detail |
|-------|--------|
| **Image URLs** | `image.src` must be **HTTPS**. |
| **Next.js image allowlist** | Remote hosts must be listed in `next.config.ts` → `images.remotePatterns`. Today includes `images.unsplash.com`; add **your CDN** (e.g. Cloudinary, Firebase Storage) before using new hostnames. |
| **Dimensions** | `width` / `height` help layout and LCP; set to real asset dimensions when possible. |

---

## 5. What the catalog does *not* do

- **No prices** on catalog rows — pricing is **quoted per order** in admin (ledger).
- **No inventory or stock** — service business model.
- **No automatic sync** to Firestore — catalog is **static JSON** in the repo / on the CDN.
- **No customer accounts** — identity is name + phone on the order.

---

## 6. Operational checklist (owner)

1. **Add or edit items** in `catalog.json` — unique `id`, correct `category`, polished `title` / `description`.
2. **Images** — host on an allowed domain or extend `next.config.ts`.
3. **Deploy** so the site and WhatsApp deep links match production.
4. **Spot-check** `/gallery`, `/request?catalog=<newId>`, and a test order + receipt for the new ID.

---

## 7. Related docs

| Topic | Document |
|--------|----------|
| JSON shape & reviews | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Order items & WhatsApp | [ORDER_MODEL.md](./ORDER_MODEL.md) |
| Owner credentials & data stores | [OWNER_DATA_ACCESS.md](./OWNER_DATA_ACCESS.md) |
| Indicative price tiers & bands | [PRICING_MODEL.md](./PRICING_MODEL.md) — public **`/pricing`** page |

Customers can open **`/pricing`** from the main nav for **Basic / Standard / Premium** bands by garment type and **minor / major** alteration ranges.
