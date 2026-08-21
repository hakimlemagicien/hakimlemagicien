import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { explainEligibility } from "@/lib/platform/prescription/eligibility";
import { getGoalMuscleProfile } from "@/lib/platform/prescription/goal-profile";
import { getGoalIntelligenceProfile, regionFamily } from "@/lib/platform/goal-intelligence/profiles";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import { requiredMovementRoles, hasPushPullCoverage } from "./roles";
import type { SessionDemand } from "./roles";
import { volumeForFamily, leadVolumeRegions } from "./volume";
import type {
  ProgramCandidate,
  ProgramGenerationContext,
  RegionalVolumeSummary,
  RegionalVolumeTarget,
  ValidationIssue,
  ValidationResult,
} from "./types";

function issue(
  code: ValidationIssue["code"],
  severity: ValidationIssue["severity"],
  message: string,
  session_index?: number,
): ValidationIssue {
  return { code, severity, message, session_index };
}

function catalogMap(exercises: ExerciseV2Metadata[]) {
  return new Map(exercises.map((item) => [item.external_id, item]));
}

function demandOf(role: string): SessionDemand {
  if (role === "LOWER_GLUTE_PRIORITY" || role === "UPPER_PRIORITY" || role === "PULL_POSTERIOR") return "HIGH";
  if (role === "CORE_SUPPORT") return "LOW";
  return "MODERATE";
}

export function validateTrainingProgram(
  candidate: ProgramCandidate | null,
  context: ProgramGenerationContext,
  extras?: {
    regionalVolume?: RegionalVolumeSummary;
    targets?: RegionalVolumeTarget[];
    missingSlots?: Array<{ role: string; muscleFamily: string }>;
    spotReductionAttempted?: boolean;
  },
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const add = (row: ValidationIssue) => {
    if (row.severity === "error") errors.push(row);
    else warnings.push(row);
  };

  if (context.waistStagnationSpotReduction || extras?.spotReductionAttempted) {
    add(issue("SPOT_REDUCTION_LOGIC_INVALID", "error", "Spot reduction is not valid Goal logic."));
  }

  if (![2, 3, 4, 5].includes(context.daysPerWeek)) {
    add(issue("UNSUPPORTED_FREQUENCY", "error", `Frequency ${context.daysPerWeek} is outside Phase 10 2–5 support.`));
  }

  if (!candidate) {
    if (extras?.missingSlots?.length) {
      add(
        issue(
          "NO_VALID_EXERCISE_CANDIDATE",
          "error",
          extras.missingSlots
            .map((slot) => `${slot.role}/${slot.muscleFamily}`)
            .join(", "),
        ),
      );
    } else {
      add(issue("PROGRAM_GENERATION_BLOCKED", "error", "No program candidate."));
    }
    return { status: "INVALID", errors, warnings };
  }

  const goal = candidate.goal_id;
  const profile = getGoalMuscleProfile(goal);
  const intel = getGoalIntelligenceProfile(goal);
  const catalog = catalogMap(context.exercises);
  const sessions = candidate.sessions;
  const indexes = sessions.map((session) => session.sequence_index);
  const unique = new Set(indexes);

  if (sessions.length !== context.daysPerWeek && [2, 3, 4, 5].includes(context.daysPerWeek)) {
    add(issue("INVALID_SEQUENCE", "error", "Program day count does not match intended frequency."));
  }
  if (unique.size !== indexes.length) {
    add(issue("DUPLICATE_SESSION_INDEX", "error", "Duplicate sequence positions."));
  }
  const expected = sessions.map((_, index) => index);
  if (indexes.slice().sort((a, b) => a - b).join(",") !== expected.join(",")) {
    add(issue("INVALID_SEQUENCE", "error", "Sequence indexes must be 0..n-1."));
  }

  const usedRoles = new Set<string>();
  let trunkFlexion = 0;
  let intervalCount = 0;

  for (const session of sessions) {
    if (!session.program_day_id || !session.role) {
      add(issue("INVALID_SEQUENCE", "error", "Session missing stable id/role.", session.sequence_index));
    }
    const ids = session.exercises.map((item) => item.external_id);
    if (new Set(ids).size !== ids.length) {
      add(issue("REDUNDANT_STIMULUS_EXCESS", "error", "Duplicate exercise in the same session.", session.sequence_index));
    }
    const roleCounts = new Map<string, number>();
    for (const exercise of session.exercises) {
      const meta = catalog.get(exercise.external_id);
      if (!meta) {
        add(issue("UNKNOWN_EXERCISE", "error", `Unknown exercise ${exercise.external_id}`, session.sequence_index));
        continue;
      }
      if (exercise.suggested_weight_kg != null) {
        add(issue("PROGRAM_CAPACITY_EXCEEDED", "error", "Program snapshot must not bake working load.", session.sequence_index));
      }
      const eligibility = explainEligibility({
        exercise: meta,
        location: context.location,
        availableEquipment: context.availableEquipment,
        trainingLevel: context.trainingLevel,
      });
      if (eligibility === "EQUIPMENT_UNAVAILABLE") {
        add(issue("EQUIPMENT_MISMATCH", "error", `${exercise.external_id} equipment mismatch`, session.sequence_index));
      } else if (eligibility === "LOCATION_INCOMPATIBLE") {
        add(issue("LOCATION_MISMATCH", "error", `${exercise.external_id} location mismatch`, session.sequence_index));
      } else if (eligibility === "COMPLEXITY_INAPPROPRIATE") {
        add(issue("PROGRAM_CAPACITY_EXCEEDED", "error", `${exercise.external_id} exceeds training level`, session.sequence_index));
      }
      if ((context.excludedExternalIds ?? []).includes(exercise.external_id)) {
        add(issue("SAFETY_RESTRICTION_VIOLATION", "error", `${exercise.external_id} is safety-excluded`, session.sequence_index));
      }
      if (meta.primary_movement_role === "TRUNK_FLEXION") trunkFlexion += 1;
      if (meta.primary_movement_role === "INTERVAL_CONDITIONING" || meta.prescription_mode === "INTERVAL") intervalCount += 1;
      if (meta.primary_movement_role) {
        usedRoles.add(meta.primary_movement_role);
        roleCounts.set(meta.primary_movement_role, (roleCounts.get(meta.primary_movement_role) ?? 0) + 1);
      }
    }
    for (const [role, count] of roleCounts) {
      if (count >= 3) add(issue("REDUNDANT_STIMULUS_EXCESS", "error", `Excess ${role} stacking`, session.sequence_index));
      else if (count >= 2) add(issue("REDUNDANT_STIMULUS_EXCESS", "warning", `Repeated ${role} in session`, session.sequence_index));
    }
    if (session.estimated_minutes > context.availableMinutes) {
      add(issue("SESSION_DURATION_EXCEEDED", "error", `Session ${session.sequence_index} exceeds available time`, session.sequence_index));
    } else if (session.estimated_minutes >= context.availableMinutes * 0.9) {
      add(issue("SESSION_NEAR_DURATION_LIMIT", "warning", `Session ${session.sequence_index} near duration limit`, session.sequence_index));
    }

    const required = session.exercises.filter((item) => item.muscle_priority === "PRIMARY" || item.exercise_priority === "REQUIRED");
    if (required.length) {
      const firstRequired = Math.min(...required.map((item) => item.order_index));
      const leadingLow = session.exercises.filter(
        (item) => item.order_index < firstRequired && (item.exercise_priority === "OPTIONAL" || item.muscle_priority === "MAINTENANCE"),
      );
      if (leadingLow.length >= 2) {
        add(issue("PROGRAM_CAPACITY_EXCEEDED", "warning", "Primary work is buried after low-priority fatigue.", session.sequence_index));
      }
    }
  }

  for (let index = 1; index < sessions.length; index += 1) {
    const prev = sessions[index - 1];
    const current = sessions[index];
    const overlap = prev.primary_regions.some((region) => current.primary_regions.includes(region));
    if (overlap && demandOf(prev.role) === "HIGH" && demandOf(current.role) === "HIGH") {
      add(
        issue(
          "RECOVERY_SPACING_INVALID",
          "error",
          `Consecutive high-demand overlap ${prev.role} → ${current.role}`,
          current.sequence_index,
        ),
      );
    } else if (overlap && (demandOf(prev.role) === "HIGH" || demandOf(current.role) === "HIGH")) {
      add(issue("HIGH_REGIONAL_OVERLAP", "warning", "Adjacent sessions share a primary region.", current.sequence_index));
    }
  }

  const volume = extras?.regionalVolume ?? {};
  const lead = leadVolumeRegions(goal);
  for (const region of lead.length ? lead : profile.primary) {
    const effective = volumeForFamily(volume, region).effective;
    if (effective <= 0) {
      add(issue("MISSING_PRIMARY_REGION", "error", `Primary region ${regionFamily(region)} has no stimulus.`));
    }
  }
  if (goal === "TONED_ARMS_UPPER_BODY") {
    const lower = volumeForFamily(volume, "GLUTES").effective + volumeForFamily(volume, "QUADRICEPS").effective;
    if (lower < 1) add(issue("MISSING_PRIMARY_REGION", "error", "Upper-body Goal still requires lower-body maintenance."));
  }

  const targets = extras?.targets ?? [];
  for (const target of targets) {
    if (target.min <= 0 && target.max >= 99) continue;
    const family = regionFamily(target.region);
    const isLead = lead.includes(family) || (lead.length === 0 && profile.primary.some((region) => regionFamily(region) === family));
    if (!isLead) continue;
    const effective = volumeForFamily(volume, target.region).effective;
    if (effective + 0.01 < target.min) add(issue("REGIONAL_VOLUME_BELOW_MIN", "error", `${target.region} below min`));
    if (effective > target.max + 0.01) add(issue("REGIONAL_VOLUME_ABOVE_MAX", "error", `${target.region} above max`));
    else if (effective >= target.max * 0.9) add(issue("PRIMARY_VOLUME_NEAR_MAX", "warning", `${target.region} near max`));
  }

  for (const role of requiredMovementRoles(goal)) {
    if (!usedRoles.has(role)) add(issue("MISSING_MOVEMENT_ROLE", "error", `Missing movement role ${role}`));
  }
  if (
    (goal === "FAT_LOSS" || goal === "FEMININE_BALANCED_BODY" || goal === "SLIM_TONED_WAIST") &&
    !hasPushPullCoverage(usedRoles)
  ) {
    add(issue("MISSING_MOVEMENT_ROLE", "error", "Missing push/pull coverage"));
  }

  if ((goal === "SLIM_TONED_WAIST" || goal === "FAT_LOSS") && trunkFlexion >= 3) {
    add(issue("SPOT_REDUCTION_LOGIC_INVALID", "error", "Excess trunk-flexion is not a waist/fat-loss strategy."));
  }
  if (goal === "FAT_LOSS" && intervalCount > 0) {
    add(issue("PROTECTED_OUTCOME_CONFLICT", "error", "Fat Loss must not require HIIT/interval shortcuts."));
  }
  if (goal === "GLUTE_GROWTH") {
    const glutes = volumeForFamily(volume, "GLUTES").effective;
    const quads = volumeForFamily(volume, "QUADRICEPS").effective;
    if (glutes > 0 && quads > glutes * 1.5) {
      add(issue("PROTECTED_OUTCOME_CONFLICT", "error", "Glute Goal achieved mainly via excessive Quad volume."));
    }
  }
  if (intel.protected_outcomes.includes("no_spot_reduction") && extras?.spotReductionAttempted) {
    add(issue("PROTECTED_OUTCOME_CONFLICT", "error", "Protected outcome no_spot_reduction violated."));
  }
  if (extras?.missingSlots?.length) {
    add(issue("NO_VALID_EXERCISE_CANDIDATE", "error", "Required slot had no safe library candidate."));
  }

  const uniqueExercises = new Set(sessions.flatMap((session) => session.exercises.map((item) => item.external_id)));
  if (uniqueExercises.size <= 3 && sessions.length >= 3) add(issue("LOW_EXERCISE_VARIETY", "warning", "Very low exercise variety."));
  if (uniqueExercises.size >= sessions.length * 6) add(issue("HIGH_EXERCISE_VARIETY", "warning", "Unusually high variety."));
  if (sessions.some((session) => session.exercises.some((item) => item.calibration_required))) {
    add(issue("NEW_EXERCISE_CALIBRATION_REQUIRED", "warning", "New exercise requires calibration."));
  }
  if (context.scheduleCapacityMismatch) {
    add(issue("SCHEDULE_CAPACITY_MISMATCH", "warning", "Requested frequency may exceed demonstrated capacity."));
  }

  const status = errors.length ? "INVALID" : warnings.length ? "VALID_WITH_WARNINGS" : "VALID";
  return { status, errors, warnings };
}

export function canActivateProgram(validation: ValidationResult, generationStatus: string) {
  if (generationStatus !== "READY") return false;
  return validation.status === "VALID" || validation.status === "VALID_WITH_WARNINGS";
}

export function assertGoalId(goal: TrainingV2CanonicalGoal) {
  return goal;
}
