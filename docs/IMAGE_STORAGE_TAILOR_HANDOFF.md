# Image storage & tailor handoff workflow

This document describes how **customer reference images** and **notes** move from intake (website + WhatsApp) into **central storage**, **Firestore orders**, and **tailor / cutting master** handoff. It matches fields and UI in **`/admin/orders/[id]`** (`designAssetsFolderUrl`, `tailorHandoffNotesInternal`, **Copy tailor handoff**).

---

## Principles

1. **Order ID is the spine** — Same UUID appears in: website form, WhatsApp prefilled text, Firestore document id, shared folder name, and tailor messages.
2. **WhatsApp is for conversation, not archival** — Images and final specs should live in a **shared folder** + **order record**, not only in chat history.
3. **Rename customer files** — Avoid `IMG_1234.jpg` in storage; use the suggested names in admin (see below).

---

## End-to-end flow (customer → staff → tailor)

### A. Customer

1. Completes **Service request** on the site (`/request`): items, notes, optional reference **filename** (image chosen on device is **not** auto-uploaded to a server today).
2. Sees the **WhatsApp handoff** modal, opens WhatsApp, sends the prefilled summary, and **attaches** reference photo(s) in chat.
3. If Firestore is configured, the order is saved and the message may include **Track my order: …/track/…**.

### B. Staff (intake)

1. **Identify the order** — Match WhatsApp thread to **Order ID** (full UUID in message) or customer phone + date.
2. **Create a folder** in shared storage (e.g. Google Drive) under your agreed root, e.g.  
   `Orders / Order_<OrderID> /`  
   Use the **full** `Order ID` from the admin order page (same as Firestore document id).
3. **Save images** — Download from WhatsApp (or collect from customer), **rename** using the **Suggested file names** list on the order detail page (`src/lib/orders/asset-naming.ts` generates names from order id + line item).
4. **Add `notes.txt`** (or a Doc) in the same folder with: customer name/phone, pasted customer notes from the form, and any call-out measurements agreed in chat.
5. **Share the folder** — Link with view access for internal team (and tailor if policy allows).
6. **Admin → Order details** — Paste the folder link into **Design folder URL**, fill **Structured tailor notes** (bullets), **Save changes**.

### C. Tailor / cutting master (preferred: Option B)

**Option B (preferred):** Send the **shared folder link** plus a short WhatsApp line:

- Order ID (short + full if needed)
- “All references and notes are in the linked folder.”

Use **Copy tailor handoff (WhatsApp)** on the order page — it includes folder link (when set), line items from the website, and structured tailor notes.

**Option A:** If folder is not ready, send images + notes in WhatsApp **only as a stopgap**; still create the folder and link it in admin as soon as possible.

---

## Folder structure (example)

```text
Orders/
  Order_755bf2e5-4707-4182-bd16-bb3b14f198ff/
    order_755bf2e54707_item1_design_ref.png
    order_755bf2e54707_item2_garment.jpg
    notes.txt
```

- **Folder name** — Include full Order ID for unambiguous search in Drive.
- **`notes.txt`** — Human-readable summary; can duplicate structured tailor notes for offline use.

---

## Order tracking structure (current app)

| Field | Where | Purpose |
|--------|--------|--------|
| **Order ID** | Firestore doc id, WhatsApp text | Single identifier everywhere |
| **Customer** | `customerName`, `customerPhone` | Contact |
| **Items** | Embedded `items[]` | Stitching/alteration lines, notes, delivery prefs, filename hints |
| **Status** | `status` | Ops pipeline |
| **Tracking** | `trackingToken` → `/track/…` | Customer visibility |
| **Design folder** | `designAssetsFolderUrl` | Link to Drive (etc.) |
| **Tailor notes** | `tailorHandoffNotesInternal` | Bullet spec for production |

Optional future: sync row to **Google Sheets** or export CSV from admin — same columns as above plus `updatedAtIso`.

---

## File naming convention

Generated in code: **`order_<12-char-hex-from-uuid>_item<N>_<role>.<ext>`**

- **12-char hex** — First 12 hex digits of UUID (no hyphens), lowercase.
- **`<role>`** — e.g. `design_ref`, `garment`, `catalog_screenshot`.
- **`<ext>`** — Taken from the customer’s original filename when available; else `jpg`.

Staff should **rename before upload** to match the admin **Suggested file names** list.

---

## Notes standardization

**Customer (website)** — Encouraged via placeholder on the form: short bullets (garment type, back, sleeves, length, fabric).

**Staff → tailor (`tailorHandoffNotesInternal`)** — Example:

```text
Garment: Blouse
• Back: deep cut
• Sleeves: elbow length

Garment: Kurti
• Style: straight cut
• Length: 45 inches
```

Keep one **Garment:** block per piece or per line item, aligned with how tailors think.

---

## Error prevention checklist

- [ ] Order exists in Firestore (or logged manually if persistence off).
- [ ] At least one **stored** reference image per stitching line that needs a visual (upload or WhatsApp-sourced).
- [ ] **Design folder URL** filled when assets are in Drive.
- [ ] **`notes.txt`** (or equivalent) in folder matches latest agreed spec.
- [ ] **Copy tailor handoff** sent after link + notes are saved.

---

## Scalability / future

| Direction | Approach |
|-----------|----------|
| **Automated uploads from app** | `POST /api/orders/:id/assets` + object storage (S3/R2); store public or signed URLs on `StoredOrder` or subcollection. |
| **Database** | Already on Firestore; SQL migration keeps same logical fields. |
| **Internal dashboard** | Admin orders list/detail; optional read-only view for tailors (auth + folder links). |
| **Google Sheets** | Nightly export or Apps Script webhook on order create. |

---

## Related code

| Piece | Location |
|--------|----------|
| Stored fields | `src/lib/orders/schema.ts` |
| Create / map / update | `src/lib/orders/firestore.ts` |
| Folder URL validation | `src/lib/orders/folder-url.ts` |
| Suggested filenames | `src/lib/orders/asset-naming.ts` |
| Tailor WhatsApp body | `src/lib/orders/tailor-handoff.ts` |
| Admin UI | `src/app/admin/orders/[id]/order-detail-form.tsx` |
| PATCH API | `src/app/api/admin/orders/[id]/route.ts` |
