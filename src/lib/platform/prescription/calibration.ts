import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import { incrementIsSafe } from "./load-source";
import type { CalibrationAdjustment, CalibrationAdjustmentInput } from "./types";

export function getCalibrationAdjustment(input: CalibrationAdjustmentInput): CalibrationAdjustment {
  if (input.safetyReview) {
    return { action: "SAFETY_REVIEW", next_load: input.actualLoad, reason: "SAFETY_REVIEW" };
  }
  const effort = input.effort;
  const belowMin = input.actualValue < input.targetMin;
  const atLeastMin = input.actualValue >= input.targetMin;
  const atOrAboveMax = input.actualValue >= input.targetMax;

  if (belowMin && (effort === "FAILURE" || effort === "VERY_HARD")) {
    if (input.actualLoad != null && input.equipmentIncrementKg != null && input.actualLoad > input.equipmentIncrementKg) {
      return {
        action: "REDUCE",
        next_load: input.actualLoad - input.equipmentIncrementKg,
        reason: "BELOW_MIN_HARD",
      };
    }
    return { action: "RECALIBRATE", next_load: null, reason: "BELOW_MIN_HARD" };
  }

  if (atLeastMin && effort === "IDEAL") {
    return { action: "KEEP", next_load: input.actualLoad, reason: "TARGET_IDEAL" };
  }

  if (atOrAboveMax && effort === "EASY") {
    if (
      input.prescriptionMode === "REPS" &&
      input.actualLoad != null &&
      input.equipmentIncrementKg != null &&
      incrementIsSafe(input.actualLoad, input.equipmentIncrementKg)
    ) {
      return {
        action: "SMALL_INCREASE",
        next_load: input.actualLoad + input.equipmentIncrementKg,
        reason: "EASY_VALID_INCREMENT",
      };
    }
    return { action: "KEEP", next_load: input.actualLoad, reason: "EASY_NO_SAFE_INCREMENT" };
  }

  if (atLeastMin && effort === "VERY_HARD") {
    return { action: "KEEP", next_load: input.actualLoad, reason: "TARGET_VERY_HARD_NO_INCREASE" };
  }

  if (effort === "FAILURE") {
    return { action: "REDUCE", next_load: null, reason: "FAILURE" };
  }

  return { action: "KEEP", next_load: input.actualLoad, reason: "STABLE_DEFAULT" };
}
