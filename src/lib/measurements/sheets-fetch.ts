import { createPrivateKey } from "node:crypto";

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

/** Zero-width / invisible chars often break PEM parsing in OpenSSL 3. */
function stripInvisible(s: string): string {
  return s.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
}

/**
 * Collapse whitespace in the base64 body and re-wrap to 64-char lines.
 * Fixes single-line keys and shell/dotenv-mangled PEMs (common cause of
 * `error:1E08010C:DECODER routines::unsupported`).
 */
function rewrapServiceAccountPem(pem: string): string {
  const t = pem.trim().replace(/^\uFEFF/, "");
  const m = t.match(
    /^(-----BEGIN (?:RSA )?PRIVATE KEY-----)\s*([\s\S]*?)\s*(-----END (?:RSA )?PRIVATE KEY-----)/,
  );
  if (!m) return pem;
  const [, begin, bodyRaw, end] = m;
  const body = bodyRaw.replace(/\s+/g, "");
  if (body.length < 80 || !/^[A-Za-z0-9+/=]+$/.test(body)) return pem;
  const lines = body.match(/.{1,64}/g) ?? [];
  return `${begin}\n${lines.join("\n")}\n${end}\n`;
}

function pemLooksValidForNode(pem: string): boolean {
  try {
    createPrivateKey({ key: pem, format: "pem" });
    return true;
  } catch {
    return false;
  }
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
  for (let i = 0; i < 12; i++) {
    const next = stripInvisible(k)
      .replace(/\\n/g, "\n")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    if (next === k) break;
    k = next;
  }
  k = stripInvisible(k);
  k = k.replace(/\u201c|\u201d/g, '"');

  if (
    k.includes("BEGIN PRIVATE KEY") ||
    k.includes("BEGIN RSA PRIVATE KEY")
  ) {
    const wrapped = rewrapServiceAccountPem(k);
    if (pemLooksValidForNode(wrapped)) {
      k = wrapped;
    } else if (pemLooksValidForNode(k)) {
      /* keep k */
    } else {
      k = wrapped;
    }
  }

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
          `Copy the exact "private_key" from the service account JSON, or set GOOGLE_SHEETS_PRIVATE_KEY to the whole JSON string. In .env use double quotes and real \\n between PEM lines, e.g. GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n". ` +
          `Regenerate the key in Google Cloud if it may be truncated. See docs/MEASUREMENTS_GOOGLE_SHEETS.md.`,
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
