# Pricing communication (customer-facing)

This playbook aligns **website copy**, **WhatsApp quotes**, and **staff tone** so pricing feels **transparent**, **fair**, and **premium** — without sounding defensive.

**Bilingual UI copy** lives in `src/lib/i18n/dictionaries.ts` → `pricing.communication`.  
**Long-form templates** below mirror that section for easy printing or onboarding.

---

## 1. Principles

| Goal | How |
|------|-----|
| **Clarity** | Separate **base** (labour for agreed tier) from **add-ons** (named, priced, or TBD). |
| **Tone** | Warm, confident, plain language — we explain craft, we don’t apologise for bespoke work. |
| **Breakdown** | Short line items when helpful; never a wall of numbers unless the client asks. |
| **Trust** | “We’ll confirm before adding anything chargeable” / “No hidden charges” — only say what you can honour. |
| **Upsell** | Frame enhancements as **optional upgrades** with a clear ₹ impact and an easy “no”. |

---

## 2. Messaging templates (WhatsApp)

Use as starting points; localise tone per client.

### A. First written quote

```
Hi! Here’s your quote for the [blouse/kurti/dress] we discussed:
• Base (Standard tier, labour): ₹____
• Agreed extras: [none / listed below]
• Timeline: [date]
Total: ₹____. No hidden charges — this is what we stand by before we start. Happy to adjust scope before you confirm 💛
```

### B. Extras broken down

```
Quick breakdown so it’s easy to scan:
Base stitching (tier): ₹____
+ Lace border (___m, approved): ₹____
+ Rush fee (agreed): +____%
Total: ₹____. We’ll only proceed on extras you’ve OK’d in chat — nothing else is billed.
```

### C. Rush / peak

```
We can prioritise your piece for [date]. That uses our express slot, so the total is ₹____ (includes +____% for priority/peak as we discussed). If you’d prefer our standard timeline instead, we can price that too — tell me what works for you.
```

### D. Optional upgrade (soft)

```
One thought: a [lace/lining/detail] would add roughly ₹___ and gives [effect]. It’s completely optional — your quote without it stays ₹___. Want to include it or keep the original plan?
```

### E. After a price question

```
Totally fair question. We list labour and extras separately so you always know what you’re choosing — we’ll confirm in writing before we add anything chargeable. Ask anything else; we’re here to make this feel easy.
```

---

## 3. Short explanation examples (talk tracks)

- **Why ranges on the site?**  
  “The site shows bands because fabric and finishing change the hours — your WhatsApp quote is the exact number once we’ve seen your fabric and design.”

- **More work than expected?**  
  “If cutting or handling needs more time than usual, we’ll tell you before we lock the price — never after.”

- **Client compares to a cheaper quote**  
  “We price for the time and finish this piece needs — happy to walk through what’s included so you can compare apples to apples.”

---

## 4. UX placement (app)

| Location | Purpose |
|----------|---------|
| **`/pricing`** | “How we talk about price” section — principles, trust phrases, breakdown example, templates, UX table. |
| **Service request** | One line under the pricing link: written quote on WhatsApp before pay. |
| **Gallery** | `styling.pricingNotice` — extras may apply; confirm before proceeding; no hidden fees. |
| **WhatsApp** | Line-item quote, explicit rush/peak, optional upgrades on their own lines. |
| **Receipt** | Repeat total and scope — reinforces trust. |

---

## 5. Related docs

- [PRICING_MODEL.md](./PRICING_MODEL.md) — tiers, bands, JSON maintenance  
- [DYNAMIC_PRICING.md](./DYNAMIC_PRICING.md) — rush & peak language  
- [ACCESSORIES_SERVICE_FLOW.md](./ACCESSORIES_SERVICE_FLOW.md) — approving extras in admin  
