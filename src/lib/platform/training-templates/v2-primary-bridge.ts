/**
 * Training V2 Canonical Goal → Primary Training Strategy bridge.
 * Preserves V2 IDs. Fail-closed for unknown values. Does not alter LEGACY_GOAL_MAP.
 */

import {
  TRAINING_V2_CANONICAL_GOALS,
  type TrainingV2CanonicalGoal,
  isCanonicalTrainingGoal,
} from "@/lib/platform/training-v2-contracts";
import {
  isPrimaryTrainingStrategy,
  type PrimaryTrainingStrategy,
} from "./primary-strategy";

export type V2PrimaryBridgeMode = "DETERMINISTIC" | "CONTEXT_SENSITIVE" | "FAIL_CLOSED";

export type V2ToPrimaryStrategyResult =
  | {
      ok: true;
      v2Goal: TrainingV2CanonicalGoal;
      primaryStrategy: PrimaryTrainingStrategy;
      mode: "DETERMINISTIC" | "CONTEXT_SENSITIVE";
      notes?: string;
      allowsFatLossContextOverride?: boolean;
      allowsCoachSpecialization?: boolean;
    }
  | {
      ok: false;
      v2Goal: string;
      primaryStrategy: null;
      mode: "FAIL_CLOSED";
      reason: "EMPTY_GOAL" | "UNKNOWN_V2_GOAL";
    };

/**
 * Explicit bridge table. Every Training V2 canonical ID is documented.
 * CONTEXT_SENSITIVE entries declare default strategy + allowed later overrides.
 */
const V2_TO_PRIMARY: Record<
  TrainingV2CanonicalGoal,
  Omit<Extract<V2ToPrimaryStrategyResult, { ok: true }>, "ok" | "v2Goal">
> = {
  FAT_LOSS: { primaryStrategy: "FAT_LOSS", mode: "DETERMINISTIC" },
  MUSCLE_GROWTH: { primaryStrategy: "MUSCLE_GAIN", mode: "DETERMINISTIC" },
  FITNESS_ENERGY: { primaryStrategy: "GENERAL_FITNESS", mode: "DETERMINISTIC" },
  ATHLETIC_PHYSIQUE: { primaryStrategy: "ATHLETIC_PERFORMANCE", mode: "DETERMINISTIC" },
  BODY_RESHAPE: { primaryStrategy: "BODY_RECOMPOSITION", mode: "DETERMINISTIC" },
  HEALTHY_WEIGHT_GAIN: {
    primaryStrategy: "MUSCLE_GAIN",
    mode: "DETERMINISTIC",
    notes: "Maps to MUSCLE_GAIN for templates; nutrition remains separate.",
  },
  GLUTE_GROWTH: { primaryStrategy: "GLUTE_FOCUS", mode: "DETERMINISTIC" },
  SLIM_TONED_WAIST: {
    primaryStrategy: "BODY_RECOMPOSITION",
    mode: "CONTEXT_SENSITIVE",
    allowsFatLossContextOverride: true,
    notes: "Default BODY_RECOMPOSITION; may resolve to FAT_LOSS with clear fat-loss priority.",
  },
  FEMININE_BALANCED_BODY: { primaryStrategy: "BODY_RECOMPOSITION", mode: "DETERMINISTIC" },
  POSTURE_TONED_BACK: { primaryStrategy: "GENERAL_FITNESS", mode: "DETERMINISTIC" },
  TONED_ARMS_UPPER_BODY: {
    primaryStrategy: "BODY_RECOMPOSITION",
    mode: "CONTEXT_SENSITIVE",
    allowsCoachSpecialization: true,
    notes: "Default BODY_RECOMPOSITION; Coach Custom may specialize.",
  },
};

/** Exhaustiveness guard: every V2 goal must appear in the bridge. */
const _exhaustive: Record<TrainingV2CanonicalGoal, true> = (() => {
  const out = {} as Record<TrainingV2CanonicalGoal, true>;
  for (const goal of TRAINING_V2_CANONICAL_GOALS) {
    if (!V2_TO_PRIMARY[goal]) throw new Error(`Missing V2→Primary bridge for ${goal}`);
    out[goal] = true;
  }
  return out;
})();
void _exhaustive;

export function mapTrainingV2GoalToPrimaryStrategy(
  v2Goal: string | null | undefined,
): V2ToPrimaryStrategyResult {
  const key = v2Goal?.trim() ?? "";
  if (!key) {
    return {
      ok: false,
      v2Goal: "",
      primaryStrategy: null,
      mode: "FAIL_CLOSED",
      reason: "EMPTY_GOAL",
    };
  }
  if (!isCanonicalTrainingGoal(key)) {
    return {
      ok: false,
      v2Goal: key,
      primaryStrategy: null,
      mode: "FAIL_CLOSED",
      reason: "UNKNOWN_V2_GOAL",
    };
  }
  const mapped = V2_TO_PRIMARY[key];
  return { ok: true, v2Goal: key, ...mapped };
}

/** Reverse helper for admin filters — Primary Strategy → compatible V2 goals. */
export function trainingV2GoalsForPrimaryStrategy(
  strategy: PrimaryTrainingStrategy,
): TrainingV2CanonicalGoal[] {
  if (!isPrimaryTrainingStrategy(strategy)) return [];
  return TRAINING_V2_CANONICAL_GOALS.filter((goal) => {
    const bridge = V2_TO_PRIMARY[goal];
    return bridge.primaryStrategy === strategy;
  });
}
