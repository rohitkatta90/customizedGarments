# Order & order items (data model)

The **client-side model** below powers the multi-item request form and WhatsApp handoff. When **Firestore** is configured, the same payload is also **persisted** server-side — see **[ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md)** for the stored shape, admin UI, and migration notes.

## Concepts

| Concept | Description |
|--------|-------------|
| **Order** | One customer submission (one WhatsApp message). |
| **Order item** | A single garment/service line: **stitching** or **alteration**, with its own reference, notes, and optional delivery preference. |

Relationship: **Order 1 — N Order items**.

## TypeScript types

Defined in `src/lib/order/types.ts`:

- **`Order`** — `{ id: string; items: OrderItem[] }`  
  - `id` — client-generated reference (UUID), echoed in WhatsApp for manual matching.  
- **`OrderItem`** — discriminated union:  
  - **`StitchingOrderItem`** — `service: "stitching"`, design source (catalog / upload / describe), notes, optional `deliveryPreference` (date string `YYYY-MM-DD`).  
  - **`AlterationOrderItem`** — `service: "alteration"`, `alterationType`, notes, optional garment filename hint, optional `deliveryPreference`.

## Persisted backend (current + SQL migration)

**Current (Firestore):** one document per order with **embedded `items`** — see `StoredOrder` and `ORDER_ADMIN_SYSTEM.md`.

**Future SQL (suggested):**

| Entity | Suggested fields |
|--------|------------------|
| **orders** | `id`, `created_at`, `updated_at`, `customer_name`, `customer_phone`, `requested_delivery_date`, `status`, `status_timestamps` JSON |
| **order_items** | `id`, `order_id`, `service`, payload JSON or normalized columns matching `OrderItem` |

**Order-level status** is what the admin UI updates today. Item-level statuses can be added later without changing the customer form much.

## WhatsApp message (multi-item)

Built by `buildMultiItemOrderMessage()` in `src/lib/order/whatsapp.ts`. It includes:

- Greeting and **total item count**
- **Order reference** (client `order.id`)
- For each item: **service type**, design/type summary, **notes**, optional **delivery / date** line
- Closing line about sharing images in chat

Single-item catalog shortcuts (gallery “Get This Stitched”) still use the legacy helper in `src/lib/whatsapp.ts` for a quick inquiry template.
