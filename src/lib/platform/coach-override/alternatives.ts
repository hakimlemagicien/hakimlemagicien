import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { explainEligibility, type EligibilityInput } from "@/lib/platform/prescription/eligibility";
import { rankCandidates, exerciseMatchesFamily } from "@/lib/platform/program-generation/selection";
import { exercisesForPoolVersion } from "@/lib/platform/strategy-matrix/core-100";
import type { ExerciseAlternative } from "./types";

export function suggestExerciseAlternatives(input: {
  exercises: ExerciseV2Metadata[];
  eligibility: Omit<EligibilityInput, "exercise">;
  sourceExercise?: ExerciseV2Metadata | null;
  movementRole?: string | null;
  muscleFamily?: string | null;
  limit?: number;
}): ExerciseAlternative[] {
  const pool = exercisesForPoolVersion(
    input.exercises,
    input.eligibility.exercisePoolVersion ?? "MAAKFIT_V1_CORE_100",
  );

  const role = input.movementRole ?? input.sourceExercise?.primary_movement_role ?? null;
  const family =
    input.muscleFamily ??
    input.sourceExercise?.primary_muscles[0] ??
    null;

  const eligible = pool.filter((exercise) => {
    if (input.sourceExercise && exercise.external_id === input.sourceExercise.external_id) {
      return false;
    }
    if (explainEligibility({ ...input.eligibility, exercise }) != null) return false;
    if (role && exercise.primary_movement_role !== role) {
      if (!exercise.secondary_movement_roles.includes(role)) return false;
    }
    if (family && !exerciseMatchesFamily(exercise, family)) return false;
    return true;
  });

  const ranked = rankCandidates({
    slot: {
      movementRole: role,
      muscleFamily: family ?? "CHEST",
      priority: "PRIMARY",
    },
    candidates: eligible,
    usedIds: new Set(),
    previousIds: new Set(input.sourceExercise ? [input.sourceExercise.external_id] : []),
    experienceById: {},
  });

  return ranked.slice(0, input.limit ?? 5).map((exercise) => ({
    external_id: exercise.external_id,
    name_ar: exercise.name_ar,
    reason: role
      ? `نفس دور الحركة (${role}) ضمن Core 100 والأهلية`
      : "متوافق مع الأهلية وCore 100",
  }));
}

export function reviewExerciseEligibility(input: {
  exercise: ExerciseV2Metadata;
  eligibility: Omit<EligibilityInput, "exercise">;
}): { ok: true } | { ok: false; code: string } {
  const failure = explainEligibility({ ...input.eligibility, exercise: input.exercise });
  if (!failure) return { ok: true };
  return { ok: false, code: failure };
}
