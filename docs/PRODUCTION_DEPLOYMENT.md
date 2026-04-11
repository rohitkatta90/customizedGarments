# Production deployment checklist

**Document name:** Garment Services — Production deployment  
**Purpose:** Single place for **everything to do before and right after** pointing customers at the live site. Use it for first launch and for any major “go live” cutover.

**Related:** [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) (env table, Vercel basics), [OWNER_DATA_ACCESS.md](./OWNER_DATA_ACCESS.md) (secrets & data map), [ADMIN_OPERATIONS_RUNBOOK.md](./ADMIN_OPERATIONS_RUNBOOK.md) (staff UI), `.env.example` (variable names).

---

## 1. Preconditions

| # | Action | Notes |
|---|--------|--------|
| 1.1 | **Repository** is the source of truth | Main branch builds cleanly (`npm run build`). |
| 1.2 | **Hosting** account ready | e.g. Vercel project linked to Git. |
| 1.3 | **Domain decision** | Use Vercel default (`*.vercel.app`) or attach **custom domain** (DNS per Vercel instructions). |
| 1.4 | **Node** | CI/hosting uses **Node 20.x** (matches `package.json` `engines`). |

---

## 2. Environment variables (production)

Set these in the host (**Vercel → Project → Settings → Environment Variables**), scoped to **Production** (and **Preview** if staff test on preview URLs). **Redeploy** after any change.

### 2.1 Required for a credible public site

| Variable | Action |
|----------|--------|
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Set to real business WhatsApp: **digits only**, country code, **no** `+` (e.g. `9198xxxxxxxx`). |
| `NEXT_PUBLIC_SITE_URL` | Set to **canonical live URL** with **no trailing slash** (e.g. `https://your-domain.com` or `https://project.vercel.app`). Update again if you add a custom domain. |
| `NEXT_PUBLIC_BUSINESS_NAME` | Set to the public brand name (header, metadata, `{{name}}` in copy). **Build-time** for client bundle — redeploy after changes. |

### 2.2 Strongly recommended

| Variable | Action |
|----------|--------|
| `NEXT_PUBLIC_DESIGNER_PHONE` | Real **Call** / `tel:` number (may include `+` and spaces). |
| `NEXT_PUBLIC_UPI_ID` | Real or operational UPI id shown in the Payments section (public). |

### 2.3 Optional public behaviour

| Variable | Action |
|----------|--------|
| `NEXT_PUBLIC_SHOW_PRICING` | Set to `true` only if `/pricing` should appear in nav/footer/sitemap; omit or use non-`true` to hide. |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Optional override for tagline (see `.env.example`). |

### 2.4 Order persistence & admin (operations)

| Variable | Action |
|----------|--------|
| `FIREBASE_PROJECT_ID` | From Firebase project settings. |
| `FIREBASE_CLIENT_EMAIL` | Service account email (`…@….iam.gserviceaccount.com`). |
| `FIREBASE_PRIVATE_KEY` | Full PEM; in Vercel use **one line** with `\n` between PEM lines (same pattern as `.env.example`). **Server-only** — never `NEXT_PUBLIC_*`. |

**Firebase console:** Enable **Firestore**. Deploy **Firestore security rules** appropriate for your setup (this app uses **Admin SDK** on the server for orders/expenses; rules still matter if you add client access later).

| Variable | Action |
|----------|--------|
| `ADMIN_PASSWORD` | Strong secret — typed at `/admin/login`. |
| `ADMIN_SESSION_TOKEN` | Long random secret — must **match** what the server expects for cookie `gs_admin` (see `src/proxy.ts`). **Not** the same string as `ADMIN_PASSWORD`. |

Without both admin vars, `/admin/login` shows **Admin unavailable**. Without Firebase trio, orders are **not** saved to Firestore (API may still accept POSTs; see `firestore_not_configured` behaviour).

### 2.5 Optional automations

| Variable | Action |
|----------|--------|
| `ORDERS_SHEET_WEBHOOK_URL` | If you use Make/Zapier/Apps Script: set HTTPS webhook URL; each accepted order POSTs a JSON payload (see `src/lib/orders/sheet-webhook.ts`). Omit to disable. |
| `ORDERS_SHEET_WEBHOOK_USE_FORM` | Set `true` if your automation needs `application/x-www-form-urlencoded` instead of JSON. |

### 2.6 Optional: measurements lookup (Google Sheets)

Only if you use **Find my measurements** / `POST /api/measurements/lookup`:

| Variable | Action |
|----------|--------|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | From sheet URL. |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Service account with Sheets API + sheet shared (Viewer). |
| `GOOGLE_SHEETS_PRIVATE_KEY` | PEM or full JSON string per [MEASUREMENTS_GOOGLE_SHEETS.md](./MEASUREMENTS_GOOGLE_SHEETS.md). |
| `GOOGLE_SHEETS_RANGE` / `GOOGLE_SHEETS_TAB_NAME` | As documented; defaults exist. |
| `GOOGLE_SHEETS_CACHE_TTL_SECONDS` | Optional. |
| `MEASUREMENT_LOOKUP_DEBUG` | Optional. Set `1` only when debugging (extra logging). Omit in production. |

If unset, measurement lookup returns “not configured” — site otherwise works.

**Production vs staging (same variable names, different values):** You do **not** need new env *names* for prod. In Vercel, set **Production** and **Preview** environments separately: e.g. Preview can point `GOOGLE_SHEETS_SPREADSHEET_ID` at a **copy** of the sheet or a **staging tab** (`GOOGLE_SHEETS_RANGE` like `Staging!A:T`) so test numbers never touch the live master sheet. For **orders**, prefer a **separate Firebase project** (or at least separate Firestore database) for staging vs production so test checkouts do not mix with real customers. The **orders webhook** (`ORDERS_SHEET_WEBHOOK_URL`) should target a **staging** Make/Zapier scenario on Preview and the **live** sheet/automation in Production.

---

## 3. Firebase / Google Cloud tasks

| # | Action |
|---|--------|
| 3.1 | Create or select **Firebase project**; enable **Firestore** (Native mode). |
| 3.2 | Create **service account** with access to Firestore; download JSON **once** for extracting `project_id`, `client_email`, `private_key` into env (do not commit JSON). |
| 3.3 | If Firestore prompts for **indexes** (from error links in logs), create them. |
| 3.4 | Confirm collections used by the app: **`garment_orders`**, **`studio_expenses`** (expenses admin). |
| 3.5 | **Backup policy** (owner): schedule exports or manual backups per your compliance needs — not automated in-repo. |

---

## 4. Content & data in the repo (before prod)

| # | Action | Location |
|---|--------|----------|
| 4.1 | Review **gallery**: images, copy, deep links | `public/data/catalog.json` |
| 4.2 | Review **reviews** | `public/data/reviews.json` |
| 4.3 | Review **pricing** and related JSON if shown | `public/data/pricing.json`, etc. (see [OWNER_DATA_ACCESS.md](./OWNER_DATA_ACCESS.md)) |
| 4.4 | Confirm **`next.config.ts`** `images.remotePatterns` includes every **remote image host** used in catalog JSON |

---

## 5. Deploy pipeline

| # | Action |
|---|--------|
| 5.1 | Push branch that builds successfully. |
| 5.2 | Confirm production deploy finished without errors. |
| 5.3 | If you changed **only** env vars: trigger **Redeploy** (no code change needed). |
| 5.4 | After **custom domain** attach: update `NEXT_PUBLIC_SITE_URL` and redeploy. |

---

## 6. Post-deploy verification (smoke tests)

Run these on the **production URL**:

| # | Check |
|---|--------|
| 6.1 | **Home** loads; header shows correct **brand** and WhatsApp entry points. |
| 6.2 | **WhatsApp** links use `NEXT_PUBLIC_WHATSAPP_PHONE` (open one link; number correct). |
| 6.3 | **Call designer** / sticky **Call** uses `NEXT_PUBLIC_DESIGNER_PHONE`. |
| 6.4 | **Gallery** images load (no broken `next/image` domains). |
| 6.5 | **`/request`** — submit a **test order** (use a test phone if possible). |
| 6.6 | **Firestore** — confirm document appears under `garment_orders` (Firebase Console) **or** in **Admin → Orders** after login. |
| 6.7 | **`/admin/login`** — shows login form (not “Admin unavailable”); **Sign in** works; **`/admin/orders`** lists orders. |
| 6.8 | **Tracking** — open tracking URL returned after submit (or from admin **Copy link**); status page loads for that token. |
| 6.9 | **`/sitemap.xml`** and **`/robots.txt`** load. |
| 6.10 | **OG / metadata** — share homepage in a tester; title and URL look correct (`NEXT_PUBLIC_SITE_URL`). |
| 6.11 | If **`ORDERS_SHEET_WEBHOOK_URL`** set — confirm automation receives one test row. |
| 6.12 | **`/admin/payments`** and **`/admin/expenses`** load (Firestore required); spot-check **Log out** on Orders or Expenses. |

---

## 7. Security & operations

| # | Action |
|---|--------|
| 7.1 | **Never** commit `.env.local` or service account JSON. |
| 7.2 | Store **ADMIN_*** and **FIREBASE_PRIVATE_KEY** only in hosting secrets. |
| 7.3 | **Rotate** `ADMIN_PASSWORD` + `ADMIN_SESSION_TOKEN` if someone leaves or credentials leak; redeploy. |
| 7.4 | **Revoke** old Firebase/Google keys in Cloud Console when rotating. |
| 7.5 | Limit who knows **admin password**; use [ADMIN_OPERATIONS_RUNBOOK.md](./ADMIN_OPERATIONS_RUNBOOK.md) for training. |

---

## 8. Optional: custom domain & SSL

| # | Action |
|---|--------|
| 8.1 | Vercel **Domains** → add domain → apply DNS records. |
| 8.2 | Wait for **SSL** active. |
| 8.3 | Set `NEXT_PUBLIC_SITE_URL` to `https://your-custom-domain` and **redeploy**. |

---

## 9. Launch communication (non-technical)

| # | Action |
|---|--------|
| 9.1 | Update **Google Business / social / printed** materials with final URL and WhatsApp number. |
| 9.2 | Brief staff: **admin URL**, password handling, where orders appear. |
| 9.3 | Decide **who** monitors WhatsApp vs who updates **admin** status. |

---

## 10. After launch

| # | Action |
|---|--------|
| 10.1 | Monitor first real orders for failed submits (browser network tab / Vercel logs / Firestore). |
| 10.2 | Revisit **Firestore rules** and **indexes** if you change query patterns. |
| 10.3 | Keep this document updated when you add env vars or new production steps. |

---

## Quick copy: minimum env for “full” prod (typical)

```
NEXT_PUBLIC_BUSINESS_NAME=
NEXT_PUBLIC_WHATSAPP_PHONE=
NEXT_PUBLIC_DESIGNER_PHONE=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_UPI_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_TOKEN=
```

Add optional vars from §2.5–§2.6 as needed.
