import { resolveCanonicalGoal } from "@/lib/platform/prescription/goal-profile";
import type { GoalResolutionResult } from "./types";

export const OPEN_GOAL_MAPPING_DECISIONS = [
  "muscle",
  "fitness",
  "athletic",
  "shape",
  "gain",
  "tone",
  "fit",
] as const;

export type OpenGoalMappingId = (typeof OPEN_GOAL_MAPPING_DECISIONS)[number];

function pickRawGoal(input: {
  rawGoalId?: string | null;
  profileGoal?: string | null;
}): string | null {
  const fromId = input.rawGoalId?.trim();
  if (fromId) return fromId;
  const fromProfile = input.profileGoal?.trim();
  if (fromProfile) return fromProfile;
  return null;
}

/**
 * Fail-closed goal resolution. Never silently maps unknown goals to FAT_LOSS.
 */
export function resolveStrategyGoal(input: {
  rawGoalId?: string | null;
  profileGoal?: string | null;
}): GoalResolutionResult {
  const rawGoal = pickRawGoal(input);
  if (!rawGoal) {
    return { ok: false, rawGoal: null, reason: "MISSING_GOAL", assignable: false };
  }

  const resolved = resolveCanonicalGoal(rawGoal);
  if (resolved.mappingStatus === "LEGACY_UNMAPPED" || !resolved.canonicalId) {
    const reason =
      (OPEN_GOAL_MAPPING_DECISIONS as readonly string[]).includes(rawGoal) ||
      resolved.mappingStatus === "LEGACY_UNMAPPED"
        ? "UNMAPPED_LEGACY_GOAL"
        : "UNKNOWN_GOAL";
    return { ok: false, rawGoal, reason, assignable: false };
  }

  const resolutionSource =
    resolved.legacyId === resolved.canonicalId ? "CANONICAL_ID" : "LEGACY_MAP";

  return {
    ok: true,
    rawGoal,
    canonicalGoal: resolved.canonicalId,
    resolutionSource,
  };
}
