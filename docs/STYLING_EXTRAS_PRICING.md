# Styling extras (add-ons) — pricing & process

Optional **Additional Styling Elements** sit **on top of** base stitching or alteration. This doc standardizes **indicative ranges**, **how to categorize**, and **approval** — aligned with `public/data/pricing.json` (`stylingExtras`) and the admin **quoted accessories** flow.

---

## 1. Add-on categories & strategy

Categories match **preset IDs** in `src/lib/orders/styling-elements.ts` and rows in **`pricing.json` → `stylingExtras`**:

| ID | Typical scope | What widens the band |
|----|----------------|----------------------|
| `lace_border` | Laces / borders | Metres of lace, hand-finished vs machine edge, border complexity |
| `tassel_latkan` | Tassels / latkans | Count, size, hand-made vs ready-made |
| `buttons_zipper` | Buttons / zippers | Specialty closures, concealed zips, premium buttons |
| `padding_cups` | Padding / cups | Type of cup, structured vs soft, custom fit |
| `embroidery` | Embroidery | Area covered, hand vs machine, density, specialty threads |
| `dyeing_color` | Dyeing / colour matching | Garment type, colour matching difficulty, multiple dips |
| `extra_lining` | Extra lining or layers | Fabric quality, full vs partial, structure |

**Rule:** Ranges are **not** fixed per SKU — final **₹** depends on **quantity**, **complexity**, and **material** (same as in the public copy on **`/pricing`**).

---

## 2. Indicative price ranges (source of truth)

Numeric bands live in **`public/data/pricing.json`** under `stylingExtras`. Example shape:

```json
"stylingExtras": {
  "lace_border": [200, 4500],
  "tassel_latkan": [80, 1500],
  ...
}
```

**Owner:** Edit these when your studio’s rates change; run `npm run build`, then deploy. Validation: `src/lib/pricing/parse.ts`.

---

## 3. Positioning (customer-facing)

- Present as **style upgrades** or **enhancements** — never as a hidden mandatory line.
- Base quote covers **standard construction**; extras are **listed separately** on the order and in WhatsApp.
- **Gallery / request** already show `dict.styling.pricingNotice` (bilingual).

---

## 4. Approval system (implemented)

| Step | Where |
|------|--------|
| Identify | Design review / admin **Additional Styling Elements** |
| Quote | Per-line **₹** or **TBD** (`quotedAccessories`) |
| Status | `accessoriesQuoteStatus`: `none` → `pending_customer` → `approved` \| `declined` |
| Message | **Copy WhatsApp confirmation (extras)** on order detail |

**Do not** start chargeable extra work until the customer **approves** in writing (WhatsApp). Full workflow: **[ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md)**.

---

## 5. Guidelines for consistent staff pricing

1. **Pick the closest preset** (or free-text label) so categories stay comparable.
2. **Start inside the band** for “typical” jobs; move **up** for premium materials, rush, or heavy coverage.
3. **Document** unusual scope in **Payment notes** or **internal accessories notes** so the next person understands the quote.
4. **Roll into order total** when the customer approves — the main order **Total** should include agreed extras for the final invoice.
5. If unsure, use **TBD** on the line until fabric is seen, then update before approval.

---

## 6. Related

| Topic | Doc / code |
|--------|------------|
| Public page with ranges | **`/pricing`** — `PricingPageContent` |
| Presets & WhatsApp | `src/lib/orders/styling-elements.ts` |
| General pricing policy | [PRICING_MODEL.md](./PRICING_MODEL.md) |
