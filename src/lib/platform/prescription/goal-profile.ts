import {
  mapLegacyGoalId,
  TRAINING_V2_CANONICAL_GOALS,
  type TrainingV2CanonicalGoal,
} from "@/lib/platform/training-v2-contracts";
import type { MusclePriority } from "./types";

export type GoalMuscleProfile = {
  canonicalId: TrainingV2CanonicalGoal;
  primary: string[];
  secondary: string[];
  maintenance: string[];
  notes: string;
};

const ALL_RESISTANCE = [
  "CHEST",
  "LATS",
  "UPPER_BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "QUADRICEPS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "CORE",
  "RECTUS_ABDOMINIS",
  "OBLIQUES",
];

export const GOAL_MUSCLE_PROFILES: Record<TrainingV2CanonicalGoal, GoalMuscleProfile> = {
  GLUTE_GROWTH: {
    canonicalId: "GLUTE_GROWTH",
    primary: ["GLUTES", "GLUTEUS_MAXIMUS", "GLUTEUS_MEDIUS"],
    secondary: ["HAMSTRINGS", "QUADRICEPS"],
    maintenance: ["CHEST", "LATS", "UPPER_BACK", "SHOULDERS", "BICEPS", "TRICEPS", "CORE", "CALVES"],
    notes: "Glutes primary; other lower-body is supporting, not all-primary.",
  },
  TONED_ARMS_UPPER_BODY: {
    canonicalId: "TONED_ARMS_UPPER_BODY",
    primary: ["BICEPS", "TRICEPS", "SHOULDERS", "ANTERIOR_DELTOID", "LATERAL_DELTOID", "UPPER_BACK"],
    secondary: ["CHEST", "LATS", "POSTERIOR_DELTOID"],
    maintenance: ["GLUTES", "QUADRICEPS", "HAMSTRINGS", "CORE", "CALVES"],
    notes: "Upper-body elevated; lower body is not zero.",
  },
  POSTURE_TONED_BACK: {
    canonicalId: "POSTURE_TONED_BACK",
    primary: ["UPPER_BACK", "POSTERIOR_DELTOID", "LATS"],
    secondary: ["CORE", "RECTUS_ABDOMINIS", "OBLIQUES", "HAMSTRINGS", "GLUTES"],
    maintenance: ["CHEST", "SHOULDERS", "BICEPS", "TRICEPS", "QUADRICEPS", "CALVES"],
    notes: "Training-oriented posterior/core work. Not medical correction.",
  },
  SLIM_TONED_WAIST: {
    canonicalId: "SLIM_TONED_WAIST",
    primary: [],
    secondary: ["CORE", "RECTUS_ABDOMINIS", "OBLIQUES", "GLUTES", "QUADRICEPS", "UPPER_BACK"],
    maintenance: ["CHEST", "LATS", "SHOULDERS", "BICEPS", "TRICEPS", "HAMSTRINGS", "CALVES"],
    notes: "Core is functional, not extreme-primary ab volume. Body composition is separate.",
  },
  FEMININE_BALANCED_BODY: {
    canonicalId: "FEMININE_BALANCED_BODY",
    primary: ["GLUTES"],
    secondary: ["QUADRICEPS", "HAMSTRINGS", "UPPER_BACK", "SHOULDERS", "CORE"],
    maintenance: ["CHEST", "LATS", "BICEPS", "TRICEPS", "CALVES"],
    notes: "Balanced allocation with moderate glute emphasis. No female-only rep range.",
  },
  FAT_LOSS: {
    canonicalId: "FAT_LOSS",
    primary: [],
    secondary: ALL_RESISTANCE,
    maintenance: [],
    notes: "Muscle-preservation balanced resistance. No fat-loss rep or rest special case.",
  },
};

export function resolveCanonicalGoal(goalId: string | null | undefined): {
  canonicalId: TrainingV2CanonicalGoal | null;
  mappingStatus: "MAPPED" | "LEGACY_UNMAPPED";
  legacyId: string;
} {
  const raw = goalId?.trim() ?? "";
  if (!raw) {
    return { canonicalId: null, mappingStatus: "LEGACY_UNMAPPED", legacyId: "" };
  }
  if ((TRAINING_V2_CANONICAL_GOALS as readonly string[]).includes(raw)) {
    return { canonicalId: raw as TrainingV2CanonicalGoal, mappingStatus: "MAPPED", legacyId: raw };
  }
  const mapped = mapLegacyGoalId(raw);
  return {
    canonicalId: mapped.canonicalId,
    mappingStatus: mapped.mappingStatus,
    legacyId: mapped.legacyId,
  };
}

export function getGoalMuscleProfile(canonicalId: TrainingV2CanonicalGoal): GoalMuscleProfile {
  return GOAL_MUSCLE_PROFILES[canonicalId];
}

export function musclePriorityFor(
  canonicalId: TrainingV2CanonicalGoal | null,
  muscles: string[],
): MusclePriority | null {
  if (!canonicalId) return null;
  const profile = GOAL_MUSCLE_PROFILES[canonicalId];
  if (muscles.some((muscle) => profile.primary.includes(muscle))) return "PRIMARY";
  if (muscles.some((muscle) => profile.secondary.includes(muscle))) return "SECONDARY";
  if (muscles.some((muscle) => profile.maintenance.includes(muscle))) return "MAINTENANCE";
  return "MAINTENANCE";
}
