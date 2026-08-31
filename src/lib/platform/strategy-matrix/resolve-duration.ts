import { STRATEGY_FALLBACK_SESSION_DURATION_MINUTES } from "./constants";
import type { SessionDurationSource } from "./types";

export function resolveStrategySessionDuration(input: {
  clientMinutes?: number | null;
  coachMinutes?: number | null;
}):
  | { ok: true; sessionDurationMinutes: number; sessionDurationSource: SessionDurationSource }
  | { ok: false; code: "INVALID_SESSION_DURATION" } {
  const candidate = input.coachMinutes ?? input.clientMinutes;
  if (candidate == null || candidate === undefined) {
    return {
      ok: true,
      sessionDurationMinutes: STRATEGY_FALLBACK_SESSION_DURATION_MINUTES,
      sessionDurationSource: "FALLBACK_DEFAULT",
    };
  }
  if (!Number.isFinite(candidate) || candidate <= 0) {
    return { ok: false, code: "INVALID_SESSION_DURATION" };
  }
  return {
    ok: true,
    sessionDurationMinutes: Math.round(candidate),
    sessionDurationSource: "CLIENT",
  };
}
