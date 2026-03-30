# Customer measurement storage & retrieval

**Implemented (read path):** Google Sheets–backed **lookup** + WhatsApp summary — see **[MEASUREMENTS_GOOGLE_SHEETS.md](./MEASUREMENTS_GOOGLE_SHEETS.md)**.  
This file still describes the broader **data model** and phased ideas (write path, Firestore link, OTP, etc.).

Design for storing and reusing tailoring measurements in the **Garment Services** catalog app (women’s wear primary, girls’ wear secondary). Complements the existing **[ORDER_MODEL.md](./ORDER_MODEL.md)** and optional **[ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md)** (Firestore).

---

## 1. Goals

| Goal | Notes |
|------|--------|
| **Identify** repeat customers reliably | Single stable key: **normalized phone** (E.164 or digits-only policy — match `normalizePhone` / order flow). |
| **Store** structured measurements | Per **garment type** + **audience** (women vs girls), append-only history. |
| **Retrieve** on new requests | After phone entry, suggest **latest** (or staff-picked) set with date. |
| **Never overwrite silently** | Updates = **new measurement row**; audit trail preserved. |
| **MVP without heavy backend** | **Google Sheets** or **Airtable** as system of record; app calls via **server-only** integration (API route + secrets). |
| **Privacy** | No public reads; staff-only UI; minimal PII in logs. |

---

## 2. Data structure design

### 2.1 Entity: **Customer**

Logical record keyed by phone (unique).

| Field | Type | Notes |
|-------|------|--------|
| `customer_id` | string (UUID) | Stable internal id once created; avoids churn if phone ever corrected (rare). |
| `phone_normalized` | string | **Unique**; same normalization as orders (`+91…` / digits-only — one canonical rule). |
| `phone_raw` | string (optional) | As entered first time; for display only. |
| `name` | string (optional) | Latest known name from orders / admin. |
| `created_at` | ISO datetime | |
| `updated_at` | ISO datetime | Last touch (order or measurement). |
| `notes_internal` | string (optional) | Staff only — e.g. “prefers fittings on Saturday”. |

**Sheets / Airtable MVP:** one tab or table `customers` with one row per customer; `phone_normalized` column **unique** (enforced in Airtable; in Sheets use validation + process discipline).

### 2.2 Entity: **Measurement**

Many rows per customer; **append-only** for history.

| Field | Type | Notes |
|-------|------|--------|
| `measurement_id` | string (UUID) | Primary key. |
| `customer_id` | string | FK → customers. |
| `audience` | `women` \| `girls` | Aligns with catalog **`CatalogAudience`** (`src/lib/types.ts`). |
| `garment_type` | string | e.g. `blouse`, `kurti`, `dress`, `lehenga`, `girls_party`, `girls_kurti_set`, `other`. Use a **controlled vocabulary** (dropdown in staff UI / enum in code). |
| `label` | string (optional) | e.g. “Festival blouse — Dec 2025”. |
| `values` | JSON object | Flexible key-value: `{ "bust": "36", "waist": "30", ... }` — keys per garment template (see §2.3). |
| `unit` | string | e.g. `inches` / `cm` — default one studio standard. |
| `source` | string | `customer_self`, `staff_entry`, `import`, `order_confirmed`. |
| `created_at` | ISO datetime | **Date of entry** (shown to customer). |
| `order_id` | string (optional) | Link to order if captured at checkout / confirmation. |
| `item_index` | number (optional) | 0-based index if tied to a specific line in a multi-item order. |
| `supersedes_id` | string (optional) | Optional pointer to previous measurement row if staff marks “replacement intent” (still keep both rows). |

**Sheets / Airtable:** table `measurements`; `values` as JSON string column or flattened columns per template (harder to evolve — JSON preferred in Airtable “Long text” + parse, or Airtable “multiple fields” per template set).

### 2.3 Measurement templates (flexible fields)

Define **templates** per `(audience, garment_type)` in config (JSON or admin):

Example — **women’s blouse:**

```json
{
  "fields": [
    { "key": "bust", "label": "Bust", "required": true },
    { "key": "waist", "label": "Waist", "required": true },
    { "key": "shoulder", "label": "Shoulder", "required": false },
    { "key": "armhole", "label": "Armhole", "required": false },
    { "key": "blouse_length", "label": "Blouse length", "required": false },
    { "key": "notes", "label": "Notes", "required": false }
  ]
}
```

Example — **girls’ dress:**

```json
{
  "fields": [
    { "key": "chest", "label": "Chest", "required": true },
    { "key": "shoulder_to_hem", "label": "Shoulder to hem", "required": true },
    { "key": "age_or_size", "label": "Age / ready-made size ref", "required": false },
    { "key": "notes", "label": "Notes", "required": false }
  ]
}
```

Stored document only contains **`values`**; UI renders labels from template. New fields = template version bump; old rows still valid.

### 2.4 Relationship diagram

```mermaid
erDiagram
  CUSTOMER ||--o{ MEASUREMENT : has
  CUSTOMER {
    string customer_id PK
    string phone_normalized UK
    string name
    datetime created_at
  }
  MEASUREMENT {
    string measurement_id PK
    string customer_id FK
    string audience
    string garment_type
    json values
    datetime created_at
    string order_id FK_optional
    int item_index_optional
  }
```

---

## 3. UX flow — customer (service request / future measurement step)

### 3.1 First-time customer

1. Customer enters **name + phone** (existing form).
2. System checks measurements API: **no rows** → no banner; optional link: “Save measurements after we confirm in WhatsApp” (phase 2).
3. Order proceeds as today → WhatsApp.

*(MVP can skip in-form measurement capture entirely and rely on **staff** entering measurements after fitting / chat — still valuable for retrieval on return.)*

### 3.2 Returning customer (auto-fetch)

1. Customer enters **phone** (on blur or before submit).
2. **Server route** `POST /api/measurements/lookup` with `{ phone, garmentType?, audience? }` (rate-limited; no public list).
3. If hits found:
   - Load **latest** `measurement` per `(audience, garment_type)` or single “latest any” if garment not yet chosen.
4. **Inline message** (English example):

   > **We have your measurements on file** (saved **12 Jan 2026**) for **blouse · women’s**.  
   > Would you like to **use these**, **update them**, or **enter fresh** for this order?

5. Choices:
   - **Use saved** → attach `measurement_id` (or snapshot JSON + id) to order payload / WhatsApp summary line: `Measurements: on file (ref …) — customer confirmed reuse.`
   - **Update** → open short form (template fields); on submit → **new** `measurement` row + same confirmation copy.
   - **Enter fresh** → treat as new row on submit without linking to old id.

### 3.3 Multi-item orders

- Each **line item** can optionally reference:
  - `measurement_audience`, `garment_type`, `measurement_id` (reuse), or `measurement_values` (new inline draft).
- WhatsApp summary per item:

  `Item 1 — Stitching — Blouse — Measurements: reused from 12 Jan 2026 (ref …)`  
  `Item 2 — Stitching — Girls dress — Measurements: new entry; please reconfirm growth (last on file: 01 Nov 2025).`

### 3.4 Kids (girls) — copy emphasis

Always show **last saved date** prominently:

> **Little Princess sizing:** Children grow quickly. Your last saved measurements are from **[date]**. Please **confirm or update** so we can cut accurately.

---

## 4. Staff workflow

| Step | Action |
|------|--------|
| **Search** | Admin screen: input **phone** (normalized) → list customer + count of measurement rows. |
| **History** | Table: date, garment type, audience, source, order link; expand to see `values` JSON. |
| **Select** | For phone order: “Apply measurement **meas_abc** to this order item” (reference only; customer should still confirm in WhatsApp for legal/clarity). |
| **Add / edit** | “Add measurement” opens template form → **insert new row** (never delete old). Optional “reason” field internal. |
| **Export** | Sheets/Airtable already exportable; for Firestore later, CSV from admin. |

**Access control:** reuse existing **admin cookie** (`ADMIN_SESSION_TOKEN`) + **no** measurement APIs without server auth. Never expose measurement endpoints to anonymous clients beyond **scoped lookup** that requires **rate limit + optional OTP** (future hardening).

---

## 5. Customer & staff messaging (templates)

**Customer — reuse prompt:**

> We found saved measurements from **[formatted date]** for your **[garment]**. Use them for this request, update them, or enter new numbers — your choice.

**Customer — girls reconfirm:**

> For **children’s wear**, we ask you to **double-check** measurements — kids grow fast. Last saved: **[date]**.

**WhatsApp (after submit):**

> Measurements: **[Reused from DD MMM YYYY | Updated and saved | To be taken at fitting]**

**Staff — internal note:**

> Customer confirmed reuse of **measurement_id** on order **ord-…** at **timestamp**.

---

## 6. MVP storage: Google Sheets vs Airtable

| Topic | Google Sheets | Airtable |
|--------|----------------|----------|
| **Pros** | Free tier, familiar, easy manual edit | Typed fields, views, API ergonomics |
| **Cons** | Concurrency, schema discipline | Cost at scale |
| **Integration** | Service account + `googleapis`; server-only | PAT / OAuth; server-only |
| **Secrets** | `GOOGLE_SERVICE_ACCOUNT_JSON`, sheet id | `AIRTABLE_API_KEY`, base id |

**Recommendation:** **Airtable** for clearer **linked records** (Customer ↔ Measurements) and validation; **Sheets** if you want zero extra tooling.

**Critical:** All read/write from **Next.js Route Handlers** only (`runtime = "nodejs"`); credentials in env; **never** `NEXT_PUBLIC_*` for keys.

---

## 7. Future migration: Firebase / SQL (alignment with app today)

You already have **Firestore** for orders (`garment_orders`). A natural extension:

| Collection / table | Document / row |
|--------------------|----------------|
| `garment_customers` | `customer_id`, `phone_normalized`, `name`, `created_at`, … |
| `garment_measurements` | `measurement_id`, `customer_id`, `audience`, `garment_type`, `values` (map), `created_at`, `order_id`, … |

**Indexes:** `(phone_normalized)`, `(customer_id, created_at desc)`, `(customer_id, garment_type, created_at desc)`.

**Migration from Sheets/Airtable:** one-off script: export CSV → `admin` import route or Cloud Function; preserve `created_at` and `measurement_id` where possible.

**Django / Postgres:** same tables; use JSONField for `values`.

---

## 8. Privacy & security checklist

- [ ] Measurements **not** in client-side localStorage unencrypted (if cached, short TTL + minimal fields).
- [ ] **HTTPS** only; admin routes behind existing auth.
- [ ] **Rate limit** `lookup` by IP + phone hash to reduce enumeration.
- [ ] **Retention policy** documented (e.g. delete inactive > N years on request).
- [ ] **DPA** with Airtable/Google if EU/UK customers matter.
- [ ] WhatsApp messages: avoid pasting **full** measurement tables in plain text unless customer requests; prefer “on file, ref …” + confirm in shop.

---

## 9. Scalability & product notes

| Concern | Mitigation |
|---------|------------|
| **Template explosion** | Version templates; migrate old `values` lazily on read. |
| **Many rows per customer** | UI default “latest per garment_type”; archive view for staff. |
| **Phone change** | Rare: staff merge tool (link two `customer_id`, mark old phone inactive). |
| **Alterations vs stitching** | Same `garment_type` taxonomy; optional `context: new_piece | alteration`. |

---

## 10. Suggested implementation phases (engineering)

| Phase | Scope |
|-------|--------|
| **P0** | Staff-only: Airtable/Sheets + internal playbook (no app code). |
| **P1** | `POST /api/measurements/lookup` + admin page “Customer measurements” (search by phone). |
| **P2** | Service request form: phone blur → banner + reuse/update/fresh; append to WhatsApp body. |
| **P3** | Firestore collections + sync or replace external sheet; link `measurement_id` on `StoredOrder`. |

---

## 11. Related docs

- **[ORDER_MODEL.md](./ORDER_MODEL.md)** — order / item shapes.  
- **[ORDER_ADMIN_SYSTEM.md](./ORDER_ADMIN_SYSTEM.md)** — Firestore, admin UI patterns.  
- **[OWNER_DATA_ACCESS.md](./OWNER_DATA_ACCESS.md)** — env vars, secrets.  
- Catalog audience: **`CatalogAudience`** in `src/lib/types.ts` (`women` | `girls`).

---

*This document is the source of truth for measurement storage design until implemented; update it when you choose Sheets vs Airtable and when Firestore schemas are added.*
