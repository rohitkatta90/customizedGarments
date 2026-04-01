# Owner guide — data access & credentials

**Audience:** You (business owner) — where your data lives, what to keep secret, and how to reach each system. Technical teammates can use [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for setup.

---

## 1. Quick map: what lives where

| Data | Location | How you access it |
|------|----------|-------------------|
| **Catalog, pricing & reviews** (public) | `public/data/catalog.json`, **`pricing.json`**, **`effort-pricing.json`**, **`dynamic-pricing.json`**, **`profit-margin.json`**, **`staff-pricing-policy.json`**, `reviews.json` in the **Git repo** | Edit files → deploy. **`/pricing`** includes INR tables, effort, rush/peak, margin, staff consistency. See [PRICING_MODEL.md](./PRICING_MODEL.md), [EFFORT_BASED_PRICING.md](./EFFORT_BASED_PRICING.md), [DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md), [PROFIT_MARGIN.md](./PROFIT_MARGIN.md), [PRICING_COMMUNICATION.md](./PRICING_COMMUNICATION.md), [INTERNAL_PRICING_GUIDELINES.md](./INTERNAL_PRICING_GUIDELINES.md). |
| **Orders** (customer PII, items, money) | **Google Firestore** — collection `garment_orders` | [Firebase Console](https://console.firebase.google.com) → your project → Firestore. Same data appears in **Admin → Orders** in the app. |
| **Expenses** (internal) | Firestore — collection `studio_expenses` | Firebase Console **or** **Admin → Expense ledger**. |
| **Admin session** | **HTTP-only cookie** `gs_admin` in the browser | Log in at `/admin/login`; value equals your server secret (see below). |

**Single source of truth for day-to-day ops:** the **admin UI** (`/admin/orders`, `/admin/orders/[id]`, `/admin/payments`, `/admin/expenses`). Use the **Firebase console** for backups, debugging, or if the site is down.

---

## 2. Hosting & environment (Vercel or similar)

| Item | What you need to know |
|------|------------------------|
| **Where secrets live** | Hosting dashboard → **Environment variables** (e.g. Vercel → Project → Settings → Environment Variables). |
| **Production vs preview** | Set variables for **Production** (and Preview if you use branch deploys). |
| **After changing env** | **Redeploy** so new values apply. |

### Variables the business cares about (non-exhaustive)

| Variable | Owner concern |
|----------|----------------|
| `NEXT_PUBLIC_BUSINESS_NAME` | Your brand name on the site. |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | **Digits only**, country code, no `+` — every WhatsApp link uses this. |
| `NEXT_PUBLIC_SITE_URL` | Your live URL (no trailing slash) — tracking links, SEO, sitemap. |
| `NEXT_PUBLIC_UPI_ID` | Shown to customers as payment hint (public). |
| `ADMIN_PASSWORD` | **Secret** — password you type at `/admin/login`. |
| `ADMIN_SESSION_TOKEN` | **Secret** — long random string; cookie must match. **Anyone with this can forge admin access** if combined with other gaps — treat like a password. |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | **Server-only** — connect the app to Firestore. **Never** paste the private key into chat, email, or a public repo. |

Full table: [PROJECT_GUIDE.md §4](./PROJECT_GUIDE.md).

---

## 3. Firebase / Google Cloud (orders & expenses)

| Item | Detail |
|------|--------|
| **Console** | [console.firebase.google.com](https://console.firebase.google.com) — select **your** project. |
| **Firestore collections** | `garment_orders` — one document per order (ID = order id). `studio_expenses` — expense lines. |
| **Who can read/write from the browser** | This app uses **server-side** `firebase-admin` with a **service account** — keys stay on the server. **Do not** expose service account JSON in the client. |
| **Indexes** | If Firestore shows an “index required” link in logs, open it once and **Create index**. |

**Backup / export (owner responsibility):** Periodically use **Google Cloud** export or Firebase extensions, or export collections manually for your records — not automated in this repo.

---

## 4. Admin URLs (bookmark these)

| URL | Purpose |
|-----|---------|
| `/admin/login` | Sign in with `ADMIN_PASSWORD`. |
| `/admin/orders` | All orders; filters; quick status changes. |
| `/admin/orders/[id]` | Full order: ledger, tracking link, receipt copy, internal notes. |
| `/admin/payments` | Daily payments & receivables snapshot. |
| `/admin/expenses` | Expense ledger. |

**Auth:** Middleware checks cookie `gs_admin` === `ADMIN_SESSION_TOKEN`. **Log out** clears the cookie (`/api/admin/logout`).

---

## 5. APIs (server-only; session cookie)

These require a valid admin session (same cookie as the admin UI):

- `GET /api/admin/orders` — list orders (filters).
- `PATCH /api/admin/orders/[id]` — update order (status, money, notes).
- `GET /api/admin/ledger/summary` — daily financial summary.
- `GET/POST/PATCH/DELETE /api/admin/expenses` — expenses.

**Customer-facing:** `POST /api/orders` creates orders (no admin password — public intake). `GET` tracking uses a **secret token** in the URL, not the admin cookie.

---

## 6. Privacy & compliance (practical)

| Topic | Guidance |
|-------|----------|
| **Customer data** | Names, phones, garment notes live in **Firestore** and in **WhatsApp** on your phone. |
| **Catalog / reviews JSON** | **Public** on the website — no secrets, no unreleased personal info. |
| **Staff** | Share **admin password** only with trusted people; rotate `ADMIN_PASSWORD` and `ADMIN_SESSION_TOKEN` if someone leaves. |
| **Service account key** | Only on the server (Vercel env). If leaked, **revoke** the key in Google Cloud IAM and create a new one. |

---

## 7. Related playbooks

| Topic | Document |
|--------|----------|
| Env, deploy, troubleshooting | [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) |
| Production go-live checklist | [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) |
| Firestore order fields | [ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md) |
| Money workflow | [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md) |
| Catalog features | [CATALOG_CAPABILITIES.md](./CATALOG_CAPABILITIES.md) |
