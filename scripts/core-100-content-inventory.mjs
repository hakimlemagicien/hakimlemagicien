#!/usr/bin/env node
/**
 * Inventory for Core 100 exercise content packs.
 * Run: npm run content:core-100-inventory
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const contentRoot = join(root, "src/assets/content/core-100-exercises");
const ids = loadCore100Ids();

const REQUIRED = [
  "stages/stage-a.webp",
  "stages/stage-b.webp",
  "stages/stage-c.webp",
  "mistakes/mistake-01.webp",
  "mistakes/mistake-02.webp",
];

let imagesReady = 0;
let videoReady = 0;
const missingImages = [];
const missingVideo = [];

for (const externalId of ids) {
  const base = join(contentRoot, externalId);
  const missing = REQUIRED.filter((rel) => !existsSync(join(base, rel)));
  if (missing.length === 0) imagesReady++;
  else missingImages.push({ externalId, missing });

  const hasVideo = existsSync(join(base, "video/exercise.mp4"));
  if (hasVideo) videoReady++;
  else missingVideo.push(externalId);
}

console.log(`[core-100-inventory] exercises=${ids.length} images_ready=${imagesReady} video_ready=${videoReady}`);

if (missingImages.length > 0) {
  console.log("\n○ Missing required images:");
  for (const row of missingImages.slice(0, 20)) {
    console.log(`  ${row.externalId}: ${row.missing.join(", ")}`);
  }
  if (missingImages.length > 20) {
    console.log(`  ... +${missingImages.length - 20} more`);
  }
}

if (videoReady === 0) {
  console.log("\n○ No local exercise.mp4 yet — drop files in each exercise's video/ folder.");
} else {
  console.log(`\n✓ ${videoReady} exercises have local video/exercise.mp4`);
}

function loadCore100Ids() {
  const source = join(root, "src/lib/platform/strategy-matrix/config/core-100-external-ids.ts");
  const text = readFileSync(source, "utf8");
  return [...text.matchAll(/"([A-Z]{2}-\d{3})"/g)].map((match) => match[1]);
}
