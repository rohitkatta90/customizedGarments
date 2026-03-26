# Garment Services — Project guide (living document)

> **Purpose:** Single reference for how this app works, how to run it, and how to ship it.  
> **Update this file** when you change env vars, deploy steps, data shape, or major features.

---

## 1. What this project is

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Product:** Mobile-first **service catalog** for a women’s tailoring / alteration business — **not** a shopping cart.
- **Orders:** Customers reach you via **WhatsApp** with prefilled messages. Optional **Firestore** persistence + **`/admin/orders`** for listing, filters, and status updates (see **[ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md)**). No payment gateway in the app; UPI/COD are explained on the site and settled in chat. **Money:** quote and payments on each order, delivery guards, WhatsApp receipts — see **[FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md)**.
- **Content:** Catalog and reviews live in **`public/data/*.json`** (edit files → redeploy). **Catalog** capabilities (gallery, deep links, receipts): **[CATALOG_CAPABILITIES.md](./CATALOG_CAPABILITIES.md)**. **Owner data access** (Firebase, admin, secrets): **[OWNER_DATA_ACCESS.md](./OWNER_DATA_ACCESS.md)**.
- **Languages:** **English** and **Hindi** via header **EN / हि** (cookie `gs_locale`).

---

## 2. Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | 20.x LTS recommended (matches typical Vercel runtime). |
| **npm** | Comes with Node; project uses `package-lock.json`. |

Check versions:

```bash
node -v   # e.g. v20.x
npm -v
```

---

## 3. Repository & install

```bash
cd /path/to/GarmentServicesProject
npm install
```

---

## 4. Environment variables

Copy the example file and edit **`.env.local`** (never commit secrets; `.gitignore` should ignore `.env*`).

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BUSINESS_NAME` | Recommended | Brand name in header/footer. |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | **Yes** for real WhatsApp links | **Digits only**, country code included, **no** `+` (e.g. India `9198xxxxxxxx`). |
| `NEXT_PUBLIC_DESIGNER_PHONE` | Recommended | Shown for “Call designer”; can include spaces and `+`. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** for production | Canonical site URL, **no trailing slash** (e.g. `https://your-app.vercel.app`). Used for Open Graph, sitemap, `metadataBase`. |
| `NEXT_PUBLIC_UPI_ID` | Optional | Shown in Payments section as placeholder. |
| `FIREBASE_PROJECT_ID` | Optional | Server-only; enables saving orders to Firestore. |
| `FIREBASE_CLIENT_EMAIL` | Optional | Service account email (pair with private key). |
| `FIREBASE_PRIVATE_KEY` | Optional | PEM string; use `\n` for newlines in `.env.local`. |
| `ADMIN_PASSWORD` | Optional | Password for `/admin/login` (set with admin token). |
| `ADMIN_SESSION_TOKEN` | Optional | Secret cookie value; must match between login and middleware. |

All `NEXT_PUBLIC_*` values are **exposed to the browser** — only use non-secret business info. **Never** put Firebase private keys in `NEXT_PUBLIC_*`.

**Local dev:** If `NEXT_PUBLIC_SITE_URL` is unset, `src/lib/site.ts` falls back to `http://localhost:3000` for metadata.

---

## 5. Running locally

### Development (hot reload)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build (same as CI / hosting)

```bash
npm run build
npm run start
```

Then open [http://localhost:3000](http://localhost:3000) (default port).

### Lint

```bash
npm run lint
```

### Scripts summary

| Command | When to use |
|---------|-------------|
| `npm run dev` | Daily development |
| `npm run build` | Before deploy; must succeed |
| `npm run start` | Test production output locally |
| `npm run lint` | Before commit / PR |

---

## 6. Deploying

### 6.1 Vercel (recommended for Next.js)

1. Push the project to **GitHub / GitLab / Bitbucket**.
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. **Framework preset:** Next.js (auto-detected).
4. **Environment variables:** Add every key from `.env.example` with production values (especially `NEXT_PUBLIC_WHATSAPP_PHONE`, `NEXT_PUBLIC_SITE_URL`).
5. **Deploy.** Vercel runs `npm run build` automatically.

**Production URL:** Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain (or custom domain) once you know it, then redeploy so SEO and sitemap URLs stay correct.

**Custom domain:** Vercel → Project → Domains → add DNS as instructed.

### 6.2 Netlify (alternative)

1. **Build command:** `npm run build`  
2. **Publish directory:** `.next` is **not** static export — use Netlify’s **Next.js** runtime or deploy via **Vercel** for fewer surprises.  
3. If you use Netlify’s Next support: set the same env vars in Site settings → Environment variables.

> This repo targets the **default Next.js server** output (not `output: 'export'`). Prefer **Vercel** unless you have a specific Netlify setup.

### 6.3 Post-deploy checklist

- [ ] `NEXT_PUBLIC_SITE_URL` matches the live URL (no trailing slash).
- [ ] WhatsApp links open the correct number (`wa.me/...`).
- [ ] “Call designer” `tel:` works on a real phone.
- [ ] Gallery images load (remote hosts allowed in `next.config.ts` → `images.remotePatterns`).
- [ ] Toggle **EN / हि** and confirm copy + WhatsApp message language.
- [ ] `/sitemap.xml` and `/robots.txt` load (optional smoke test).
- [ ] If using Firestore: submit a test order from `/request`, confirm it appears at `/admin/orders` after login.

---

## 7. Where things live (quick map)

```
GarmentServicesProject/
├── .env.example              # Template for .env.local
├── public/
│   └── data/
│       ├── catalog.json      # Gallery items (admin-editable)
│       ├── pricing.json      # Indicative INR bands (tiers × garment type)
│       ├── effort-pricing.json # Effort units, base rate, multipliers (capacity)
│       ├── dynamic-pricing.json # Rush %, peak multipliers, standard lead hint
│       ├── profit-margin.json  # Internal cost stack, minimum margin (staff policy)
│       ├── staff-pricing-policy.json # Staff escalation, recording hooks, review cadence
│       └── reviews.json      # Testimonials
├── src/
│   ├── app/                  # Routes, layout, metadata, sitemap, robots
│   ├── components/           # UI (header, footer, order form, gallery, i18n)
│   └── lib/                  # site config, whatsapp helpers, i18n, order types
├── docs/
│   ├── PROJECT_GUIDE.md      # This file
│   ├── ORDER_MODEL.md        # Order / order-items model + WhatsApp summary
│   ├── ORDER_ADMIN_SYSTEM.md # Firestore, admin routes, migration path
│   ├── ORDER_TRACKING.md     # Status lifecycle, /track URLs, delays
│   ├── ANALYTICS.md          # KPI definitions, data for insights, dashboard concept
│   ├── EDGE_CASES.md         # Rush, cancel, delays, rework, multi-item; rules + fields
│   ├── ACCESSORIES_SERVICE_FLOW.md # Add-on styling elements, admin quote, WhatsApp
│   ├── FINANCIAL_LEDGER.md     # Income/expense ledger design (Sheets → Firebase/SQL)
│   ├── PAYMENT_RECONCILIATION.md # Validation, audit log, daily summary API
│   ├── RECEIPTS.md             # WhatsApp receipt copy, when to send
│   ├── FINANCIAL_WORKFLOW.md   # End-to-end ops: quote → pay → deliver → receipt
│   ├── CATALOG_CAPABILITIES.md # Gallery + request + WhatsApp + admin — full catalog surface
│   ├── OWNER_DATA_ACCESS.md    # Owner: env, Firebase, admin URLs, privacy
│   ├── PRICING_MODEL.md        # Tier policy, pricing.json, staff adjustment band
│   ├── STYLING_EXTRAS_PRICING.md # Add-on ranges, presets, approval alignment
│   ├── EFFORT_BASED_PRICING.md # Effort × base rate, factors, staff guidelines
│   ├── DYNAMIC_PRICING.md      # Rush, peak demand, communication rules
│   ├── PROFIT_MARGIN.md       # Labour, overhead, margin floor, monitoring
│   ├── PRICING_COMMUNICATION.md # Customer pricing tone, WhatsApp templates, UX
│   ├── INTERNAL_PRICING_GUIDELINES.md # Staff tiers, exceptions, documentation
│   └── ARCHITECTURE.md       # Deeper technical notes, JSON shapes, FAQs
└── README.md                 # Short intro + link here
```

**Primary customer flow:** `/request` (multi-item stitching + alteration). Legacy URLs `/stitching` and `/alteration` redirect to `/request` with query hints.

**Order admin (optional):** `/admin/login` → `/admin/orders` — requires `ADMIN_PASSWORD` + `ADMIN_SESSION_TOKEN` and Firebase env vars to persist. Details: [ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md).

**Deep dives:** [ARCHITECTURE.md](./ARCHITECTURE.md) — i18n, WhatsApp templates, data schemas, component map.

---

## 8. Updating content without code

| Task | File |
|------|------|
| Add/change gallery images & copy | `public/data/catalog.json` |
| Add/change reviews | `public/data/reviews.json` |
| New image host (e.g. Cloudinary) | Add `hostname` under `next.config.ts` → `images.remotePatterns` |

After editing JSON, **commit** and **redeploy** (or save in dev and refresh).

---

## 9. Internationalization (EN / HI)

- **Cookie:** `gs_locale` = `en` | `hi`
- **Strings:** `src/lib/i18n/dictionaries.ts`
- **WhatsApp:** `src/lib/whatsapp.ts` (language-aware bodies)

---

## 10. Troubleshooting

| Issue | Things to check |
|-------|-----------------|
| WhatsApp opens wrong number | `NEXT_PUBLIC_WHATSAPP_PHONE` — digits only, with country code. |
| Broken images in gallery | URL must be `https`; host must be in `next.config.ts` `images.remotePatterns`. |
| SEO / OG wrong URL | `NEXT_PUBLIC_SITE_URL` must match production. |
| Build fails | Run `npm run build` locally; fix TypeScript/ESLint errors. |
| Language toggle not visible | Long business name: header truncates logo; see recent header/layout fixes. Toggle also appears in mobile menu. |

---

## 11. Security & privacy

- No secrets in client env vars.
- Security-related headers are set in `next.config.ts`.
- Customer reviews and catalog text are **public** in JSON — don’t put private data there.

---

## 12. Maintenance

### When to update this guide

- New environment variables or renames.
- Deploy platform or build command changes.
- Switching from JSON to a CMS.
- Major UX or i18n behavior changes.

### Document owner

Keep this file in **`docs/PROJECT_GUIDE.md`** and link it from **`README.md`** so new contributors find it immediately.

---

*Last updated: March 2026 — adjust date when you edit this file.*
