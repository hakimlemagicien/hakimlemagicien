import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXERCISE_LIBRARY_AUTHORING,
  filterV2Candidates,
  hasCompleteV2CriticalMetadata,
  isValidExternalId,
  isV2EligibleExercise,
  normalizeEquipmentKey,
  normalizeMuscleKey,
  substitutionCandidates,
  validateV2Combination,
} from "./exercise-library-v2";
import {
  assertLibraryInvariants,
  auditExerciseLibrary,
  collectHardcodedProgramExternalIds,
  loadAuthoredV2Metadata,
  loadExerciseCatalog,
  toV2Contract,
} from "./exercise-library-v2-validator";
import { resolveExerciseMediaSource } from "./exercise-media";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const { report, issues, catalog, authored } = assertLibraryInvariants(root);

assert(issues.length === 0, issues.join(" | "));
assert(catalog.length === 320, "audit covers all 320 catalog exercises");
assert(authored.length === 320, "authored V2 metadata covers 320 exercises");
assert(report.MISSING_EXTERNAL_ID === 0, "MISSING_EXTERNAL_ID = 0");
assert(report.DUPLICATE_EXTERNAL_ID === 0, "DUPLICATE_EXTERNAL_ID = 0");
assert(report.INVALID_EXTERNAL_ID === 0, "INVALID_EXTERNAL_ID = 0");
assert(report.ORPHAN_ACTIVE_PROGRAM_REFERENCE === 0, "ORPHAN_ACTIVE_PROGRAM_REFERENCE = 0");
assert(report.NAME_QA.missing_name_ar.length === 0, "all active exercises have name_ar");
assert(report.NAME_QA.missing_name_en.length === 0, "all active exercises have name_en");
assert(report.NAME_QA.id_as_name.length === 0, "names are not identity keys");

const byId = new Map(authored.map((row) => [row.external_id, row]));
assert(byId.get("CH-001")?.external_id === "CH-001", "CH-001 identity is preserved");
assert(!authored.some((row) => row.external_id.includes("-V2")), "no CH-001-V2 identity fork");

const renamed = { ...byId.get("CH-001")!, name_en: "Barbell Bench Press" };
assert(renamed.external_id === "CH-001", "display-name change does not change identity");

assert(normalizeMuscleKey("Pecs") === "CHEST", "legacy pecs maps to CHEST");
assert(normalizeMuscleKey("Chest") === "CHEST", "Chest maps to CHEST");
assert(normalizeEquipmentKey("Dumbbells") === "DUMBBELLS", "Dumbbells alias");
assert(normalizeEquipmentKey("DB") === "DUMBBELLS", "DB alias");
assert(normalizeEquipmentKey("") === null, "blank equipment is unknown, not NO_EQUIPMENT");

const bench = toV2Contract(byId.get("CH-001")!);
const curl = toV2Contract(byId.get("BI-001")!);
const row = toV2Contract(byId.get("BA-010")!);
const plank = toV2Contract(byId.get("AB-006")!);
const sidePlank = toV2Contract(byId.get("AB-007")!);
const pushUp = toV2Contract(byId.get("CH-004")!);

assert(bench.primary_movement_role === "HORIZONTAL_PUSH", "bench is horizontal push");
assert(bench.mechanics === "COMPOUND", "bench is compound");
assert(bench.equipment_state === "HAS_EQUIPMENT", "bench has equipment");
assert(pushUp.equipment_state === "NO_EQUIPMENT", "push-up is explicit NO_EQUIPMENT");
assert(pushUp.equipment_state !== "UNKNOWN", "NO_EQUIPMENT is distinct from UNKNOWN");
assert(curl.primary_movement_role === "ELBOW_FLEXION", "curl is elbow flexion");
assert(row.primary_movement_role === "HORIZONTAL_PULL", "barbell row is horizontal pull");
assert(plank.primary_movement_role === "ANTI_EXTENSION", "plank is anti-extension not CORE role");
assert(sidePlank.primary_movement_role === "LATERAL_STABILITY", "side plank is lateral stability");
assert(
  bench.muscle_contributions[0]?.contribution === "DIRECT_PRIMARY",
  "bench chest is direct primary",
);
assert(
  bench.muscle_contributions.some((item) => item.muscle === "TRICEPS" && item.contribution === "DIRECT_SECONDARY"),
  "bench triceps are direct secondary, not a fake 0.5 coefficient",
);

const pool = authored.map((item) => toV2Contract(item));
const curlSubs = substitutionCandidates(curl, pool);
assert(
  curlSubs.every((item) => item.primary_movement_role === "ELBOW_FLEXION"),
  "curl substitutes stay in the same movement role",
);
assert(
  !curlSubs.some((item) => item.external_id === "BA-010"),
  "row is not a biceps-curl substitute",
);

const unapproved = { ...curl, metadata_status: "REVIEW_REQUIRED" as const };
assert(
  filterV2Candidates([unapproved], { movementRole: "ELBOW_FLEXION" }).length === 0,
  "unapproved metadata is excluded from V2 candidates",
);

assert(
  !isV2EligibleExercise({
    is_active: true,
    external_id: "CH-001",
    metadata_status: "APPROVED",
    primary_movement_role: null,
    equipment_state: "HAS_EQUIPMENT",
    required_equipment: ["BARBELL"],
    mechanics: "COMPOUND",
    is_bodyweight: false,
    is_unilateral: false,
    prescription_mode: "REPS",
    primary_muscle: "CHEST",
  }),
  "APPROVED resistance exercise cannot lack movement role",
);

assert(
  validateV2Combination({
    metadata_status: "APPROVED",
    prescription_mode: "DURATION",
    supports_timed_prescription: false,
  }).includes("duration_requires_timed"),
  "duration without timed support is invalid",
);
assert(
  validateV2Combination({
    metadata_status: "UNREVIEWED",
    equipment_state: "NO_EQUIPMENT",
    required_equipment: ["BARBELL"],
  }).includes("no_equipment_with_requirements"),
  "NO_EQUIPMENT cannot carry requirements",
);
assert(
  !hasCompleteV2CriticalMetadata({
    external_id: "CH-001",
    metadata_status: "APPROVED",
    primary_movement_role: "HORIZONTAL_PUSH",
    equipment_state: "UNKNOWN",
    mechanics: "COMPOUND",
    is_bodyweight: false,
    is_unilateral: false,
    prescription_mode: "REPS",
    primary_muscle: "CHEST",
  }),
  "UNKNOWN equipment is incomplete",
);

assert(isValidExternalId("CH-001"), "valid external_id accepted");
assert(!isValidExternalId("bench-press"), "name-like ids rejected");
assert(!isValidExternalId("CH-001-V2"), "forked identity rejected");

const freeIds = collectHardcodedProgramExternalIds(root);
assert(freeIds.includes("CH-001"), "free program still references CH-001");
for (const id of freeIds) {
  assert(byId.has(id), `hardcoded ${id} still resolves in the catalog`);
}

const mediaReady = resolveExerciseMediaSource({
  status: "ready",
  path: "exercises/CH-001/exercise.mp4",
  kind: "exercise",
});
assert(mediaReady.storagePath?.includes("CH-001"), "ready media is bound to external_id");
const mediaPlaceholder = resolveExerciseMediaSource({
  status: "placeholder",
  path: null,
  kind: "exercise",
});
assert(mediaPlaceholder.useSharedPlaceholder, "missing/placeholder uses shared placeholder");
assert(
  resolveExerciseMediaSource({ status: "missing", path: null, kind: "exercise" }).useSharedPlaceholder,
  "missing media does not change identity",
);

const hipThrust = toV2Contract(byId.get("GL-001")!);
assert(hipThrust.primary_movement_role === "HIP_EXTENSION", "glute goal has hip extension candidates");
assert(report.ROLE_COVERAGE.HORIZONTAL_PULL > 0, "upper-body pull coverage exists");
assert(report.ROLE_COVERAGE.ELBOW_FLEXION > 0, "elbow flexion coverage exists");
assert(report.ROLE_COVERAGE.ELBOW_EXTENSION > 0, "elbow extension coverage exists");
assert(report.ROLE_WITH_ZERO_ELIGIBLE_EXERCISES.length === 0, "required roles have eligible candidates");

assert(EXERCISE_LIBRARY_AUTHORING.RUNTIME_SOURCE === "public.exercises", "runtime source is public.exercises");
assert(!EXERCISE_LIBRARY_AUTHORING.AUTHORING_SOURCE.includes("exercises_v2"), "no parallel V2 catalog");

const migration = readFileSync(join(root, "supabase/migrations/20260821140000_exercise_library_v2_compatibility.sql"), "utf8");
assert(migration.includes("ALTER TABLE public.exercises"), "existing exercises table is extended");
assert(!migration.includes("CREATE TABLE public.exercises_v2"), "no exercises_v2 table");
assert(migration.includes("external_id_immutable"), "external_id is protected");
assert(migration.includes("v2_metadata_status"), "metadata review is separate from media");
assert(migration.includes("DIRECT_PRIMARY") || migration.includes("muscle_contributions"), "contribution model exists");
assert(migration.includes("exercise_v2_is_eligible"), "eligibility helper exists");

const seed = readFileSync(join(root, "supabase/migrations/20260821140100_exercise_library_v2_metadata_seed.sql"), "utf8");
assert(seed.includes("WHERE e.external_id = rec->>'external_id'"), "seed updates same identity");
assert(!seed.includes("INSERT INTO public.exercises"), "seed does not create duplicate rows");

const sync = readFileSync(join(root, "scripts/sync-exercises.sh"), "utf8");
assert(sync.includes("must not erase"), "sync cannot wipe populated equipment");
assert(sync.includes("update_v2_metadata"), "sync can apply V2 metadata without identity fork");

const adminUi = readFileSync(join(root, "src/components/admin/libraries/ExerciseLibraryManager.tsx"), "utf8");
assert(adminUi.includes("v2_metadata_status"), "admin manager exposes V2 review status");
assert(adminUi.includes("if (draft.id) return"), "admin cannot freely edit external_id after create");
assert(!adminUi.includes("Exercise Library V2 Manager"), "no parallel admin manager");

const player = readFileSync(join(root, "src/hooks/useWorkoutPlayer.ts"), "utf8");
assert(!player.includes("listV2ExerciseCandidates"), "workout player does not load full V2 candidate catalog");
assert(!player.includes("GLUTE_SCORE"), "no goal ranking in player");

const runtime = readFileSync(join(root, "src/lib/platform/exercise-library.ts"), "utf8");
assert(!runtime.includes("primary_movement_role"), "workout library list stays lean");

console.log("exercise-library-v2 tests passed");
console.log(JSON.stringify({
  TOTAL_EXERCISES: report.TOTAL_EXERCISES,
  V2_ELIGIBLE: report.V2_ELIGIBLE,
  REVIEW_REQUIRED: report.REVIEW_REQUIRED,
  MEDIA_PLACEHOLDER: report.MEDIA_PLACEHOLDER,
  ROLE_COVERAGE: report.ROLE_COVERAGE,
  LOCATION_COVERAGE: report.LOCATION_COVERAGE,
  SUBSTITUTION_GAPS: report.SUBSTITUTION_GAPS,
  GOAL_REQUIRED_MUSCLE_WITH_LOW_COVERAGE: report.GOAL_REQUIRED_MUSCLE_WITH_LOW_COVERAGE,
}, null, 2));
