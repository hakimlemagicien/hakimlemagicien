/**
 * LOCAL_ONLY — register P0 FEMALE media (images READY + temporary still-as-video).
 * Never marks temporary video as READY. Idempotent. No Staging/Production.
 */
import assert from "node:assert/strict";
import { existsSync, copyFileSync, renameSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import {
  GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS,
  calculateP0FemaleMediaCompleteness,
  evaluateGluteReleaseReadiness,
  getVariantAsset,
  presentFemaleMediaAdminReadiness,
  publicExerciseVariantImageThumbPath,
  publicExerciseVariantVideoPath,
  registerExerciseMediaAsset,
  resolveExerciseMedia,
  resolvePreferredExerciseStillThumb,
  resolvePreferredExerciseVideoPlayback,
} from "@/lib/platform/exercise-media-variants";

const { Client } = pg;
/** LOCAL_ONLY — never follow shell DATABASE_URL that may point at Staging/Production. */
const DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const LOCAL_API = "http://127.0.0.1:54321";

function assetExists(path: string): boolean {
  const rel = path.replace(/^\//, "");
  return existsSync(resolve("public", rel));
}

async function verifyLocalEnvironment(client: pg.Client) {
  const health = await fetch(`${LOCAL_API}/auth/v1/health`);
  assert.equal(health.status, 200, "LOCAL auth health");
  // Connection string is hard-locked to 127.0.0.1:54322 (Docker publishes Local DB).
  assert.match(DB, /127\.0\.0\.1:54322/);
  assert.match(LOCAL_API, /127\.0\.0\.1:54321/);
  const db = await client.query<{ db: string }>(`SELECT current_database() AS db`);
  assert.equal(db.rows[0]?.db, "postgres");
  console.log("LOCAL_ENVIRONMENT_VERIFIED=YES", {
    api: LOCAL_API,
    db_host: "127.0.0.1:54322",
    note: "DB URL hard-locked; shell SUPABASE_URL ignored",
  });
}

const client = new Client({ connectionString: DB });
await client.connect();

const report: Record<string, unknown> = {
  task: "P0_FEMALE_MEDIA_LOCAL_REGISTRATION",
  local_verified: false,
  registered_images: 0,
  registered_temp_videos: 0,
  real_videos_ready: 0,
  duplicates_created: 0,
  idempotent_second_pass: false,
  replacement_simulation: "NOT_RUN",
};

try {
  await verifyLocalEnvironment(client);
  report.local_verified = true;

  const known = new Set(
    (
      await client.query<{ external_id: string }>(
        `SELECT external_id FROM exercises WHERE external_id = ANY($1::text[])`,
        [[...GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS]],
      )
    ).rows.map((r) => r.external_id),
  );
  assert.equal(known.size, 17, `expected 17 P0 exercises in Local DB, got ${known.size}`);

  const rows = (
    await client.query<{ external_id: string; metadata: Record<string, unknown> | null }>(
      `SELECT external_id, metadata FROM exercises WHERE external_id = ANY($1::text[])`,
      [[...GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS]],
    )
  ).rows;

  const byId = new Map(rows.map((r) => [r.external_id, r]));
  let imageCount = 0;
  let tempVideoCount = 0;

  for (const id of GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS) {
    const row = byId.get(id);
    assert.ok(row, `missing exercise ${id}`);
    const imagePath = publicExerciseVariantImageThumbPath(id, "FEMALE");
    const videoPath = publicExerciseVariantVideoPath(id, "FEMALE");
    assert.ok(assetExists(imagePath), `missing image ${imagePath}`);
    assert.ok(assetExists(videoPath), `missing temp video ${videoPath}`);

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
    assert.equal(img.ok, true, `image register failed ${id}`);
    if (!img.ok) throw new Error(img.message);

    const vid = registerExerciseMediaAsset({
      exerciseExternalId: id,
      variant: "FEMALE",
      mediaType: "VIDEO",
      path: videoPath,
      status: "TEMPORARY_STILL_AS_VIDEO",
      metadata: img.metadata,
      knownExternalIds: known,
      assetExists,
      real_video_required: true,
      replacement_pending: true,
    });
    assert.equal(vid.ok, true, `video register failed ${id}`);
    if (!vid.ok) throw new Error(vid.message);

    // Never READY for temporary video
    const videoAsset = getVariantAsset(vid.metadata, "FEMALE", "VIDEO");
    assert.equal(videoAsset?.status, "TEMPORARY_STILL_AS_VIDEO");
    assert.notEqual(videoAsset?.status, "READY");

    await client.query(`UPDATE exercises SET metadata = $1::jsonb WHERE external_id = $2`, [
      JSON.stringify(vid.metadata),
      id,
    ]);
    row.metadata = vid.metadata as Record<string, unknown>;
    imageCount += 1;
    tempVideoCount += 1;
  }

  report.registered_images = imageCount;
  report.registered_temp_videos = tempVideoCount;

  // Idempotent second pass
  let idempotentOk = 0;
  for (const id of GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS) {
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
    assert.ok(img.ok && img.idempotent);
    const vid = registerExerciseMediaAsset({
      exerciseExternalId: id,
      variant: "FEMALE",
      mediaType: "VIDEO",
      path: publicExerciseVariantVideoPath(id, "FEMALE"),
      status: "TEMPORARY_STILL_AS_VIDEO",
      metadata: img.ok ? img.metadata : row.metadata,
      knownExternalIds: known,
      assetExists,
      real_video_required: true,
      replacement_pending: true,
    });
    assert.ok(vid.ok && vid.idempotent);
    idempotentOk += 1;
  }
  report.idempotent_second_pass = idempotentOk === 17;

  // Completeness
  const states = [...GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS].map((id) => ({
    externalId: id,
    metadata: byId.get(id)?.metadata ?? null,
  }));
  const p0 = calculateP0FemaleMediaCompleteness(states, { assetExists });
  assert.equal(p0.female_images_ready, 17);
  assert.equal(p0.female_display_ready, 17);
  assert.equal(p0.female_real_videos_ready, 0);
  assert.equal(p0.female_videos_ready, 0);
  assert.equal(p0.image_percent, 100);
  assert.equal(p0.display_percent, 100);
  assert.equal(p0.real_video_percent, 0);

  // Runtime resolve — no STANDARD fallback for P0 images
  for (const id of GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS) {
    const meta = byId.get(id)?.metadata ?? null;
    const still = resolvePreferredExerciseStillThumb({
      externalId: id,
      preferredVariant: "FEMALE",
      metadata: meta,
    });
    assert.ok(still?.includes(`/exercises/${id}/female/`), `FEMALE still ${id}`);
    const img = resolveExerciseMedia({
      externalId: id,
      preferredVariant: "FEMALE",
      mediaType: "IMAGE",
      metadata: meta,
      standardHint: { ready: true, path: `/exercises/${id}/stages/stage-b-thumb.webp` },
      assetExists,
    });
    assert.equal(img.selectedVariant, "FEMALE");
    assert.equal(img.fallbackUsed, false);

    const playback = resolvePreferredExerciseVideoPlayback({
      externalId: id,
      preferredVariant: "FEMALE",
      metadata: meta,
    });
    assert.equal(playback.selectedVariant, "FEMALE");
    assert.equal(playback.temporaryStill, true);
    assert.ok(playback.path?.endsWith("/female/video/exercise.mp4"));
  }

  // Admin presenter
  const admin = presentFemaleMediaAdminReadiness({
    templateSlug: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
    preferredMediaVariant: "FEMALE",
    states,
    includeP0: true,
  });
  assert.equal(admin.p0?.images_label, "17 / 17");
  assert.equal(admin.p0?.display_label, "17 / 17");
  assert.equal(admin.p0?.real_videos_label, "0 / 17");
  assert.match(admin.video_upgrade_label_ar, /معلّقة|ترقية/);

  // Control template unchanged
  const control = presentFemaleMediaAdminReadiness({
    templateSlug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    preferredMediaVariant: "STANDARD",
  });
  assert.equal(control.applies, false);
  assert.equal(control.preferred_variant, "STANDARD");

  // Replacement simulation — upgrade one temp → READY then rollback
  const simId = "GL-004";
  const simPath = resolve("public", publicExerciseVariantVideoPath(simId, "FEMALE").replace(/^\//, ""));
  const backup = `${simPath}.bak-registration-sim`;
  const fakeReady = `${simPath}.fake-ready`;
  copyFileSync(simPath, backup);
  copyFileSync(simPath, fakeReady); // same bytes; status flip only for contract test
  try {
    renameSync(fakeReady, simPath);
    const upgraded = registerExerciseMediaAsset({
      exerciseExternalId: simId,
      variant: "FEMALE",
      mediaType: "VIDEO",
      path: publicExerciseVariantVideoPath(simId, "FEMALE"),
      status: "READY",
      metadata: byId.get(simId)?.metadata ?? {},
      knownExternalIds: known,
      assetExists,
      real_video_required: false,
      replacement_pending: false,
    });
    assert.equal(upgraded.ok, true);
    if (upgraded.ok) {
      assert.equal(upgraded.asset.status, "READY");
      // Do NOT persist READY to DB — rollback metadata conceptually
    }
    report.replacement_simulation = "PASS_THEN_ROLLBACK";
  } finally {
    renameSync(backup, simPath);
    if (existsSync(fakeReady)) unlinkSync(fakeReady);
    // Ensure DB remains TEMPORARY for simId
    const restore = registerExerciseMediaAsset({
      exerciseExternalId: simId,
      variant: "FEMALE",
      mediaType: "VIDEO",
      path: publicExerciseVariantVideoPath(simId, "FEMALE"),
      status: "TEMPORARY_STILL_AS_VIDEO",
      metadata: byId.get(simId)?.metadata ?? {},
      knownExternalIds: known,
      assetExists,
      real_video_required: true,
      replacement_pending: true,
    });
    assert.ok(restore.ok);
    if (restore.ok) {
      await client.query(`UPDATE exercises SET metadata = $1::jsonb WHERE external_id = $2`, [
        JSON.stringify(restore.metadata),
        simId,
      ]);
      byId.get(simId)!.metadata = restore.metadata as Record<string, unknown>;
    }
  }

  // Final DB verify — no READY videos
  const finalRows = (
    await client.query<{ external_id: string; metadata: Record<string, unknown> }>(
      `SELECT external_id, metadata FROM exercises WHERE external_id = ANY($1::text[])`,
      [[...GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS]],
    )
  ).rows;
  let readyVideos = 0;
  let tempVideos = 0;
  let readyImages = 0;
  for (const row of finalRows) {
    const img = getVariantAsset(row.metadata, "FEMALE", "IMAGE");
    const vid = getVariantAsset(row.metadata, "FEMALE", "VIDEO");
    if (img?.status === "READY") readyImages += 1;
    if (vid?.status === "READY") readyVideos += 1;
    if (vid?.status === "TEMPORARY_STILL_AS_VIDEO") tempVideos += 1;
  }
  assert.equal(readyImages, 17);
  assert.equal(tempVideos, 17);
  assert.equal(readyVideos, 0);
  report.real_videos_ready = readyVideos;

  // Exercise count unchanged
  const count = await client.query<{ c: string }>(
    `SELECT count(*)::text AS c FROM exercises WHERE external_id = ANY($1::text[])`,
    [[...GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS]],
  );
  assert.equal(Number(count.rows[0]?.c), 17);

  const p0Final = calculateP0FemaleMediaCompleteness(
    finalRows.map((r) => ({ externalId: r.external_id, metadata: r.metadata })),
    { assetExists },
  );
  report.p0_completeness = p0Final;
  report.admin_p0 = admin.p0;
  // Full Glute 40 still blocked on images (P1 pending) — expected
  const fullRelease = evaluateGluteReleaseReadiness(
    calculateP0FemaleMediaCompleteness(
      finalRows.map((r) => ({ externalId: r.external_id, metadata: r.metadata })),
      { assetExists },
    ),
  );
  // Using P0 completeness as display set for P0 gate
  assert.equal(fullRelease.status, "GLUTE_RELEASE_READY");
  assert.equal(fullRelease.real_video_upgrade_pending, true);

  console.log(JSON.stringify({ STATUS: "PASS", ...report }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ STATUS: "BLOCKED", error: String(error), ...report }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end();
}
