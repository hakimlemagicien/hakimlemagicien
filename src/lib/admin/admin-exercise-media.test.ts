import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  EXERCISE_THUMBNAIL_MAX_BYTES,
  EXERCISE_VIDEO_MAX_BYTES,
  canonicalPathForAsset,
  isCanonicalExerciseMediaPath,
  replaceConfirmCopy,
  thumbnailStatusFromPath,
  validateExerciseMediaFile,
  videoStatusLabel,
} from "./admin-exercise-media-contract";
import { resolveAdminExerciseListThumbSrc } from "./admin-exercise-media";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const mp4 = { name: "clip.mp4", type: "video/mp4", size: 1024 } as File;
const empty = { name: "clip.mp4", type: "video/mp4", size: 0 } as File;
const hugeVideo = { name: "clip.mp4", type: "video/mp4", size: EXERCISE_VIDEO_MAX_BYTES + 1 } as File;
const webm = { name: "clip.webm", type: "video/webm", size: 1024 } as File;
const png = { name: "shot.png", type: "image/png", size: 2048 } as File;
const gif = { name: "shot.gif", type: "image/gif", size: 2048 } as File;
const hugeImg = { name: "shot.png", type: "image/png", size: EXERCISE_THUMBNAIL_MAX_BYTES + 1 } as File;

assert(validateExerciseMediaFile(mp4, "exercise_video") === null, "T1 valid mp4");
assert(validateExerciseMediaFile(mp4, "instructions_video") === null, "T8 instructions same video rules");
assert(validateExerciseMediaFile(png, "thumbnail") === null, "T9 valid png");
assert(validateExerciseMediaFile(empty, "exercise_video")?.code === "empty_file", "empty rejected");
assert(validateExerciseMediaFile(hugeVideo, "exercise_video")?.code === "too_large", "T17 oversized video");
assert(validateExerciseMediaFile(hugeImg, "thumbnail")?.code === "too_large", "T17 oversized image");
assert(validateExerciseMediaFile(webm, "exercise_video")?.code === "invalid_type", "T15 invalid video");
assert(validateExerciseMediaFile(gif, "thumbnail")?.code === "invalid_type", "T16 invalid image");

assert(canonicalPathForAsset("CH-001", "exercise_video") === "exercises/CH-001/exercise.mp4", "T5 path from id");
assert(canonicalPathForAsset("ch-001", "exercise_video") === "exercises/CH-001/exercise.mp4", "id normalized");
assert(canonicalPathForAsset("CH-001", "instructions_video") === "exercises/CH-001/instructions.mp4", "instructions path");
assert(canonicalPathForAsset("CH-001", "thumbnail") === "exercises/CH-001/thumbnail.webp", "thumb path");
assert(isCanonicalExerciseMediaPath("CH-001", "exercises/CH-001/exercise.mp4", "exercise_video"), "canonical ok");
assert(!isCanonicalExerciseMediaPath("CH-001", "exercises/OTHER/exercise.mp4", "exercise_video"), "T14 no arbitrary path");
assert(!isCanonicalExerciseMediaPath("CH-001", "../secret.mp4", "exercise_video"), "no traversal");

assert(replaceConfirmCopy("CH-001", "exercise_video").body.includes("CH-001"), "confirm keeps id");
assert(replaceConfirmCopy("CH-001", "exercise_video").body.includes("نفس التمرين"), "confirm keeps identity");
assert(videoStatusLabel("ready") === "جاهز", "arabic ready");
assert(thumbnailStatusFromPath(null) === "missing", "T12 missing thumb");
assert(thumbnailStatusFromPath("exercises/CH-001/thumbnail.webp") === "ready", "thumb ready from path");

assert(
  resolveAdminExerciseListThumbSrc({
    externalId: "CH-001",
    thumbnailPath: null,
    signedUrls: {},
    storageFetchDone: true,
  }) === "/exercises/CH-001/stages/stage-b-thumb.webp",
  "T11 stage still fallback when no db thumb",
);
assert(
  resolveAdminExerciseListThumbSrc({
    externalId: "CH-001",
    thumbnailPath: "exercises/CH-001/thumbnail.webp",
    signedUrls: { "exercises/CH-001/thumbnail.webp": "https://signed.example/thumb.webp" },
    storageFetchDone: true,
  }) === "https://signed.example/thumb.webp",
  "storage override wins over stage still",
);
assert(
  resolveAdminExerciseListThumbSrc({
    externalId: "CH-001",
    thumbnailPath: "exercises/CH-001/thumbnail.webp",
    signedUrls: {},
    storageFetchDone: false,
  }) === null,
  "wait for signed url before fallback",
);
assert(
  resolveAdminExerciseListThumbSrc({
    externalId: "BI-001",
    thumbnailPath: null,
    signedUrls: {},
    storageFetchDone: true,
  }) === "/exercises/BI-001/stages/stage-b-thumb.webp",
  "Core 100 list thumb works without pilot guide registry",
);
assert(
  resolveAdminExerciseListThumbSrc({
    externalId: "MO-001",
    thumbnailPath: null,
    signedUrls: {},
    storageFetchDone: true,
  }) === null,
  "non-Core-100 without storage thumb stays empty until asset created",
);

const manager = readFileSync(resolve(process.cwd(), "src/components/admin/libraries/ExerciseLibraryManager.tsx"), "utf8");
assert(manager.includes("resolveAdminExerciseListThumbSrc"), "T11 list thumbnail resolver");
assert(manager.includes("fetchResolvedExerciseMediaUrl"), "detail preview import");
assert(manager.includes("ExerciseListThumb"), "T11 list thumbnail component");
assert(manager.includes("ExerciseMediaPanel"), "media panel");
assert(manager.includes("cc-exercise-card"), "T21 mobile card");
assert(!manager.includes("htmlFor=\"video_path\""), "T22 no manual video path field");
assert(manager.includes("debouncedQuery"), "T18 search preserved");
assert(manager.includes("p_muscle") || manager.includes("muscle:"), "T19 filters preserved");
assert(manager.includes("AdminPagination"), "T20 pagination preserved");

const panel = readFileSync(resolve(process.cwd(), "src/components/admin/libraries/ExerciseMediaPanel.tsx"), "utf8");
assert(panel.includes("تأكيد الرفع"), "confirm before upload");
assert(panel.includes("إعادة المحاولة"), "retry");
assert(!panel.includes("autoPlay"), "T22 no autoplay");

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260901040000_admin_exercise_media_replace.sql"), "utf8");
assert(sql.includes("external_id = v_existing.external_id"), "T5/T6 identity guard");
assert(sql.includes("name_ar = v_existing.name_ar"), "T6 name unchanged");
assert(!sql.includes("client_program"), "T25 no assignment rewrite");
assert(sql.includes("EXERCISE_VIDEO_REPLACED"), "audit video");
assert(sql.includes("EXERCISE_THUMBNAIL_REPLACED"), "audit thumb");
assert(sql.includes("video_status = 'ready'"), "T3 ready after video");
assert(!sql.includes("strategy_matrix"), "T23 matrix untouched");

const mediaTs = readFileSync(resolve(process.cwd(), "src/lib/platform/exercise-media.ts"), "utf8");
assert(mediaTs.includes("buildRealThumbnailPath"), "thumb contract");

const a8 = readFileSync(resolve(process.cwd(), "src/lib/admin/admin-a8.test.ts"), "utf8");
assert(a8.includes("detectExerciseSensitiveChanges"), "T23 a8 still matrix/library safety");

console.log("admin-exercise-media.test.ts: all assertions passed");
