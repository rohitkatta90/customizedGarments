import { google } from "googleapis";

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
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!;
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  await auth.authorize();
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
