import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import type { EffortLevel } from "@/lib/platform/workout-session";

export const V2_EFFORT_LABELS_AR: Record<TrainingV2Effort, string> = {
  EASY: "أسهل من المطلوب",
  IDEAL: "مناسب",
  VERY_HARD: "صعب جداً",
  FAILURE: "لم أستطع الإكمال كما طُلب",
};

export const V2_EFFORTS: TrainingV2Effort[] = ["EASY", "IDEAL", "VERY_HARD", "FAILURE"];

export function effortV2ToLegacy(effort: TrainingV2Effort): EffortLevel {
  if (effort === "EASY") return "easy";
  if (effort === "IDEAL") return "medium";
  return "hard";
}

export function parseEffortV2(value: string | null | undefined): TrainingV2Effort | null {
  if (value === "EASY" || value === "IDEAL" || value === "VERY_HARD" || value === "FAILURE") return value;
  return null;
}
