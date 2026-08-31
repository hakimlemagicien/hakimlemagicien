import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import { GOAL_MUSCLE_PROFILES } from "@/lib/platform/prescription/goal-profile";
import type { GoalAction } from "./types";

export type BodyCompositionDependency = "NONE" | "OPTIONAL_CONFIRMATION" | "REQUIRED_FOR_FULL_CONFIRMATION";

export type GoalIntelligenceProfile = {
  goal_id: TrainingV2CanonicalGoal;
  primary_regions: string[];
  secondary_regions: string[];
  maintenance_regions: string[];
  training_success_signals: string[];
  body_composition_dependency: BodyCompositionDependency;
  protected_outcomes: string[];
  regional_under_response_rule: string;
  program_limiter_rule: string;
  body_composition_limiter_rule: string;
  nutrition_review_rule: string;
  conflict_rules: string[];
  allowed_actions: GoalAction[];
  forbidden_shortcuts: string[];
};

const KEEP_SET: GoalAction[] = [
  "KEEP_STRATEGY",
  "REALLOCATE_TRAINING_EMPHASIS",
  "HOLD_TRAINING_ADAPTATION",
  "PROGRAM_REVIEW_REQUIRED",
  "RECOVERY_REVIEW_REQUIRED",
  "BODY_COMPOSITION_REVIEW_REQUIRED",
  "NUTRITION_REVIEW_REQUIRED",
  "GOAL_TRADEOFF_REVIEW",
  "SAFETY_REVIEW",
  "INSUFFICIENT_DATA",
  "COACH_REVIEW_REQUIRED",
];

export const GOAL_INTELLIGENCE_PROFILES: Record<TrainingV2CanonicalGoal, GoalIntelligenceProfile> = {
  GLUTE_GROWTH: {
    goal_id: "GLUTE_GROWTH",
    primary_regions: GOAL_MUSCLE_PROFILES.GLUTE_GROWTH.primary,
    secondary_regions: GOAL_MUSCLE_PROFILES.GLUTE_GROWTH.secondary,
    maintenance_regions: GOAL_MUSCLE_PROFILES.GLUTE_GROWTH.maintenance,
    training_success_signals: [
      "glute_exercise_progression",
      "glute_effective_volume",
      "glute_adherence",
      "glute_recoverable_fatigue",
      "direct_glute_role_coverage",
    ],
    body_composition_dependency: "OPTIONAL_CONFIRMATION",
    protected_outcomes: ["training_recovery", "lower_body_balance", "waist_body_composition_boundary"],
    regional_under_response_rule: "If GLUTES slow and QUADRICEPS fast with recoverable budget, reallocate QUAD→GLUTE. Never add total lower volume.",
    program_limiter_rule: "If direct glute role coverage is low, PROGRAM/EXERCISE_SELECTION limited — not biological slow.",
    body_composition_limiter_rule: "Weight alone is not glute success or failure. Missing measurements → BODY_COMPOSITION_DATA_REQUIRED, not failure.",
    nutrition_review_rule: "Rapid weight loss with declining glute performance → NUTRITION_REVIEW_REQUIRED / TRADEOFF. No calorie writes.",
    conflict_rules: ["aggressive_fat_loss_vs_glute_development", "quad_dominance_vs_glute_priority"],
    allowed_actions: KEEP_SET,
    forbidden_shortcuts: [
      "judge_by_scale_weight",
      "claim_glute_growth_from_hip_thrust_load",
      "add_total_lower_volume",
      "auto_change_goal",
    ],
  },
  SLIM_TONED_WAIST: {
    goal_id: "SLIM_TONED_WAIST",
    primary_regions: GOAL_MUSCLE_PROFILES.SLIM_TONED_WAIST.primary,
    secondary_regions: GOAL_MUSCLE_PROFILES.SLIM_TONED_WAIST.secondary,
    maintenance_regions: GOAL_MUSCLE_PROFILES.SLIM_TONED_WAIST.maintenance,
    training_success_signals: ["core_performance_control", "full_body_resistance_consistency", "recoverable_training"],
    body_composition_dependency: "REQUIRED_FOR_FULL_CONFIRMATION",
    protected_outcomes: ["training_recovery", "resistance_quality", "no_spot_reduction"],
    regional_under_response_rule: "Core training response is not waist reduction. Do not treat core SLOW as need for more abs.",
    program_limiter_rule: "Waist goal is not extreme-primary ab volume. Missing core coverage is not solved by fat-burn abs.",
    body_composition_limiter_rule: "Unchanged waist with good training → BODY_COMPOSITION_REVIEW_REQUIRED.",
    nutrition_review_rule: "Body-composition stagnation with adequate training → NUTRITION_REVIEW_REQUIRED. No calorie writes.",
    conflict_rules: ["core_strength_vs_waist_measurement"],
    allowed_actions: KEEP_SET,
    forbidden_shortcuts: ["spot_reduction", "add_abs_for_waist_fat", "local_fat_burn_exercises"],
  },
  TONED_ARMS_UPPER_BODY: {
    goal_id: "TONED_ARMS_UPPER_BODY",
    primary_regions: GOAL_MUSCLE_PROFILES.TONED_ARMS_UPPER_BODY.primary,
    secondary_regions: GOAL_MUSCLE_PROFILES.TONED_ARMS_UPPER_BODY.secondary,
    maintenance_regions: GOAL_MUSCLE_PROFILES.TONED_ARMS_UPPER_BODY.maintenance,
    training_success_signals: ["biceps_triceps_shoulder_upper_back_progression", "regional_volume", "adherence", "recovery"],
    body_composition_dependency: "OPTIONAL_CONFIRMATION",
    protected_outcomes: ["training_recovery", "upper_body_balance"],
    regional_under_response_rule: "Shoulders FAST + arms SLOW with limited recovery → reallocate, do not add total upper volume.",
    program_limiter_rule: "If arm-direct coverage missing, EXERCISE_SELECTION not biological slow.",
    body_composition_limiter_rule: "Arms looking soft with improving training stimulus may be BODY_COMPOSITION. Do not add endless curls.",
    nutrition_review_rule: "Visual softness with adequate training → BODY_COMPOSITION/NUTRITION review signal only.",
    conflict_rules: ["shoulder_dominance_vs_arm_priority"],
    allowed_actions: KEEP_SET,
    forbidden_shortcuts: ["spot_reduction_arms", "add_total_upper_volume", "declare_visual_goal_from_strength_alone"],
  },
  FEMININE_BALANCED_BODY: {
    goal_id: "FEMININE_BALANCED_BODY",
    primary_regions: GOAL_MUSCLE_PROFILES.FEMININE_BALANCED_BODY.primary,
    secondary_regions: GOAL_MUSCLE_PROFILES.FEMININE_BALANCED_BODY.secondary,
    maintenance_regions: GOAL_MUSCLE_PROFILES.FEMININE_BALANCED_BODY.maintenance,
    training_success_signals: ["balanced_regional_progression", "no_major_primary_under_response", "adherence", "recovery"],
    body_composition_dependency: "OPTIONAL_CONFIRMATION",
    protected_outcomes: ["regional_balance", "training_recovery", "glute_leg_proportion"],
    regional_under_response_rule: "One region FAST vs others does not auto-suppress the progressing region unless recovery/profile requires reallocation.",
    program_limiter_rule: "If one region has no coverage, PROGRAM_LIMITED rather than imbalance biology.",
    body_composition_limiter_rule: "Scale weight is not balanced-body success.",
    nutrition_review_rule: "Body-composition conflict with protected waist/glute balance → TRADEOFF/NUTRITION review.",
    conflict_rules: ["single_region_dominance_vs_balance"],
    allowed_actions: KEEP_SET,
    forbidden_shortcuts: ["one_region_maximum", "judge_by_scale_only", "female_only_rep_magic"],
  },
  FAT_LOSS: {
    goal_id: "FAT_LOSS",
    primary_regions: GOAL_MUSCLE_PROFILES.FAT_LOSS.primary,
    secondary_regions: GOAL_MUSCLE_PROFILES.FAT_LOSS.secondary,
    maintenance_regions: GOAL_MUSCLE_PROFILES.FAT_LOSS.maintenance,
    training_success_signals: ["performance_preserved", "resistance_adherence", "recoverable_training"],
    body_composition_dependency: "REQUIRED_FOR_FULL_CONFIRMATION",
    protected_outcomes: ["strength_preservation", "training_recovery", "resistance_quality"],
    regional_under_response_rule: "Do not add resistance sets because scale is flat.",
    program_limiter_rule: "Balanced resistance coverage supports muscle preservation, not calorie burn as success.",
    body_composition_limiter_rule: "Training good + body stagnant → NUTRITION/BODY_COMPOSITION review. Workout calories are not fat-loss success.",
    nutrition_review_rule: "Aggressive weight drop with performance/recovery decline → TRADEOFF + NUTRITION_REVIEW_REQUIRED.",
    conflict_rules: ["aggressive_loss_vs_performance_preservation"],
    allowed_actions: KEEP_SET,
    forbidden_shortcuts: ["infer_fat_loss_from_workout_calories", "add_sets_for_scale_stall", "spot_reduction"],
  },
  POSTURE_TONED_BACK: {
    goal_id: "POSTURE_TONED_BACK",
    primary_regions: GOAL_MUSCLE_PROFILES.POSTURE_TONED_BACK.primary,
    secondary_regions: GOAL_MUSCLE_PROFILES.POSTURE_TONED_BACK.secondary,
    maintenance_regions: GOAL_MUSCLE_PROFILES.POSTURE_TONED_BACK.maintenance,
    training_success_signals: ["pulling_posterior_core_performance", "adherence", "recoverability"],
    body_composition_dependency: "NONE",
    protected_outcomes: ["training_recovery", "non_medical_scope"],
    regional_under_response_rule: "Training-side posterior response only. No clinical posture diagnosis.",
    program_limiter_rule: "If pulling/posterior roles missing, PROGRAM_LIMITED.",
    body_composition_limiter_rule: "Appearance/posture photos are not machine truth.",
    nutrition_review_rule: "Not a nutrition-owned posture correction goal.",
    conflict_rules: ["no_medical_posture_claim"],
    allowed_actions: KEEP_SET,
    forbidden_shortcuts: ["claim_posture_corrected", "medical_diagnosis", "promise_anatomical_correction"],
  },
};

export function getGoalIntelligenceProfile(goalId: TrainingV2CanonicalGoal): GoalIntelligenceProfile {
  return GOAL_INTELLIGENCE_PROFILES[goalId];
}

export function regionFamily(region: string): string {
  const upper = region.toUpperCase();
  if (upper.includes("GLUTE")) return "GLUTES";
  if (upper.includes("QUAD")) return "QUADRICEPS";
  if (upper === "ANTERIOR_DELTOID" || upper === "LATERAL_DELTOID" || upper === "POSTERIOR_DELTOID") return "SHOULDERS";
  if (upper === "RECTUS_ABDOMINIS" || upper === "OBLIQUES") return "CORE";
  return upper;
}

export function isPrimaryRegion(goalId: TrainingV2CanonicalGoal, region: string): boolean {
  const profile = GOAL_INTELLIGENCE_PROFILES[goalId];
  const family = regionFamily(region);
  return profile.primary_regions.some((item) => regionFamily(item) === family || item === region);
}
