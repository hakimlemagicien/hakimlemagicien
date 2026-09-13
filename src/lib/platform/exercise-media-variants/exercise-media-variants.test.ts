import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS,
  GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS,
  calculateGluteFemaleMediaCompleteness,
  describeExerciseMediaVariantState,
  evaluateGluteReleaseReadiness,
  preferredMediaVariantFromContract,
  preferredMediaVariantFromTemplateMetadata,
  presentFemaleMediaAdminReadiness,
  publicExerciseVariantImageThumbPath,
  publicExerciseVariantVideoPath,
  registerExerciseMediaAsset,
  resolveExerciseListStill,
  resolveExerciseMedia,
  toExerciseMediaVariantPreference,
} from "./index";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";

const known = new Set(GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS);

// --- Preference from contract (no goal hardcode) ---
assert.equal(
  preferredMediaVariantFromContract({
    media_preference: {
      preferred_demonstrator: "FEMALE",
      preferred_media_variant: "FEMALE",
      duplicates_exercise_identity: false,
    },
  }),
  "FEMALE",
  "Glute preference → FEMALE",
);
assert.equal(
  preferredMediaVariantFromContract({
    media_preference: {
      preferred_demonstrator: "STANDARD",
      preferred_media_variant: "STANDARD",
      duplicates_exercise_identity: false,
    },
  }),
  "STANDARD",
  "control preference → STANDARD",
);
assert.equal(toExerciseMediaVariantPreference("FEMALE"), "FEMALE");
assert.equal(toExerciseMediaVariantPreference("STANDARD"), "STANDARD");

// --- STANDARD regression: existing stage thumbs still resolve ---
const gl001Standard = getExerciseStageListThumb("GL-001");
assert.ok(gl001Standard, "STANDARD GL-001 stage thumb exists");
assert.ok(existsSync(resolve("public", gl001Standard.replace(/^\//, ""))), "STANDARD file on disk");

const stdStill = resolveExerciseListStill({
  externalId: "GL-001",
  preferredVariant: "STANDARD",
  standardStillUrl: gl001Standard,
});
assert.equal(stdStill.outcome, "READY");
assert.equal(stdStill.selectedVariant, "STANDARD");
assert.equal(stdStill.fallbackUsed, false);

// --- FEMALE preferred + missing + STANDARD ready → STANDARD fallback ---
const femaleFallback = resolveExerciseListStill({
  externalId: "GL-001",
  preferredVariant: "FEMALE",
  standardStillUrl: gl001Standard,
});
assert.equal(femaleFallback.outcome, "READY");
assert.equal(femaleFallback.selectedVariant, "STANDARD");
assert.equal(femaleFallback.fallbackUsed, true);
assert.equal(femaleFallback.url, gl001Standard);

// --- both missing → MEDIA_MISSING (no broken url) ---
const missing = resolveExerciseMedia({
  externalId: "WU-001",
  preferredVariant: "FEMALE",
  mediaType: "IMAGE",
  metadata: {},
  standardHint: { ready: false },
});
assert.equal(missing.outcome, "MEDIA_MISSING");
assert.equal(missing.path, null);
assert.equal(missing.url, null);
assert.equal(missing.selectedVariant, null);

// --- FEMALE ready wins ---
const withFemale = registerExerciseMediaAsset({
  exerciseExternalId: "GL-001",
  variant: "FEMALE",
  mediaType: "IMAGE",
  path: publicExerciseVariantImageThumbPath("GL-001", "FEMALE"),
  status: "READY",
  knownExternalIds: known,
  assetExists: () => true,
});
assert.equal(withFemale.ok, true);
if (!withFemale.ok) throw new Error("register failed");
const femaleHit = resolveExerciseListStill({
  externalId: "GL-001",
  preferredVariant: "FEMALE",
  metadata: withFemale.metadata,
  standardStillUrl: gl001Standard,
});
assert.equal(femaleHit.selectedVariant, "FEMALE");
assert.equal(femaleHit.fallbackUsed, false);
assert.equal(femaleHit.path, publicExerciseVariantImageThumbPath("GL-001", "FEMALE"));

// --- placeholder ≠ READY ---
const placeholderResolve = resolveExerciseMedia({
  externalId: "GL-001",
  preferredVariant: "FEMALE",
  mediaType: "VIDEO",
  metadata: {
    media_variants: {
      FEMALE: {
        VIDEO: {
          media_type: "VIDEO",
          status: "PLACEHOLDER",
          path: "/exercises/placeholders/default-exercise.mp4",
        },
      },
    },
  },
  standardHint: { ready: false },
});
assert.equal(placeholderResolve.outcome, "MEDIA_MISSING");
assert.match(placeholderResolve.reason, /PLACEHOLDER|MISSING/);

// --- Completeness initial = 0 ---
const emptyCompleteness = calculateGluteFemaleMediaCompleteness([]);
assert.equal(emptyCompleteness.required_exercises, 40);
assert.equal(emptyCompleteness.female_images_ready, 0);
assert.equal(emptyCompleteness.female_display_ready, 0);
assert.equal(emptyCompleteness.female_videos_ready, 0);
assert.equal(emptyCompleteness.female_real_videos_ready, 0);
assert.equal(emptyCompleteness.fully_complete_exercises, 0);
assert.equal(emptyCompleteness.image_percent, 0);
assert.equal(emptyCompleteness.display_percent, 0);
assert.equal(emptyCompleteness.video_percent, 0);
assert.equal(emptyCompleteness.real_video_percent, 0);
assert.equal(emptyCompleteness.full_percent, 0);

const release = evaluateGluteReleaseReadiness(emptyCompleteness);
assert.equal(release.status, "BLOCKED_BY_FEMALE_MEDIA");
assert.equal(release.real_video_upgrade_pending, true);
assert.equal(release.runtime_fallback_does_not_satisfy_release, true);

// Runtime fallback success must NOT flip release
assert.equal(femaleFallback.fallbackUsed, true);
assert.equal(evaluateGluteReleaseReadiness(emptyCompleteness).status, "BLOCKED_BY_FEMALE_MEDIA");

// --- counters after one full exercise ---
const imgReg = registerExerciseMediaAsset({
  exerciseExternalId: "GL-001",
  variant: "FEMALE",
  mediaType: "IMAGE",
  path: publicExerciseVariantImageThumbPath("GL-001", "FEMALE"),
  status: "READY",
  knownExternalIds: known,
  assetExists: () => true,
});
assert.ok(imgReg.ok);
const vidReg = registerExerciseMediaAsset({
  exerciseExternalId: "GL-001",
  variant: "FEMALE",
  mediaType: "VIDEO",
  path: publicExerciseVariantVideoPath("GL-001", "FEMALE"),
  status: "READY",
  metadata: imgReg.ok ? imgReg.metadata : {},
  knownExternalIds: known,
  assetExists: () => true,
});
assert.ok(vidReg.ok);
const partial = calculateGluteFemaleMediaCompleteness([
  { externalId: "GL-001", metadata: vidReg.ok ? vidReg.metadata : {} },
]);
assert.equal(partial.female_images_ready, 1);
assert.equal(partial.female_display_ready, 1);
assert.equal(partial.female_videos_ready, 1);
assert.equal(partial.female_real_videos_ready, 1);
assert.equal(partial.fully_complete_exercises, 1);
assert.equal(partial.image_percent, 2.5);
assert.equal(evaluateGluteReleaseReadiness(partial).status, "BLOCKED_BY_FEMALE_MEDIA");

// Temporary still-as-video is playable but NOT real-video ready / NOT release video
const tempVid = registerExerciseMediaAsset({
  exerciseExternalId: "GL-004",
  variant: "FEMALE",
  mediaType: "VIDEO",
  path: publicExerciseVariantVideoPath("GL-004", "FEMALE"),
  status: "TEMPORARY_STILL_AS_VIDEO",
  knownExternalIds: known,
  assetExists: () => true,
  real_video_required: true,
  replacement_pending: true,
});
assert.ok(tempVid.ok);
const tempResolve = resolveExerciseMedia({
  externalId: "GL-004",
  preferredVariant: "FEMALE",
  mediaType: "VIDEO",
  metadata: tempVid.ok ? tempVid.metadata : {},
  standardHint: { ready: false },
  assetExists: () => true,
});
assert.equal(tempResolve.outcome, "READY");
assert.equal(tempResolve.selectedVariant, "FEMALE");
assert.match(tempResolve.reason, /TEMPORARY_STILL/);
const tempOnlyCompleteness = calculateGluteFemaleMediaCompleteness([
  { externalId: "GL-004", metadata: tempVid.ok ? tempVid.metadata : {} },
]);
assert.equal(tempOnlyCompleteness.female_videos_ready, 0);
assert.equal(tempOnlyCompleteness.female_real_videos_ready, 0);

// --- Import validation ---
assert.equal(
  registerExerciseMediaAsset({
    exerciseExternalId: "FAKE-999",
    variant: "FEMALE",
    mediaType: "IMAGE",
    path: "/exercises/FAKE-999/female/stages/stage-b-thumb.webp",
    status: "READY",
    knownExternalIds: known,
    assetExists: () => true,
  }).ok,
  false,
  "unknown exercise rejected",
);

assert.equal(
  registerExerciseMediaAsset({
    exerciseExternalId: "GL-001",
    variant: "FEMALE",
    mediaType: "IMAGE",
    path: "/exercises/OTHER/female/stages/stage-b-thumb.webp",
    status: "READY",
    knownExternalIds: known,
    assetExists: () => true,
  }).ok,
  false,
  "wrong exercise path rejected",
);

assert.equal(
  registerExerciseMediaAsset({
    exerciseExternalId: "GL-001",
    variant: "FEMALE",
    mediaType: "IMAGE",
    path: publicExerciseVariantImageThumbPath("GL-001", "FEMALE"),
    status: "READY",
    knownExternalIds: known,
    assetExists: () => false,
  }).ok,
  false,
  "missing file marked READY rejected",
);

assert.equal(
  registerExerciseMediaAsset({
    exerciseExternalId: "GL-001",
    variant: "FEMALE",
    mediaType: "IMAGE",
    path: "/exercises/placeholders/default.webp",
    status: "READY",
    knownExternalIds: known,
    assetExists: () => true,
  }).ok,
  false,
  "placeholder path READY rejected",
);

// Idempotent duplicate
const first = registerExerciseMediaAsset({
  exerciseExternalId: "BA-023",
  variant: "FEMALE",
  mediaType: "IMAGE",
  path: publicExerciseVariantImageThumbPath("BA-023", "FEMALE"),
  status: "READY",
  knownExternalIds: known,
  assetExists: () => true,
});
assert.ok(first.ok);
const second = registerExerciseMediaAsset({
  exerciseExternalId: "BA-023",
  variant: "FEMALE",
  mediaType: "IMAGE",
  path: publicExerciseVariantImageThumbPath("BA-023", "FEMALE"),
  status: "READY",
  metadata: first.ok ? first.metadata : {},
  knownExternalIds: known,
  assetExists: () => true,
});
assert.ok(second.ok);
if (second.ok) assert.equal(second.idempotent, true);

// Conflicting path
const conflict = registerExerciseMediaAsset({
  exerciseExternalId: "BA-023",
  variant: "FEMALE",
  mediaType: "IMAGE",
  path: "/exercises/BA-023/female/stages/stage-a-thumb.webp",
  status: "READY",
  metadata: first.ok ? first.metadata : {},
  knownExternalIds: known,
  assetExists: () => true,
});
assert.equal(conflict.ok, false);

// Manifest 40/40 IDs
const manifest = JSON.parse(
  readFileSync(resolve("docs/data/glute-female-media-manifest-v1.json"), "utf8"),
) as { unique_exercise_ids: string[] };
assert.equal(manifest.unique_exercise_ids.length, 40);
assert.deepEqual(
  [...manifest.unique_exercise_ids].sort(),
  [...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS].sort(),
);

// Admin readiness presentation
const adminGlute = presentFemaleMediaAdminReadiness({
  templateSlug: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
  preferredMediaVariant: "FEMALE",
});
assert.equal(adminGlute.applies, true);
assert.equal(adminGlute.images_label, "0 / 40");
assert.equal(adminGlute.display_label, "0 / 40");
assert.equal(adminGlute.videos_label, "0 / 40");
assert.equal(adminGlute.real_videos_label, "0 / 40");
assert.equal(adminGlute.full_label, "0 / 40");
assert.match(adminGlute.release_label_ar, /محظور/);
assert.match(adminGlute.video_upgrade_label_ar, /معلّقة|ترقية/);
assert.equal(adminGlute.p0?.images_label, "0 / 17");
assert.equal(adminGlute.p0?.real_videos_label, "0 / 17");

const adminControl = presentFemaleMediaAdminReadiness({
  templateSlug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
  preferredMediaVariant: "STANDARD",
});
assert.equal(adminControl.applies, false);
assert.equal(adminControl.preferred_variant, "STANDARD");

// State descriptor
const state = describeExerciseMediaVariantState({
  externalId: "GL-001",
  standardImageReady: true,
  standardVideoReady: false,
});
assert.equal(state.STANDARD_IMAGE, "READY_HINT");
assert.equal(state.FEMALE_IMAGE, "MISSING");
assert.equal(state.FEMALE_VIDEO, "MISSING");

// P0 female thumbs may exist on disk after media production — do not invent READY without metadata.
let femaleOnDisk = 0;
for (const id of GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS) {
  const img = resolve("public", publicExerciseVariantImageThumbPath(id, "FEMALE").replace(/^\//, ""));
  if (existsSync(img)) femaleOnDisk += 1;
}
assert.equal(femaleOnDisk, 17, "P0 female thumbs present on disk");
// Non-P0 glute IDs must not suddenly become READY via empty metadata resolve
const nonP0 = GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS.find(
  (id) => !(GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS as readonly string[]).includes(id),
)!;
const nonP0Still = resolveExerciseListStill({
  externalId: nonP0,
  preferredVariant: "FEMALE",
  metadata: {},
  standardStillUrl: getExerciseStageListThumb(nonP0),
});
if (nonP0Still.selectedVariant === "FEMALE") {
  assert.fail("non-P0 must not resolve FEMALE without metadata registration");
}

// Template metadata preference helper (invalid contract → STANDARD)
assert.equal(preferredMediaVariantFromTemplateMetadata({}), "STANDARD");

console.log("exercise-media-variants.test.ts: PASS");
