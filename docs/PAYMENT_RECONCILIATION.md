# Payment tracking & reconciliation

**Ops playbook (quote → pay → deliver → receipt):** [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md)

This app treats each **order** as one ledger row: **total**, **amount received**, **primary payment mode**, and **notes** (e.g. advance UPI + balance COD). **Payment status** is **derived** from amounts and order status — it is not edited independently.

## Payment types (how they show up)

| Pattern | In the app |
|--------|------------|
| **Full payment** | Total set; paid equals total; status **paid**. |
| **Partial (advance + balance)** | Total set; paid &lt; total until settled; status **partial** then **paid** when the rest is recorded. |
| **COD** | Often paid = 0 until handover; **primary mode** = COD; at delivery, **record the cash received** so paid matches total, then mark **Delivered** (see below). |

## Tracking fields (per order)

| Field | Role |
|-------|------|
| **Total (₹)** | Agreed quote (incl. extras). |
| **Paid (₹)** | Cumulative received so far. |
| **Pending** | Derived: `total − paid` when total is set. |
| **Primary payment mode** | UPI / COD / mixed / cash / other — how the customer is paying or how the last leg was settled. |
| **Payment notes** | Free text: UPI refs, “₹2k advance”, split stories. |
| **Payment status** | Derived: pending / partial / paid / none (cancelled). |

## Payment audit log

Every time **Paid** changes (saved), the API appends an **audit row** (`paymentAuditLog`): previous paid, new paid, delta, timestamp. This is the basis for **“Payments recorded (day)”** on **Admin → Payments & receivables** (sum of **positive** deltas on that **IST calendar day**).

- **Duplicate entries:** The same mistake can still be entered twice; the audit trail makes it obvious. Cross-check against your UPI statement and cash register.
- **Corrections:** Lowering paid (negative delta) is allowed for corrections; document why in **Payment notes**.

## Reconciliation logic (enforced in the API)

Rules applied when a PATCH touches **status** or **financial** fields:

1. **Paid cannot exceed total** by more than a tiny rounding tolerance (₹1). Otherwise the app returns `400` — avoids accidental double keying.
2. **Paid without total** — if paid &gt; 0 but total is empty, the app blocks the save until the agreed total is entered.
3. **Delivered** — an order may be marked **Delivered** only if:
   - **Total** is set and &gt; 0;
   - **Primary payment mode** is set;
   - **Paid ≥ total** (ledger shows **paid**).

That enforces **no delivery without payment tracking** for new saves: **COD** must be recorded at handover (paid updated) **before** or **with** the same save as status **Delivered**.

**Metadata-only edits** (delay notes, accessories, etc.) do **not** re-run delivery rules, so legacy orders that predate these checks can still be edited without fixing history; fix amounts on the order detail screen when you touch them.

## Daily tracking

**Admin → Payments & receivables** (`/admin/payments`) shows:

- **Payments recorded (day)** — sum of positive audit deltas on the selected **IST** date.
- **Pending collections** — sum of outstanding balances across **non-cancelled** orders with a total set.
- **Delivered (this day)** — count and **quoted total** value for orders whose **delivered** timestamp falls on that IST day.

**Note:** The orders list is capped at **500** newest orders; if you have more, the summary may be incomplete until you add pagination or a dedicated query.

## Error handling & validation rules (summary)

| Situation | Behaviour |
|-----------|-----------|
| Missing total / mode when marking delivered | `400` with a clear message. |
| Outstanding balance when marking delivered | `400` — record payment (including COD) first. |
| Paid &gt; total (beyond tolerance) | `400` — fix typo or adjust total. |
| Duplicate / mistaken payment | Not auto-blocked; use audit log + bank statement to reconcile. |

## Workflow (recommended)

1. **Quote** — set **Total** when the customer agrees.
2. **Advance** — increase **Paid** when you receive UPI/cash; **Payment notes** optional reference.
3. **COD** — before delivery, set **Paid** to the full amount when cash is collected; **mode** COD.
4. **Deliver** — only when the ledger shows **paid** and mode is set.
5. **End of day** — open **Payments & receivables**, compare **Payments recorded** to your UPI/cash book; filter **Orders** by **Payment** = partial/pending for follow-ups.

## API

- `PATCH /api/admin/orders/[id]` — ledger validation + audit append on paid change.
- `GET /api/admin/ledger/summary?date=YYYY-MM-DD` — JSON summary (admin session required).

See also `docs/FINANCIAL_LEDGER.md` and `docs/RECEIPTS.md`.
