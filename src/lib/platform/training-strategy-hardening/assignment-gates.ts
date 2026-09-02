import type { AssignmentMode } from "@/lib/platform/training-assignment-orchestrator/types";
import {
  isAssignmentCandidateStale,
  type TrainingAssignmentCandidate,
} from "@/lib/platform/training-assignment-orchestrator";
import { TRAINING_STRATEGY_ERROR_CODES } from "./error-taxonomy";

/** V1 product closure — paid auto-assign enabled; coach review for exceptions only. */
export const AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED = false;

export function assertAutomatedAssignmentAllowed(
  mode: AssignmentMode,
): { ok: true } | { ok: false; code: string } {
  if (mode === "AUTOMATED" && AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED) {
    return { ok: false, code: TRAINING_STRATEGY_ERROR_CODES.AUTOMATED_DISABLED };
  }
  return { ok: true };
}

/**
 * Client-side gate before V2 assign RPC — blocks silent RPC FAT_LOSS fallback
 * when goal_id is missing from payload.
 */
export function validateV2AssignmentPayload(
  payload: Record<string, unknown>,
): string | null {
  const goalId = payload.goal_id;
  if (typeof goalId !== "string" || !goalId.trim()) {
    return TRAINING_STRATEGY_ERROR_CODES.MISSING_GOAL_ID;
  }
  const sessions = payload.sessions;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return TRAINING_STRATEGY_ERROR_CODES.MISSING_SESSIONS;
  }
  for (const session of sessions) {
    if (!session || typeof session !== "object") {
      return TRAINING_STRATEGY_ERROR_CODES.INVALID_SESSION_STRUCTURE;
    }
    const exercises = (session as { exercises?: unknown }).exercises;
    if (!Array.isArray(exercises)) {
      return TRAINING_STRATEGY_ERROR_CODES.INVALID_SESSION_STRUCTURE;
    }
    for (const exercise of exercises) {
      if (!exercise || typeof exercise !== "object") continue;
      const weight = (exercise as { suggested_weight_kg?: unknown }).suggested_weight_kg;
      if (weight != null) return TRAINING_STRATEGY_ERROR_CODES.FIXED_LOAD_FORBIDDEN;
    }
  }
  return null;
}

export function validateCandidateBeforeAssign(input: {
  candidate: TrainingAssignmentCandidate;
  currentFingerprint: string;
}): string | null {
  if (isAssignmentCandidateStale(input.candidate, input.currentFingerprint)) {
    return TRAINING_STRATEGY_ERROR_CODES.STALE_STRATEGY_CONTEXT;
  }
  if (!input.candidate.assignable) {
    return TRAINING_STRATEGY_ERROR_CODES.CANDIDATE_NOT_ASSIGNABLE;
  }
  if (input.candidate.generation?.validation.status === "INVALID") {
    return TRAINING_STRATEGY_ERROR_CODES.PROGRAM_INVALID;
  }
  if (input.candidate.state === "BLOCKED" || input.candidate.state === "REJECTED") {
    return TRAINING_STRATEGY_ERROR_CODES.CANDIDATE_NOT_ASSIGNABLE;
  }
  return null;
}

export function validateValidationStatuses(input: {
  generationStatus: string;
  validationStatus: string;
}): string | null {
  if (input.generationStatus !== "READY") {
    return TRAINING_STRATEGY_ERROR_CODES.PROGRAM_GENERATION_BLOCKED;
  }
  if (input.validationStatus === "INVALID") {
    return TRAINING_STRATEGY_ERROR_CODES.PROGRAM_INVALID;
  }
  return null;
}

/** Documents template path separation from Strategy Matrix V1. */
export const ASSIGNMENT_PATH = {
  V2_STRATEGY_MATRIX: "v2_strategy_matrix",
  LEGACY_TEMPLATE: "legacy_template_snapshot",
} as const;

export type AssignmentPath = (typeof ASSIGNMENT_PATH)[keyof typeof ASSIGNMENT_PATH];

export function assignmentPathFromPayload(
  payload: Record<string, unknown> | null | undefined,
): AssignmentPath {
  if (payload?.sessions) return ASSIGNMENT_PATH.V2_STRATEGY_MATRIX;
  return ASSIGNMENT_PATH.LEGACY_TEMPLATE;
}
