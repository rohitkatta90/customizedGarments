# Step-by-step: Google Cloud + Sheets for customer measurements

This guide walks you from zero to a working **measurement lookup** in your app. You need:

- A **Google account** (Gmail / Workspace).
- About **20–30 minutes** the first time.

**Security:** Never paste your **private key** or full JSON key into chat, email, or a public repo. Keep it only in `.env.local` (local) and your host’s **secret** environment variables (e.g. Vercel).

---

## Part 1 — Open Google Cloud Console

1. In your browser, go to: **https://console.cloud.google.com/**
2. **Sign in** with the Google account you want to use for this project (can be your business account).
3. If you see a welcome screen, accept terms if asked.
4. At the **top bar**, you’ll see a **project dropdown** (it may say “Select a project” or show an existing project name).  
   - Click it → **New Project**.  
   - **Project name:** e.g. `Radha Creations Measurements` (any name is fine).  
   - **Location:** leave default or pick your org if you use Workspace.  
   - Click **Create**.  
5. Wait a few seconds, then open the **project dropdown** again and **select** the project you just created.  
   Everything below is done **inside this project**.

---

## Part 2 — Enable Google Sheets API

1. In the left menu, open **APIs & Services** → **Library**  
   (or visit: **https://console.cloud.google.com/apis/library** while your project is selected).
2. In the search box, type **Google Sheets API**.
3. Click **Google Sheets API** in the results.
4. Click **Enable**.
5. Wait until it shows **Enabled** (usually a few seconds).

---

## Part 3 — Create a service account (robot reader for your sheet)

A **service account** is a special identity (an email like `something@your-project.iam.gserviceaccount.com`) that your **server** uses to read the spreadsheet. It is **not** your personal Gmail login.

1. Go to **APIs & Services** → **Credentials**:  
   **https://console.cloud.google.com/apis/credentials**
2. At the top, click **+ Create credentials** → **Service account**.
3. **Service account name:** e.g. `measurements-reader`  
   **Service account ID** fills automatically — OK to leave as is.  
   Click **Create and continue**.
4. **Grant this service account access to the project** (optional step): you can choose **Continue** without a role for a minimal setup, or add **Viewer** if the console asks — for **only reading Sheets via API**, the important part is the key + sheet share (next steps).
5. Click **Done** (skip optional user access if shown).

You should now see the new service account in the list.

---

## Part 4 — Create and download a JSON key

1. On **Credentials**, under **Service Accounts**, click the **email** of the service account you created (the long `…@….iam.gserviceaccount.com` address).
2. Open the **Keys** tab.
3. Click **Add key** → **Create new key**.
4. Choose **JSON** → **Create**.  
   A **`.json` file** downloads to your computer. **Keep this file safe** — treat it like a password.
5. Open the JSON file in a text editor (Notepad, VS Code, etc.). You will need two fields soon:
   - **`client_email`** — looks like `measurements-reader@your-project-id.iam.gserviceaccount.com`
   - **`private_key`** — a long string starting with `-----BEGIN PRIVATE KEY-----`

**Copy `client_email` exactly** — you’ll paste it when sharing the Google Sheet.

---

## Part 5 — Create the Google Sheet and columns

1. Open **https://sheets.google.com** (same Google account is fine; the sheet can live in your normal Drive).
2. **Blank spreadsheet** → name it at the top, e.g. `Customer measurements — Radha Creations`.
3. **Import headers (recommended):**  
   - **File → Import → Upload**  
   - Select **`docs/measurements-sheet-template.csv`** from this repository.  
   - Choose to **replace** the current sheet or **insert** so **row 1** is the header row with all columns through **PANT L**.
4. **Optional:** Rename the bottom tab from `Sheet1` to `Measurements` (double-click the tab). Remember this name for the range below.
5. **Format phone numbers as plain text:**  
   - Click the **B** column header (**Phone_Number**).  
   - **Format → Number → Plain text**  
   (Stops Excel/Sheets from turning long numbers into scientific notation.)
6. **Add or edit a test row:**  
   - Use a **10-digit** Indian mobile in **Phone_Number** (e.g. `9876543210` or change the sample row in the CSV).  
   - Fill **Timestamp** (any recent date/time), **Garment_Type** (e.g. `Kurti`), and at least **one** measurement column (e.g. **B**).

---

## Part 6 — Share the spreadsheet with the service account

The service account must have **access** to the file, like sharing with a colleague.

1. In the spreadsheet, click **Share** (top right).
2. In **Add people and groups**, paste the **`client_email`** from your JSON (the `…@….iam.gserviceaccount.com` address).
3. Set role to **Viewer** (read-only is enough).
4. **Uncheck** “Notify people” if you want (the robot doesn’t read email).
5. Click **Share** or **Send**.

---

## Part 7 — Copy the Spreadsheet ID

1. Look at the browser **address bar** while the sheet is open.  
   URL shape:  
   `https://docs.google.com/spreadsheets/d/THIS_LONG_RANDOM_PART/edit`
2. Copy **only** the part between `/d/` and `/edit` — that is **`GOOGLE_SHEETS_SPREADSHEET_ID`**.

---

## Part 8 — Set environment variables in your app

In your project root, copy `.env.example` to **`.env.local`** if you don’t have it yet:

```bash
cp .env.example .env.local
```

Edit **`.env.local`** and set:

| Variable | What to put |
|----------|-------------|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | The ID from Part 7 |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | The `client_email` from the JSON file |
| `GOOGLE_SHEETS_PRIVATE_KEY` | The `private_key` from the JSON (see below) |
| `GOOGLE_SHEETS_RANGE` | Tab name + columns **A:T**, e.g. `Sheet1!A:T` or `Measurements!A:T` |

### Private key in `.env.local` (important)

**Easiest — if you still have the downloaded `.json` key file**, from the **project root** run (use your real path to the file):

```bash
node scripts/print-sheets-env.mjs ~/Downloads/your-service-account.json >> .env.local
```

Then open `.env.local` and confirm you did not duplicate `GOOGLE_SHEETS_*` lines if you ran the command more than once.

---

The `private_key` in JSON contains **real newlines**. If you paste by hand, use **`\n`** instead of line breaks, inside **double quotes**:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...(one long base64 block)...\n-----END PRIVATE KEY-----\n"
```

**Easier option:** some deployments accept the **entire JSON file contents** as a single line in `GOOGLE_SHEETS_PRIVATE_KEY` — the app code can extract the key (see project docs). For local `.env.local`, the `\n` style above is the most reliable.

If you see errors like **`DECODER routines::unsupported`**:

- Re-copy `private_key` from the JSON without changing any characters.
- Ensure the value is in **double quotes** and uses **`\n`**, not real line breaks, unless your host supports multiline secrets.

---

## Part 9 — Run the app and test

1. **Restart** the dev server after changing env vars:

   ```bash
   npm run dev
   ```

2. Open your site → **Request stitching** (quick or full flow).
3. Go to the step where you enter **phone number**.
4. Enter the **same 10-digit number** you put in **Phone_Number** in the sheet (with or without spaces; the app normalizes digits).
5. After a short moment, you should see **saved measurements** (or a friendly message if none / not configured).

If nothing happens:

- Confirm **Share** includes the service account email.
- Confirm **`GOOGLE_SHEETS_RANGE`** matches the **tab name** and includes columns **A through T** (header row + data).
- Check the terminal / server logs for `[measurements/lookup]` or Sheets errors.

---

## Part 10 — Production (e.g. Vercel)

1. In the Vercel dashboard → your project → **Settings → Environment Variables**.
2. Add the same four variables (`GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SHEETS_RANGE`).
3. For `GOOGLE_SHEETS_PRIVATE_KEY`, paste the PEM with `\n` or use Vercel’s multiline secret if available.
4. **Redeploy** the project so the new env applies.

---

## Quick checklist

- [ ] Google Cloud **project** created  
- [ ] **Google Sheets API** enabled  
- [ ] **Service account** created  
- [ ] **JSON key** downloaded and stored safely  
- [ ] **Spreadsheet** created with correct **row 1** headers  
- [ ] **Phone_Number** column = plain text  
- [ ] Sheet **shared** with service account **`client_email`** as Viewer  
- [ ] **Spreadsheet ID** copied  
- [ ] **`.env.local`** (or host) has all four variables; **`GOOGLE_SHEETS_RANGE`** = `YourTab!A:T`  
- [ ] App restarted / redeployed  
- [ ] Tested request flow with a matching phone  

For column names and parser rules, see **`MEASUREMENTS_GOOGLE_SHEETS.md`**.
