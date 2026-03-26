# Financial ledger (simple) — design for a tailoring business

**Goal:** Track income, payments, and expenses without full accounting software. Start in **Google Sheets** or **Airtable**; structure maps cleanly to **Firestore** or **Django/Postgres** later.

### Implemented in this app (Firestore)

- **Orders** (`garment_orders`): `totalAmountInr`, `paidAmountInr`, `paymentModePrimary`, `financialNotes`; **`ledgerPaymentStatus`** is **computed on read** (`pending` / `partial` / `paid` / `none`). Edit on **Admin → Order details**. List filters: **Payment** on **Admin → Orders**.
- **Expenses** (`studio_expenses`): separate collection with **Admin → Expense ledger** (`/admin/expenses`) — add/delete rows, optional `linkedOrderId`.
- **API:** `GET/POST /api/admin/expenses`, `PATCH/DELETE /api/admin/expenses/[id]`; order PATCH accepts financial fields (see `updateOrderFields`).

You can still **export** to Google Sheets periodically for sharing with an accountant.

---

## 1. Order ledger (income / receivables)

One **row per order** (or one row per payment event — see “Partial payments” below).

### Recommended columns

| Column | Type | Notes |
|--------|------|--------|
| `order_id` | string | Stable ID — same as app/WhatsApp reference (e.g. UUID prefix). |
| `order_date` | date | Request or confirmation date (pick one rule and stick to it). |
| `customer_name` | string | |
| `customer_phone` | string | Normalized digits optional (second column `phone_normalized`). |
| `order_status` | enum | Align with ops: `request_received`, `confirmed`, `in_progress`, `ready`, `delivered`, `cancelled`. |
| `total_amount_inr` | number | **Agreed** order total (incl. agreed extras). |
| `paid_amount_inr` | number | Sum of money received so far. |
| `pending_amount_inr` | number | **Derived:** `total_amount_inr - paid_amount_inr` (formula column in Sheets). |
| `payment_status` | enum | `pending` \| `partial` \| `paid` — **derived** from amounts (see §4). |
| `payment_mode_primary` | enum | `UPI` \| `COD` \| `mixed` \| `partial` — how the *balance* is expected or how last payment was made. |
| `notes` | text | Optional: “advance ₹2k UPI, rest COD”. |

### Partial payments over time

**MVP (one row per order):** Update `paid_amount_inr` and optionally `payment_mode_primary` / `notes` when each installment arrives.

**Clearer audit (later):** Separate **Payments** tab: `order_id`, `date`, `amount_inr`, `mode` (`UPI`/`COD`/`cash`/`other`). Then `paid_amount_inr` = SUM of payments for that order. Same pattern works in Firebase/Django.

### Cancelled orders

- Set `order_status` = `cancelled`.
- Either **zero out** financial expectation (`total_amount_inr` = 0) with a `notes` “refunded / waived”, or keep amounts and note refund in `notes` — choose one policy for the studio.

---

## 2. Expense ledger

Separate **sheet/tab** (or Airtable **table**) — do not mix with order rows.

### Recommended columns

| Column | Type | Notes |
|--------|------|--------|
| `expense_date` | date | |
| `expense_type` | enum / single-select | e.g. `fabric`, `accessories`, `labor`, `rent`, `utilities`, `transport`, `other`. |
| `amount_inr` | number | Positive number; outflow. |
| `vendor_or_payee` | string | Optional. |
| `linked_order_id` | string | Optional — if expense is **directly** attributable to one job (e.g. lace for Order X). |
| `notes` | text | Invoice #, market name, etc. |

### Why separate

- Income/receivables stay in the **order** ledger; **cash out** stays in **expenses**. Monthly you can compare **sum(paid)** on orders vs **sum(expenses)** for a rough P&amp;L; real accounting may still need a bookkeeper for tax.

---

## 3. Payment status (`pending` / `partial` / `paid`)

**Derive from numbers** to avoid contradictions:

| Rule | `payment_status` |
|------|------------------|
| `paid_amount_inr` ≤ 0 (or no payment yet) and `total_amount_inr` &gt; 0 | `pending` |
| 0 &lt; `paid_amount_inr` &lt; `total_amount_inr` | `partial` |
| `paid_amount_inr` ≥ `total_amount_inr` (and total &gt; 0) | `paid` |

Optional: if `order_status` = `cancelled` and no money due, force `payment_status` to `paid` or a dedicated `n/a` — document the rule.

**`payment_mode_primary`:** Use `UPI` / `COD` for the **expected** final settlement or the **last** payment; use `mixed` when both appear; `partial` is redundant with status — prefer **mode** to describe *instrument*, **status** to describe *completion*.

---

## 4. Data organization approach

### Google Sheets

- **Workbook:** `Studio_Ledger_YYYY`
- **Tabs:** `Orders`, `Expenses`, optional `Payments` (if you split installments).
- **Orders:** Protect header row; use **Data validation** for enums; `pending_amount_inr` = formula.
- **Access:** Owner + 1–2 staff; version history for audit.

### Airtable

- **Bases:** same split — **Orders**, **Expenses**; optional **Payments** linked to Orders via **linked record**.
- **Views:** Kanban or filter by `payment_status`; grid by month for `order_date` / `expense_date`.
- **Automations:** optional Slack/email when `payment_status` becomes `paid`.

### Firestore (future)

- **`ledger_orders`** (or extend `garment_orders`): `totalAmountInr`, `paidAmountInr`, `paymentStatus`, `paymentMode`, `currency: "INR"`.
- **`ledger_expenses`** collection: one doc per expense line.
- **`ledger_payments`** optional subcollection under order: `{ amountInr, at, mode, note }`.

### Django/SQL (future)

- **orders** — financial columns + FK customer.
- **payments** — FK order, amount, mode, timestamp (supports many partials).
- **expenses** — standalone; optional FK order for attributable cost.

---

## 5. Workflow (maintaining records)

| When | Action |
|------|--------|
| **Order confirmed (WhatsApp)** | New row in **Orders** (or update existing if you created a placeholder at request): set `total_amount_inr`, `paid_amount_inr` = advance if any, `order_status`. |
| **Every payment received** | Increase `paid_amount_inr`; check formula `pending_amount_inr`; mode in `notes` or **Payments** tab. |
| **Order delivered** | Confirm `total_amount_inr` matches final invoice; chase `pending` to `paid`. |
| **Any purchase** | New row in **Expenses**; tag `expense_type`; link `linked_order_id` if job-specific. |
| **Weekly (15 min)** | Filter `payment_status` = `partial` or `pending` for active orders; reconcile with UPI/COD log. |
| **Monthly** | Sum paid vs expenses; export CSV for CA if needed. |

### Discipline

- **Single source of truth:** Either the sheet is authoritative for money, or the app is — if both exist, define **which is master** and sync weekly.

---

## 6. Alignment with this codebase

**Implemented:** Firestore `garment_orders` stores `totalAmountInr`, `paidAmountInr`, `paymentModePrimary`, `financialNotes`; **`ledgerPaymentStatus`** is **computed** when reading; **payment audit** (`paymentAuditLog`) on each paid change. Admin: **Orders** list, **Order details**, **Payments & receivables** (`/admin/payments`), **Expense ledger**. Validation and reconciliation rules: **`docs/PAYMENT_RECONCILIATION.md`**.

You can still **export** to Google Sheets periodically for sharing with an accountant.

---

## 7. Scalability summary

| Layer | Now (Sheets/Airtable) | Later (Firebase/Django) |
|-------|------------------------|---------------------------|
| Order money | Rows + formulas | Order doc or SQL row + optional payment rows |
| Expenses | Separate tab/table | `expenses` collection/table |
| Audit | Sheet history / Airtable log | Immutable `payments` rows, `created_at` |

Keep **amounts in INR integers** (or two decimal if you ever need paise) and **one currency** until you need multi-currency.
