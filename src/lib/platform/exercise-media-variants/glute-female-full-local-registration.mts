/**
 * LOCAL_ONLY — register all 40 Glute FEMALE images from production package.
 * Preserves TEMPORARY_STILL_AS_VIDEO on P0 exercises that already have it.
 * Never marks temp video as READY. Idempotent. No Staging/Production.
 */
import assert from "node:assert/strict";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import pg from "pg";
import {
  GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS,
  GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS,
  calculateGluteFemaleMediaCompleteness,
  evaluateGluteReleaseReadiness,
  getVariantAsset,
  presentFemaleMediaAdminReadiness,
  preferredMediaVariantFromContract,
  publicExerciseVariantImageThumbPath,
  publicExerciseVariantVideoPath,
  registerExerciseMediaAsset,
  resolveExerciseMedia,
  resolvePreferredExerciseStillThumb,
} from "@/lib/platform/exercise-media-variants";

const { Client } = pg;
const DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const LOCAL_API = "http://127.0.0.1:54321";

const PACKAGE_ZIP =
  "/Users/hakimlemagicien/Documents/Hakim Coaching Platform/Exercise Library/GLUTE_FEMALE_IMAGE_FULL_PRODUCTION_PACKAGE.zip";
const PACKAGE_ROOT = resolve(".tmp/glute-female-full/GLUTE_FEMALE_IMAGE_FULL_PRODUCTION_PACKAGE");
const IMAGES_DIR = join(PACKAGE_ROOT, "GLUTE_FEMALE_IMAGES_COMPLETE");

function assetExists(path: string): boolean {
  const rel = path.replace(/^\//, "");
  return existsSync(resolve("public", rel));
}

function isTemporaryStillVideoOnDisk(externalId: string): boolean {
  const still = resolve(
    "public",
    `exercises/${externalId}/female/video/exercise.still.png`,
  );
  const mp4 = resolve("public", `exercises/${externalId}/female/video/exercise.mp4`);
  return existsSync(still) && existsSync(mp4);
}

async function verifyLocalEnvironment(client: pg.Client) {
  const health = await fetch(`${LOCAL_API}/auth/v1/health`);
  assert.equal(health.status, 200, "LOCAL auth health");
  assert.match(DB, /127\.0\.0\.1:54322/);
  assert.match(LOCAL_API, /127\.0\.0\.1:54321/);
  const db = await client.query<{ db: string }>(`SELECT current_database() AS db`);
  assert.equal(db.rows[0]?.db, "postgres");
  console.log("LOCAL_ENVIRONMENT_VERIFIED=YES", { api: LOCAL_API, db_host: "127.0.0.1:54322" });
}

async function installImagesFromPackage() {
  assert.ok(existsSync(join(PACKAGE_ROOT, "master-manifest.json")), "package not extracted");
  mkdirSync(resolve(".tmp/glute-female-full/masters"), { recursive: true });
  const { default: sharp } = await import("sharp");
  let installed = 0;
  for (const id of GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS) {
    const src = join(IMAGES_DIR, id, `${id}_female.png`);
    assert.ok(existsSync(src), `missing package PNG ${src}`);
    const outDir = resolve("public/exercises", id, "female/stages");
    mkdirSync(outDir, { recursive: true });
    const stageB = join(outDir, "stage-b.webp");
    const thumb = join(outDir, "stage-b-thumb.webp");
    await sharp(src).resize(1280, null, { withoutEnlargement: true }).webp({ quality: 82 }).toFile(stageB);
    await sharp(src).resize(320, 320, { fit: "inside" }).webp({ quality: 75 }).toFile(thumb);
    copyFileSync(src, resolve(".tmp/glute-female-full/masters", `${id}-female.png`));
    installed += 1;
  }
  return installed;
}

const client = new Client({ connectionString: DB });
await client.connect();

const report: Record<string, unknown> = {
  task: "GLUTE_FEMALE_MEDIA_FULL_LOCAL_REGISTRATION",
  local_verified: false,
  images_installed: 0,
  female_images_registered: 0,
  temporary_still_as_video_count: 0,
  real_videos_ready: 0,
  broken_references: 0,
  standard_fallback_count: 0,
  duplicates_created: 0,
  idempotent_second_pass: false,
};

try {
  await verifyLocalEnvironment(client);
  report.local_verified = true;

  // Package must contain 40 unique IDs matching Glute set
  assert.equal(GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS.length, 40);

  report.images_installed = await installImagesFromPackage();
  assert.equal(report.images_installed, 40);

  const known = new Set(
    (
      await client.query<{ external_id: string }>(
        `SELECT external_id FROM exercises WHERE external_id = ANY($1::text[])`,
        [[...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS]],
      )
    ).rows.map((r) => r.external_id),
  );
  assert.equal(known.size, 40, `expected 40 exercises in Local DB, got ${known.size}`);
  report.broken_references = 40 - known.size;

  const rows = (
    await client.query<{ external_id: string; metadata: Record<string, unknown> | null }>(
      `SELECT external_id, metadata FROM exercises WHERE external_id = ANY($1::text[])`,
      [[...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS]],
    )
  ).rows;
  const byId = new Map(rows.map((r) => [r.external_id, r]));

  let imageCount = 0;
  let tempVideoCount = 0;

  for (const id of GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS) {
    const row = byId.get(id);
    assert.ok(row, `missing exercise ${id}`);
    const imagePath = publicExerciseVariantImageThumbPath(id, "FEMALE");
    assert.ok(assetExists(imagePath), `missing installed image ${imagePath}`);

    const img = registerExerciseMediaAsset({
      exerciseExternalId: id,
      variant: "FEMALE",
      mediaType: "IMAGE",
      path: imagePath,
      status: "READY",
      metadata: row.metadata,
      knownExternalIds: known,
      assetExists,
    });
    assert.equal(img.ok, true, `image register failed ${id}: ${!img.ok ? img.message : ""}`);
    if (!img.ok) throw new Error(img.message);

    let metadata = img.metadata;

    // Preserve TEMPORARY_STILL_AS_VIDEO only when file exists (P0 batch)
    if (isTemporaryStillVideoOnDisk(id)) {
      const videoPath = publicExerciseVariantVideoPath(id, "FEMALE");
      const vid = registerExerciseMediaAsset({
        exerciseExternalId: id,
        variant: "FEMALE",
        mediaType: "VIDEO",
        path: videoPath,
        status: "TEMPORARY_STILL_AS_VIDEO",
        metadata,
        knownExternalIds: known,
        assetExists,
        real_video_required: true,
        replacement_pending: true,
      });
      assert.equal(vid.ok, true, `temp video register failed ${id}`);
      if (!vid.ok) throw new Error(vid.message);
      metadata = vid.metadata;
      tempVideoCount += 1;
      assert.notEqual(getVariantAsset(metadata, "FEMALE", "VIDEO")?.status, "READY");
    }

    await client.query(`UPDATE exercises SET metadata = $1::jsonb WHERE external_id = $2`, [
      JSON.stringify(metadata),
      id,
    ]);
    row.metadata = metadata as Record<string, unknown>;
    imageCount += 1;
  }

  report.female_images_registered = imageCount;
  report.temporary_still_as_video_count = tempVideoCount;

  // Idempotent second pass
  let idempotentOk = 0;
  for (const id of GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS) {
    const row = byId.get(id)!;
    const img = registerExerciseMediaAsset({
      exerciseExternalId: id,
      variant: "FEMALE",
      mediaType: "IMAGE",
      path: publicExerciseVariantImageThumbPath(id, "FEMALE"),
      status: "READY",
      metadata: row.metadata,
      knownExternalIds: known,
      assetExists,
    });
    assert.ok(img.ok && img.idempotent, `idempotent image fail ${id}`);
    idempotentOk += 1;
  }
  report.idempotent_second_pass = idempotentOk === 40;

  const states = [...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS].map((id) => ({
    externalId: id,
    metadata: byId.get(id)?.metadata ?? null,
  }));

  const completeness = calculateGluteFemaleMediaCompleteness(states, { assetExists });
  assert.equal(completeness.female_images_ready, 40);
  assert.equal(completeness.female_display_ready, 40);
  assert.equal(completeness.image_percent, 100);
  assert.equal(completeness.display_percent, 100);
  report.completeness = completeness;

  const release = evaluateGluteReleaseReadiness(completeness);
  assert.equal(release.status, "GLUTE_RELEASE_READY");
  assert.equal(release.real_video_upgrade_pending, true);

  // Resolver — no STANDARD fallback when FEMALE image registered
  let fallbackCount = 0;
  for (const id of GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS) {
    const meta = byId.get(id)?.metadata ?? null;
    const resolved = resolveExerciseMedia({
      externalId: id,
      preferredVariant: "FEMALE",
      mediaType: "IMAGE",
      metadata: meta,
      standardHint: { ready: true, path: `/exercises/${id}/stages/stage-b-thumb.webp` },
      assetExists,
    });
    if (resolved.fallbackUsed || resolved.selectedVariant !== "FEMALE") {
      fallbackCount += 1;
    }
    const still = resolvePreferredExerciseStillThumb({
      externalId: id,
      preferredVariant: "FEMALE",
      metadata: meta,
    });
    assert.ok(still?.includes(`/exercises/${id}/female/`), `FEMALE still missing ${id}`);
  }
  report.standard_fallback_count = fallbackCount;
  assert.equal(fallbackCount, 0);

  // Glute template preference
  for (const slug of [
    "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
    "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
  ]) {
    const tpl = (
      await client.query<{ metadata: Record<string, unknown> }>(
        `SELECT metadata FROM program_templates WHERE slug = $1 AND archived_at IS NULL LIMIT 1`,
        [slug],
      )
    ).rows[0];
    assert.ok(tpl, `template ${slug} missing`);
    const pref = preferredMediaVariantFromContract(
      (tpl.metadata as { template_contract?: unknown })?.template_contract as Parameters<
        typeof preferredMediaVariantFromContract
      >[0],
    );
    assert.equal(pref, "FEMALE", `${slug} must prefer FEMALE`);
  }
  report.glute_foundation_runtime = "PASS";
  report.glute_progress_runtime = "PASS";

  // Admin readiness
  const admin = presentFemaleMediaAdminReadiness({
    templateSlug: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
    preferredMediaVariant: "FEMALE",
    states,
    includeP0: true,
  });
  assert.equal(admin.images_label, "40 / 40");
  assert.equal(admin.display_label, "40 / 40");
  assert.equal(admin.real_videos_label, "0 / 40");
  assert.match(admin.video_upgrade_label_ar, /معلّقة|ترقية/);
  report.admin_readiness = admin;

  // Control template
  const control = presentFemaleMediaAdminReadiness({
    templateSlug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    preferredMediaVariant: "STANDARD",
  });
  assert.equal(control.applies, false);
  report.control_template_regression = "PASS";

  // Final DB counts
  const finalRows = (
    await client.query<{ external_id: string; metadata: Record<string, unknown> }>(
      `SELECT external_id, metadata FROM exercises WHERE external_id = ANY($1::text[])`,
      [[...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS]],
    )
  ).rows;
  let readyImages = 0;
  let readyVideos = 0;
  let tempVideos = 0;
  for (const row of finalRows) {
    const img = getVariantAsset(row.metadata, "FEMALE", "IMAGE");
    const vid = getVariantAsset(row.metadata, "FEMALE", "VIDEO");
    if (img?.status === "READY") readyImages += 1;
    if (vid?.status === "READY") readyVideos += 1;
    if (vid?.status === "TEMPORARY_STILL_AS_VIDEO") tempVideos += 1;
  }
  assert.equal(readyImages, 40);
  assert.equal(readyVideos, 0);
  assert.equal(tempVideos, tempVideoCount);
  report.real_videos_ready = readyVideos;

  const exerciseCount = await client.query<{ c: string }>(
    `SELECT count(*)::text AS c FROM exercises WHERE external_id = ANY($1::text[])`,
    [[...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS]],
  );
  assert.equal(Number(exerciseCount.rows[0]?.c), 40);

  report.glute_female_media_v1_local_ready = true;
  report.p0_temp_preserved = tempVideoCount === GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS.length;

  console.log(JSON.stringify({ STATUS: "PASS", ...report }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ STATUS: "BLOCKED", error: String(error), ...report }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end();
}
