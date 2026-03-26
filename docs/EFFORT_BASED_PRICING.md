# Effort-based pricing (tailoring)

This document describes the **effort unit** model used for **capacity planning** and **consistent quotes**. It complements the **₹ range tables** on `/pricing` and the **styling-extras** bands. Source files: **`public/data/effort-pricing.json`**, UI: **`EffortPricingSection`** on the pricing page.

---

## 1. Effort units (what they mean)

An **effort unit** is a **normalized amount of shop time and skill** — not clock minutes, but a shared yardstick so two jobs that feel “the same size” map to similar units.

| Service profile | Effort level | Typical use |
|-----------------|--------------|-------------|
| **Basic stitching** | Low | Simple / catalogue-style construction |
| **Designer stitching** | High | Heavy custom, designer refs, bridal-level detail |
| **Alterations** | Variable | Minor vs major work — span the range by inspection |

Each profile carries a **typical unit range** in JSON; staff pick a number **inside** the range before applying factors.

---

## 2. Effort factors (what moves the needle)

| Factor | Role |
|--------|------|
| **Pieces in order** | Each extra garment adds **partial units** (capacity load for batching). |
| **Design complexity tier** | Basic / Standard / Premium **multipliers** on stitching effort. |
| **Add-on categories** | Each quoted category (lace, embroidery, …) adds **fractional units** — use alongside **₹** bands in `stylingExtras`. |
| **Urgency** | Rush vs standard **multiplier** — only after the customer agrees in chat. |

---

## 3. Pricing formula (reference)

**Reference price ≈ effort units × base rate (INR per unit)**

- **`baseRateInrPerEffortUnit`** — one studio-wide number in **`effort-pricing.json`**; change it when wages or productivity shift, not per customer.
- **Effort units** — chosen from the profile range, then adjusted using the factors (document the mental math in order notes if needed).

A **combined** mental model (not enforced in code):

```
adjusted_units ≈ profile_units
  × complexity_multiplier
  × urgency_multiplier
  + (pieces - 1) × additional_units_per_extra_piece
  + add_on_categories × units_per_category
```

Then **price ≈ round(adjusted_units × base_rate)** — compare with the **stitching tier table** and **alteration / add-on ₹ bands**; they should tell a similar story. If not, reconcile before quoting.

---

## 4. Mapping effort ↔ price

| Step | Action |
|------|--------|
| 1 | Choose **service profile** (basic stitching / designer / alteration). |
| 2 | Pick **effort units** in the **typical range** (or justify above/below in notes). |
| 3 | Apply **tier** (Basic / Standard / Premium) for stitching complexity. |
| 4 | Add **piece** and **add-on** adjustments. |
| 5 | Multiply by **base rate** → **reference ₹**. |
| 6 | Cross-check against **garment-type × tier** table and **extras** ranges — align or explain the delta. |

**Consistency rule:** Similar **adjusted effort** → similar **reference price** before discounts or promos.

---

## 5. Staff guidelines (estimating effort)

1. **Anchor** on the profile’s **typical range** before overrides.
2. **Increase units** for: difficult fabric, extra fittings, high rework risk, or many seams.
3. **Decrease** only with a clear reason (e.g. repeat client, simpler than reference) — note it.
4. **Rush** only after explicit customer acceptance of a rush uplift.
5. **Add-ons**: add **units** when categories are agreed; **₹** still comes from quoted lines + **`stylingExtras`** sanity check.

---

## 6. Maintenance

| Change | File |
|--------|------|
| Base rate, factors, ranges | `public/data/effort-pricing.json` |
| Customer-facing copy (EN/HI) | `src/lib/i18n/dictionaries.ts` → `pricing.effort` |
| Validation | `src/lib/pricing/parse-effort.ts` |

After edits: `npm run build`, deploy.

---

## 7. Related

| Doc | Topic |
|-----|--------|
| [PRICING_MODEL.md](./PRICING_MODEL.md) | INR tables & tiers |
| [STYLING_EXTRAS_PRICING.md](./STYLING_EXTRAS_PRICING.md) | Add-on ₹ bands |
| [DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md) | Rush / peak surcharges vs this model |
| [ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md) | Customer approval on extras |
