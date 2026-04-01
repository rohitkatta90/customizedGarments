# Admin operations runbook — screen & control map

**Document name:** Garment Services — Admin Operations Runbook  
**Audience:** Owner, ops lead, staff using the back office  
**Scope:** What each critical business workflow maps to in the app (routes, page titles, buttons, links, and key fields).

---

## Route index

| Route | Page title (main heading) | Purpose |
|--------|-----------------------------|--------|
| `/admin/login` | **Admin login** (or **Admin unavailable** if env missing) | Sign in |
| `/admin/orders` | **Orders** | Order queue, filters, quick status, open detail |
| `/admin/orders/[id]` | **Order** | Full edit for one order (status, money, handoff, extras, notes) |
| `/admin/payments` | **Payments & receivables** | Daily ledger snapshot (IST) |
| `/admin/expenses` | **Expense ledger** | Business expenses; optional link to order |

**Session:** After login, other `/admin` URLs require a valid admin cookie. **Log out** appears on **Orders** and **Expense ledger** (not on Payments — navigate to Orders or Expenses to sign out).

---

## 1. Run the order pipeline

| Item | Where |
|------|--------|
| **Screen** | **Orders** — `/admin/orders` |
| **See all requests** | Table loads on open; columns include Order, Customer, Phone, Total, Paid, Pending, Pay (ledger status), Items, dates, **Status**. |
| **Change stage from list** | Per row: **Status** dropdown → pick a status (labels from `ORDER_STATUS_LABELS`). Saves on change. |
| **Open full record** | Same row: link **Details** → `/admin/orders/{orderId}`. |
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Change stage (detail)** | Field **Status** (dropdown). |
| **Persist** | Button **Save changes** (shows **Saving…** while working). |

---

## 2. Keep delivery promises honest

| Item | Where |
|------|--------|
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Internal delay reason** | **Workload / delay (internal)** — multiline field. Helper: “Not shown to customers.” |
| **Revised date (customer-visible)** | **Revised delivery date (customer)** — date input. Helper: shown on tracking as updated estimate. |
| **Rush vs standard** | **Priority** dropdown: **Standard** or **Rush / urgent**. |
| **Persist** | **Save changes** |

---

## 3. Handle scope and rework

| Item | Where |
|------|--------|
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Scope changes** | **Scope change after confirmation (internal)** — textarea. |
| **Rework / fit issues** | **Rework / measurement issue (internal)** — textarea. |
| **Persist** | **Save changes** |

---

## 4. Quote and confirm add-ons (styling / extras)

| Item | Where |
|------|--------|
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Section heading** | **Additional Styling Elements** |
| **Add a line** | Button **+ Add line**. |
| **Per line** | **Preset** dropdown (**Choose preset…**), **Description**, **₹ extra**, **Remove**. |
| **Customer approval state** | **Extras approval status** — dropdown. |
| **Internal notes** | **Notes (internal)** — textarea under extras. |
| **WhatsApp text for customer** | Button **Copy WhatsApp confirmation (extras)** |
| **Persist** | **Save changes** |

---

## 5. Control money on each order

| Item | Where |
|------|--------|
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Section** | **Ledger (payment)** |
| **Fields** | **Total (₹)**, **Paid (₹)**, **Primary payment mode**, **Payment notes** |
| **Read-only summary** | Lines showing **Pending:** and **Payment status:** (derived). |
| **WhatsApp receipt** | Button **Copy WhatsApp receipt** |
| **Reference pricing** | Link **Pricing guide** (opens public `/pricing` in new tab). |
| **Persist** | **Save changes** |
| **Quick view in list** | **Orders** — `/admin/orders` table columns **Total**, **Paid**, **Pending**, **Pay**. |

---

## 6. Hand work to production (assets + tailor notes)

| Item | Where |
|------|--------|
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Section** | **Design assets & tailor handoff** |
| **Folder link** | **Design folder URL** — URL field. |
| **Tailor notes** | **Structured tailor notes (internal)** — textarea. |
| **Naming help** | Block **Suggested file names** (read-only list per line item). |
| **WhatsApp packet** | Button **Copy tailor handoff (WhatsApp)** |
| **Persist** | **Save changes** |

---

## 7. Share customer tracking

| Item | Where |
|------|--------|
| **Screen** | **Order** — `/admin/orders/[id]` |
| **Section** | **Tracking** |
| **Copy URL** | Button **Copy link** (next to the tracking URL). If no token: message **No tracking token (older order).** |

---

## 8. Daily cash / UPI reconciliation

| Item | Where |
|------|--------|
| **Screen** | **Payments & receivables** — `/admin/payments` |
| **Pick day** | **Report date (IST)** — date input. |
| **Reload** | Button **Refresh** |
| **Cards** | **Payments recorded (day)**, **Pending collections**, **Delivered (this day)** (with subtext). |
| **Navigation** | Link **← Orders**; link **Expense ledger →** |
| **Note** | No **Log out** on this page — use **Orders** or **Expense ledger**. |

---

## 9. Track business spending

| Item | Where |
|------|--------|
| **Screen** | **Expense ledger** — `/admin/expenses` |
| **Add row** | Form **Add expense**: **Date**, **Type**, **Amount (₹)**, **Vendor / payee**, **Linked order ID (optional)**, **Notes** |
| **Submit** | Button **Add expense** (**Saving…** while submitting). |
| **Remove row** | Per row: control **Delete** (confirms in browser). |
| **Navigation** | **← Orders**; **Payments & receivables →** |
| **Session** | Button **Log out** |

---

## 10. Find and chase the right orders

| Item | Where |
|------|--------|
| **Screen** | **Orders** — `/admin/orders` |
| **Filters** | **Status** (dropdown, **All** + each status), **Payment** (dropdown, **All** + ledger payment states), **Phone search** (digits / partial). |
| **Apply** | Button **Apply filters** |
| **Open detail** | **Details** on the row. |

---

## 11. Sign in and sign out

| Item | Where |
|------|--------|
| **Login** | `/admin/login` — **Admin login**; field **Password**; submit **Sign in** (**Signing in…** when pending). Success sends you to `from` query param or **`/admin/orders`**. |
| **Misconfiguration** | Same route shows **Admin unavailable** if `ADMIN_PASSWORD` / `ADMIN_SESSION_TOKEN` are not set. |
| **Logout** | **Orders** or **Expense ledger**: button **Log out** (clears session and returns to login). |

---

## 12. Cross-navigation (admin chrome)

From **Orders** (`/admin/orders`):

- Link **Expense ledger →** → `/admin/expenses`
- Link **Payments & receivables →** → `/admin/payments`
- Button **Log out**

From **Order detail** (`/admin/orders/[id]`):

- Link **← All orders** → `/admin/orders`
- Link **Expense ledger** → `/admin/expenses`

From **Payments** (`/admin/payments`):

- Link **← Orders** → `/admin/orders`
- Link **Expense ledger →** → `/admin/expenses`

From **Expenses** (`/admin/expenses`):

- Link **← Orders** → `/admin/orders`
- Link **Payments & receivables →** → `/admin/payments`
- Button **Log out**

---

## Related technical docs

- Order persistence & admin API: **`PROJECT_TECHNOLOGY.md`**, **`PROJECT_GUIDE.md`**
- Env vars for admin: `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN`, Firebase / Firestore

When the product UI changes, update this runbook so staff training stays accurate.
