# Analytics & insights (lightweight design)

Purpose: support **planning**, **peak-demand visibility**, and **staffing** without a heavy BI stack. This document defines **metrics**, **data requirements**, and a **simple dashboard layout** (concept only — no implementation spec for UI code).

---

## 1. Key metric definitions

### 1.1 Total orders per week

| Definition | Count of **orders** whose **order date** falls in each calendar week. |
|------------|------------------------------------------------------------------------|
| **Order date (recommended)** | **`createdAt`** (request received) — reflects inbound demand. |
| **Alternative** | **`confirmedAt`** — reflects accepted workload (use if you only care about confirmed pipeline). |
| **Week boundary** | ISO week (Mon–Sun) or local business week; pick one and keep consistent. |
| **Output** | Table or bar: week label → count; optional rolling 4-week trend. |

---

### 1.2 Stitching vs alteration ratio

| Definition | Among **line items** (or orders weighted by items), share of **stitching** vs **alteration**. |
|------------|--------------------------------------------------------------------------------------------------|
| **Formula (by item)** | `stitching_items / (stitching_items + alteration_items)` and complement for alteration. |
| **Optional (by order)** | Tag each order with **dominant service** (majority of items) or **split** orders that mix both. |
| **Use** | Capacity mix, skill mix, and buying “stitching-heavy” weeks vs quick alteration load. |

---

### 1.3 Average delivery time

| Definition | Mean (and optionally median) **lead time** from a start anchor to **delivery**. |
|------------|----------------------------------------------------------------------------------|
| **Recommended anchor** | **`confirmedAt`** → **`deliveredAt`** — “time we committed to until handover.” |
| **Alternative** | **`createdAt`** → **`deliveredAt`** — end-to-end including queue before confirmation. |
| **Unit** | Calendar days or **working days** (if you exclude Sundays, match your operations calendar). |
| **Eligibility** | Only orders with **both** timestamps and `status === delivered` (or `deliveredAt` present). |
| **Output** | Single KPI “Avg. days (confirmed → delivered)” + trend by month. |

---

### 1.4 Delayed orders

| Definition | Orders where **actual completion** is later than **promised or requested** date, or explicitly flagged. |
|------------|-----------------------------------------------------------------------------------------------------------|
| **Rule A (date slip)** | `deliveredAt` **date** (local) **>** `requestedDeliveryDate` when both exist. |
| **Rule B (explicit)** | `revisedDeliveryDate` was set (customer was told of a change) — counts as a **delay event** even if final delivery meets revised date. |
| **Rule C (operational)** | `delayReasonInternal` is non-empty — **internal backlog** tracking. |
| **KPIs** | (1) **% of delivered orders** that violated Rule A; (2) **count** of Rule B in period; (3) optional list for review. |

Clarify with the team: “delayed” for planning is usually **Rule A + B**; **Rule C** is for root-cause notes.

---

### 1.5 Customer repeat rate

| Definition | Share of customers who placed **more than one** order in the analysis window (or ever). |
|------------|-------------------------------------------------------------------------------------------|
| **Customer key** | **`customerPhoneNormalized`** (primary); optionally merge obvious duplicates later. |
| **Window** | e.g. last 90 days: `repeat_customers / unique_customers`. |
| **Alternative KPI** | **Orders per repeat customer** (avg # orders among those with ≥2 orders). |
| **Caveat** | Family sharing one phone counts as one “customer”; name changes don’t split identity without manual rules. |

---

## 2. Data points required

| Data point | Source in current model | Notes |
|------------|-------------------------|--------|
| Order identity | `id` | |
| When request arrived | `createdAtIso` | Weekly counts, cohorts |
| When confirmed / in progress / ready / delivered | `confirmedAtIso`, `inProgressAtIso`, `readyAtIso`, `deliveredAtIso` | Lead time, funnel |
| Service mix | `items[].service` (`stitching` \| `alteration`) | Ratio |
| Requested delivery | `requestedDeliveryDate` | Delay Rule A |
| Revised promise | `revisedDeliveryDate` | Delay Rule B |
| Internal delay flag/note | `delayReasonInternal` | Delay Rule C, ops review |
| Customer identity | `customerPhoneNormalized` | Repeat rate |

**Gaps to close later (optional):**

| Gap | Why | Mitigation |
|-----|-----|------------|
| Shop **timezone** | Date boundaries for “week” and “same day” comparison | Fix IANA TZ in pipeline (e.g. `Asia/Kolkata`) |
| **Working calendar** | Avg time in *working* days | Reuse capacity calendar when you add it |
| Marketing source | Channel mix | Add optional `source` on order later |

---

## 3. Simple dashboard concept (no code)

**Audience:** owner / lead tailor (internal only — e.g. future `/admin/insights`).

### Layout (single page, top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  Insights (last 4 weeks · timezone: shop local)              │
├──────────────────┬──────────────────┬────────────────────────┤
│  Orders / week   │  Avg delivery    │  Repeat rate (90d)    │
│  [sparkline/bar] │  days (conf→del) │  [%]                   │
├──────────────────┴──────────────────┴────────────────────────┤
│  Stitching vs alteration (by item)   [stacked bar or 100%]   │
├──────────────────────────────────────────────────────────────┤
│  Delayed orders  [count] [% of delivered]   [small table]      │
├──────────────────────────────────────────────────────────────┤
│  Peak demand: orders by weekday (createdAt)  [bar Mon–Sun]    │
└──────────────────────────────────────────────────────────────┘
```

### Sections (behavioral)

1. **Header** — Preset range: “Last 4 weeks”, “This month”, “Last 90 days”; show timezone once.
2. **KPI row** — Three big numbers with short definitions in tooltips (not on screen clutter).
3. **Mix chart** — Stitching vs alteration; drill-down could be “by week” later.
4. **Delays** — Number + %; table: order ref (short), requested vs delivered date, optional “revised” flag — **no customer PII** in default view.
5. **Peak days** — Histogram of **`createdAt` weekday**; answers “which weekdays are busiest for *new requests*.”

### Principles

- **Recompute on read** from Firestore (or nightly export) for MVP — acceptable up to a few thousand orders.
- **No PII** on shared screenshots: use order ref short + aggregates only.
- **One source of truth** for “order date” and “delivery date” in the metric glossary (Section 1).

---

## 4. Implementation phases (optional)

| Phase | What |
|-------|------|
| **Now** | This spec + query sketches in admin or scripts when needed. |
| **Next** | Read-only **admin API** that aggregates `listStoredOrders`-style data server-side. |
| **Later** | Materialized weekly rollups in Firestore/SQL + charts. |

---

## 5. Relation to other docs

- Orders & statuses: **[ORDER_TRACKING.md](./ORDER_TRACKING.md)**, **[ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md)**  
- Capacity planning (future): tie **peak weekday** to **capacity calendar** when that ships.
