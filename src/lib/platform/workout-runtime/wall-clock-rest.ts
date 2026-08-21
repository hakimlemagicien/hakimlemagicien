/**
 * Phase 5 — wall-clock rest authority.
 * Display remaining time from NOW vs rest_target_end_at.
 * Interval decrement is never the source of truth.
 */
export type WallClockRest = {
  rest_started_at: string;
  rest_target_end_at: string;
  prescribed_rest_seconds: number;
};

export type RestCueId = "t15" | "count3" | "count2" | "count1" | "start";

export function createWallClockRest(prescribedSeconds: number, now = Date.now()): WallClockRest {
  const started = now;
  const target = started + Math.max(0, prescribedSeconds) * 1000;
  return {
    rest_started_at: new Date(started).toISOString(),
    rest_target_end_at: new Date(target).toISOString(),
    prescribed_rest_seconds: Math.max(0, prescribedSeconds),
  };
}

export function extendWallClockRest(rest: WallClockRest, extraSeconds: number): WallClockRest {
  const end = Date.parse(rest.rest_target_end_at) + extraSeconds * 1000;
  return {
    ...rest,
    rest_target_end_at: new Date(end).toISOString(),
    prescribed_rest_seconds: rest.prescribed_rest_seconds + extraSeconds,
  };
}

export function remainingRestMs(rest: WallClockRest, now = Date.now()): number {
  return Date.parse(rest.rest_target_end_at) - now;
}

export function remainingRestSeconds(rest: WallClockRest, now = Date.now()): number {
  return Math.max(0, Math.ceil(remainingRestMs(rest, now) / 1000));
}

export function restElapsedSeconds(rest: WallClockRest, now = Date.now()): number {
  return Math.max(0, Math.round((now - Date.parse(rest.rest_started_at)) / 1000));
}

export function isRestComplete(rest: WallClockRest, now = Date.now()): boolean {
  return remainingRestMs(rest, now) <= 0;
}

/**
 * Cues that should fire at `now`, given already-fired ids.
 * If the client returns after expiry, only START is eligible — never a 15/3/2/1 burst.
 */
export function pendingRestCues(
  rest: WallClockRest,
  fired: ReadonlySet<RestCueId>,
  now = Date.now(),
): RestCueId[] {
  const remaining = remainingRestMs(rest, now);
  if (remaining <= 0) {
    return fired.has("start") ? [] : ["start"];
  }
  const pending: RestCueId[] = [];
  const sec = remaining / 1000;
  if (sec <= 15.05 && sec > 3.05 && !fired.has("t15")) pending.push("t15");
  if (sec <= 3.05 && sec > 2.05 && !fired.has("count3")) pending.push("count3");
  if (sec <= 2.05 && sec > 1.05 && !fired.has("count2")) pending.push("count2");
  if (sec <= 1.05 && sec > 0.05 && !fired.has("count1")) pending.push("count1");
  return pending;
}
