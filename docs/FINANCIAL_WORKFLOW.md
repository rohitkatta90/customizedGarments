# End-to-end financial workflow (orders → payments → receipts)

This document is the **operational playbook** for daily use. It ties together the **order ledger** on each Firestore order, **admin validation**, **WhatsApp receipts**, and **daily reconciliation**. Technical details live in [PAYMENT_RECONCILIATION.md](./PAYMENT_RECONCILIATION.md), [RECEIPTS.md](./RECEIPTS.md), and [FINANCIAL_LEDGER.md](./FINANCIAL_LEDGER.md).

---

## Goals

- **No step skipped** — every paying job has a quoted total, tracked payments, and a clear moment of completion.
- **Data consistency** — totals, paid amounts, and delivery rules stay aligned (the API enforces the risky transitions).
- **Simple daily ops** — one order screen, one receipt button, one payments dashboard for the day.

---

## Step-by-step workflow

| Step | What happens | In the app | Owner (typical) |
|------|----------------|------------|------------------|
| **1. Order created** | A new job enters the system; it becomes your **order ledger row** (same document for ops + money). | Customer submits **Service request** → order saved to **`garment_orders`** with items, customer, tracking token. **Total** and **Paid** start empty / zero. | **Intake** — confirm the request is captured (WhatsApp + admin list). |
| **2. Price finalization** | You agree the full price **including accessories / extras** before taking significant payment. | **Admin → Order → Ledger:** set **Total (₹)**. List quoted extras in **Additional styling elements** if you use that section. **Save.** | **Owner / tailor** — only they should lock the final quote. |
| **3. Payment handling** | Money is recorded as it arrives: **advance**, then **balance**, or **full** upfront, or **COD** at the end. | **Paid (₹)** = cumulative received. Set **Primary payment mode** (UPI / COD / mixed / cash / other). Use **Payment notes** for UPI refs or “₹2k advance, rest COD”. **Save** after each material change. Each save that changes **Paid** appends an **audit** row (for daily totals). | **Whoever collects** — cash desk or designer with UPI on phone. |
| **4. Order completion (delivery)** | Work is handed over; financially, the job should be **fully settled** when you mark **Delivered** (see rules below). | Set status to **Delivered** only when **Total** &gt; 0, **payment mode** is set, and **Paid ≥ Total**. For **COD**, enter cash collected **before** or **in the same save** as Delivered. | **Dispatch / front desk** with the person who marks status. |
| **5. Receipt generation** | Customer gets a clear **summary + payment confirmation**. | **Admin → Order → Copy WhatsApp receipt** — paste into WhatsApp. Prefer **after** ledger is saved so totals match. See [RECEIPTS.md](./RECEIPTS.md) for timing (UPI vs COD). | **Customer-facing staff** (often same as intake). |
| **6. Ledger update (“completed”)** | “Completed” here means **financially closed**: nothing left to collect on that order. | **Payment status** is **derived** — it becomes **paid** when **Paid ≥ Total** (and order not cancelled). Use **Admin → Payments & receivables** for **today’s** inflows and **pending** balances across open orders. End-of-day: compare to bank/UPI/cash. | **Owner / bookkeeper** — 5–10 minutes daily. |

---

## How the app enforces consistency

These rules reduce skipped steps **when you change status or money fields**:

1. You **cannot** record **Paid** without a **Total** (stops random partials with no quote).
2. **Paid** cannot exceed **Total** beyond a ₹1 tolerance (reduces double entry).
3. You **cannot** mark **Delivered** without: **Total** set, **payment mode** set, and **full settlement** (**Paid ≥ Total**). So **COD** must be booked when cash is taken, not “later in the head.”

Non-financial edits (e.g. internal delay notes) do not re-trigger these checks, so old data can still be adjusted — but **fix the ledger** the next time you edit that order.

---

## Responsibilities at each stage (summary)

| Stage | Primary responsibility | Must be true before moving on |
|--------|------------------------|------------------------------|
| Intake | Order exists in admin with correct items | Customer identifiable; order ID shareable |
| Quoting | **Total** reflects fabric + labor + agreed extras | Customer acknowledged price (WhatsApp OK) |
| Collection | **Paid** and **mode** updated when money moves | Notes match reality (split payments) |
| Delivery | Status **Delivered** only when money matches quote | Handover + payment for COD done |
| Receipt | WhatsApp receipt sent with **saved** ledger | Customer has written confirmation |
| Control | Daily **Payments & receivables** + filters on **Orders** | No long list of **partial** without a plan |

---

## Common failure points (and how to avoid them)

| Failure | Why it hurts | What to do |
|---------|----------------|------------|
| **Delivered without total** | Revenue and tax records are meaningless | Always set **Total** before heavy work or final payment |
| **COD delivered but Paid still low** | The app **blocks** Delivered — good | At handover: count cash → update **Paid** → then **Delivered** in one flow |
| **Receipt copied before Save** | Customer sees wrong numbers | **Save** the order, then **Copy WhatsApp receipt** |
| **Advance recorded but total later changes** | Pending math drifts | When scope changes, **update Total** and tell the customer; re-send receipt if needed |
| **Duplicate Paid entry** | Audit shows two identical jumps | Cross-check UPI SMS; use **Payment notes**; fix with a downward correction if needed (audit allows) |
| **Skipping daily check** | Pending balances pile up | Filter orders by **Payment** = partial/pending; use **Payments & receivables** for the day |
| **Only using memory for “who owes what”** | Leakage | Single source of truth = **order ledger** in admin |

---

## Minimal daily checklist (simple routine)

1. **Morning:** Open **Orders** — filter **Payment** = partial / pending; chase large balances.
2. **When money hits:** Open the order → **Paid** / **notes** → **Save**.
3. **At handover:** **Paid** = **Total** (or adjust **Total** if agreed) → **Delivered** → **Copy WhatsApp receipt** → send.
4. **Evening:** **Payments & receivables** — compare “payments recorded” to UPI/cash book; spot-check **Pending collections**.

---

## Related documentation

| Topic | Doc |
|--------|-----|
| Validation rules, audit log, API errors | [PAYMENT_RECONCILIATION.md](./PAYMENT_RECONCILIATION.md) |
| Receipt text, when to send, template shape | [RECEIPTS.md](./RECEIPTS.md) |
| Field meanings and spreadsheet mapping | [FINANCIAL_LEDGER.md](./FINANCIAL_LEDGER.md) |
| Accessories quoting | [ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md) |
| Order statuses and tracking | [ORDER_TRACKING.md](./ORDER_TRACKING.md) |
