import {
  PROGRESSION_STATUSES,
  PROGRESSION_STRATEGIES,
  type ProgramSource,
  type ProgressionAssignmentState,
  type ProgressionStatus,
  type ProgressionStrategy,
} from "./types";

export function parseProgressionStrategy(value: unknown): ProgressionStrategy {
  if (typeof value === "string" && (PROGRESSION_STRATEGIES as readonly string[]).includes(value)) {
    return value as ProgressionStrategy;
  }
  return "MATRIX_MANAGED_PROGRESSION";
}

export function parseProgressionStatus(value: unknown): ProgressionStatus {
  if (typeof value === "string" && (PROGRESSION_STATUSES as readonly string[]).includes(value)) {
    return value as ProgressionStatus;
  }
  return "WAITING_FOR_DATA";
}

export function resolveProgramSource(input: {
  source_template_id?: string | null;
  generation_source?: string | null;
}): ProgramSource {
  if (input.generation_source === "v2_generator") return "STRATEGY_MATRIX";
  if (input.source_template_id) return "PROGRAM_TEMPLATE";
  return "COACH_CUSTOM";
}

export function emptyProgressionState(strategy: ProgressionStrategy = "MATRIX_MANAGED_PROGRESSION"): ProgressionAssignmentState {
  return {
    strategy,
    status: "WAITING_FOR_DATA",
    last_evaluation_at: null,
    reviews: [],
    kept: {},
    last_decisions: [],
  };
}

export function parseProgressionState(value: unknown, strategy: ProgressionStrategy): ProgressionAssignmentState {
  const base = emptyProgressionState(strategy);
  if (!value || typeof value !== "object") return base;
  const row = value as Record<string, unknown>;
  return {
    strategy,
    status: parseProgressionStatus(row.status),
    last_evaluation_at: typeof row.last_evaluation_at === "string" ? row.last_evaluation_at : null,
    reviews: Array.isArray(row.reviews) ? (row.reviews as ProgressionAssignmentState["reviews"]) : [],
    kept:
      row.kept && typeof row.kept === "object"
        ? (row.kept as ProgressionAssignmentState["kept"])
        : {},
    last_decisions: Array.isArray(row.last_decisions)
      ? (row.last_decisions as ProgressionAssignmentState["last_decisions"])
      : [],
  };
}
