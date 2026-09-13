/**
 * Template Resolver — input/output contracts (Phase 3).
 * Recommendation only — never assigns.
 */

import type {
  HomeRequirementKey,
  LibraryReadinessState,
  PreferredDemonstrator,
  ProgramTemplateContractV1,
  TemplateEnvironment,
  TemplateLevel,
  TemplateReviewSignal,
  TemplateStatus,
} from "./contract";
import type { PrimaryTrainingStrategy } from "./primary-strategy";

export type EquipmentCompatibility = "SUPPORTED" | "REVIEW_REQUIRED" | "INCOMPATIBLE" | "UNKNOWN";

export type TemplateResolverStatus =
  | "MATCHED"
  | "MATCHED_WITH_REVIEW"
  | "NO_EXACT_MATCH"
  | "NO_COMPATIBLE_TEMPLATE"
  | "INSUFFICIENT_CONTEXT"
  | "BLOCKED";

export type FallbackClass =
  | "EXACT_MATCH"
  | "CONTEXTUAL_MATCH"
  | "REVIEW_REQUIRED_MATCH"
  | "NO_EXACT_MATCH"
  | "NO_COMPATIBLE_TEMPLATE";

export type HomeCapabilityMap = Partial<Record<HomeRequirementKey, boolean | "unknown">>;

export type TemplateResolverInput = {
  client_id?: string | null;
  quiz_goal_id?: string | null;
  training_v2_goal_id?: string | null;
  /** When set, skips quiz→strategy mapping. */
  primary_strategy?: PrimaryTrainingStrategy | null;
  /**
   * Waist context: when true and quiz is waist (or V2 SLIM_TONED_WAIST),
   * Primary Strategy resolves to FAT_LOSS instead of default BODY_RECOMPOSITION.
   */
  fat_loss_priority?: boolean;
  training_level?: TemplateLevel | string | null;
  training_environment?: TemplateEnvironment | "BOTH" | "ANYWHERE" | string | null;
  training_days_per_week?: number | null;
  available_equipment?: string[] | null;
  home_capabilities?: HomeCapabilityMap | null;
  client_constraints?: string[] | null;
  preferred_demonstrator?: PreferredDemonstrator | null;
  coach_override?: {
    selected_template_id: string;
    reason?: string | null;
  } | null;
};

export type ResolvableTemplateRecord = {
  id: string;
  slug: string;
  version: number;
  status: TemplateStatus;
  is_published: boolean;
  archived: boolean;
  version_group_id?: string | null;
  contract: ProgramTemplateContractV1;
  /** Free-text equipment tags for coarse compatibility (fixture / metadata). */
  equipment_tags?: string[];
};

export type StructuredRecommendationReason = {
  goal: PrimaryTrainingStrategy | null;
  level: TemplateLevel | null;
  environment: TemplateEnvironment | null;
  days: number | null;
  equipment: EquipmentCompatibility;
  capability: "COMPATIBLE" | "REVIEW_REQUIRED" | "INCOMPATIBLE" | "UNKNOWN" | "N/A";
  compatibility: string;
  review_signals: TemplateReviewSignal[];
  summary: string;
  nutrition_alignment_required?: boolean;
};

export type ResolutionTrace = {
  quiz_goal: string | null;
  training_v2_goal: string | null;
  primary_strategy: PrimaryTrainingStrategy | null;
  primary_strategy_source: string;
  level: TemplateLevel | null;
  environment: TemplateEnvironment | null;
  environment_selection_note: string | null;
  days: number | null;
  initial_candidate_count: number;
  strategy_filtered_count: number;
  level_filtered_count: number;
  environment_filtered_count: number;
  days_filtered_count: number;
  equipment_filtered_count: number;
  eligibility_filtered_count: number;
  readiness_filtered_count: number;
  final_candidate_count: number;
  selected_template: string | null;
  review_signals: TemplateReviewSignal[];
  dimensions_changed: string[];
};

export type CandidateSummary = {
  id: string;
  slug: string;
  match_class: "EXACT" | "NEAR" | "INCOMPATIBLE";
  mismatched_dimensions: string[];
  library_readiness: LibraryReadinessState;
  equipment: EquipmentCompatibility;
};

export type TemplateResolverResult = {
  status: TemplateResolverStatus;
  recommended_template_id: string | null;
  recommended_template_slug: string | null;
  primary_strategy: PrimaryTrainingStrategy | null;
  resolved_level: TemplateLevel | null;
  resolved_environment: TemplateEnvironment | null;
  resolved_days: number | null;
  compatibility_status: "SAFE" | "REVIEW" | "HIGH_IMPACT" | "INCOMPATIBLE" | "UNKNOWN";
  recommendation_reason: StructuredRecommendationReason;
  review_signals: TemplateReviewSignal[];
  candidate_count: number;
  candidate_summary: CandidateSummary[];
  fallback_used: boolean;
  fallback_class: FallbackClass;
  fallback_reason: string | null;
  dimensions_changed: string[];
  coach_override_required: boolean;
  coach_override_applied: boolean;
  auto_recommended_template_id: string | null;
  coach_selected_template_id: string | null;
  override_reason: string | null;
  resolution_trace: ResolutionTrace;
};
