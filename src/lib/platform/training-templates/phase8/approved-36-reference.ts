/**
 * Provisional approved-36 template keys for Phase 8 readiness classification.
 *
 * Official content pack is NOT yet in the repository (architecture Phase 1 gap).
 * These keys follow the locked naming convention and product family × level × env plan.
 * Exercise sequences for non-Pilot rows are NOT approved programming — classify readiness only.
 */
import type { PrimaryTrainingStrategy } from "../primary-strategy";
import type { TemplateEnvironment, TemplateLevel } from "../contract";

export type Approved36TemplateRef = {
  template_key: string;
  primary_strategy: PrimaryTrainingStrategy;
  level: TemplateLevel;
  environment: TemplateEnvironment;
  days_per_week: 3 | 4 | 5;
  family: string;
  /** Pilot 4 has approved exercise sequences; others are dimension-only until content pack lands. */
  exercise_sequence_status: "APPROVED_EXERCISE" | "CANDIDATE_FOR_REVIEW" | "NOT_YET_DEFINED";
  female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE" | "STANDARD_OK";
};

export const APPROVED_36_TEMPLATE_REFS: Approved36TemplateRef[] = [
  // FAT_LOSS (4)
  { template_key: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "FAT_LOSS", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "FAT_LOSS", exercise_sequence_status: "APPROVED_EXERCISE", female_media_policy: "STANDARD_OK" },
  { template_key: "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "FAT_LOSS", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "FAT_LOSS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "FAT_LOSS", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "FAT_LOSS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D", primary_strategy: "FAT_LOSS", level: "INTERMEDIATE", environment: "HOME", days_per_week: 4, family: "FAT_LOSS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // MUSCLE_GAIN (4)
  { template_key: "MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "MUSCLE_GAIN", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "MUSCLE_GAIN", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "MUSCLE_GAIN", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "MUSCLE_GAIN", exercise_sequence_status: "APPROVED_EXERCISE", female_media_policy: "STANDARD_OK" },
  { template_key: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D", primary_strategy: "MUSCLE_GAIN", level: "INTERMEDIATE", environment: "HOME", days_per_week: 4, family: "MUSCLE_GAIN", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D", primary_strategy: "MUSCLE_GAIN", level: "INTERMEDIATE", environment: "GYM", days_per_week: 5, family: "MUSCLE_GAIN", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // BODY_RECOMPOSITION (4)
  { template_key: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "BODY_RECOMPOSITION", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "BODY_RECOMPOSITION", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "BODY_RECOMPOSITION", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "BODY_RECOMPOSITION", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "BODY_RECOMPOSITION", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "BODY_RECOMPOSITION", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D", primary_strategy: "BODY_RECOMPOSITION", level: "INTERMEDIATE", environment: "HOME", days_per_week: 4, family: "BODY_RECOMPOSITION", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // GENERAL_FITNESS (4)
  { template_key: "GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "GENERAL_FITNESS", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "GENERAL_FITNESS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "GENERAL_FITNESS", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "GENERAL_FITNESS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "GENERAL_FITNESS_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "GENERAL_FITNESS", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "GENERAL_FITNESS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "GENERAL_FITNESS_PROGRESS_INTERMEDIATE_HOME_4D", primary_strategy: "GENERAL_FITNESS", level: "INTERMEDIATE", environment: "HOME", days_per_week: 4, family: "GENERAL_FITNESS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // GLUTE_FOCUS (4) — HOME variants intentional product gaps historically
  { template_key: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "GLUTE_FOCUS", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "GLUTE_FOCUS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE" },
  { template_key: "GLUTE_FOCUS_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "GLUTE_FOCUS", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "GLUTE_FOCUS", exercise_sequence_status: "NOT_YET_DEFINED", female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE" },
  { template_key: "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "GLUTE_FOCUS", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "GLUTE_FOCUS", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE" },
  { template_key: "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_HOME_4D", primary_strategy: "GLUTE_FOCUS", level: "INTERMEDIATE", environment: "HOME", days_per_week: 4, family: "GLUTE_FOCUS", exercise_sequence_status: "NOT_YET_DEFINED", female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE" },
  // ATHLETIC_PERFORMANCE (4)
  { template_key: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "ATHLETIC_PERFORMANCE", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "ATHLETIC_PERFORMANCE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "ATHLETIC_PERFORMANCE", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "ATHLETIC_PERFORMANCE", exercise_sequence_status: "APPROVED_EXERCISE", female_media_policy: "STANDARD_OK" },
  { template_key: "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "ATHLETIC_PERFORMANCE", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "ATHLETIC_PERFORMANCE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D", primary_strategy: "ATHLETIC_PERFORMANCE", level: "INTERMEDIATE", environment: "HOME", days_per_week: 4, family: "ATHLETIC_PERFORMANCE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // STRENGTH (3) — GYM-primary
  { template_key: "STRENGTH_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "STRENGTH", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "STRENGTH", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "STRENGTH", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "STRENGTH", exercise_sequence_status: "APPROVED_EXERCISE", female_media_policy: "STANDARD_OK" },
  { template_key: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_5D", primary_strategy: "STRENGTH", level: "INTERMEDIATE", environment: "GYM", days_per_week: 5, family: "STRENGTH", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // ENDURANCE (3)
  { template_key: "ENDURANCE_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "ENDURANCE", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "ENDURANCE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "ENDURANCE", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "ENDURANCE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D", primary_strategy: "ENDURANCE", level: "INTERMEDIATE", environment: "GYM", days_per_week: 4, family: "ENDURANCE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // MOBILITY_FUNCTIONAL (3)
  { template_key: "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "MOBILITY_FUNCTIONAL", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "MOBILITY_FUNCTIONAL", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "MOBILITY_FUNCTIONAL", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "MOBILITY_FUNCTIONAL", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_3D", primary_strategy: "MOBILITY_FUNCTIONAL", level: "INTERMEDIATE", environment: "HOME", days_per_week: 3, family: "MOBILITY_FUNCTIONAL", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  // HEALTHY_AGING_ACTIVE_LIFE (3)
  { template_key: "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D", primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE", level: "BEGINNER", environment: "HOME", days_per_week: 3, family: "HEALTHY_AGING_ACTIVE_LIFE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D", primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE", level: "BEGINNER", environment: "GYM", days_per_week: 3, family: "HEALTHY_AGING_ACTIVE_LIFE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
  { template_key: "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_3D", primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE", level: "INTERMEDIATE", environment: "HOME", days_per_week: 3, family: "HEALTHY_AGING_ACTIVE_LIFE", exercise_sequence_status: "CANDIDATE_FOR_REVIEW", female_media_policy: "STANDARD_OK" },
];

export const APPROVED_36_COUNT = 36;
