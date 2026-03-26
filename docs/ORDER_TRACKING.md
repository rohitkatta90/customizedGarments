# Customer order tracking

## Lifecycle (order statuses)

Statuses are **linear** for normal operations; staff can correct mistakes by setting an earlier status from the admin UI if needed.

| Status | Meaning |
|--------|--------|
| `request_received` | Submitted from the site (and WhatsApp handoff). |
| `confirmed` | You accepted the job. |
| `in_progress` | Work has started. |
| `ready` | Ready for pickup / dispatch. |
| `delivered` | Handed over or completed. |
| `cancelled` | Order ended — not shown on the linear stepper; see **EDGE_CASES.md**. |

Fulfillment steps on `/track` use the first five statuses only; **`cancelled`** shows a dedicated message.

### Timestamps

Firestore stores optional timestamps when each stage is first reached: `confirmedAt`, `inProgressAt`, `readyAt`, `deliveredAt`. **`cancelledAt`** is set when status becomes `cancelled`. `createdAt` / `updatedAt` are always maintained.

**Priority:** `priority` is `standard` or `rush` (admin-only; does not auto-change dates).

### Legacy documents

Older orders may have `pending` → read as `request_received`, and `completed` → `delivered`. `completedAt` is mapped to `deliveredAt` when reading.

---

## Public tracking URL

- Each new order gets a random **`trackingToken`** (stored in Firestore, **unguessable**).
- Customer URL: **`/track/[token]`** (full URL uses `NEXT_PUBLIC_SITE_URL`).
- **No login** — possession of the link is the credential. Treat links like private links; do not post them publicly.
- **`robots: noindex`** on the tracking page to reduce accidental indexing.

---

## WhatsApp

When an order is saved to Firestore, the prefilled WhatsApp message includes a line:

`Track my order: https://…/track/…`

Staff can paste the same link from **Admin → Order details → Copy link**.

---

## Delays (internal vs customer)

| Field | Audience |
|--------|----------|
| `delayReasonInternal` | **Staff only** — reasons, supplier issues, notes. Never shown on `/track`. |
| `revisedDeliveryDate` | **Customer** — optional `YYYY-MM-DD` shown on the tracking page as an “updated estimate” without exposing internal reasons. |

---

## Staff workflows

- **List:** `/admin/orders` — quick status changes, link to **Details**.
- **Details:** `/admin/orders/[id]` — status, copy tracking link, internal delay note, revised delivery date for customers.

---

## Firestore index

Queries use `where("trackingToken", "==", token)`. A composite index is usually **not** required for a single-field equality query; if the console prompts for one, create the suggested index.
