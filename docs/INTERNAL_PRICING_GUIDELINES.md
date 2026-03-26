# Internal pricing guidelines (staff)

This document is the **staff playbook** for **consistent, non-arbitrary** pricing. Public anchors live in JSON under `public/data/`; this file explains **how to use them together** and **when to escalate**.

**Structured policy:** `public/data/staff-pricing-policy.json` (parsed at build; tables on **`/pricing`**).  
**Customer tone:** [PRICING_COMMUNICATION.md](./PRICING_COMMUNICATION.md).

---

## 1. Standardization — pricing ranges per service

| Source | What it defines |
|--------|-----------------|
| **`pricing.json`** | Stitching **per garment type** × **Basic / Standard / Premium** INR bands; **alterations** minor/major; **stylingExtras** add-on bands; **staffAdjustmentPercent**. |
| **`effort-pricing.json`** | Effort units × base rate — **sanity check** against tier anchor. |
| **`dynamic-pricing.json`** | Rush / peak **surcharges** — must be explicit in WhatsApp, not folded into base. |
| **`profit-margin.json`** | Internal **cost stack** and **minimum margin** — before you commit a number. |

**Rule:** The website `/pricing` page reflects the same stitching/alteration numbers as `pricing.json`. If two staff would pick different tier or band for the same job, **tier choice** or **effort estimate** was not aligned — revisit the decision framework below.

---

## 2. Decision rules (order of operations)

Every quote should trace:

1. **Complexity (tier)** — Basic / Standard / Premium from the tier definitions + stitching table. Stack premium signals → move **up** a tier; don’t “split the difference” silently.
2. **Effort** — Cross-check with effort units × base rate. Large gap vs. tier anchor → re-check tier or **document why** in order notes.
3. **Add-ons** — Each extra from `stylingExtras` or explicit TBD; **no chargeable extra** without WhatsApp approval ([ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md)).
4. **Rush / peak** — Apply `dynamic-pricing.json`; customer agrees in writing.
5. **Margin** — Package clears minimum margin policy; then **one written total** before payment.

---

## 3. Training

- New quoting staff: read this doc + shadow until the checklist is natural.
- First week: senior review for quotes near **edges** of tier bands.
- **Re-train** when `pricing.json`, wages, or studio policy files change — never quote from memory of old INR.

**Cadence:** `staff-pricing-policy.json` → `trainingReviewCadenceMonths` (default 6) — hold a **consistency review** or immediately after any published rate change.

---

## 4. Exception handling — when pricing may be overridden

| Situation | Policy |
|-----------|--------|
| **Inside** chosen tier **and** inside `staffAdjustmentPercent` | Any trained quoting staff may finalise. |
| **Outside** the adjustment band, or strategic exception (charity, VIP, loss-leader) | **Owner or lead** written approval (WhatsApp or internal note on the order). |
| **Changing published** INR bands, multipliers, or JSON policy | **Owner only** — edit repo, `npm run build`, deploy. |

**Never:** invent a one-off total with **no tier anchor** because the client negotiated hard — adjust **scope**, **tier**, or **timeline** instead.

---

## 5. Documentation — record every pricing decision

| Record | Where | When |
|--------|-------|------|
| Written quote to customer | WhatsApp | Before payment |
| Totals & payment modes | Admin order ledger (Firestore) | Always |
| Why an exception or unusual scope | Order notes / internal fields | When overriding band, escalating, or non-standard scope |

Disputes and reconciliation use the **same trail** — see [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md).

---

## 6. Related docs

| Doc | Topic |
|-----|--------|
| [PRICING_MODEL.md](./PRICING_MODEL.md) | Public tier policy & JSON map |
| [EFFORT_BASED_PRICING.md](./EFFORT_BASED_PRICING.md) | Effort units |
| [DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md) | Rush & peak |
| [PROFIT_MARGIN.md](./PROFIT_MARGIN.md) | Margin floor |
| [PRICING_COMMUNICATION.md](./PRICING_COMMUNICATION.md) | Customer-facing copy |
