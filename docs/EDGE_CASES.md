# Real-world edge cases — rules, system behavior, and UI

This document defines **business rules**, **what the product does**, and **impact on status & dates** for a tailoring platform. Implementation notes reference fields in Firestore / admin UI.

**Related:** [ORDER_TRACKING.md](./ORDER_TRACKING.md), [ANALYTICS.md](./ANALYTICS.md), [ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md)

---

## Summary table

| Edge case | Rule (short) | Status / dates impact | Customer sees |
|-----------|--------------|------------------------|---------------|
| Post-confirm scope change | Log internally; agree new date in WhatsApp | Optional `revisedDeliveryDate`; notes in `scopeChangeNotesInternal` | Updated estimate on `/track` if you set revised date |
| Multiple item timelines | One order = one progress bar today; per-item dates are **phase 2** | Order-level `requestedDeliveryDate` / `revisedDeliveryDate` | Single “requested / updated estimate” |
| Rush / urgent | Flag `priority: rush`; confirm feasibility off-channel | **No auto date change** — staff sets `revisedDeliveryDate` if needed | Same tracking UI; optional WhatsApp for promise |
| Cancellation | Terminal `cancelled`; store internal reason | `cancelledAt` set; delivery promises **void** | “Cancelled” + neutral copy on `/track` |
| Workload delay | Use delay note + customer revised date | `delayReasonInternal` + `revisedDeliveryDate` | “Updated estimate” only |
| Bad measurement / rework | Log in rework notes; may extend date | Often stays `in_progress`; optional revised date | Updated estimate if date changes |

---

## 1. Customer changes requirements after confirmation

**Rule**

- The **contract** is what you confirm on WhatsApp (or in shop). Changes after confirmation are **change orders**.
- Always capture **what changed** and whether **price / date** moved.

**System behavior**

- **Order status** stays on the fulfillment path (`confirmed` → …) unless you **pause** or **cancel** (see below).
- Staff records context in **`scopeChangeNotesInternal`** (admin order detail).
- If the **delivery promise** moves, set **`revisedDeliveryDate`** — this is what customers see on tracking as an “updated estimate” (no internal blame language).

**Impact on status & dates**

| Aspect | Effect |
|--------|--------|
| `status` | Usually unchanged; only changes if you restart work or cancel. |
| `requestedDeliveryDate` | Original ask — **keep** for audit. |
| `revisedDeliveryDate` | Set when the **new** committed date is later (or earlier). |
| Analytics | Lead-time metrics should use **confirmed → delivered**; annotate big scope-change outliers in internal notes. |

**UI / communication**

- **Customer (WhatsApp):** Confirm change, price impact, and new date in plain language.
- **Customer (`/track`):** Only sees revised date if you set `revisedDeliveryDate` — not the internal scope log.

---

## 2. Multiple items with different completion timelines

**Rule**

- Operationally you may finish items on different days; the **order** is still one legal / payment unit unless you **split** it.

**System behavior (current MVP)**

- **Single** order status and **one** order-level delivery story on `/track`.
- Per-item readiness is tracked **outside** the app (labels / WhatsApp) or via **future** `items[].expectedReadyDate` / per-item status (not required for MVP).

**Impact on status & dates**

| Aspect | Effect |
|--------|--------|
| `status` | One funnel for the whole order. |
| Dates | `requestedDeliveryDate` / `revisedDeliveryDate` = **order-level** promise. |
| “Ready” | Move to **`ready`** when **all** agreed items are ready for handover, or define a policy: “ready = bulk ready” and notify exceptions in chat. |

**UI / communication**

- **Customer:** Avoid showing per-item dates until the product supports them; use WhatsApp for partial ready / staggered pickup.
- **Staff:** Use **`reworkNotesInternal`** or **`scopeChangeNotesInternal`** to note “Item 2 held for lining.”

---

## 3. Urgent / rush orders

**Rule**

- Rush is **capacity + fee + explicit promise**, not a silent flag.

**System behavior**

- **`priority: rush`** on the order (admin) — visible internally for planning and filters (list can be extended later).
- **Does not** auto-shorten or auto-set dates; you confirm the date in **WhatsApp** and optionally set **`revisedDeliveryDate`** if it differs from the original request.

**Impact on status & dates**

| Aspect | Effect |
|--------|--------|
| `status` | Normal fulfillment path. |
| Dates | Only **`revisedDeliveryDate`** changes what `/track` shows as “updated estimate.” |

**UI / communication**

- **Customer:** WhatsApp is the right place for “we can do [date] for rush.” Tracking stays calm and factual.
- **Staff:** Mark **Rush** in admin so intake and tailors see it.

---

## 4. Order cancellations

**Rule**

- Cancellation **ends** fulfillment; refund / deposit policy is **business** (outside this spec).

**System behavior**

- Set **`status: cancelled`**.
- **`cancelledAt`** is set automatically; use **`cancellationReasonInternal`** for audit (refund pending, customer withdrew, etc.).
- Leaving cancelled clears **`cancelledAt`** in storage if you ever reactivate an order (rare); internal cancellation text can remain for history.

**Impact on status & dates**

| Aspect | Effect |
|--------|--------|
| `status` | **`cancelled`** — terminal for the customer journey. |
| Delivery dates | No active promise; **`revisedDeliveryDate`** is irrelevant for a cancelled order (optional to clear manually). |

**UI / communication**

- **Customer (`/track`):** Shows **Cancelled** and neutral copy — **no** internal reason.
- **Staff:** Always log **`cancellationReasonInternal`** when possible.

---

## 5. Delays due to workload

**Rule**

- Separate **“we’re busy”** (workload) from **supplier/material** delays — both use the same customer-facing tool: **revised date**.

**System behavior**

- **`delayReasonInternal`** — backlog, capacity, queue (staff-only).
- **`revisedDeliveryDate`** — new date shown on `/track`.

**Impact on status & dates**

| Aspect | Effect |
|--------|--------|
| `status` | Often stays **`in_progress`**; only change if you pause the job. |
| Dates | Customer-visible slip = **`revisedDeliveryDate`**. |

**UI / communication**

- **Customer:** “Updated estimate” on `/track`; optional WhatsApp message when the date moves.
- **Staff:** Use delay field for standup / planning; never paste internal queue notes to customers.

---

## 6. Incorrect measurements or rework

**Rule**

- Rework is a **quality / process** event; may or may not change the delivery promise.

**System behavior**

- Log details in **`reworkNotesInternal`** (measurement error, remake, who caught it).
- If the **date** moves, set **`revisedDeliveryDate`**.
- **`status`** usually remains **`in_progress`**; use **`ready`** only when the garment is actually ready for pickup.

**Impact on status & dates**

| Aspect | Effect |
|--------|--------|
| `status` | Typically **`in_progress`** through rework. |
| Dates | **`revisedDeliveryDate`** when the promise changes. |

**UI / communication**

- **Customer:** Explain in WhatsApp (“we need one more fitting”) — not on `/track` unless you add a generic message later.
- **Staff:** Rework notes feed **quality** and **analytics** (manual review until you add rework tags).

---

## 7. Field reference (implemented)

| Field | Who sees it |
|-------|-------------|
| `priority` (`standard` \| `rush`) | Admin only |
| `delayReasonInternal` | Admin |
| `revisedDeliveryDate` | Customer on `/track` |
| `scopeChangeNotesInternal` | Admin |
| `reworkNotesInternal` | Admin |
| `cancellationReasonInternal` | Admin |
| `cancelledAt` | System / admin |

---

## 8. Future enhancements (not blocking)

- **Per-item** target dates or statuses on `items[]`.
- **Split order** workflow (new order id, linked parent).
- **Customer-safe** short message for delay (without internal detail).
- **Block** uncancelling or require confirmation when re-opening a cancelled order.
