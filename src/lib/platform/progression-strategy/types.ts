import type { NextSessionProgression, ProgressionAction, ProgressionReasonCode } from "@/lib/platform/progression/types";

export const PROGRAM_SOURCES = ["STRATEGY_MATRIX", "PROGRAM_TEMPLATE", "COACH_CUSTOM"] as const;
export type ProgramSource = (typeof PROGRAM_SOURCES)[number];

export const PROGRESSION_STRATEGIES = [
  "SMART_PROGRESSION_EXERCISE_LOCKED",
  "MATRIX_MANAGED_PROGRESSION",
  "COACH_MANAGED",
] as const;
export type ProgressionStrategy = (typeof PROGRESSION_STRATEGIES)[number];

export const PROGRESSION_STATUSES = ["ACTIVE", "WAITING_FOR_DATA", "REVIEW_REQUIRED", "PAUSED"] as const;
export type ProgressionStatus = (typeof PROGRESSION_STATUSES)[number];

export const AUTOMATION_OWNERS = ["AUTO", "COACH"] as const;
export type AutomationOwner = (typeof AUTOMATION_OWNERS)[number];

export type ProgressionAutomationScope = {
  load: AutomationOwner;
  reps: AutomationOwner;
  sets: AutomationOwner;
  rest: AutomationOwner;
  exercises: AutomationOwner;
};

export type ProgressionReview = {
  exercise_external_id: string;
  exercise_name_ar: string;
  reason_code: ProgressionReasonCode | "EXERCISE_REVIEW_RECOMMENDED";
  reason_ar: string;
  last_load: number | null;
  last_reps: number[];
  created_at: string;
  status: "open" | "kept";
};

export type ProgressionHistoryEntry = {
  exercise_external_id: string;
  exercise_name_ar: string;
  session_date: string;
  load: number | null;
  reps: number[];
  action: ProgressionAction | "NONE";
  reason_code: ProgressionReasonCode | "NO_DATA";
  reason_ar: string;
  previous_load: number | null;
  next_load: number | null;
};

export type ProgressionAssignmentState = {
  strategy: ProgressionStrategy;
  status: ProgressionStatus;
  last_evaluation_at: string | null;
  reviews: ProgressionReview[];
  kept: Record<string, { at: string; reason_code: string }>;
  last_decisions: ProgressionHistoryEntry[];
};

export type ProgressionExerciseInput = {
  id: string;
  exercise_id: string | null;
  exercise_external_id: string;
  exercise_name_ar: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  rest_seconds: number;
  suggested_weight_kg: number | null;
};

export type ProgressionApplyPatch = {
  exercise_row_id: string;
  exercise_external_id: string;
  exercise_id: string | null;
  suggested_weight_kg: number | null;
  reps_min: number | null;
  reps_max: number | null;
  sets: number;
  rest_seconds: number;
  changed_fields: Array<"suggested_weight_kg" | "reps_min" | "reps_max">;
};

export type ProgressionEvaluation = {
  strategy: ProgressionStrategy;
  status: ProgressionStatus;
  decisions: NextSessionProgression[];
  patches: ProgressionApplyPatch[];
  reviews: ProgressionReview[];
  history: ProgressionHistoryEntry[];
  blocked: boolean;
};

export const EXERCISE_CHANGE_ACTIONS: ProgressionAction[] = ["PROGRESS_VARIATION", "REGRESS_VARIATION"];
export const AUTO_LOAD_ACTIONS: ProgressionAction[] = ["INCREASE_LOAD", "DECREASE_LOAD"];
export const AUTO_REP_ACTIONS: ProgressionAction[] = ["INCREASE_REPS"];
export const AUTO_DURATION_ACTIONS: ProgressionAction[] = ["INCREASE_DURATION"];
export const REVIEW_ACTIONS: ProgressionAction[] = [
  "PLATEAU_REVIEW",
  "RECOVERY_REVIEW",
  "SAFETY_REVIEW",
  "PROGRESS_VARIATION",
  "REGRESS_VARIATION",
];
