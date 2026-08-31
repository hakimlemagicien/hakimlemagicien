import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import type { WorkoutSetType } from "@/lib/platform/training-v2-contracts";

export type SetWriteInput = {
  actualLoad: number | null;
  actualReps: number | null;
  actualDurationSeconds: number | null;
  effortV2: TrainingV2Effort | null;
  skipped: boolean;
  setType: WorkoutSetType;
  prescriptionMode: "REPS" | "DURATION" | "INTERVAL" | "DISTANCE" | "OTHER" | string | null;
  isBodyweight: boolean;
  requireEffort: boolean;
};

export type SetWriteValidation =
  | { ok: true }
  | { ok: false; reason: "INVALID_NUMBER" | "MISSING_REPS" | "MISSING_DURATION" | "MISSING_EFFORT" };

export function parseNonNegativeNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function validateSetWrite(input: SetWriteInput): SetWriteValidation {
  if (input.skipped) return { ok: true };
  if (input.actualLoad != null && (!Number.isFinite(input.actualLoad) || input.actualLoad < 0)) {
    return { ok: false, reason: "INVALID_NUMBER" };
  }
  if (input.prescriptionMode === "DURATION" || input.prescriptionMode === "INTERVAL") {
    if (input.actualDurationSeconds == null) return { ok: false, reason: "MISSING_DURATION" };
  } else if (input.actualReps == null) {
    return { ok: false, reason: "MISSING_REPS" };
  }
  if (input.requireEffort && !input.effortV2) return { ok: false, reason: "MISSING_EFFORT" };
  return { ok: true };
}

export function loadForPersistence(input: {
  isBodyweight: boolean;
  actualLoad: number | null;
}): number | null {
  if (input.isBodyweight && (input.actualLoad == null || input.actualLoad === 0)) return null;
  return input.actualLoad;
}

export const SIDE_SPECIFIC_LOGGING_DEFERRED = "SIDE_SPECIFIC_LOGGING_DEFERRED" as const;
