import type { StrategySafetyConstraints } from "./types";
import { aggregateSafetyConstraints } from "./exercise-safety-rules";

export function resolveStrategyEquipment(input: {
  availableEquipment?: string[] | null;
  coachEquipment?: string[] | null;
}): { availableEquipment: string[] | null; equipmentSource: "CLIENT" | "UNKNOWN" } {
  const coach = input.coachEquipment?.filter(Boolean);
  if (coach?.length) {
    return { availableEquipment: coach, equipmentSource: "CLIENT" };
  }
  const client = input.availableEquipment?.filter(Boolean);
  if (client?.length) {
    return { availableEquipment: client, equipmentSource: "CLIENT" };
  }
  return { availableEquipment: null, equipmentSource: "UNKNOWN" };
}

/** Maps declared injury/restriction IDs into deterministic safety constraints. */
export function resolveStrategySafetyConstraints(
  injuryIds?: string[] | null,
): StrategySafetyConstraints {
  const aggregated = aggregateSafetyConstraints(injuryIds);
  return {
    injuryIds: aggregated.injuryIds,
    restrictedMuscles: aggregated.restrictedMuscles,
    blockedExternalIds: aggregated.blockedExternalIds,
    blockedMovementRoles: aggregated.blockedMovementRoles,
    unknownInjuryIds: aggregated.unknownInjuryIds,
    warnings: aggregated.warnings,
  };
}
