# Customer receipts (WhatsApp)

**End-to-end money flow:** [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md)

Primary format is **plain text** optimized for WhatsApp: short lines, clear sections, no special Unicode that breaks on older phones. **PDF** is a possible future add-on (same fields, print layout).

## When to send

| Situation | Suggested moment |
|-----------|------------------|
| **UPI / paid upfront** | Right after payment is recorded (or when work is ready, if you prefer one message). |
| **COD / cash on delivery** | At **handover / delivery** — receipt confirms what was due and what was collected. |
| **Partial (advance + balance)** | After **each** significant payment, or once at the end when fully settled — match your shop’s habit; the template shows paid vs balance. |

Staff can paste the same structure for manual messages; the admin **Copy WhatsApp receipt** button uses live ledger fields (including unsaved edits on the form).

## Receipt structure (sections)

1. **Business name** (title line)
2. **Short thank-you line** (friendly, not stiff)
3. **Order ID** — full Firestore id (customers can quote it back)
4. **Customer name**
5. **Date** — `Delivery / handover` if `deliveredAtIso` is set; otherwise **Receipt date** (today when generated)
6. **Services** — one block per garment (`Item n — Stitching` or `Alteration`, design/reference, notes, optional delivery preference)
7. **Quoted extras** (if any) — numbered list with optional ₹ amounts
8. **Payment** — order total, amount received, balance if applicable, **payment mode** (UPI / COD / mixed / cash / other), **payment status** (paid / partial / pending / N/A cancelled)
9. **Optional note** — from payment notes (e.g. “₹2k UPI, balance COD”)
10. **Tracking link** — if the order has a tracking token
11. **Closing line** — warm sign-off

## WhatsApp message template (illustrative)

Below is the **shape** the app generates (values are filled from the order + ledger):

```
Radha Creations

Thanks for choosing us — here’s your order summary.

Order ID: abc123…
Customer: Priya
Delivery / handover: 21 March 2025

— Services —

Item 1 — Stitching
  Design / reference: …
  Notes: …

Item 2 — Alteration
  Type: …
  Notes: …

— Quoted extras —
1. Lace border (₹500)

— Payment —
Order total: ₹5,000
Amount received: ₹5,000
Payment mode: UPI
Payment status: Paid in full

Track anytime: https://…/track/…

We appreciate your trust. See you again soon!
```

**Partial payment example** — extra lines:

```
Balance: ₹1,500
Payment status: Part paid — balance may be due
Note: ₹3,500 UPI, rest COD at pickup
```

## Consistency guidelines

1. **One order = one receipt text** — always include the **same order ID** as in admin and tracking.
2. **Money** — use **₹** and Indian grouping (`1,23,456`); totals come from **Total** and **Paid** on the order.
3. **Payment mode** — set **Primary payment mode** in admin; use **Payment notes** for split stories (UPI + COD).
4. **COD** — keep **Paid** in sync when cash is collected at delivery so the receipt shows **Paid in full** (or the right partial state).
5. **Cancelled orders** — receipt still works; status shows **N/A (cancelled)** when the ledger says so.
6. **Tone** — short sentences, “we / you” sparingly; thank-you at start and end; avoid legal boilerplate unless your lawyer requires it.

## Code

- Builder: `src/lib/orders/receipt.ts` — `buildWhatsAppReceiptText`
- Item lines shared with intake copy: `describeOrderItemLinesForReceipt` in `src/lib/order/whatsapp.ts`
- Admin: **Order** page → **Copy WhatsApp receipt** (under Ledger)
