import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { explainEligibility } from "@/lib/platform/prescription/eligibility";
import { regionFamily } from "@/lib/platform/goal-intelligence/profiles";
import { exerciseContributions } from "@/lib/platform/volume/contribution";
import type { ClientTrainingLevel, ExerciseExperienceState } from "@/lib/platform/training-v2-contracts";
import type { LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import type { ExercisePoolVersion } from "@/lib/platform/strategy-matrix/core-100";
import type { ProgramSlot } from "./types";

const BLOCKED_ROLES = new Set([
  "STEADY_CARDIO",
  "INTERVAL_CONDITIONING",
  "WARMUP",
  "MOBILITY",
  "LOCOMOTION",
]);

export function isResistanceEligible(exercise: ExerciseV2Metadata) {
  const role = exercise.primary_movement_role ?? "";
  if (BLOCKED_ROLES.has(role)) return false;
  if (exercise.prescription_mode === "INTERVAL" || exercise.prescription_mode === "DISTANCE") return false;
  if (exercise.conditioning_class === "INTERVAL_CAPABLE" && exercise.mechanics === "NOT_APPLICABLE") return false;
  return true;
}

export function exerciseMatchesFamily(exercise: ExerciseV2Metadata, family: string) {
  const wanted = regionFamily(family);
  const muscles = [
    ...(exercise.primary_muscles ?? []),
    ...(exercise.secondary_muscles ?? []),
    ...(exercise.muscle_contributions ?? []).map((row) => row.muscle),
  ];
  return muscles.some((muscle) => regionFamily(muscle) === wanted);
}

function contributionScore(exercise: ExerciseV2Metadata, family: string) {
  const wanted = regionFamily(family);
  let best = 0;
  for (const row of exerciseContributions(exercise).contributions) {
    if (regionFamily(row.muscle) === wanted) best = Math.max(best, row.weight);
  }
  return best;
}

export function rankCandidates(input: {
  slot: ProgramSlot;
  candidates: ExerciseV2Metadata[];
  usedIds: Set<string>;
  previousIds: Set<string>;
  lockedIds?: Set<string>;
  experienceById: Record<string, ExerciseExperienceState>;
  fromRegion?: string | null;
  toRegion?: string | null;
}): ExerciseV2Metadata[] {
  const scored = input.candidates
    .filter((exercise) => !input.usedIds.has(exercise.external_id))
    .map((exercise) => {
      let score = 0;
      const role = exercise.primary_movement_role;
      if (input.slot.movementRole && role === input.slot.movementRole) score += 80;
      else if (input.slot.movementRole && exercise.secondary_movement_roles.includes(input.slot.movementRole)) score += 40;
      score += contributionScore(exercise, input.slot.muscleFamily) * 50;
      if (exercise.mechanics === "COMPOUND" && input.slot.priority === "PRIMARY") score += 15;
      if (input.previousIds.has(exercise.external_id)) score += 20;
      if (input.lockedIds?.has(exercise.external_id)) score += 100;
      if (input.experienceById[exercise.external_id] === "ESTABLISHED") score += 12;
      if (input.experienceById[exercise.external_id] === "NEW") score += 2;
      const from = input.fromRegion?.toUpperCase() ?? "";
      const to = input.toRegion?.toUpperCase() ?? "";
      if (from && contributionScore(exercise, from) >= 1) score -= 35;
      if (to && contributionScore(exercise, to) >= 1) score += 25;
      return { exercise, score };
    });
  scored.sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    return left.exercise.external_id.localeCompare(right.exercise.external_id);
  });
  return scored.map((row) => row.exercise);
}

export function filterProgramCandidates(input: {
  exercises: ExerciseV2Metadata[];
  location: LocationCompatibility;
  permittedLocations?: LocationCompatibility[];
  availableEquipment?: string[] | null;
  trainingLevel: ClientTrainingLevel;
  excludedExternalIds?: string[];
  exercisePoolVersion?: ExercisePoolVersion;
  injuryIds?: string[] | null;
  restrictedMuscles?: string[] | null;
}): ExerciseV2Metadata[] {
  const excluded = new Set(input.excludedExternalIds ?? []);
  return input.exercises.filter((exercise) => {
    if (excluded.has(exercise.external_id)) return false;
    if (!isResistanceEligible(exercise)) return false;
    return (
      explainEligibility({
        exercise,
        location: input.location,
        permittedLocations: input.permittedLocations,
        availableEquipment: input.availableEquipment,
        trainingLevel: input.trainingLevel,
        exercisePoolVersion: input.exercisePoolVersion,
        injuryIds: input.injuryIds,
        restrictedMuscles: input.restrictedMuscles,
        excludedExternalIds: input.excludedExternalIds,
      }) == null
    );
  });
}

export function pickForSlot(input: {
  slot: ProgramSlot;
  pool: ExerciseV2Metadata[];
  usedIds: Set<string>;
  usedRoles: Set<string>;
  previousIds: Set<string>;
  lockedIds?: Set<string>;
  experienceById: Record<string, ExerciseExperienceState>;
  fromRegion?: string | null;
  toRegion?: string | null;
}): ExerciseV2Metadata | null {
  const matching = input.pool.filter((exercise) => {
    if (input.slot.movementRole && exercise.primary_movement_role !== input.slot.movementRole) {
      if (!exercise.secondary_movement_roles.includes(input.slot.movementRole)) return false;
    }
    return exerciseMatchesFamily(exercise, input.slot.muscleFamily);
  });
  const ranked = rankCandidates({
    slot: input.slot,
    candidates: matching,
    usedIds: input.usedIds,
    previousIds: input.previousIds,
    lockedIds: input.lockedIds,
    experienceById: input.experienceById,
    fromRegion: input.fromRegion,
    toRegion: input.toRegion,
  });
  const nonRedundant = ranked.find((exercise) => {
    const role = exercise.primary_movement_role;
    if (!role) return true;
    return !input.usedRoles.has(role);
  });
  return nonRedundant ?? ranked[0] ?? null;
}
