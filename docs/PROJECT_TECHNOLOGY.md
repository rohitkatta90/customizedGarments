# Project technology & integrations

This document is a single reference for **what the stack is**, **which services connect to the app**, and **where to look in the repo**. Operational setup (env copy-paste, deploy steps) stays in **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)**; domain rules stay in the linked feature docs.

---

## 1. Product in one paragraph

**Garment Services / Radha Creations** (configurable via `NEXT_PUBLIC_BUSINESS_NAME`) is a **mobile-first marketing and request site** for a women’s tailoring / alteration studio. Customers browse a **JSON-driven catalog**, submit **stitching / alteration / booking** flows, and complete the handoff in **WhatsApp** (no in-app payment checkout). Optional **Firestore** persists orders for **admin** and **tracking**; optional **Google Sheets** supplies read-only **saved measurements**; an optional **HTTP webhook** can push order summaries to **Make / Zapier / Apps Script** for spreadsheets or automation.

---

## 2. Core technologies

| Layer | Technology | Version (approx.) | Notes |
|--------|------------|-------------------|--------|
| Framework | **Next.js** (App Router) | 16.x | Server components, `src/app` routes, API routes under `src/app/api` |
| UI library | **React** | 19.x | Client components where interactivity is required (`"use client"`) |
| Language | **TypeScript** | 5.x | Strict typing across `src/` |
| Styling | **Tailwind CSS** | 4.x | `@import "tailwindcss"`, `@theme inline` tokens in `src/app/globals.css` |
| PostCSS | **@tailwindcss/postcss** | 4.x | Wired for Tailwind v4 |
| Linting | **ESLint** + **eslint-config-next** | 9.x / 16.x | `npm run lint` |

### Fonts & visual design

- **Inter** — UI / body (`next/font/google`, CSS variable `--font-inter`).
- **Playfair Display** — headings / display (`--font-playfair`).
- Design tokens: warm neutrals, rose accent (`--accent`, `--accent-dark`) defined in `:root` and `@theme inline` in `globals.css`.

### Build & run

- **Node.js** — use an LTS version compatible with Next 16 (see Next.js docs).
- Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- **Turbopack** is used for `next dev` / build as per Next 16 defaults.

### Deployment (typical)

- **Vercel** is the documented target (see `README.md`, `PROJECT_GUIDE.md`).  
- `NEXT_PUBLIC_SITE_URL` should match the production origin (metadata, OG, sitemap).

### Security-related defaults

- **`next.config.ts`**: response headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`); **remote image** allowlist includes `images.unsplash.com` for catalog imagery.

---

## 3. Application structure (where things live)

| Area | Path | Role |
|------|------|------|
| Routes & layouts | `src/app/**` | Pages, `layout.tsx`, `metadata`, `sitemap.ts`, `robots.ts`, `manifest.ts` |
| API | `src/app/api/**/route.ts` | Server endpoints (orders, admin, measurements) |
| Layout chrome | `src/components/layout/` | Header, footer |
| Marketing / home | `src/components/home/` | Hero, sections, CTAs |
| Catalog | `src/components/catalog/` | Gallery, cards |
| Forms | `src/components/forms/` | Stitching, alteration, book, delivery helper |
| Order flows | `src/components/order/` | Quick stitch, full service request, measurement panel |
| Admin UI | `src/app/admin/**` | Login, orders list/detail, expenses, payments |
| Shared UI | `src/components/ui/` | Button, stars, etc. |
| Business logic | `src/lib/**` | Site config, orders, WhatsApp builders, pricing parsers, i18n, measurements |
| Static data | `public/data/*.json` | Catalog, reviews, pricing JSON consumed at build/runtime |
| Access control | `src/middleware.ts` | Protects `/admin/*` (except login) via cookie vs `ADMIN_SESSION_TOKEN` |

---

## 4. Data & configuration

### Brand name consistency

- **`NEXT_PUBLIC_BUSINESS_NAME`** drives `siteConfig.name` (header, footer title, default metadata title template, PWA manifest name).
- English copy can use the placeholder **`{{name}}`** in `dictionaries.ts`; render paths call **`formatBrandText()`** from `src/lib/site.ts` so subtitles, descriptions, and hero eyebrow stay aligned with the env-driven name on Vercel builds.

### Environment variables

Canonical list and comments: **`.env.example`**. Categories:

- **Public (browser)** — `NEXT_PUBLIC_*`: business name, WhatsApp digits, designer phone, site URL, UPI placeholder, optional pricing visibility.
- **Server-only** — Firebase admin credentials, Google Sheets credentials, admin session secret / password, optional order webhook URL.

Never commit **`.env.local`** or real keys.

### JSON catalogs (no CMS in-repo)

- **`public/data/catalog.json`** — Gallery / request catalog items (images, categories, ids).
- **`public/data/reviews.json`** — Testimonials / social proof.
- **Pricing / internal policy JSON** — Various files under `public/data/` used by `/pricing` and admin-oriented docs (see `PRICING_MODEL.md`, `DYNAMIC_PRICING.md`, etc.).

### Internationalization (i18n)

- Copy lives in **`src/lib/i18n/dictionaries.ts`** (English dictionary shape in `types.ts`).
- **`I18nProvider`** supplies `dict` to client components; **`getDictionary` / `getLocale`** in `src/lib/i18n/server.ts` feed the root layout (locale wiring can be extended; structure is ready for multiple locales).

---

## 5. Backend & integrations

### 5.1 WhatsApp (primary handoff)

- **Mechanism:** `https://api.whatsapp.com/send?phone=<digits>&text=<url-encoded>` built in **`src/lib/whatsapp.ts`** (`buildWhatsAppUrl`).
- **Phone:** `NEXT_PUBLIC_WHATSAPP_PHONE` — digits only, country code, no `+` (normalized via `src/lib/site.ts`).
- **Message bodies:** Composed in **`src/lib/order/quick-request.ts`**, **`src/lib/order/whatsapp.ts`**, **`src/lib/whatsapp.ts`** templates, etc. Prefilled text avoids most **emoji** (WhatsApp clients often corrupt supplementary-plane characters in URL query strings).

### 5.2 Firebase Admin + Firestore (optional but used for orders)

- **Package:** `firebase-admin` (^12.x).
- **Usage:** Initialize with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (PEM with `\n` in env).
- **Collection:** `garment_orders` — see **`src/lib/orders/firestore.ts`**, **`docs/ORDER_ADMIN_SYSTEM.md`**, **`docs/ORDER_MODEL.md`**.
- **API:** `POST /api/orders` persists when Firebase is configured; admin CRUD under `/api/admin/orders`.

### 5.3 Google Sheets API (optional — measurements lookup)

- **Package:** `googleapis` (^144.x) — Sheets v4, **read-only** scope.
- **Env:** `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, optional `GOOGLE_SHEETS_RANGE`, `GOOGLE_SHEETS_TAB_NAME`, `GOOGLE_SHEETS_CACHE_TTL_SECONDS`.
- **Code:** **`src/lib/measurements/sheets-fetch.ts`**, parsing in **`sheet-parse.ts`**, **`POST /api/measurements/lookup`**.
- **Docs:** **`docs/MEASUREMENTS_GOOGLE_SHEETS.md`**.

### 5.4 Outbound webhooks (optional — e.g. Make.com)

- **Env:** `ORDERS_SHEET_WEBHOOK_URL`, optional `ORDERS_SHEET_WEBHOOK_USE_FORM`.
- **Code:** **`src/lib/orders/sheet-webhook.ts`**, triggered from **`src/app/api/orders/route.ts`** after validation.
- **Payload:** Typed `OrdersSheetWebhookPayload` (includes friendly request id for sheet columns).

### 5.5 Admin authentication

- **Login:** `POST /api/admin/login` sets httpOnly cookie **`gs_admin`** when password matches `ADMIN_PASSWORD` and token matches `ADMIN_SESSION_TOKEN`.
- **Gate:** **`src/middleware.ts`** redirects unauthenticated users from `/admin/*` to `/admin/login`.
- **Logout:** `/api/admin/logout`.

---

## 6. HTTP API surface (App Router)

| Method / path | Purpose |
|---------------|---------|
| `POST /api/orders` | Accept order payload; optional Firestore + sheet webhook |
| `POST /api/measurements/lookup` | Phone-based measurement lookup against Sheets (rate-limited server-side) |
| `POST /api/admin/login` | Admin session cookie |
| `POST /api/admin/logout` | Clear admin cookie |
| `GET/POST/PATCH … /api/admin/orders` | Admin order listing and updates |
| `GET/PATCH /api/admin/orders/[id]` | Single order |
| `GET/POST /api/admin/expenses` | Expenses ledger |
| `GET/PATCH/DELETE /api/admin/expenses/[id]` | Single expense |
| `GET /api/admin/ledger/summary` | Ledger summary for payments dashboard |

*(Exact verbs and bodies: see each `route.ts`.)*

---

## 7. Customer-facing routes (summary)

- **Marketing:** `/`, `/gallery`, `/faq`, `/terms`, `/book`, `/pricing` (optional in nav via env).
- **Services:** `/stitching`, `/alteration`, `/request` (quick + full flows).
- **Tracking:** `/track/[token]` — tokenized links tied to stored orders when Firestore is enabled.
- **PWA hints:** `manifest.webmanifest` via `src/app/manifest.ts`.

---

## 8. Related documentation index

| Topic | Doc |
|--------|-----|
| Setup, deploy, troubleshooting | [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) |
| System design & JSON shapes | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Order domain model | [ORDER_MODEL.md](./ORDER_MODEL.md) |
| Firestore + admin | [ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md) |
| Tracking pages | [ORDER_TRACKING.md](./ORDER_TRACKING.md) |
| Measurements + Sheets | [MEASUREMENTS_GOOGLE_SHEETS.md](./MEASUREMENTS_GOOGLE_SHEETS.md) |
| WhatsApp + images | [STITCHING_WHATSAPP_IMAGE_FLOW.md](./STITCHING_WHATSAPP_IMAGE_FLOW.md) |
| Feature inventory | [CATALOG_CAPABILITIES.md](./CATALOG_CAPABILITIES.md) |

---

## 9. Changelog of this doc

- **Initial version:** Consolidates stack, env groups, integrations, and repo map for onboarding and audits. Update when major dependencies or integrations change.
