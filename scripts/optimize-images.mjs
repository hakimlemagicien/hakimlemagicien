#!/usr/bin/env node
/**
 * Compresses src/assets images to WebP and reports size savings.
 * Requires: npm install -D sharp
 *
 * Usage: node scripts/optimize-images.mjs [--dry-run] [--quality=82]
 */
import { readdir, stat, access } from "node:fs/promises";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "../src/assets");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png"]);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const qualityArg = args.find((a) => a.startsWith("--quality="));
const quality = qualityArg ? Number(qualityArg.split("=")[1]) : 82;

async function loadSharp() {
  try {
    const sharp = await import("sharp");
    return sharp.default;
  } catch {
    console.error(
      "sharp is required. Install with: npm install -D sharp\nThen re-run: node scripts/optimize-images.mjs",
    );
    process.exit(1);
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const sharp = await loadSharp();
  const files = await walk(ASSETS_DIR);
  let originalBytes = 0;
  let webpBytes = 0;
  let converted = 0;
  let skipped = 0;

  console.log(`Found ${files.length} images in src/assets/`);
  if (dryRun) console.log("(dry-run — no files written)\n");

  for (const file of files) {
    const webpPath = join(dirname(file), `${basename(file, extname(file))}.webp`);
    try {
      await access(webpPath);
      skipped += 1;
      continue;
    } catch {
      // no existing webp — proceed
    }

    const inputStat = await stat(file);
    originalBytes += inputStat.size;

    if (dryRun) {
      converted += 1;
      continue;
    }

    const buffer = await sharp(file)
      .rotate()
      .webp({ quality, effort: 4 })
      .toBuffer();

    const { writeFile } = await import("node:fs/promises");
    await writeFile(webpPath, buffer);
    webpBytes += buffer.length;
    converted += 1;
    const saved = ((1 - buffer.length / inputStat.size) * 100).toFixed(1);
    console.log(`✓ ${basename(file)} → ${basename(webpPath)} (−${saved}%)`);
  }

  console.log("\n── Summary ──");
  console.log(`Converted: ${converted}`);
  console.log(`Skipped (WebP exists): ${skipped}`);
  if (!dryRun && converted > 0) {
    const savedPct = ((1 - webpBytes / originalBytes) * 100).toFixed(1);
    console.log(`Original: ${(originalBytes / 1024 / 1024).toFixed(1)} MB`);
    console.log(`WebP output: ${(webpBytes / 1024 / 1024).toFixed(1)} MB (−${savedPct}%)`);
    console.log("\nNext: update imports to use .webp files, then remove originals.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
