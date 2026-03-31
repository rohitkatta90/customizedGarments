import { google } from "googleapis";

/**
 * If the env value is the full service-account JSON (one line), pull out `private_key`.
 */
function extractPrivateKeyFromMaybeJson(raw: string): string {
  const t = raw.trim().replace(/^\uFEFF/, "");
  if (!t.startsWith("{")) return raw;
  try {
    const o = JSON.parse(t) as { private_key?: string; client_email?: string };
    if (typeof o.private_key === "string" && o.private_key.includes("BEGIN")) {
      return o.private_key;
    }
  } catch {
    /* not valid JSON */
  }
  return raw;
}

/**
 * Normalize a service-account PEM from .env (quoted strings, `\n` escapes, CRLF).
 * Bad formatting often surfaces as OpenSSL `ERR_OSSL_UNSUPPORTED` / DECODER routines.
 */
export function normalizeGoogleServiceAccountPrivateKey(raw: string): string {
  let k = extractPrivateKeyFromMaybeJson(raw).trim().replace(/^\uFEFF/, "");
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  for (let i = 0; i < 3; i++) {
    const next = k.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (next === k) break;
    k = next;
  }
  k = k.replace(/\u201c|\u201d/g, '"');
  if (!k.endsWith("\n")) {
    k += "\n";
  }
  return k;
}

/**
 * Read-only Sheets access. Share the spreadsheet with the service account email
 * (Viewer is enough). Env mirrors Firebase-style credentials.
 */
export function isMeasurementSheetsConfigured(): boolean {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim();
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.trim();
  return Boolean(id && email && key);
}

async function getAuthorizedSheetsClient() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!;
  const privateKey = normalizeGoogleServiceAccountPrivateKey(
    process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
  );

  if (
    !privateKey.includes("BEGIN PRIVATE KEY") &&
    !privateKey.includes("BEGIN RSA PRIVATE KEY")
  ) {
    throw new Error(
      "GOOGLE_SHEETS_PRIVATE_KEY must be the service account PEM (BEGIN PRIVATE KEY … END PRIVATE KEY), or paste the full JSON from Google Cloud.",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  try {
    await auth.authorize();
  } catch (e) {
    const msg = String(e);
    if (
      /DECODER|unsupported|PEM|private key|bad decrypt/i.test(msg)
    ) {
      throw new Error(
        `GOOGLE_SHEETS_PRIVATE_KEY is not a valid PEM for this Node/OpenSSL. ${msg} ` +
          `Use the exact "private_key" from the service account JSON (in .env use one line with \\n between PEM lines), paste the whole JSON as the value, or regenerate the key in Google Cloud. On Node 20+, try NODE_OPTIONS=--openssl-legacy-provider if needed.`,
      );
    }
    throw e;
  }
  return google.sheets({ version: "v4", auth });
}

export async function fetchMeasurementSheetValues(): Promise<unknown[][]> {
  if (!isMeasurementSheetsConfigured()) {
    throw new Error("measurement_sheets_not_configured");
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!.trim();
  const range =
    process.env.GOOGLE_SHEETS_RANGE?.trim() ||
    `${process.env.GOOGLE_SHEETS_TAB_NAME?.trim() || "Sheet1"}!A:L`;

  const sheets = await getAuthorizedSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });

  return (res.data.values as unknown[][]) ?? [];
}
