import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import {
  isValidExternalId,
  isV2EligibleExercise,
} from "@/lib/platform/exercise-library-v2";
import { CORE_100_EXTERNAL_IDS } from "./config/core-100-external-ids";

/** Versioned V1 Core 100 exercise pool identifier. */
export const EXERCISE_POOL_MAAKFIT_V1_CORE_100 = "MAAKFIT_V1_CORE_100" as const;

export type ExercisePoolVersion = typeof EXERCISE_POOL_MAAKFIT_V1_CORE_100 | "FULL_CATALOG";

export type Core100ValidationIssue =
  | "CORE_100_LIST_EMPTY"
  | "CORE_100_COUNT_MISMATCH"
  | "CORE_100_DUPLICATE_ID"
  | "CORE_100_UNKNOWN_ID"
  | "CORE_100_NOT_V2_ELIGIBLE"
  | "CORE_100_REVIEW_REQUIRED";

export type Core100ValidationResult =
  | { ok: true; externalIds: readonly string[]; count: 100 }
  | { ok: false; issues: Core100ValidationIssue[]; count: number };

export function isCore100PoolActive(version: ExercisePoolVersion): boolean {
  return version === EXERCISE_POOL_MAAKFIT_V1_CORE_100;
}

/** Structural config check (count, uniqueness, ID format) — no catalog required. */
export function isCore100ConfigStructurallyValid(): boolean {
  const ids = CORE_100_EXTERNAL_IDS as readonly string[];
  return ids.length === 100 && new Set(ids).size === 100 && ids.every((id) => isValidExternalId(id));
}

/** Strategy Matrix V1 always targets the locked Core 100 pool — no silent FULL_CATALOG fallback. */
export function resolveExercisePoolVersion(): ExercisePoolVersion {
  return EXERCISE_POOL_MAAKFIT_V1_CORE_100;
}

/** Validates the configured Core 100 list against the exercise catalog. */
export function validateCore100Config(
  catalog: ExerciseV2Metadata[],
): Core100ValidationResult {
  const ids = [...CORE_100_EXTERNAL_IDS];
  if (!ids.length) {
    return { ok: false, issues: ["CORE_100_LIST_EMPTY"], count: 0 };
  }
  if (ids.length !== 100) {
    return { ok: false, issues: ["CORE_100_COUNT_MISMATCH"], count: ids.length };
  }

  const issues = new Set<Core100ValidationIssue>();
  const seen = new Set<string>();
  const catalogById = new Map(catalog.map((row) => [row.external_id, row]));

  for (const id of ids) {
    if (seen.has(id)) issues.add("CORE_100_DUPLICATE_ID");
    seen.add(id);

    const exercise = catalogById.get(id);
    if (!exercise) {
      issues.add("CORE_100_UNKNOWN_ID");
      continue;
    }
    if (exercise.metadata_status === "REVIEW_REQUIRED") {
      issues.add("CORE_100_REVIEW_REQUIRED");
    }
    if (
      !isV2EligibleExercise({
        is_active: true,
        external_id: exercise.external_id,
        metadata_status: exercise.metadata_status,
        primary_muscles: exercise.primary_muscles,
        primary_movement_role: exercise.primary_movement_role,
        equipment_state: exercise.equipment_state,
        required_equipment: exercise.required_equipment,
        mechanics: exercise.mechanics,
        is_bodyweight: exercise.is_bodyweight,
        is_unilateral: exercise.is_unilateral,
        prescription_mode: exercise.prescription_mode,
        supports_timed_prescription: exercise.supports_timed_prescription,
      })
    ) {
      issues.add("CORE_100_NOT_V2_ELIGIBLE");
    }
  }

  if (issues.size) {
    return { ok: false, issues: [...issues], count: ids.length };
  }

  return { ok: true, externalIds: CORE_100_EXTERNAL_IDS, count: 100 };
}

export function core100ExternalIdSet(): ReadonlySet<string> {
  return new Set(CORE_100_EXTERNAL_IDS);
}

export function isInCore100Pool(externalId: string): boolean {
  return (CORE_100_EXTERNAL_IDS as readonly string[]).includes(externalId);
}

export function filterExercisesToCore100Pool(exercises: ExerciseV2Metadata[]): ExerciseV2Metadata[] {
  const allowed = core100ExternalIdSet();
  if (!allowed.size) return [];
  return exercises.filter((exercise) => allowed.has(exercise.external_id));
}

export function exercisesForPoolVersion(
  exercises: ExerciseV2Metadata[],
  version: ExercisePoolVersion,
): ExerciseV2Metadata[] {
  if (!isCore100PoolActive(version)) return exercises;
  return filterExercisesToCore100Pool(exercises);
}
