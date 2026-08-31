import { createWallClockRest, pendingRestCues, remainingRestSeconds, restElapsedSeconds } from "./wall-clock-rest";
import { nextLoadAfterCalibration, usesLegacyTenPercentProgression } from "./calibration-runtime";
import { shouldShowHydrationReminder, HYDRATION_INTERVAL_MS } from "./hydration";
import { loadForPersistence, validateSetWrite } from "./set-result";
import { enqueuePending, setIdentity } from "./pending-sync";
import { parseRepsLabel } from "./parse-reps";
import { getSetProgression, SET_WEIGHT_INCREMENT } from "@/lib/platform/workout-session";
import { getCoreExercisePrescription } from "@/lib/platform/prescription";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const start = Date.parse("2026-08-21T10:00:00.000Z");
const rest = createWallClockRest(90, start);
assertEqual(remainingRestSeconds(rest, start), 90, "rest starts at prescribed");
assertEqual(remainingRestSeconds(rest, start + 45_000), 45, "wall clock remaining after 45s");
assertEqual(remainingRestSeconds(rest, start + 90_000), 0, "expired is zero not restart");
assertEqual(restElapsedSeconds(rest, start + 80_000), 80, "early rest actual ~80");
assertEqual(restElapsedSeconds(rest, start + 130_000), 130, "late rest not capped to 90");

const fired = new Set<"t15" | "count3" | "count2" | "count1" | "start">();
assertEqual(pendingRestCues(rest, fired, start + 75_000)[0], "t15", "T-15 once");
fired.add("t15");
assertEqual(pendingRestCues(rest, fired, start + 75_000).length, 0, "T-15 does not repeat");
assertEqual(pendingRestCues(rest, new Set(), start + 91_000)[0], "start", "expired return only start");
assert(!pendingRestCues(rest, new Set(), start + 91_000).includes("t15"), "no burst T-15 after expiry");
assert(!pendingRestCues(rest, new Set(), start + 91_000).includes("count3"), "no burst 3");

const keep = nextLoadAfterCalibration({ action: "KEEP", currentLoad: 40, incrementKg: 2.5 });
assertEqual(keep.load, 40, "KEEP does not increase");
const up = nextLoadAfterCalibration({ action: "SMALL_INCREASE", currentLoad: 40, incrementKg: 2.5 });
assertEqual(up.load, 42.5, "small increase uses increment");
assert(up.load !== 44, "not +10%");
const noInc = nextLoadAfterCalibration({ action: "SMALL_INCREASE", currentLoad: 40, incrementKg: null });
assertEqual(noInc.load, 40, "unknown increment does not invent");
const reduce = nextLoadAfterCalibration({ action: "REDUCE", currentLoad: 40, incrementKg: 2.5 });
assertEqual(reduce.load, 37.5, "reduce steps down");
const safety = nextLoadAfterCalibration({ action: "SAFETY_REVIEW", currentLoad: 40, incrementKg: 2.5 });
assertEqual(safety.load, 40, "safety no increase");
assert(usesLegacyTenPercentProgression("legacy_free"), "legacy isolated");
assert(!usesLegacyTenPercentProgression("v2"), "v2 does not use +10% path");

const legacyNext = getSetProgression({ setNumber: 2, baseWeightKg: 40, lastWeightKg: 40 });
assertEqual(legacyNext.weightKg, 44, "legacy helper still 10% for free preview");
assertEqual(SET_WEIGHT_INCREMENT, 0.1, "legacy constant remains isolated");

assert(
  !shouldShowHydrationReminder({
    sessionStartedAt: new Date(start).toISOString(),
    completedWorkingSets: 1,
    lastShownAt: null,
    phase: "rest",
    now: start + 60_000,
  }),
  "hydration not after every set",
);
assert(
  shouldShowHydrationReminder({
    sessionStartedAt: new Date(start).toISOString(),
    completedWorkingSets: 6,
    lastShownAt: null,
    phase: "rest",
    now: start + HYDRATION_INTERVAL_MS,
  }),
  "hydration at cadence",
);
assert(
  !shouldShowHydrationReminder({
    sessionStartedAt: new Date(start).toISOString(),
    completedWorkingSets: 8,
    lastShownAt: new Date(start).toISOString(),
    phase: "set-sheet",
    now: start + HYDRATION_INTERVAL_MS,
  }),
  "hydration does not block active set",
);

const skip = validateSetWrite({
  actualLoad: 20,
  actualReps: 10,
  actualDurationSeconds: null,
  effortV2: null,
  skipped: true,
  setType: "WORKING",
  prescriptionMode: "REPS",
  isBodyweight: false,
  requireEffort: true,
});
assert(skip.ok, "skip does not require effort");

const timed = validateSetWrite({
  actualLoad: null,
  actualReps: null,
  actualDurationSeconds: 30,
  effortV2: "IDEAL",
  skipped: false,
  setType: "WORKING",
  prescriptionMode: "DURATION",
  isBodyweight: true,
  requireEffort: true,
});
assert(timed.ok, "timed duration valid without reps");

assertEqual(loadForPersistence({ isBodyweight: true, actualLoad: 0 }), null, "bodyweight 0 is not a metric");
assertEqual(loadForPersistence({ isBodyweight: true, actualLoad: 10 }), 10, "added load kept");
assertEqual(loadForPersistence({ isBodyweight: false, actualLoad: 0 }), 0, "zero load not auto-null for loaded");

const id1 = setIdentity({ sessionDate: "2026-08-21", exerciseExternalId: "CH-001", setNumber: 1 });
const queued = enqueuePending([], {
  identity: id1,
  payload: { setNumber: 1 },
  queuedAt: "t",
  attempts: 1,
});
const queued2 = enqueuePending(queued, { identity: id1, payload: { setNumber: 1, reps: 8 }, queuedAt: "t2", attempts: 2 });
assertEqual(queued2.length, 1, "retry same set identity does not duplicate");

assertEqual(parseRepsLabel("10 - 12")?.min, 10, "parse min");
assertEqual(parseRepsLabel("12")?.max, 12, "parse fixed");

const fakeMeta = {
  external_id: "CH-001",
  name_en: "Bench",
  name_ar: "بنش",
  primary_muscles: ["CHEST"],
  secondary_muscles: [],
  muscle_contributions: [],
  primary_movement_role: "HORIZONTAL_PUSH",
  secondary_movement_roles: [],
  substitution_group: "CHEST_PRESS",
  mechanics: "COMPOUND" as const,
  loading_type: "BARBELL" as const,
  required_equipment: ["BARBELL"],
  equipment_state: "HAS_EQUIPMENT" as const,
  location_compatibility: ["GYM" as const],
  is_bodyweight: false,
  is_unilateral: false,
  execution_sides: "BILATERAL" as const,
  supports_timed_prescription: false,
  prescription_mode: "REPS" as const,
  conditioning_class: null,
  complexity: "MODERATE" as const,
  beginner_eligible: true,
  metadata_status: "APPROVED" as const,
  media_status: "placeholder",
};

const rx = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "UNASSESSED",
  exerciseExperience: "NEW",
  exercise: fakeMeta,
  location: "GYM",
});
assert(rx.prescribed_load !== 40, "V2 runtime prescription still not 40kg");
assert(rx.prescribed_load == null, "calibration has no fake load");

const root = process.cwd();
const player = readFileSync(join(root, "src/hooks/useWorkoutPlayer.ts"), "utf8");
assert(player.includes('runtimeMode === "v2"'), "v2 branch exists");
assert(player.includes("legacy_free"), "legacy isolated");
assert(player.includes("ensureWorkoutSession"), "canonical session");
assert(player.includes("getCalibrationAdjustment"), "phase 4 calibration connected");
assert(player.includes("createWallClockRest"), "wall clock rest");
assert(!/lastWeightKg \* \(1 \+ SET_WEIGHT_INCREMENT\)/.test(player), "v2 player source has no inline +10%");
assert(player.includes("PENDING_SYNC"), "offline pending status");
assert(player.includes("SIDE_SPECIFIC") === false, "no fake L/R logging");
assert(!player.includes("INCREASE_LOAD_NEXT_SESSION"), "no phase 6");
assert(!player.includes("ADD_WEEKLY_VOLUME"), "no phase 7");
assert(!player.includes("calories burned"), "no invented calories");

const sheet = readFileSync(join(root, "src/components/platform/workout/SetLogBottomSheet.tsx"), "utf8");
assert(sheet.includes("pendingRestCues"), "cues from wall clock");
assert(sheet.includes("visibilitychange"), "visibility recalc");
assert(sheet.includes("EASY") || sheet.includes("V2_EFFORTS"), "v2 effort buttons");
assert(!sheet.includes("RIR"), "no RIR in player");

const assets = ["t15.wav", "count-3.wav", "count-2.wav", "count-1.wav", "start.wav"];
for (const name of assets) {
  const path = join(root, "public/audio/workout", name);
  const size = statSync(path).size;
  assert(size > 100 && size < 20_000, `${name} is a small original wav`);
}

const rls = readFileSync(join(root, "supabase/migrations/20260821120000_training_engine_v2_data_contracts.sql"), "utf8");
assert(rls.includes("workout_sessions_own_select"), "session RLS remains");
assert(rls.includes("wsl_own_insert"), "set log RLS remains");

console.log("workout runtime v2 tests passed");
