import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";

export function resolveStrategyTrainingLevel(assessed?: ClientTrainingLevel | null): {
  trainingLevel: ClientTrainingLevel;
  trainingLevelSource: "ASSESSED" | "UNASSESSED";
} {
  if (assessed === "BEGINNER" || assessed === "INTERMEDIATE") {
    return { trainingLevel: assessed, trainingLevelSource: "ASSESSED" };
  }
  if (assessed === "UNASSESSED") {
    return { trainingLevel: "UNASSESSED", trainingLevelSource: "UNASSESSED" };
  }
  return { trainingLevel: "UNASSESSED", trainingLevelSource: "UNASSESSED" };
}
