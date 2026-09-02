#!/usr/bin/env node
/**
 * Bootstrap Core 100 content folders and import existing public exercise images.
 *
 * Creates:
 *   src/assets/content/core-100-exercises/{EXTERNAL_ID}/
 *     stages/
 *     mistakes/
 *     anatomy/
 *     video/          ← drop exercise.mp4 + instructions.mp4 here later
 *
 * Run once after clone, or when adding a new Core 100 slot:
 *   npm run content:bootstrap-core-100
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const ids = loadCore100Ids();
const contentRoot = join(root, "src/assets/content/core-100-exercises");
const publicRoot = join(root, "public/exercises");

const SUBDIRS = ["stages", "mistakes", "anatomy", "video"];
const REQUIRED_RELATIVE = [
  "stages/stage-a.webp",
  "stages/stage-a-thumb.webp",
  "stages/stage-b.webp",
  "stages/stage-b-thumb.webp",
  "stages/stage-c.webp",
  "stages/stage-c-thumb.webp",
  "mistakes/mistake-01.webp",
  "mistakes/mistake-01-thumb.webp",
  "mistakes/mistake-02.webp",
  "mistakes/mistake-02-thumb.webp",
  "anatomy/anatomy.webp",
  "anatomy/anatomy-thumb.webp",
];

let created = 0;
let imported = 0;
const manifest = [];

for (const externalId of ids) {
  const exerciseDir = join(contentRoot, externalId);
  for (const sub of SUBDIRS) {
    mkdirSync(join(exerciseDir, sub), { recursive: true });
  }

  const videoReadme = join(exerciseDir, "video", "README.md");
  if (!existsSync(videoReadme)) {
    writeFileSync(
      videoReadme,
      [
        `# ${externalId} — فيديو`,
        "",
        "ضع هنا:",
        "- `exercise.mp4` — فيديو الأداء",
        "- `instructions.mp4` — فيديو التعليمات (اختياري)",
        "",
        `Storage بعد الرفع: \`exercises/${externalId}/exercise.mp4\``,
        "",
      ].join("\n"),
      "utf8",
    );
  }

  created++;

  const publicDir = join(publicRoot, externalId);
  const filesPresent = [];
  const filesMissing = [];

  for (const rel of REQUIRED_RELATIVE) {
    const fromPublic = join(publicDir, rel);
    const toContent = join(exerciseDir, rel);

    if (existsSync(fromPublic)) {
      if (!existsSync(toContent)) {
        cpSync(fromPublic, toContent);
        imported++;
      }
      filesPresent.push(rel);
    } else {
      filesMissing.push(rel);
    }
  }

  manifest.push({
    externalId,
    repoDir: `src/assets/content/core-100-exercises/${externalId}`,
    imagesReady: filesMissing.length === 0,
    imageCount: filesPresent.length,
    missingImages: filesMissing,
    videoReady: existsSync(join(exerciseDir, "video/exercise.mp4")),
  });
}

writeFileSync(
  join(contentRoot, "MANIFEST.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: ids.length,
      exercises: manifest,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(
  `[bootstrap-core-100] folders=${created} imported_files=${imported} manifest=src/assets/content/core-100-exercises/MANIFEST.json`,
);

function loadCore100Ids() {
  const source = join(root, "src/lib/platform/strategy-matrix/config/core-100-external-ids.ts");
  const text = readFileSync(source, "utf8");
  return [...text.matchAll(/"([A-Z]{2}-\d{3})"/g)].map((match) => match[1]);
}
