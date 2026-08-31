import type { ProgramGenerationResult } from "@/lib/platform/program-generation/types";
import type { ResolvedTrainingStrategy } from "@/lib/platform/strategy-matrix/types";
import type { AssignmentRecommendationItem } from "./types";

const LOCATION_LABELS: Record<string, string> = {
  GYM: "نادي",
  HOME: "منزل",
  BOTH: "نادي ومنزل",
  UNKNOWN: "غير محدد",
};

/**
 * Deterministic assignment recommendation from domain facts — not LLM prose.
 */
export function buildAssignmentRecommendation(
  strategy: ResolvedTrainingStrategy,
  generation: ProgramGenerationResult,
): AssignmentRecommendationItem[] {
  const items: AssignmentRecommendationItem[] = [];

  items.push({
    category: "GOAL_ALIGNMENT",
    aligned: generation.status === "READY",
    detail: `الهدف: ${strategy.canonicalGoal} (مصدر: ${strategy.goalResolutionSource})`,
  });

  items.push({
    category: "FREQUENCY_ALIGNMENT",
    aligned: strategy.trainingDaysPerWeek >= 2 && strategy.trainingDaysPerWeek <= 5,
    detail: `${strategy.trainingDaysPerWeek} أيام/أسبوع (مصدر: ${strategy.frequencySource})`,
  });

  items.push({
    category: "LOCATION_ALIGNMENT",
    aligned: strategy.trainingLocation !== "UNKNOWN",
    detail: `بيئة التدريب: ${LOCATION_LABELS[strategy.trainingLocation] ?? strategy.trainingLocation}`,
  });

  items.push({
    category: "LEVEL_ALIGNMENT",
    aligned: strategy.trainingLevel !== "UNASSESSED",
    detail: `المستوى: ${strategy.trainingLevel} (مصدر: ${strategy.trainingLevelSource})`,
  });

  const safetyOk =
    strategy.safety.injuryIds.length === 0 ||
    !generation.validation.errors.some((row) => row.code === "SAFETY_RESTRICTION_VIOLATION");
  items.push({
    category: "SAFETY_ALIGNMENT",
    aligned: safetyOk,
    detail:
      strategy.safety.injuryIds.length > 0
        ? `قيود السلامة: ${strategy.safety.injuryIds.join(", ")}`
        : "لا قيود إصابة مسجّلة",
  });

  items.push({
    category: "RECOVERY_ALIGNMENT",
    aligned: generation.validation.errors.every((row) => row.code !== "RECOVERY_SPACING_INVALID"),
    detail: `مدة الجلسة: ${strategy.sessionDurationMinutes} دقيقة`,
  });

  const validationOk =
    generation.validation.status === "VALID" || generation.validation.status === "VALID_WITH_WARNINGS";
  items.push({
    category: "VALIDATION_ALIGNMENT",
    aligned: validationOk && generation.status === "READY",
    detail: `التحقق: ${generation.validation.status} · التوليد: ${generation.status}`,
  });

  return items;
}
