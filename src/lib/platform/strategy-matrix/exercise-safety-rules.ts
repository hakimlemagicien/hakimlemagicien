import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { regionFamily } from "@/lib/platform/goal-intelligence/profiles";

/** Versioned deterministic injury → exercise safety configuration. */
export const MAAKFIT_EXERCISE_SAFETY_V1 = "MAAKFIT_EXERCISE_SAFETY_V1" as const;

export type SafetyClassification = "ALLOWED" | "CAUTION" | "BLOCKED";

export type InjurySafetyRule = {
  injuryId: string;
  /** Hard-blocked movement roles for automatic generation. */
  blockedMovementRoles: string[];
  /** Hard-blocked muscle families for automatic generation. */
  blockedMuscles: string[];
  /** Explicit exercise blocks when metadata alone is insufficient. */
  blockedExternalIds: string[];
  /** Treated as BLOCKED for automatic generation (no coach-review path in V1). */
  cautionMovementRoles: string[];
};

/**
 * Quiz injury taxonomy (from `InjuriesScreen.tsx`):
 * none | knee | shoulder | lower_back | ankle | elbow
 */
export const INJURY_SAFETY_RULES: InjurySafetyRule[] = [
  {
    injuryId: "knee",
    blockedMovementRoles: ["SQUAT", "KNEE_EXTENSION", "LOCOMOTION"],
    blockedMuscles: ["QUADRICEPS"],
    blockedExternalIds: [],
    cautionMovementRoles: ["HINGE", "KNEE_FLEXION"],
  },
  {
    injuryId: "shoulder",
    blockedMovementRoles: ["VERTICAL_PUSH", "SHOULDER_ABDUCTION", "SHOULDER_FLEXION"],
    blockedMuscles: ["SHOULDERS", "ANTERIOR_DELTOID", "LATERAL_DELTOID", "POSTERIOR_DELTOID"],
    blockedExternalIds: [],
    cautionMovementRoles: ["HORIZONTAL_PUSH"],
  },
  {
    injuryId: "lower_back",
    blockedMovementRoles: ["HINGE"],
    blockedMuscles: [],
    blockedExternalIds: [],
    cautionMovementRoles: ["HIP_EXTENSION", "SQUAT"],
  },
  {
    injuryId: "ankle",
    blockedMovementRoles: ["LOCOMOTION", "CALF_RAISE"],
    blockedMuscles: [],
    blockedExternalIds: [],
    cautionMovementRoles: ["SQUAT"],
  },
  {
    injuryId: "elbow",
    blockedMovementRoles: ["ELBOW_FLEXION", "ELBOW_EXTENSION"],
    blockedMuscles: ["BICEPS", "TRICEPS"],
    blockedExternalIds: [],
    cautionMovementRoles: ["HORIZONTAL_PUSH", "HORIZONTAL_PULL"],
  },
];

export type AggregatedSafetyConstraints = {
  injuryIds: string[];
  restrictedMuscles: string[];
  blockedExternalIds: string[];
  blockedMovementRoles: string[];
  unknownInjuryIds: string[];
  warnings: string[];
};

const ACTIVE_INJURY_FILTER = new Set(["none", ""]);

function ruleForInjury(injuryId: string): InjurySafetyRule | null {
  return INJURY_SAFETY_RULES.find((rule) => rule.injuryId === injuryId) ?? null;
}

export function aggregateSafetyConstraints(
  injuryIds?: string[] | null,
): AggregatedSafetyConstraints {
  const normalized = (injuryIds ?? []).filter((id) => id && !ACTIVE_INJURY_FILTER.has(id.toLowerCase()));
  const restrictedMuscles = new Set<string>();
  const blockedExternalIds = new Set<string>();
  const blockedMovementRoles = new Set<string>();
  const unknownInjuryIds: string[] = [];
  const warnings: string[] = [];

  for (const injuryId of normalized) {
    const rule = ruleForInjury(injuryId);
    if (!rule) {
      unknownInjuryIds.push(injuryId);
      warnings.push(`UNKNOWN_INJURY_ID:${injuryId}`);
      continue;
    }
    for (const muscle of rule.blockedMuscles) restrictedMuscles.add(muscle);
    for (const id of rule.blockedExternalIds) blockedExternalIds.add(id);
    for (const role of [...rule.blockedMovementRoles, ...rule.cautionMovementRoles]) {
      blockedMovementRoles.add(role);
    }
  }

  if (unknownInjuryIds.length) {
    warnings.push("UNKNOWN_INJURY_FAIL_CLOSED");
  }

  return {
    injuryIds: normalized,
    restrictedMuscles: [...restrictedMuscles],
    blockedExternalIds: [...blockedExternalIds],
    blockedMovementRoles: [...blockedMovementRoles],
    unknownInjuryIds,
    warnings,
  };
}

function exerciseMuscleFamilies(exercise: ExerciseV2Metadata): Set<string> {
  const muscles = [
    ...(exercise.primary_muscles ?? []),
    ...(exercise.secondary_muscles ?? []),
    ...(exercise.muscle_contributions ?? []).map((row) => row.muscle),
  ];
  return new Set(muscles.map((muscle) => regionFamily(muscle)));
}

export function classifyExerciseSafety(input: {
  exercise: ExerciseV2Metadata;
  constraints: AggregatedSafetyConstraints;
  extraRestrictedMuscles?: string[];
}): SafetyClassification {
  const { exercise, constraints } = input;
  const restricted = new Set([
    ...constraints.restrictedMuscles,
    ...(input.extraRestrictedMuscles ?? []),
  ]);

  if (constraints.blockedExternalIds.includes(exercise.external_id)) return "BLOCKED";

  const role = exercise.primary_movement_role ?? "";
  if (role && constraints.blockedMovementRoles.includes(role)) return "BLOCKED";
  if (exercise.secondary_movement_roles.some((item) => constraints.blockedMovementRoles.includes(item))) {
    return "BLOCKED";
  }

  const families = exerciseMuscleFamilies(exercise);
  for (const muscle of restricted) {
    const family = regionFamily(muscle);
    if ([...families].some((item) => regionFamily(item) === family || item === muscle)) {
      return "BLOCKED";
    }
  }

  return "ALLOWED";
}

export function isExerciseSafetyBlocked(input: {
  exercise: ExerciseV2Metadata;
  constraints: AggregatedSafetyConstraints;
  extraRestrictedMuscles?: string[];
}): boolean {
  const classification = classifyExerciseSafety(input);
  return classification === "BLOCKED" || classification === "CAUTION";
}

export function safetyBlockedExternalIds(
  exercises: ExerciseV2Metadata[],
  constraints: AggregatedSafetyConstraints,
  extraRestrictedMuscles?: string[],
): string[] {
  return exercises
    .filter((exercise) =>
      isExerciseSafetyBlocked({ exercise, constraints, extraRestrictedMuscles }),
    )
    .map((exercise) => exercise.external_id);
}
