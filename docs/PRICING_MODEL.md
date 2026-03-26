# Pricing model (studio policy + app)

This document describes the **pricing structure** used on the public **`/pricing`** page and how to maintain it. Numbers are **indicative**; the **WhatsApp quote** is always authoritative.

---

## 1. Service categories & base structure

| Category | What it covers | App mapping |
|----------|----------------|-------------|
| **Blouse stitching** | Women’s blouses / tops | Row **Blouses** in `pricing.json` → `stitching.blouses` |
| **Kurti stitching** | Kurtis / ethnic tops | `stitching.kurtis` |
| **Dress stitching** | Dresses, gowns (non-bridal unless quoted) | `stitching.dresses` |
| **Custom / designer work** | Heavy custom, complex references | `stitching.custom_designs` (aligns with gallery **Custom designs**) |
| **Alterations — minor** | Quick structural fixes | `alterations.minor` range |
| **Alterations — major** | Reshaping, heavy work | `alterations.major` range |

---

## 2. Pricing principles (why not one flat price)

Final quotes consider:

1. **Complexity** — plain construction vs. ornamentation, layering, designer detailing.
2. **Effort** — cutting difficulty, hand finishing, risk of rework.
3. **Time** — fittings, queue, rush.
4. **Materials** — customer fabric vs. sourced trims; special linings and embellishments (often quoted as **extras** per [ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md)).

The site explains this in copy; **ranges** in JSON are **bands**, not a single SKU price.

---

## 3. Tiers (Basic · Standard · Premium)

| Tier | Meaning | When to use (guidance) |
|------|---------|-------------------------|
| **Basic** | Simple silhouettes, minimal detail | Everyday pieces, straightforward construction. |
| **Standard** | Moderate customization | Interesting necklines, panels, moderate embroidery, standard linings. |
| **Premium** | Heavy work or high touch | Heavy embroidery, intricate cuts, occasion / designer references, extra fittings. |

**Staff:** Pick the tier that matches the **bulk of labour**; move up if multiple premium signals stack (lining + embroidery + rush).

---

## 4. Flexibility (staff adjustment band)

`pricing.json` includes:

```json
"staffAdjustmentPercent": { "min": -15, "max": 25 }
```

Meaning: after choosing a tier band, the studio may quote **within roughly −15% to +25%** of the “anchor” for that job (e.g. simpler-than-expected fabric, or extra fitting rounds). **Always** confirm the final number in **WhatsApp** before the customer pays.

To change the policy band, edit the JSON and redeploy.

---

## 5. Transparency (customer-facing)

- **`/pricing`** shows **ranges** and **tier definitions** so customers know *what* drives cost.
- **Terms** and **Payments** sections reiterate: the site is not a checkout; **written quote in chat** lists labour + agreed extras.

### 5b. Communication strategy (tone & templates)

Customer-friendly **messaging templates**, **example talk tracks**, and **UX placement** (pricing page, request, gallery, WhatsApp) are documented in **[PRICING_COMMUNICATION.md](./PRICING_COMMUNICATION.md)** and summarized on **`/pricing`** in the “How we talk about price” section (`dictionaries.ts` → `pricing.communication`).

### 5c. Internal consistency (staff)

**Decision framework**, **escalation**, **recording requirements**, and links to authoritative JSON files are in **[INTERNAL_PRICING_GUIDELINES.md](./INTERNAL_PRICING_GUIDELINES.md)** and **`public/data/staff-pricing-policy.json`** (tables on **`/pricing`**, `dictionaries.ts` → `pricing.internalGuidelines`).

---

## 6. Styling extras (add-ons)

Optional **Additional Styling Elements** use **`stylingExtras`** in `pricing.json` — one **min–max band** per preset category (laces, embroidery, etc.). Positioned as **enhancements**, not mandatory; **approval** uses `quotedAccessories` + `accessoriesQuoteStatus` (see **[STYLING_EXTRAS_PRICING.md](./STYLING_EXTRAS_PRICING.md)** and **[ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md)**).

---

## 6b. Effort-based reference pricing

**Effort units × base rate** (see **`public/data/effort-pricing.json`**) supports **capacity planning** and **consistent quotes** alongside the tier tables. Full model: **[EFFORT_BASED_PRICING.md](./EFFORT_BASED_PRICING.md)**.

---

## 6c. Dynamic pricing (rush & peak)

**Urgency surcharges** and **demand multipliers** for express / same-day / next-day and peak workload are in **`public/data/dynamic-pricing.json`**. Strategy and comms: **[DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md)**.

---

## 6d. Profit margin (internal)

**Labour + accessories (supplier) + overhead** and **minimum margin per order** live in **`public/data/profit-margin.json`**. Cost stack, pricing check, monitoring, and optimisation: **[PROFIT_MARGIN.md](./PROFIT_MARGIN.md)**.

---

## 7. Owner maintenance

| Task | Where |
|------|--------|
| Update INR bands | `public/data/pricing.json` (stitching, alterations, **stylingExtras**) |
| Effort model (units, base rate, factors) | `public/data/effort-pricing.json` |
| Rush / peak / standard lead | `public/data/dynamic-pricing.json` |
| Profit margin & cost stack (staff) | `public/data/profit-margin.json` |
| Staff consistency & escalation | `public/data/staff-pricing-policy.json` |
| Update customer copy (EN/HI) | `src/lib/i18n/dictionaries.ts` → `pricing` |
| Validate on save | `src/lib/pricing/parse.ts` (throws if JSON is malformed) |

After edits: `npm run build` locally, then deploy.

---

## 8. Related links

| Doc | Topic |
|-----|--------|
| [CATALOG_CAPABILITIES.md](./CATALOG_CAPABILITIES.md) | Gallery vs. pricing |
| [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md) | Quote → pay → receipt |
| [ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md) | Quoted extras |
| [STYLING_EXTRAS_PRICING.md](./STYLING_EXTRAS_PRICING.md) | Add-on bands & staff guidelines |
| [EFFORT_BASED_PRICING.md](./EFFORT_BASED_PRICING.md) | Effort units × base rate, factors, consistency |
| [DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md) | Rush %, peak multipliers, capacity comms |
| [PROFIT_MARGIN.md](./PROFIT_MARGIN.md) | Labour / overhead / margin floor & monitoring |
| [INTERNAL_PRICING_GUIDELINES.md](./INTERNAL_PRICING_GUIDELINES.md) | Staff decision rules, escalation, documentation |
