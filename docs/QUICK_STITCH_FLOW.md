# Quick stitching request flow

## Goals

- **Mobile-first**, minimal typing, defaults and segmented controls where possible.
- **Conversion:** shortest path from catalog → request → WhatsApp; details and **photos move to WhatsApp** (no mandatory upload on the site).
- **Order ID** still generated client-side, saved when Firestore is configured, and echoed in the WhatsApp text + optional tracking link.

## Step-by-step UX

1. **Catalog / gallery** — Primary CTA **Get This Stitched** opens `/request?catalog=<id>&service=stitching` so the design is **pre-linked** (chip on the quick form). Secondary **Chat on WhatsApp** keeps a one-tap inquiry template.
2. **`/request` (default)** — **Quick stitching request**: service (stitching / alteration), item count (1 / 2 / 3+), preferred delivery date (required), optional notes. No name, phone, or image fields.
3. **Submit → handoff modal** — Friendly copy explains that **WhatsApp** opens next and the user should **send the design photo** there (paperclip). **Continue to WhatsApp** / **Back to edit**.
4. **WhatsApp** — Prefilled structured message (ASCII `Hi :)` in the deep link to avoid emoji encoding issues). Includes bullets for item count, delivery date, notes, catalog line when applicable, **Order reference**, line about sharing the reference image, optional **Track my order** URL.

## `/request?full=1` (detailed form)

Multi-item flow with name, phone, per-item design sources (including optional upload filename), and the existing handoff modal. Use when customers need full intake on the site.

## WhatsApp message template (quick path)

Built by `buildQuickStitchWhatsAppMessage` in `src/lib/order/quick-request.ts`. Shape:

- `Hi :)`
- Opening line (stitched catalog title, generic stitched line, or alteration).
- Bullets: number of items, preferred delivery date, notes (or `—`).
- Optional: design reference title + catalog ID.
- `Order reference: <uuid>`
- Reference-image and paperclip reminder.
- Optional `Track my order: …`

## Microcopy (English)

Centralized in `quickRequestCopy` in `src/lib/request-copy.ts` (page title, intro, labels, handoff, errors).

## API / persistence

- **`POST /api/orders`** with `{ quick: true, id, serviceType, itemCount, preferredDeliveryDate, notes?, catalogId? }` builds **one** `OrderItem`, validates with existing `validateOrderItems`, and stores with placeholder contact:
  - **Name:** `Quick request (website)`
  - **Phone:** `0000000000` (update from WhatsApp when staff replies)

Staff should treat placeholder phone as **“confirm on WhatsApp”**, not a real number.

## Edge cases

| Case | Behaviour |
|------|-----------|
| Notes empty | Allowed; WhatsApp shows `Notes: —`. |
| No `catalog` query | Quick form works; message uses generic “garment(s) stitched” unless alteration. |
| Firestore off | WhatsApp still works; no tracking URL line. |
| User wants uploads / multiple lines | Link to **detailed request** (`?full=1`), preserves `catalog` + `service` query params when possible. |

## Conversion recommendations

- Keep **one primary CTA** on cards (Get This Stitched → quick form).
- Keep the handoff modal **short**; stress **one photo** if that’s enough for first touch.
- Follow up fast on WhatsApp; placeholder phone orders are **high intent** but anonymous on the site.
- A/B test copy on the quick **Continue** button vs **Continue to WhatsApp** (clarity vs action).

## Related code

| Area | File |
|------|------|
| Quick form UI | `src/components/order/QuickStitchRequestForm.tsx` |
| Quick vs detailed switch | `src/components/order/RequestFlowShell.tsx` |
| Message + line items | `src/lib/order/quick-request.ts` |
| Orders API | `src/app/api/orders/route.ts` |
| Catalog CTAs | `src/components/catalog/CatalogCard.tsx` |
