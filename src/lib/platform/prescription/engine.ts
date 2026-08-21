import type {
  ExerciseExperienceState,
  PrescriptionState,
} from "@/lib/platform/training-v2-contracts";
import { explainEligibility } from "./eligibility";
import { prescribeTargetEffort, prescribeRest } from "./effort-rest";
import { musclePriorityFor, resolveCanonicalGoal } from "./goal-profile";
import { applyProgressionToLoad } from "@/lib/platform/progression/apply";
import { resolveLoadSource } from "./load-source";
import { isStrengthEligible, prescribeRepOrDuration } from "./ranges";
import { prescribeWarmupSets, prescribeWorkingSets, resolveExercisePriority } from "./sets";
import type {
  CoreExercisePrescription,
  CorePrescriptionContext,
  PrescriptionReason,
} from "./types";

function emptyPrescription(
  context: CorePrescriptionContext,
  status: CoreExercisePrescription["status"],
  reason: PrescriptionReason,
  extra: Partial<CoreExercisePrescription> = {},
): CoreExercisePrescription {
  const goal = resolveCanonicalGoal(context.goalId);
  return {
    external_id: context.exercise.external_id,
    goal_id: goal.canonicalId,
    muscle_priority: null,
    exercise_priority: null,
    movement_role: context.exercise.primary_movement_role,
    mechanics: context.exercise.mechanics,
    prescription_mode: context.exercise.prescription_mode,
    training_level: context.trainingLevel,
    exercise_experience: context.exerciseExperience,
    prescription_state: context.prescriptionState ?? null,
    working_sets: context.assigned?.sets ?? null,
    warmup_sets: 0,
    set_type_working: "WORKING",
    set_type_warmup: null,
    rep_min: null,
    rep_max: null,
    fixed_reps: null,
    duration_min: null,
    duration_max: null,
    target_effort: null,
    failure_allowed: false,
    failure_required: false,
    recommended_rest_seconds: context.assigned?.rest_seconds ?? null,
    rest_reason: null,
    load_source: null,
    prescribed_load: null,
    history_reference_load: null,
    confidence: "LOW",
    prescription_reason: reason,
    status,
    selection_reason: null,
    assigned: context.assigned ?? null,
    used_legacy_fallback: Boolean(context.assigned),
    ...extra,
  };
}

function isCalibrating(
  experience: ExerciseExperienceState,
  state: PrescriptionState | null | undefined,
) {
  return experience === "NEW" || experience === "CALIBRATING" || state === "CALIBRATING";
}

export function getCoreExercisePrescription(
  context: CorePrescriptionContext,
): CoreExercisePrescription {
  try {
    return computePrescription(context);
  } catch {
    return emptyPrescription(context, "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", {
      used_legacy_fallback: Boolean(context.assigned),
    });
  }
}

function computePrescription(context: CorePrescriptionContext): CoreExercisePrescription {
  if (context.safetyReview || context.prescriptionState === "SAFETY_REVIEW") {
    return emptyPrescription(context, "SAFETY_REVIEW_REQUIRED", "SAFETY_REVIEW");
  }

  const goal = resolveCanonicalGoal(context.goalId);
  if (!goal.canonicalId) {
    return emptyPrescription(context, "GOAL_MAPPING_REQUIRED", "GOAL_UNMAPPED");
  }

  const eligibility = explainEligibility({
    exercise: context.exercise,
    location: context.location,
    availableEquipment: context.availableEquipment,
    trainingLevel: context.trainingLevel,
  });

  if (eligibility === "INACTIVE_OR_UNAPPROVED") {
    if (context.assigned) {
      return emptyPrescription(context, "READY", "V2_FALLBACK_LEGACY_PRESCRIPTION", {
        used_legacy_fallback: true,
        confidence: "LOW",
      });
    }
    return emptyPrescription(context, "EXERCISE_METADATA_REQUIRED", "METADATA_REQUIRED");
  }
  if (eligibility === "EQUIPMENT_CONTEXT_REQUIRED") {
    return emptyPrescription(context, "EQUIPMENT_CONTEXT_REQUIRED", "INSUFFICIENT_DATA");
  }
  if (eligibility === "LOCATION_INCOMPATIBLE" || eligibility === "EQUIPMENT_UNAVAILABLE") {
    if (context.assigned) {
      return emptyPrescription(context, "READY", "V2_FALLBACK_LEGACY_PRESCRIPTION", {
        used_legacy_fallback: true,
      });
    }
    return emptyPrescription(context, "EQUIPMENT_CONTEXT_REQUIRED", "EQUIPMENT_FILTERED");
  }
  if (eligibility) {
    return emptyPrescription(context, "INSUFFICIENT_DATA", "INSUFFICIENT_DATA");
  }

  const calibrating = isCalibrating(context.exerciseExperience, context.prescriptionState);
  const musclePriority = musclePriorityFor(goal.canonicalId, context.exercise.primary_muscles);
  const exercisePriority = resolveExercisePriority(musclePriority, context.exercise.mechanics);
  const strengthEligible = isStrengthEligible({
    trainingLevel: context.trainingLevel,
    exerciseExperience: context.exerciseExperience,
    mechanics: context.exercise.mechanics,
  });
  const ranges = prescribeRepOrDuration({
    exercise: context.exercise,
    trainingLevel: context.trainingLevel,
    strengthEligible,
  });
  if (
    context.progression &&
    (context.progression.action === "INCREASE_DURATION" ||
      context.progression.action === "KEEP_DURATION") &&
    context.progression.next_duration_max != null
  ) {
    ranges.duration_min = context.progression.next_duration_min;
    ranges.duration_max = context.progression.next_duration_max;
  }
  const workingSets = prescribeWorkingSets({
    trainingLevel: context.trainingLevel,
    exerciseExperience: context.exerciseExperience,
    exercisePriority,
    mechanics: context.exercise.mechanics,
    calibrating,
  });
  const warmupSets = prescribeWarmupSets({
    exercise: context.exercise,
    trainingLevel: context.trainingLevel,
    calibrating,
  });
  const effort = prescribeTargetEffort({
    trainingLevel: context.trainingLevel,
    exerciseExperience: context.exerciseExperience,
    mechanics: context.exercise.mechanics,
    calibrating,
  });
  const rest = prescribeRest({
    exercise: context.exercise,
    strengthEmphasis: strengthEligible,
    calibrating,
  });
  const load = resolveLoadSource({
    exercise: context.exercise,
    history: context.recentHistory,
    prescriptionState: context.prescriptionState,
    now: context.now,
  });
  const progressed = applyProgressionToLoad({
    progression: context.progression,
    historyLoad: load.prescribed_load,
    coachProtected: context.coachProtected,
    coachLoad: context.assigned?.suggested_weight_kg ?? null,
  });
  if (
    context.progression &&
    !context.coachProtected &&
    !calibrating &&
    context.prescriptionState !== "RECONDITIONING"
  ) {
    load.prescribed_load = progressed.prescribed_load;
    load.load_source = progressed.load_source ?? load.load_source;
  }

  let status: CoreExercisePrescription["status"] = "READY";
  let reason: PrescriptionReason = "COMPOUND_HYPERTROPHY";
  let confidence: CoreExercisePrescription["confidence"] = "MODERATE";

  if (
    context.exercise.prescription_mode === "DURATION" ||
    context.exercise.prescription_mode === "INTERVAL"
  ) {
    reason = "TIMED_EXERCISE";
  } else if (context.exercise.is_bodyweight) {
    reason = "BODYWEIGHT_PRESCRIPTION";
  } else if (context.exercise.mechanics === "ISOLATION") {
    reason = "ISOLATION_ACCESSORY";
  }

  if (context.prescriptionState === "RECONDITIONING") {
    status = "RECALIBRATION_REQUIRED";
    reason = "RECONDITIONING_RECALIBRATION";
    confidence = "LOW";
  } else if (load.load_source === "RECENT_HISTORY") {
    reason = "RECENT_HISTORY_REUSED";
    confidence = "HIGH";
  } else if (load.load_source === "BODYWEIGHT" || load.load_source === "NO_LOAD") {
    confidence = calibrating ? "MODERATE" : "HIGH";
  } else if (load.load_source === "UNKNOWN_REQUIRES_CALIBRATION" || calibrating) {
    status = "CALIBRATION_REQUIRED";
    reason =
      context.trainingLevel === "UNASSESSED"
        ? "BEGINNER_CONSERVATIVE_START"
        : "NEW_EXERCISE_CALIBRATION";
    confidence = "LOW";
  } else if (musclePriority === "PRIMARY" && status === "READY") {
    reason = "GOAL_PRIMARY_MUSCLE";
  }

  if (context.severeReadiness && status === "READY") {
    confidence = "LOW";
  }

  return {
    external_id: context.exercise.external_id,
    goal_id: goal.canonicalId,
    muscle_priority: musclePriority,
    exercise_priority: exercisePriority,
    movement_role: context.exercise.primary_movement_role,
    mechanics: context.exercise.mechanics,
    prescription_mode: context.exercise.prescription_mode,
    training_level: context.trainingLevel,
    exercise_experience: context.exerciseExperience,
    prescription_state: context.prescriptionState ?? (calibrating ? "CALIBRATING" : "NORMAL"),
    working_sets: workingSets,
    warmup_sets: warmupSets,
    set_type_working: "WORKING",
    set_type_warmup: warmupSets > 0 ? "WARMUP" : null,
    rep_min: ranges.rep_min,
    rep_max: ranges.rep_max,
    fixed_reps: ranges.fixed_reps,
    duration_min: ranges.duration_min,
    duration_max: ranges.duration_max,
    target_effort: effort.target_effort,
    failure_allowed: effort.failure_allowed,
    failure_required: false,
    recommended_rest_seconds: rest.recommended_rest_seconds,
    rest_reason: rest.rest_reason,
    load_source: load.load_source,
    prescribed_load: load.prescribed_load,
    history_reference_load: load.history_reference_load,
    confidence,
    prescription_reason: reason,
    status,
    selection_reason: null,
    assigned: context.assigned ?? null,
    used_legacy_fallback: false,
  };
}
