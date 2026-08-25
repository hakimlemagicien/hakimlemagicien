#!/usr/bin/env node
/**
 * Builds delivery WebP images from Nutrition Pilot PNG masters.
 * Masters are never overwritten. Output is keyed by external_id:
 *   public/nutrition/meals/{MEAL-XXX}/cover.webp
 *   public/nutrition/meals/{MEAL-XXX}/cover-thumb.webp
 *
 * Usage:
 *   node scripts/optimize-meal-images.mjs
 *   node scripts/optimize-meal-images.mjs --source="/path/to/Hakim_Nutrition_Pilot_20"
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_SOURCE = join(
  process.env.HOME ?? "",
  "Documents/Hakim Coaching Platform/Nutrition Library/Hakim_Nutrition_Pilot_20",
);

const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const masterSubdirArg = process.argv.find((arg) => arg.startsWith("--master-subdir="));
const SOURCE_DIR = sourceArg ? sourceArg.slice("--source=".length) : DEFAULT_SOURCE;
const MASTER_SUBDIR = masterSubdirArg ? masterSubdirArg.slice("--master-subdir=".length) : "";
const IMAGES_DIR = MASTER_SUBDIR ? join(SOURCE_DIR, "images", MASTER_SUBDIR) : join(SOURCE_DIR, "images");
const OUT_DIR = join(ROOT, "public/nutrition/meals");

const COVER_SIZE = 800;
const THUMB_SIZE = 256;
const COVER_QUALITY = 80;
const THUMB_QUALITY = 78;

async function loadSharp() {
  try {
    const sharp = await import("sharp");
    return sharp.default;
  } catch {
    console.error("sharp is required. Install with: npm install -D sharp");
    process.exit(1);
  }
}

function parseExternalId(filename) {
  const match = filename.match(/^(MEAL-\d{3})\.png$/i);
  return match?.[1] ?? null;
}

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`Source images folder not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const sharp = await loadSharp();
  const files = (await readdir(IMAGES_DIR))
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort();

  if (files.length === 0) {
    console.error("No PNG masters found.");
    process.exit(1);
  }

  let written = 0;
  for (const file of files) {
    const externalId = parseExternalId(file);
    if (!externalId) {
      console.warn(`Skipping unexpected filename: ${file}`);
      continue;
    }

    const input = join(IMAGES_DIR, file);
    const destDir = join(OUT_DIR, externalId);
    await mkdir(destDir, { recursive: true });

    const cover = await sharp(input)
      .rotate()
      .resize(COVER_SIZE, COVER_SIZE, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: COVER_QUALITY, effort: 4 })
      .toBuffer();
    const thumb = await sharp(input)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY, effort: 4 })
      .toBuffer();

    await writeFile(join(destDir, "cover.webp"), cover);
    await writeFile(join(destDir, "cover-thumb.webp"), thumb);
    written += 1;
    console.log(
      `${externalId}: cover ${cover.length} bytes, thumb ${thumb.length} bytes`,
    );
  }

  console.log(`Wrote delivery images for ${written} meals → ${OUT_DIR}`);
}

await main();
