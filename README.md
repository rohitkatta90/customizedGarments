# Garment Services — Service Catalog (Next.js)

Mobile-first catalog for a women’s tailoring / alteration studio. Orders are **manual via WhatsApp** — no in-app checkout.

**Source repository:** [github.com/rohitkatta90/customizedGarments](https://github.com/rohitkatta90/customizedGarments)

Deploy with **Vercel** (see [docs/PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md) §6). Vercel accounts are created by you at [vercel.com](https://vercel.com) (sign in with GitHub); this project cannot create one on your behalf.

## Documentation

| 📄 Document | What’s inside |
|-------------|----------------|
| **[docs/PROJECT_TECHNOLOGY.md](./docs/PROJECT_TECHNOLOGY.md)** | **Stack & integrations** — frameworks, libraries, env groups, APIs, Firebase/Sheets/webhooks, repo map |
| **[docs/PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md)** | **Living project guide** — setup, env vars, run, deploy (Vercel/Netlify), structure, troubleshooting, maintenance |
| **[docs/ORDER_MODEL.md](./docs/ORDER_MODEL.md)** | Multi-item **order / order items** model and WhatsApp summary format |
| **[docs/ORDER_ADMIN_SYSTEM.md](./docs/ORDER_ADMIN_SYSTEM.md)** | **Firestore** order storage, **`/admin/orders`**, env vars, SQL migration path |
| **[docs/ORDER_TRACKING.md](./docs/ORDER_TRACKING.md)** | **Customer `/track`** links, 5-step status, delays, WhatsApp line |
| **[docs/IMAGE_STORAGE_TAILOR_HANDOFF.md](./docs/IMAGE_STORAGE_TAILOR_HANDOFF.md)** | **Drive folder + Order ID**, staff SOP, tailor handoff, file naming |
| **[docs/QUICK_STITCH_FLOW.md](./docs/QUICK_STITCH_FLOW.md)** | **Quick request** (default `/request`), catalog CTA, WhatsApp template, `?full=1` detailed form |
| **[docs/MEASUREMENTS_GOOGLE_SHEETS.md](./docs/MEASUREMENTS_GOOGLE_SHEETS.md)** | **Saved measurements** — Sheets API, env vars, column layout, lookup rules |
| **[docs/ANALYTICS.md](./docs/ANALYTICS.md)** | **Metrics & insights** — definitions, data points, dashboard concept (no UI code) |
| **[docs/EDGE_CASES.md](./docs/EDGE_CASES.md)** | **Edge cases** — scope changes, rush, cancel, delays, rework; rules & system mapping |
| **[docs/ACCESSORIES_SERVICE_FLOW.md](./docs/ACCESSORIES_SERVICE_FLOW.md)** | **Styling extras** — pricing rules, admin quoting, WhatsApp confirmation |
| **[docs/FINANCIAL_LEDGER.md](./docs/FINANCIAL_LEDGER.md)** | **Simple ledger** — orders, expenses, payment status; Sheets/Airtable → backend path |
| **[docs/FINANCIAL_WORKFLOW.md](./docs/FINANCIAL_WORKFLOW.md)** | **End-to-end money flow** — quote → pay → deliver → receipt |
| **[docs/CATALOG_CAPABILITIES.md](./docs/CATALOG_CAPABILITIES.md)** | **Full catalog feature list** — gallery, request form, WhatsApp, admin, receipts |
| **[docs/OWNER_DATA_ACCESS.md](./docs/OWNER_DATA_ACCESS.md)** | **Owner / operator** — env vars, Firebase, admin URLs, privacy |
| **[docs/PRICING_MODEL.md](./docs/PRICING_MODEL.md)** | **Tiers, ranges,** `pricing.json` — policy + maintenance |
| **[docs/STYLING_EXTRAS_PRICING.md](./docs/STYLING_EXTRAS_PRICING.md)** | **Add-ons** — bands, categorization, approval + `stylingExtras` |
| **[docs/EFFORT_BASED_PRICING.md](./docs/EFFORT_BASED_PRICING.md)** | **Effort units × base rate** — capacity, factors, consistency |
| **[docs/DYNAMIC_PRICING.md](./docs/DYNAMIC_PRICING.md)** | **Rush & peak** — surcharges, demand bands, customer comms |
| **[docs/PROFIT_MARGIN.md](./docs/PROFIT_MARGIN.md)** | **Profit margin** — labour, overhead, minimum margin, monitoring |
| **[docs/PRICING_COMMUNICATION.md](./docs/PRICING_COMMUNICATION.md)** | **Customer pricing comms** — templates, tone, trust phrases, UX map |
| **[docs/INTERNAL_PRICING_GUIDELINES.md](./docs/INTERNAL_PRICING_GUIDELINES.md)** | **Staff pricing rules** — tiers, escalation, recording |
| **docs/ARCHITECTURE.md** | Technical deep dive: i18n, WhatsApp templates, JSON schemas, components |

---

## Quick start

```bash
cd GarmentServicesProject
cp .env.example .env.local   # then edit values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Highlights

- **EN / हि** language toggle (cookie `gs_locale`) — UI + WhatsApp messages
- **Catalog / reviews** in `public/data/*.json`
- **Production:** `npm run build` must pass locally before deploy

See **[docs/PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md)** for full deployment steps and checklist.

---

## License

Private / your business — adjust as needed.
