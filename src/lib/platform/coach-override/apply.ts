import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix/types";
import {
  approveAssignmentCandidate,
  type TrainingAssignmentCandidate,
} from "@/lib/platform/training-assignment-orchestrator";
import { mapCoachOverrideToStrategyContext, mergeStrategyInput } from "./map-override";
import { reviewCoachOverride } from "./review";
import type {
  CoachOverrideProvenance,
  CoachOverrideRequest,
  CoachOverrideReview,
} from "./types";

export type ApplyCoachOverrideInput = {
  request: CoachOverrideRequest;
  review: CoachOverrideReview;
  strategyInput: TrainingStrategyInput;
  exercises: ExerciseV2Metadata[];
  membershipTier?: string | null;
  currentAssignmentVersion?: string | null;
  /** Idempotency — same key should not create duplicate apply. */
  applyKey?: string;
};

export type ApplyCoachOverrideResult =
  | {
      ok: true;
      state: "APPLIED";
      candidate: TrainingAssignmentCandidate;
      provenance: CoachOverrideProvenance;
      applyKey: string;
    }
  | {
      ok: false;
      state: "BLOCKED" | "REJECTED";
      errorCode: string;
      review: CoachOverrideReview;
    };

const appliedKeys = new Set<string>();
const SESSION_STORAGE_KEY = "maakfit_coach_override_applied_keys";

function readSessionAppliedKeys(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSessionAppliedKeys(keys: Set<string>) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    // ignore quota errors
  }
}

function hasAppliedKey(key: string): boolean {
  return appliedKeys.has(key) || readSessionAppliedKeys().has(key);
}

function rememberAppliedKey(key: string) {
  appliedKeys.add(key);
  const sessionKeys = readSessionAppliedKeys();
  sessionKeys.add(key);
  writeSessionAppliedKeys(sessionKeys);
}

export function resetCoachOverrideApplyKeysForTests() {
  appliedKeys.clear();
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/** Phase 6: override apply idempotency is process + browser-session only; durable assign uses RPC guards. */
export const COACH_OVERRIDE_DURABLE_IDEMPOTENCY =
  "PHASE_6_DURABLE_IDEMPOTENCY_DECISION_REQUIRED" as const;

/**
 * Confirms a reviewed override — returns validated candidate for existing assign RPC.
 * Does not persist; caller uses assignGeneratedV2Program.
 */
export function applyCoachOverride(input: ApplyCoachOverrideInput): ApplyCoachOverrideResult {
  const applyKey =
    input.applyKey ??
    `${input.request.id}:${input.request.currentAssignmentId}:${input.review.requestId}`;

  if (hasAppliedKey(applyKey)) {
    const candidate = input.review.revisedCandidate;
    if (candidate?.assignable) {
      return {
        ok: true,
        state: "APPLIED",
        candidate: approveAssignmentCandidate(candidate),
        provenance: buildProvenance(input.request, input.review),
        applyKey,
      };
    }
  }

  if (input.review.status === "BLOCKED") {
    return {
      ok: false,
      state: "BLOCKED",
      errorCode: input.review.blockingReasons[0] ?? "OVERRIDE_BLOCKED",
      review: input.review,
    };
  }

  const freshReview = reviewCoachOverride({
    request: input.request,
    strategyInput: input.strategyInput,
    exercises: input.exercises,
    membershipTier: input.membershipTier,
    currentAssignmentVersion: input.currentAssignmentVersion,
  });

  if (freshReview.status === "BLOCKED" || !freshReview.revisedCandidate) {
    return {
      ok: false,
      state: "BLOCKED",
      errorCode: freshReview.blockingReasons[0] ?? "STALE_OR_BLOCKED",
      review: freshReview,
    };
  }

  const approved = approveAssignmentCandidate(freshReview.revisedCandidate);
  if (!approved.assignable || !approved.assignmentPayload) {
    return {
      ok: false,
      state: "BLOCKED",
      errorCode: "PROGRAM_INVALID_AFTER_OVERRIDE",
      review: freshReview,
    };
  }

  appliedKeys.add(applyKey);
  rememberAppliedKey(applyKey);

  return {
    ok: true,
    state: "APPLIED",
    candidate: approved,
    provenance: buildProvenance(input.request, freshReview),
    applyKey,
  };
}

export function rejectCoachOverrideRequest(
  review: CoachOverrideReview,
): CoachOverrideReview {
  return {
    ...review,
    status: "BLOCKED",
    requestState: "REJECTED",
    blockingReasons: [...review.blockingReasons, "COACH_CANCELLED"],
  };
}

export function buildCoachOverrideRequest(input: {
  clientId: string;
  currentAssignmentId: string;
  overrideType: CoachOverrideRequest["overrideType"];
  payload: CoachOverrideRequest["payload"];
  source?: CoachOverrideRequest["source"];
  coachNote?: string | null;
  sourceAssignmentVersion?: string | null;
}): CoachOverrideRequest {
  return {
    id: `override-${input.clientId}-${Date.now()}`,
    clientId: input.clientId,
    currentAssignmentId: input.currentAssignmentId,
    overrideType: input.overrideType,
    payload: input.payload,
    source: input.source ?? "COACH_ADMIN",
    coachNote: input.coachNote ?? null,
    proposedAt: new Date().toISOString(),
    sourceAssignmentVersion: input.sourceAssignmentVersion ?? null,
  };
}

function buildProvenance(
  request: CoachOverrideRequest,
  review: CoachOverrideReview,
): CoachOverrideProvenance {
  return {
    overrideType: request.overrideType,
    overrideRequestId: request.id,
    reviewStatus: review.status,
    sourceAssignmentId: request.currentAssignmentId,
    impactCodes: review.impacts.map((row) => row.code),
    coachNote: request.coachNote ?? null,
    appliedAt: new Date().toISOString(),
    temporaryConstraint: request.overrideType === "TEMPORARY_CONSTRAINT",
    changeSource: "COACH_OVERRIDE",
  };
}

/** Rebuild candidate preview without confirming — for UI preview step. */
export function previewCoachOverrideCandidate(
  input: Omit<ApplyCoachOverrideInput, "review"> & { review?: CoachOverrideReview },
): CoachOverrideReview {
  const review =
    input.review ??
    reviewCoachOverride({
      request: input.request,
      strategyInput: input.strategyInput,
      exercises: input.exercises,
      membershipTier: input.membershipTier,
      currentAssignmentVersion: input.currentAssignmentVersion,
    });
  return review;
}
