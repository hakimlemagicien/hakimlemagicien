#!/usr/bin/env node
/**
 * Builds delivery WebP stills from Training Media Pilot PNG masters.
 * Masters are never overwritten. Output is keyed by external_id:
 *   public/exercises/{ID}/stages/stage-{a,b,c}.webp
 *   public/exercises/{ID}/stages/stage-{a,b,c}-thumb.webp
 *   public/exercises/{ID}/mistakes/mistake-0{1,2}.webp
 *   public/exercises/{ID}/mistakes/mistake-0{1,2}-thumb.webp
 *
 * Only folders that already contain all five PNG masters are processed.
 * Run after adding a new approved pilot pack — do not invent placeholders.
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_DIR = join(ROOT, "TRAINING_LIBRARY_INVENTORY_AUDIT/assets");
const OUT_DIR = join(ROOT, "public/exercises");

const DETAIL_WIDTH = 960;
const DETAIL_HEIGHT = 720;
const THUMB_WIDTH = 256;
const THUMB_HEIGHT = 192;
const DETAIL_QUALITY = 80;
const THUMB_QUALITY = 78;

const REQUIRED = [
  { file: "stage-a.png", folder: "stages", name: "stage-a" },
  { file: "stage-b.png", folder: "stages", name: "stage-b" },
  { file: "stage-c.png", folder: "stages", name: "stage-c" },
  { file: "mistake-01.png", folder: "mistakes", name: "mistake-01" },
  { file: "mistake-02.png", folder: "mistakes", name: "mistake-02" },
];

async function loadSharp() {
  try {
    const sharp = await import("sharp");
    return sharp.default;
  } catch {
    console.error("sharp is required. Install with: npm install -D sharp");
    process.exit(1);
  }
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Source assets folder not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const sharp = await loadSharp();
  const entries = (await readdir(SOURCE_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^[A-Z]{2}-\d{3}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (entries.length === 0) {
    console.error("No exercise master folders found.");
    process.exit(1);
  }

  let written = 0;
  for (const externalId of entries) {
    const masterDir = join(SOURCE_DIR, externalId);
    const missing = REQUIRED.filter((item) => !existsSync(join(masterDir, item.file)));
    if (missing.length > 0) {
      console.warn(`${externalId}: skip (missing ${missing.map((item) => item.file).join(", ")})`);
      continue;
    }

    for (const item of REQUIRED) {
      const destDir = join(OUT_DIR, externalId, item.folder);
      await mkdir(destDir, { recursive: true });
      const input = join(masterDir, item.file);

      const detail = await sharp(input)
        .rotate()
        .resize(DETAIL_WIDTH, DETAIL_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: DETAIL_QUALITY, effort: 4 })
        .toBuffer();
      const thumb = await sharp(input)
        .rotate()
        .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY, effort: 4 })
        .toBuffer();

      await writeFile(join(destDir, `${item.name}.webp`), detail);
      await writeFile(join(destDir, `${item.name}-thumb.webp`), thumb);
      written += 1;
      console.log(
        `${externalId}/${item.folder}/${item.name}: detail ${detail.length} bytes, thumb ${thumb.length} bytes`,
      );
    }
  }

  console.log(`Wrote ${written} delivery stills → ${OUT_DIR}`);
}

await main();
