# Order admin & persistence (MVP)

This app can **persist orders to Firestore** while keeping the **WhatsApp handoff** as the primary customer channel. Admin UI lists orders, filters by status, searches by phone, and updates status with **per-stage timestamps**.

## Data model (Firestore + API shape)

**Collection:** `garment_orders` (one document per order).

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Client-generated order reference (UUID); same id in WhatsApp text. |
| `customerName` | string | |
| `customerPhone` | string | Stored as entered; normalize for search in API (`normalizePhone`). |
| `requestedDeliveryDate` | string \| null | `YYYY-MM-DD` or null. |
| `items` | array | Embedded line items — same logical shape as `OrderItem[]` in `src/lib/order/types.ts`. |
| `status` | string | Includes `cancelled` (terminal). See **[EDGE_CASES.md](./EDGE_CASES.md)**. |
| `priority` | string | `standard` \| `rush` (admin; does not auto-change dates). |
| `trackingToken` | string | Unguessable token for public `/track/[token]` (new orders). |
| `delayReasonInternal` | string? | Staff-only workload / delay notes. |
| `revisedDeliveryDate` | string? | Customer-facing revised date on `/track`. |
| `scopeChangeNotesInternal` | string? | Post-confirmation scope changes (staff). |
| `reworkNotesInternal` | string? | Measurement / rework (staff). |
| `cancellationReasonInternal` | string? | Why cancelled (staff). |
| `quotedAccessories` | array | `{ id, label, amountInr }[]` — extra styling elements (**ACCESSORIES_SERVICE_FLOW.md**). |
| `accessoriesQuoteStatus` | string | `none` \| `pending_customer` \| `approved` \| `declined`. |
| `accessoriesNotesInternal` | string? | Staff notes on extras. |
| `totalAmountInr` | number? | Agreed order total (INR). |
| `paidAmountInr` | number | Received so far (default 0). |
| `paymentModePrimary` | string? | `UPI` / `COD` / `mixed` / `cash` / `other`. |
| `financialNotes` | string? | Payment notes (advance, balance, etc.). |
| `designAssetsFolderUrl` | string? | Shared folder link (e.g. Google Drive) for renamed design images + notes — see **[IMAGE_STORAGE_TAILOR_HANDOFF.md](./IMAGE_STORAGE_TAILOR_HANDOFF.md)**. |
| `tailorHandoffNotesInternal` | string? | Bullet-style spec for tailor / cutting master (staff-only). |
| *(derived)* `ledgerPaymentStatus` | — | Computed on read; not stored as source of truth. |
| `createdAt` | timestamp | Server time on create. |
| `updatedAt` | timestamp | Server time on any write. |
| `confirmedAt`, `inProgressAt`, `readyAt`, `deliveredAt`, `cancelledAt` | timestamp? | Set when entering each state (see `firestore.ts`). |

**Why embed items:** MVP simplicity; one read for the full order. For a SQL backend later, split into **`orders`** + **`order_items`** with `order_id` FK — the JSON payload maps cleanly.

## MVP storage: Firestore

- **Pros:** No custom backend process; rules + service account on the server; queryable; scales.
- **Server-only:** `firebase-admin` uses env credentials — **never** expose private keys to the client.

**If Firestore is not configured:** `POST /api/orders` still returns **200** with `{ ok: true, saved: false, reason: "firestore_not_configured" }` so the customer flow (WhatsApp) never breaks.

### Indexes

Listing uses `orderBy("createdAt", "desc")`. If Firestore asks for a composite index in the console, create the suggested index (usually single-field on `createdAt`).

## Google Sheets (alternative MVP)

Not implemented in code. Viable approach: **Apps Script** or a small **Google Sheets API** writer from a serverless function; one row per order, JSON column for `items`. Good for non-technical operators; weaker concurrency and schema enforcement than Firestore. Same **logical model** above applies — export rows → import into SQL later.

## Admin access

| Route | Purpose |
|-------|---------|
| `/admin/login` | Password login; sets `gs_admin` cookie. |
| `/admin/orders` | Table: filter by status, search phone, update status per row. |
| `/admin/orders/[id]` | Status, **copy tracking link**, **design folder URL**, **tailor handoff** (copy WhatsApp block, suggested filenames), ledger, internal notes. |

**Customer tracking:** `/track/[token]` — see **[ORDER_TRACKING.md](./ORDER_TRACKING.md)**.

**Env:** `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN` (long random string). Cookie value must match `ADMIN_SESSION_TOKEN`. See `.env.example`.

**API:** `GET /api/admin/orders?status=&phone=` · `PATCH /api/admin/orders/[id]` — handlers verify the session cookie.

## Scalable path: Firebase vs Django

| Phase | What to do |
|-------|------------|
| **Now** | Firestore + Next.js API routes; admin as above. |
| **Firebase client apps** | Optional: move catalog/auth to Firebase; keep orders in Firestore or sync to BigQuery for analytics. |
| **Django / Postgres** | Add REST or GraphQL API; migrate `garment_orders` → `orders` + `order_items`; keep `id` and timestamps; run admin in Django Admin or keep this UI against the new API. |

The **serialized order** type `StoredOrder` in `src/lib/orders/schema.ts` is the contract to preserve when swapping storage.
