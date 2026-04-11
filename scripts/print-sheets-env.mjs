#!/usr/bin/env node
/**
 * Prints GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY for .env.local
 * from a Google Cloud service account JSON key file.
 *
 * Usage (from project root):
 *   node scripts/print-sheets-env.mjs ~/Downloads/your-project-xxxxx.json
 *
 * Append to .env.local (review the file after — avoid duplicate keys):
 *   node scripts/print-sheets-env.mjs ~/Downloads/key.json >> .env.local
 *
 * Do not commit the JSON file or .env.local to git.
 */
import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/print-sheets-env.mjs /path/to/service-account.json");
  process.exit(1);
}

let j;
try {
  j = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (e) {
  console.error("Could not read or parse JSON:", e.message);
  process.exit(1);
}

const email = j.client_email;
const pem = String(j.private_key ?? "").trim().replace(/\r\n/g, "\n");

if (!email || !pem) {
  console.error("JSON must include client_email and private_key.");
  process.exit(1);
}

const escaped = pem
  .replace(/\\/g, "\\\\")
  .replace(/"/g, '\\"')
  .replace(/\n/g, "\\n");

console.log("");
console.log("# --- Google Sheets (measurements) — from service account JSON ---");
console.log(`GOOGLE_SHEETS_CLIENT_EMAIL=${email}`);
console.log(`GOOGLE_SHEETS_PRIVATE_KEY="${escaped}"`);
console.log("");
