import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  EXERCISE_STAGE_PILOT_EXTERNAL_IDS,
  getExerciseStageCover,
  getExerciseStageGuide,
  getExerciseStageListThumb,
  listExerciseStagePublicFiles,
} from "./exercise-stage-media";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const publicRoot = join(process.cwd(), "public");

assert(EXERCISE_STAGE_PILOT_EXTERNAL_IDS.length === 37, "pilot covers 10 + batch 02 + batch 04");
assert(getExerciseStageGuide("CH-015") === null, "non-wired exercises stay unwired");
assert(
  getExerciseStageListThumb("CH-001") === "/exercises/CH-001/stages/stage-b-thumb.webp",
  "exercise thumbnail is stage B",
);
assert(getExerciseStageCover("CH-001")?.key === "b", "cover still is PRIMARY_ACTION");
assert(getExerciseStageCover("CH-004")?.key === "b", "push-up cover is stage B");
assert(getExerciseStageListThumb("BI-002")?.includes("stage-b-thumb"), "dumbbell curl thumb is stage B");
assert(
  getExerciseStageListThumb("BI-001") === "/exercises/BI-001/stages/stage-b-thumb.webp",
  "Core 100 outside pilot registry still gets list thumb from synced pack",
);
assert(getExerciseStageListThumb("MO-001") === null, "non-Core-100 without stage pack returns null");
assert(getExerciseStageGuide("BI-001") === null, "BI-001 guide not wired yet; thumb still available");

const bench = getExerciseStageGuide("CH-001");
assert(bench, "CH-001 guide exists");
assert(bench.status === "PILOT_APP_TEST", "CH-001 is a client-test pilot");
assert(bench.stages[0].titleAr === "وضعية البداية", "A title is UI copy, not baked into the image");
assert(bench.stages[1].titleAr === "إنزال البار", "B title matches Manifest");
assert(bench.stages[2].titleAr === "منتصف الصعود", "C is mid-ascent, not a copy of A");
assert(bench.mistakes[0].descriptionAr === "رفع الحوض عن المقعد.", "mistake 01 is hips off bench only");
assert(bench.mistakes[1].descriptionAr === "إنزال البار نحو الرقبة.", "mistake 02 is bar toward neck only");

const pushUp = getExerciseStageGuide("CH-004");
assert(pushUp?.stages[2].titleAr === "منتصف الدفع", "push-up C is mid-press");
assert(getExerciseStageGuide("LE-001")?.mistakes[0].descriptionAr === "انهيار الركبتين للداخل.", "squat mistake 01");
assert(getExerciseStageGuide("TR-001")?.nameAr === "ترايسيبس بول داون", "tricep pushdown is wired");
assert(getExerciseStageGuide("CH-007")?.nameAr === "ضغط دمبل علوي", "incline dumbbell press is wired");
assert(getExerciseStageGuide("CH-006")?.mistakes[0].descriptionAr === "رفع الحوض عن المقعد.", "decline bench mistake 01");
assert(getExerciseStageGuide("AB-001")?.mistakes[0].descriptionAr === "سحب الرقبة باليدين.", "crunch mistake 01");

for (const externalId of EXERCISE_STAGE_PILOT_EXTERNAL_IDS) {
  const guide = getExerciseStageGuide(externalId);
  assert(guide, `${externalId} guide exists`);
  assert(guide.stages.length === 3, `${externalId} has three stages`);
  assert(guide.mistakes.length === 2, `${externalId} has two mistakes`);
  assert(guide.stages[1].cues.length === 3, `${externalId} B has three cues`);
  const files = listExerciseStagePublicFiles(guide);
  assert(files.length === 10, `${externalId} has 10 delivery files`);
  assert(
    files.every((path) => path.startsWith(`/exercises/${externalId}/`)),
    `${externalId} URLs stay under its folder`,
  );
  for (const path of files) {
    assert(existsSync(join(publicRoot, path.replace(/^\//, ""))), `delivery file missing: ${path}`);
  }
}

console.log("exercise-stage-media tests passed");
