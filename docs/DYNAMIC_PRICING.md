# Dynamic pricing — rush, peak demand & capacity

This policy balances **revenue** with **sustainable workload**. Numbers live in **`public/data/dynamic-pricing.json`**; customer copy is on **`/pricing`** (`DynamicPricingSection`). There is **no live queue API** — staff apply bands using the calendar and honesty rules.

---

## 1. Urgency pricing strategy

| Band | Meaning | Typical use |
|------|---------|-------------|
| **Express** | Priority in queue vs standard | Customer needs faster than default lead time but not impossible |
| **Next-day** | Handover next calendar day | Feasible only for small jobs + available labour |
| **Same-day / overnight** | Extreme slots | Rare; decline if quality or safety is at risk |

**Charge shape:** **percentage on the agreed quote** (labour portion), e.g. +15% express. Exact **₹** is confirmed in **WhatsApp** before payment.

**Alignment:** The **effort model** uses a **rush multiplier** on effort units (`effort-pricing.json` → `urgencyMultiplier.rush`). Keep **rush %** and **effort rush** mentally consistent — both should not double-count the same story; prefer **one primary lever** (we use **surcharge %** on final quote for clarity, effort rush for internal capacity math).

---

## 2. Demand-based adjustment logic

| Scenario | Mechanism | How to apply |
|----------|-----------|--------------|
| **Peak season** (festivals, weddings) | Multiply reference quote by a value in **`peakSeason`** band | Announce in chat; customer agrees |
| **High workload** (long backlog) | Multiply by a value in **`highWorkload`** band | Use when queue is unusually long but job is still accepted |

**Rules:**

1. **Never** auto-apply from the website — only after **written agreement**.
2. Pick a **single multiplier** inside the band; document **why** in order notes if unusual.
3. Prefer **delay at standard price** over **rush at surge price** when the customer is flexible.

---

## 3. Capacity awareness (without live metrics)

Because the public site does **not** show queue depth:

- **Quotes** reflect **spoken** backlog (“we’re about X days out”).
- If **at capacity**, offer **later delivery at standard** pricing rather than squeezing unsafe rush.
- **`referenceStandardLeadDays`** in JSON drives the **“about N days”** line in customer communication templates on `/pricing`.

---

## 4. Customer communication guidelines

**Always include:**

1. **What costs extra** — time, overtime, scarce slot, or peak-period load.
2. **Alternative** — “If you can wait ~**N** days, we can keep **standard** pricing (no rush/peak uplift).”
3. **Written confirmation** in WhatsApp before collecting rush or surge fees.

**Tone:** Transparent, never punitive — frame as **protecting quality and schedule**.

---

## 5. Owner maintenance

| Change | File |
|--------|------|
| Surcharge %, multiplier bands, standard lead days | `public/data/dynamic-pricing.json` |
| Customer-facing copy | `src/lib/i18n/dictionaries.ts` → `pricing.dynamic` |
| Validation | `src/lib/pricing/parse-dynamic.ts` |

`npm run build`, then deploy.

---

## 6. Related

| Doc | Topic |
|-----|--------|
| [EFFORT_BASED_PRICING.md](./EFFORT_BASED_PRICING.md) | Effort units & rush multiplier |
| [PRICING_MODEL.md](./PRICING_MODEL.md) | Overall pricing stack |
| [FINANCIAL_WORKFLOW.md](./FINANCIAL_WORKFLOW.md) | Quote → pay |
