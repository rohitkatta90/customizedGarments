#!/usr/bin/env node
/**
 * Next 16 defaults to Turbopack for `next build`, which often leaves `.next/server`
 * incomplete (e.g. missing `pages-manifest.json`) on some environments.
 *
 * This script runs `next build --webpack` with the same Node binary as this process
 * (`process.execPath`), uses `experimental.webpackBuildWorker: false` in next.config,
 * and retries with a clean `.next` when manifest/trace races occur.
 *
 * On Node 25+, automatically re-invokes this script with Node 20 via `npx -y node@20`
 * so `npm run build` works without nvm/Homebrew switching.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const MAX_ATTEMPTS = 5;

const nodeMajor = Number(process.version.slice(1).split(".")[0]);
if (nodeMajor >= 25) {
  console.log(
    `\nℹ Node ${process.version} — running the production build with Node 20 (npx), which Next 16.2 needs for a reliable output.\n` +
      `  To avoid the extra step, install Node 20 as your default (see .nvmrc).\n`,
  );
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const self = path.join(root, "scripts", "build.mjs");
  try {
    execFileSync(npx, ["-y", "node@20", self], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    });
  } catch (e) {
    const code = typeof e.status === "number" ? e.status : 1;
    console.error(
      "\n✖ npx node@20 failed (offline or blocked?). Install Node 20: https://nodejs.org/ — LTS — or: brew install node@20\n",
    );
    process.exit(code);
  }
  process.exit(0);
}
if (nodeMajor < 20) {
  console.warn(`\n⚠ ${process.version}: Prefer Node 20 LTS for this project (see .nvmrc).\n`);
}

function clean() {
  fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
}

function build() {
  const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
  execFileSync(process.execPath, [nextCli, "build", "--webpack"], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
}

clean();

let lastErr;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    build();
    process.exit(0);
  } catch (e) {
    lastErr = e;
    if (attempt < MAX_ATTEMPTS) {
      console.error(
        `\n⚠ Build failed (attempt ${attempt}/${MAX_ATTEMPTS}). Cleaning .next and retrying…\n`,
      );
      clean();
    }
  }
}

console.error("\n✖ Build failed after retries. Try: npm run build:node20\n");
process.exit(lastErr?.status ?? 1);
