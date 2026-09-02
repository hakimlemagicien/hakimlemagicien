#!/usr/bin/env node
/**
 * Sync Core 100 exercise media from content source-of-truth → public runtime paths.
 *
 * Source:  src/assets/content/core-100-exercises/{EXTERNAL_ID}/
 * Target:  public/exercises/{EXTERNAL_ID}/
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const root = join(import.meta.dirname, "..");
const ids = loadCore100Ids();
const contentRoot = join(root, "src/assets/content/core-100-exercises");
const publicRoot = join(root, "public/exercises");

const COPY_DIRS = ["stages", "mistakes", "anatomy", "video"];

let synced = 0;
let skipped = 0;

for (const externalId of ids) {
  const sourceDir = join(contentRoot, externalId);
  if (!existsSync(sourceDir)) {
    skipped++;
    continue;
  }

  const targetDir = join(publicRoot, externalId);
  mkdirSync(targetDir, { recursive: true });

  for (const sub of COPY_DIRS) {
    copyTree(join(sourceDir, sub), join(targetDir, sub));
  }

  synced++;
}

console.log(`[sync-core-100-media] synced=${synced} skipped_missing_source=${skipped} total=${ids.length}`);

function copyTree(source, target) {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const from = join(source, entry.name);
    const to = join(target, entry.name);

    if (entry.isDirectory()) {
      copyTree(from, to);
      continue;
    }

    if (!shouldCopy(from, to)) continue;
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
  }
}

function shouldCopy(source, target) {
  if (!existsSync(target)) return true;
  return statSync(source).mtimeMs > statSync(target).mtimeMs;
}

function loadCore100Ids() {
  const source = join(root, "src/lib/platform/strategy-matrix/config/core-100-external-ids.ts");
  const text = readFileSync(source, "utf8");
  return [...text.matchAll(/"([A-Z]{2}-\d{3})"/g)].map((match) => match[1]);
}
