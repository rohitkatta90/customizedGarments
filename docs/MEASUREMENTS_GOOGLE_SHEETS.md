# Auto-fetch customer measurements (Google Sheets)

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

## Google Cloud setup

1. Create (or pick) a **Google Cloud project**.
2. Enable **Google Sheets API**.
3. Create a **service account** → **Keys** → add JSON key.
4. Open the spreadsheet → **Share** → invite the service account email (e.g. `…@….iam.gserviceaccount.com`) with **Viewer**.
5. Copy **Spreadsheet ID** from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

## Env vars (see `.env.example`)

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY` (with `\n` newlines in `.env`)
- `GOOGLE_SHEETS_RANGE` — A1 range including header row, e.g. `Form responses 1!A:L` or `Sheet1!A:L`
- Optional: `GOOGLE_SHEETS_TAB_NAME` — used only if `GOOGLE_SHEETS_RANGE` is unset (defaults to `Sheet1!A:L`)

Optional: `GOOGLE_SHEETS_CACHE_TTL_SECONDS` (30–3600; default 300).

## Sheet column layout (row 1 = headers)

Use these **exact** header labels (case-insensitive; spaces/underscores normalized when matching):

| Timestamp | Phone_Number | Customer_Name | Garment_Type | Bust | Waist | Hip | Shoulder | Sleeve_Length | Garment_Length | Neck_Style | Notes |

**Tips**

- Set **Phone_Number** column format to **Plain text** so values are not stored as scientific notation.
- **Timestamp** should be a real date/time column (Form default works). The API reads numeric serials or parseable strings.
- **Garment_Type** must be one of: `Blouse`, `Kurti`, `Dress`, `Kids_Blouse`, `Kids_Dress` (aliases like `kids dress` normalize when unambiguous).

## Lookup rules

1. Normalize the submitted phone (`normalizePhone` — digits only).
2. Match rows where phone equals **or** last **10 digits** match (country-code tolerant).
3. Drop rows missing timestamp, phone, garment type, or **any** measurement field (Bust–Notes).
4. For each **Garment_Type**, keep the row with the **latest Timestamp** only.

## UX summary

- **Detailed request:** after **Phone (WhatsApp)**, panel loads; user taps **Find my measurements**.
- **Quick request:** optional **WhatsApp number** + same panel.
- **Found:** list per garment with **Use these** / **I’ll send updates in WhatsApp** (updates do **not** write to the sheet from the app).
- **Not found / not configured:** friendly copy; flow continues.

## Error handling

| Scenario | Behaviour |
|----------|-----------|
| Env not set | `configured: false` — UI explains lookup isn’t wired |
| Invalid phone | `400` from API; button disabled client-side when implausible |
| Sheet errors | `502` + generic message (details in dev logs) |
| Rate limit | `429` after burst per IP (in-memory; resets per server instance) |

## Scaling notes

- **MVP:** full-sheet fetch + **server cache** (good for modest form volumes).
- **Next:** move to **Apps Script / Cloud Function** that maintains an index, or sync to **Firestore** on row change.
- **Never** expose the service account or full sheet JSON to the browser.

## Related

- Original design notes: **[CUSTOMER_MEASUREMENTS.md](./CUSTOMER_MEASUREMENTS.md)**
