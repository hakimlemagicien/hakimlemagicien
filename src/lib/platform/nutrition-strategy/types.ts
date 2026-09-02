import type { MealLibraryRecord } from "../meal-library";

export const CLIENT_GOAL_IDS = [
  "FAT_LOSS",
  "MUSCLE_GAIN",
  "BODY_RECOMPOSITION",
  "GLUTE_GROWTH",
  "WAIST_DEFINITION",
  "UPPER_BODY_DEFINITION",
  "FEMININE_BALANCED_BODY",
  "STRENGTH_PERFORMANCE",
  "FITNESS_ENDURANCE",
  "MOBILITY_RECOVERY",
  "POSTURE_BACK_HEALTH",
  "GENERAL_HEALTH_FITNESS",
] as const;

export type ClientGoalId = (typeof CLIENT_GOAL_IDS)[number];

export type NutritionObjective =
  | "FAT_LOSS"
  | "MUSCLE_GAIN"
  | "BODY_RECOMPOSITION"
  | "PERFORMANCE_MAINTENANCE"
  | "MAINTENANCE";

export type GoalContext = ClientGoalId;

export type NutritionTargetSource = "ENGINE_APPROVED" | "COACH_APPROVED" | "ADMIN_APPROVED";

export type NutritionTarget = {
  id: string;
  version: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  reference_weight_kg: number;
  nutrition_objective: NutritionObjective;
  goal_context: GoalContext;
  target_source: NutritionTargetSource;
  strategy_version: string;
  target_created_at: string;
  target_reason: string;
  previous_target_id?: string;
  review_required?: boolean;
};

export type MacroTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type BodyFatCategory = "high" | "moderate" | "low";

export type ClientNutritionProfile = {
  gender: "male" | "female";
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level: keyof typeof import("./constants").ACTIVITY_MULTIPLIERS;
  body_fat_category?: BodyFatCategory | null;
  lean_mass_focus?: boolean | null;
  recomposition_signal?: boolean | null;
};

export type NutritionGoalProfile = {
  client_goal: ClientGoalId;
  nutrition_objective: NutritionObjective;
  goal_context: GoalContext;
  suitable_goals_filter: string[];
};

export type AllergyState =
  | { status: "UNKNOWN" }
  | { status: "CONFIRMED_NONE"; confirmed_at: string }
  | { status: "KNOWN_ALLERGIES"; allergens: string[] };

export type NutritionSlotKey =
  | "breakfast"
  | "snack"
  | "lunch"
  | "pre_workout"
  | "post_workout"
  | "dinner";

export type NutritionSlotState =
  | "ACTIVE"
  | "OPTIONAL"
  | "SATISFIED_BY_OTHER_MEAL"
  | "NOT_REQUIRED";

export type NutritionSlotRole =
  | "PRIMARY_MEAL"
  | "SUPPORT_SNACK"
  | "PRE_WORKOUT"
  | "POST_WORKOUT"
  | "HYDRATION";

export type ServingPolicy = "FIXED_SERVING" | "LIMITED_SCALING" | "FLEXIBLE_SCALING";

export type DayType = "TRAINING_DAY" | "REST_DAY";
export type TrainingTimeBucket = "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING";

export type NutritionDayContext = {
  day_type: DayType;
  training_time?: TrainingTimeBucket;
  session_time?: string;
  training_demand?: "LOW" | "MODERATE" | "HIGH";
};

export type NutritionSlot = {
  slot_key: NutritionSlotKey;
  slot_state: NutritionSlotState;
  slot_role: NutritionSlotRole;
  satisfied_by_slot_key?: NutritionSlotKey;
  counts_toward_day_totals: boolean;
  display_order: number;
  hour: number;
  minute: number;
};

export type AssignedMeal = {
  slot_key: NutritionSlotKey;
  external_id: string;
  meal: MealLibraryRecord;
  servings: number;
  serving_policy: ServingPolicy;
  macros: MacroTotals;
};

export type MealAlternative = {
  external_id: string;
  meal: MealLibraryRecord;
  servings: number;
  score: number;
};

export type ValidationBand = "PASS" | "REVIEW" | "FAIL";
export type ValidationStatus = "VALID" | "REVIEW_REQUIRED" | "INVALID";

export type NutritionValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type NutritionValidationResult = {
  status: ValidationStatus;
  calories: { delta_pct: number; band: ValidationBand };
  protein: { pct_of_target: number; band: ValidationBand };
  carbs: { delta_pct: number; band: ValidationBand };
  fats: { delta_pct: number; band: ValidationBand };
  issues: NutritionValidationIssue[];
};

export type NutritionPlanCandidate = {
  assigned_meals: AssignedMeal[];
  planned_totals: MacroTotals;
  score: number;
};

export type NutritionAssignmentSchema = "LEGACY_4_SLOT" | "STRATEGY_V1_DYNAMIC";

export type NutritionAssignmentVersion = {
  id: string;
  version: number;
  schema: NutritionAssignmentSchema;
  status: "scheduled" | "active" | "completed" | "replaced" | "cancelled";
  target_id: string;
  strategy_version: string;
  library_version: string;
  created_at: string;
  replaced_by_id?: string;
};

export type ConsumptionStatus =
  | "PLANNED"
  | "COMPLETED"
  | "PARTIAL"
  | "SKIPPED"
  | "SWAPPED"
  | "NOT_LOGGED";

export type NutritionConsumptionEvent = {
  slot_key: NutritionSlotKey;
  status: ConsumptionStatus;
  planned_servings: number;
  consumed_servings: number;
  source_external_id: string;
  macros_consumed: MacroTotals;
  session_date: string;
};

export type NutritionDecisionReason =
  | "INITIAL_ASSIGNMENT"
  | "GOAL_CHANGE"
  | "COACH_ADJUSTMENT"
  | "ADHERENCE_REVIEW"
  | "WEIGHT_TREND"
  | "SCHEDULE_CHANGE"
  | "TRAINING_CONTEXT_CHANGE"
  | "CLIENT_PREFERENCE_CHANGE"
  | "VARIETY_RELAXED_SAFE_COVERAGE"
  | "SWAP_REQUEST";

export type NutritionDecisionTraceEntry = {
  code: string;
  message: string;
  data?: Record<string, unknown>;
};

export type NutritionDecisionTrace = {
  reason: NutritionDecisionReason;
  strategy_version: string;
  target_id?: string;
  assignment_id?: string;
  entries: NutritionDecisionTraceEntry[];
  created_at: string;
};

export type TrainingNutritionSignal = {
  day_type: DayType;
  session_time?: string;
  session_duration_min?: number;
  training_demand_category?: "LOW" | "MODERATE" | "HIGH";
  recovery_context?: string;
  schedule_change?: boolean;
};

export type NutritionReviewSignal = {
  code: "NUTRITION_REVIEW_RECOMMENDED";
  reason: string;
  source: "training" | "adherence" | "weight_trend";
};

export type NutritionPreferences = {
  excluded_external_ids?: string[];
  preferred_external_ids?: string[];
};

export type MealHistoryWindow = {
  recent_by_meal_type: Partial<Record<string, string[]>>;
};

export type ResolvedNutritionDay = {
  ordered_slots: NutritionSlot[];
  slot_states: Record<NutritionSlotKey, NutritionSlotState>;
  slot_roles: Record<NutritionSlotKey, NutritionSlotRole>;
  assigned_meals: AssignedMeal[];
  servings: Record<NutritionSlotKey, number>;
  alternatives: Partial<Record<NutritionSlotKey, MealAlternative[]>>;
  planned_totals: MacroTotals;
  validation_result: NutritionValidationResult;
  decision_trace: NutritionDecisionTraceEntry[];
};

export type NutritionFailClosedCode =
  | "PROFILE_DATA_REQUIRED"
  | "NUTRITION_TARGET_REQUIRED"
  | "NUTRITION_TARGET_REVIEW_REQUIRED"
  | "NUTRITION_PROFILE_RESOLUTION_REQUIRED"
  | "ALLERGY_STATUS_REQUIRED"
  | "INSUFFICIENT_SAFE_MEAL_COVERAGE"
  | "NUTRITION_PLAN_INVALID"
  | "MEAL_DATA_INVALID"
  | "NUTRITION_PROFESSIONAL_REVIEW_REQUIRED"
  | "SWAP_NOT_ALLOWED";

export type NutritionFailClosedOutcome = {
  code: NutritionFailClosedCode;
  message: string;
  missing?: string[];
};

export type MembershipTier = "free" | "essential" | "premium" | "vip";
