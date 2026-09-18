import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import type { SessionBlueprint, SessionDemand } from "./roles";
import { STANDARD_SESSION_EXERCISE_TARGET, type DaysPerWeek, type ProgramSlot } from "./types";

const SUPPLEMENTAL_SLOTS: ProgramSlot[] = [
  { muscleFamily: "CORE", priority: "MAINTENANCE", movementRole: "ANTI_ROTATION" },
  { muscleFamily: "CALVES", priority: "MAINTENANCE", movementRole: "CALF_RAISE" },
  { muscleFamily: "CHEST", priority: "MAINTENANCE", movementRole: "HORIZONTAL_PUSH" },
  { muscleFamily: "SHOULDERS", priority: "MAINTENANCE", movementRole: "VERTICAL_PUSH" },
  { muscleFamily: "LATS", priority: "MAINTENANCE", movementRole: "VERTICAL_PULL" },
  { muscleFamily: "BICEPS", priority: "MAINTENANCE", movementRole: "ELBOW_FLEXION" },
  { muscleFamily: "TRICEPS", priority: "MAINTENANCE", movementRole: "ELBOW_EXTENSION" },
  { muscleFamily: "QUADRICEPS", priority: "MAINTENANCE", movementRole: "SQUAT" },
  { muscleFamily: "HAMSTRINGS", priority: "MAINTENANCE", movementRole: "KNEE_FLEXION" },
  { muscleFamily: "ADDUCTORS", priority: "MAINTENANCE", movementRole: "HIP_ADDUCTION" },
  { muscleFamily: "SHOULDERS", priority: "MAINTENANCE", movementRole: "SHOULDER_ABDUCTION" },
  { muscleFamily: "CORE", priority: "MAINTENANCE", movementRole: "LATERAL_STABILITY" },
];

export function resolveSessionExerciseTarget(input: {
  availableMinutes: number;
  trainingLevel: ClientTrainingLevel;
  daysPerWeek: DaysPerWeek;
  demand: SessionDemand;
}): number {
  if (input.availableMinutes <= 35) return input.demand === "LOW" ? 3 : 4;
  if (input.demand === "LOW") return 4;
  if (input.availableMinutes <= 45) return 5;
  if (input.trainingLevel === "BEGINNER" || input.daysPerWeek === 5) return 5;
  return STANDARD_SESSION_EXERCISE_TARGET;
}

export function expandBlueprintToTarget(
  blueprint: SessionBlueprint,
  target: number,
  avoidRegions: readonly string[] = [],
): SessionBlueprint {
  const slots = blueprint.slots.map((item) => ({ ...item }));
  const usedRoles = new Set(slots.map((item) => item.movementRole).filter(Boolean));
  const avoided = new Set(avoidRegions.map((item) => item.toUpperCase()));
  const ranked = [
    ...SUPPLEMENTAL_SLOTS.filter((item) => !avoided.has(item.muscleFamily.toUpperCase())),
    ...SUPPLEMENTAL_SLOTS.filter((item) => avoided.has(item.muscleFamily.toUpperCase())),
  ];

  for (const supplemental of ranked) {
    if (slots.length >= target) break;
    if (supplemental.movementRole && usedRoles.has(supplemental.movementRole)) continue;
    slots.push({ ...supplemental });
    if (supplemental.movementRole) usedRoles.add(supplemental.movementRole);
  }

  return {
    ...blueprint,
    primaryRegions: [...blueprint.primaryRegions],
    slots: slots.slice(0, target),
  };
}
