export { getCoreExercisePrescription } from "./engine";
export { getCalibrationAdjustment } from "./calibration";
export { selectEligibleExercise } from "./selection";
export { filterEligibleExercises, explainEligibility, isMetadataApproved } from "./eligibility";
export { resolveCanonicalGoal, getGoalMuscleProfile, musclePriorityFor } from "./goal-profile";
export { deriveExerciseExperienceState, deriveTrainingLevel, baselineEstablished } from "./experience";
export { resolveLoadSource } from "./load-source";
export {
  CORE_PRESCRIPTION_ENGINE,
  CALIBRATION_ADJUSTMENT_ENGINE,
  RECENT_HISTORY_DAYS,
} from "./types";
export type {
  CorePrescriptionContext,
  CoreExercisePrescription,
  CalibrationAdjustment,
  CalibrationAdjustmentInput,
  SelectionContext,
  AssignedSnapshotPrescription,
  LoadSource,
  CorePrescriptionStatus,
  PrescriptionReason,
} from "./types";
