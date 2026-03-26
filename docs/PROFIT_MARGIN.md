# Profit margin & cost coverage

This document defines the **internal** profit model: how to stack **labour**, **accessories at supplier cost**, and **overhead**, then enforce a **minimum margin** before confirming a quote. Customer-facing numbers still come from **WhatsApp**; this file is for **staff** and **owner** maintenance.

**Data:** `public/data/profit-margin.json`  
**Calculations:** `src/lib/pricing/profit-calculations.ts`  
**Public summary:** `/pricing` → “Profit margin & cost coverage” section.

---

## 1. Cost components

| Component | Meaning | Typical source |
|-----------|---------|----------------|
| **Labour** | Internal cost of time on the job | Effort units × `laborRateInrPerEffortUnit`, or hours × `laborRateInrPerHour` when using hourly mode |
| **Accessories** | Trims, linings, etc. **you pay suppliers for** | Pass **supplier cost** into the cost stack; customer line may add `markupPercentOnSupplierCost` |
| **Overhead** | Rent, utilities, admin, tools amortised | `percentOfDirectCost` applied to **direct cost** = labour + accessories (supplier) |

**Important:** The **customer-facing** “base rate” in `effort-pricing.json` is a **quote anchor**, not the same as **internal labour cost** per unit. Keep internal rates aligned with wages and productivity separately.

---

## 2. Margin target

| Field | Role |
|-------|------|
| `minimumPercentPerOrder` | **Floor** — no committed quote below this margin (given the chosen `basis`) |
| `targetPercentPerOrder` | **Aim** — typical healthy jobs |
| `highMarginPercentThreshold` / `lowMarginPercentThreshold` | **Monitoring bands** for weekly review (classification uses **gross margin on revenue** unless you standardise differently in ops) |

### Margin basis

- **`revenue`** (default): gross margin on quoted price — \((\text{price} - \text{total cost}) / \text{price}\).  
  Minimum acceptable price: \(\lceil \text{total cost} / (1 - m/100) \rceil\) for minimum \(m\%\).
- **`cost`**: markup on cost — \((\text{price} - \text{total cost}) / \text{total cost}\).  
  Minimum price: \(\lceil \text{total cost} \times (1 + m/100) \rceil\).

---

## 3. Pricing check

Before sending a **final** quote:

1. Estimate **direct cost** = internal labour + accessories (supplier cost).
2. Add **overhead** = direct × (`percentOfDirectCost` / 100).
3. **Total cost** = direct + overhead.
4. Ensure **quoted price** ≥ `minimumPriceForMargin(total cost, …)` from `profit-calculations.ts` (matches policy in JSON).

This is **not** wired to Firestore automatically — it is a **discipline** and **on-site calculator** pattern. Admin ledger lines remain the source of truth for what was actually charged.

---

## 4. Monitoring

- **High-profit services** — `monitoring.highProfitServiceProfileIds` (e.g. designer stitching) and `highProfitTier` remind staff where margin is often healthy; watch **capacity** and scheduling.
- **Low-margin warnings** — `monitoring.lowMarginWatchNotes` lists patterns (rush without surcharge, deep discounts, underestimated complexity, accessories at cost).

Review **weekly**: export or scan orders where **realised** margin (if you track cost per order) or **quote band** looked thin.

---

## 5. Optimization

| Trigger | Action |
|---------|--------|
| Wages or productivity shift | Update `laborRateInrPerEffortUnit` (and/or effort factors in `effort-pricing.json`) together |
| Peak load without surge | Apply `dynamic-pricing.json` multipliers — don’t absorb peak in standard quotes |
| Fabric / supplier inflation | `optimization.reviewCadenceDays` and `fabricRateInflationReviewPercent` as **reminders** to revisit JSON |

---

## 6. Related docs

| Doc | Topic |
|-----|--------|
| [PRICING_MODEL.md](./PRICING_MODEL.md) | Tiers, bands, JSON map |
| [EFFORT_BASED_PRICING.md](./EFFORT_BASED_PRICING.md) | Effort units × base rate (customer reference) |
| [DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md) | Rush & peak demand |
| [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md) | Quote → payment → receipt |
