# Auto-fetch customer measurements (Google Sheets)

**New to Google Cloud?** Use the click-by-click guide: **[GOOGLE_CLOUD_MEASUREMENTS_SETUP_GUIDE.md](./GOOGLE_CLOUD_MEASUREMENTS_SETUP_GUIDE.md)**.

Live implementation: server-side **Google Sheets API** (service account, read-only), **in-memory cache** (default 5 minutes), and **`POST /api/measurements/lookup`** used by the request flows.

## Architecture

| Piece | Role |
|--------|------|
| `src/lib/measurements/sheets-fetch.ts` | JWT auth + `spreadsheets.values.get` |
| `src/lib/measurements/cache.ts` | TTL cache of parsed rows (reduces API quota) |
| `src/lib/measurements/sheet-parse.ts` | Header mapping, row validation, **latest per garment** per phone |
| `src/lib/measurements/phone-match.ts` | Match full digits or **last 10** (handles `91…` vs 10-digit local) |
| `src/app/api/measurements/lookup/route.ts` | Rate-limited API; **no raw sheet** returned to browser |
| `src/components/measurements/MeasurementLookupPanel.tsx` | “Find my measurements” + per-garment **Use / Update in WhatsApp** |
| `src/lib/measurements/format-whatsapp.ts` | Appends a block to the prefilled WhatsApp message |

**Privacy:** The browser only receives **filtered** rows for the submitted phone. The full spreadsheet never ships to the client.

## Create the spreadsheet (you — we cannot log into your Google account)

**Do not share** passwords, OAuth tokens, or service-account private keys in email or chat. You create the file; the app only **reads** it using env vars on your server.

### Option A — Import the template (fastest)

1. In Google Drive: **New → Google Sheets → Blank spreadsheet**.
2. Name the file (e.g. `Radha Creations — Customer measurements`). Rename the bottom tab if you like (e.g. `Measurements`); note the tab name for `GOOGLE_SHEETS_RANGE`.
3. **File → Import → Upload** and choose **`docs/measurements-sheet-template.csv`** from this repo (or paste the header row from that file into row 1).
4. If prompted, choose **Replace spreadsheet** or **Insert new sheet** so **row 1** is exactly the header row.
5. Format **Phone_Number** column as **Format → Number → Plain text**.
6. **Share** the spreadsheet with your **service account** email (Viewer). Copy the **spreadsheet ID** from the URL.
7. Set `GOOGLE_SHEETS_RANGE` to include all columns, e.g. `Measurements!A:T` if the tab is named `Measurements`, or `Sheet1!A:T` for the default tab.

### Option B — Paste headers manually

Paste this as **row 1** (one column per cell):

`Timestamp` · `Phone_Number` · `Customer_Name` · `Garment_Type` · `BP` · `LW` · `L` · `B` · `W` · `H` · `SH` · `SL` · `SR` · `N` · `XF` · `XB` · `AH` · `SALWAR L` · `SKIRT L` · `PANT L`

Then do steps 5–7 above.

### Link the UI (end-to-end test)

1. Complete **Google Cloud setup** below (service account + Sheets API).
2. Put in **`.env.local`** (local) or your host’s env: `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, and **`GOOGLE_SHEETS_RANGE`** matching your tab and **columns A–T**.
3. Restart `next dev` or redeploy.
4. Open **Request** flow, enter a **10-digit phone** that appears in **Phone_Number** on a row with at least one measurement filled — saved measurements should load after a short delay.

---

## Google Cloud setup

1. Create (or pick) a **Google Cloud project**.
2. Enable **Google Sheets API**.
3. Create a **service account** → **Keys** → add JSON key.
4. Open the spreadsheet → **Share** → invite the service account email (e.g. `…@….iam.gserviceaccount.com`) with **Viewer**.
5. Copy **Spreadsheet ID** from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

## Env vars (see `.env.example`)

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY` — either the PEM alone or the **full service account JSON** (single line). For PEM in `.env`, use **double-quoted** values and **`\n`** between lines, e.g. `GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE…\n-----END PRIVATE KEY-----\n"`. If you see `DECODER routines::unsupported`, the key is often mangled (copy the `private_key` field exactly from JSON, or paste the whole JSON as the value; avoid smart quotes or trimming inside the base64 block).
- `GOOGLE_SHEETS_RANGE` — A1 range including header row through column **T**, e.g. `Sheet1!A:T` or `Measurements!A:T`
- Optional: `GOOGLE_SHEETS_TAB_NAME` — used only if `GOOGLE_SHEETS_RANGE` is unset (defaults to `Sheet1!A:L`; prefer setting `GOOGLE_SHEETS_RANGE` explicitly to `!A:T` for the current schema)

Optional: `GOOGLE_SHEETS_CACHE_TTL_SECONDS` (30–3600; default 300).

## Sheet column layout (row 1 = headers)

**Metadata** (required unless noted):

| Timestamp | Phone_Number | Customer_Name | Garment_Type | … |

**Women’s measurement columns** (enter values in Sheets only — no customer-facing measurement form). Use these header labels (case-insensitive; spaces and underscores are treated the same, e.g. `SALWAR L` = `SALWAR_L`):

| BP | LW | L | B | W | H | SH | SL | SR | N | XF | XB | AH | SALWAR L | SKIRT L | PANT L |

**Tips**

- Set **Phone_Number** column format to **Plain text** so values are not stored as scientific notation.
- **Timestamp** should be a real date/time column (Form default works). The API reads numeric serials or parseable strings.
- **Customer_Name** is optional but recommended.
- **Garment_Type** must be one of: `Blouse`, `Kurti`, `Dress`, `Kids_Blouse`, `Kids_Dress` (aliases like `kids dress` normalize when unambiguous).
- A row must have **at least one** non-empty cell among the measurement columns above to be imported.

## Lookup rules

1. Normalize the submitted phone (`normalizePhone` — digits only).
2. Match rows where phone equals **or** last **10 digits** match (country-code tolerant).
3. Drop rows missing timestamp, phone, garment type, or **any** populated measurement field among the columns listed above.
4. For each **Garment_Type**, keep the row with the **latest Timestamp** only.

## UX summary

- **Detailed & quick request:** after a valid **Phone (WhatsApp)**, saved measurements are **fetched automatically** (debounced); masters still maintain values **only in the sheet**.
- **Manual refresh** appears if the number changes after a lookup.
- **Found:** list per garment with **Use these** / **I’ll send updates in WhatsApp** (updates do **not** write to the sheet from the app).
- **Not found / not configured:** friendly copy; flow continues.

## Error handling

| Scenario | Behaviour |
|----------|-----------|
| Env not set | `configured: false` — UI explains lookup isn’t wired. **`POST /api/measurements/lookup`** also returns **`configurationStatus`**: `{ hasSpreadsheetId, hasClientEmail, hasPrivateKey }` (booleans only) so you can see which vars are empty on the server. **Vercel:** each variable must be enabled for **Production** (not only Preview), then **redeploy**. |

| Invalid phone | `400` from API; button disabled client-side when implausible |
| Sheet errors | `502` + generic message (details in dev logs) |
| Rate limit | `429` after burst per IP (in-memory; resets per server instance) |

## Scaling notes

- **MVP:** full-sheet fetch + **server cache** (good for modest form volumes).
- **Next:** move to **Apps Script / Cloud Function** that maintains an index, or sync to **Firestore** on row change.
- **Never** expose the service account or full sheet JSON to the browser.

## Related

- Original design notes: **[CUSTOMER_MEASUREMENTS.md](./CUSTOMER_MEASUREMENTS.md)**
