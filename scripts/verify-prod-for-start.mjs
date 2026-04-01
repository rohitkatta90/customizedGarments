#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");

if (!fs.existsSync(path.join(nextDir, "BUILD_ID"))) {
  console.error("Missing production build: run `npm run build` before `npm run start`.");
  process.exit(1);
}

if (!fs.existsSync(path.join(nextDir, "required-server-files.json"))) {
  console.error("Incomplete .next output — run `npm run build` again.");
  process.exit(1);
}
