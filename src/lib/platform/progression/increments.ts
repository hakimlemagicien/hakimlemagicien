import { COMPOUND_RELATIVE_JUMP_LIMIT, ISOLATION_RELATIVE_JUMP_LIMIT } from "./types";

export function nextValidLoad(input: {
  current: number;
  incrementKg?: number | null;
  validLoads?: number[] | null;
  mechanics?: string | null;
}): { next: number | null; limited: boolean; relativeJump: number | null } {
  const { current } = input;
  let next: number | null = null;
  if (input.validLoads && input.validLoads.length) {
    const ordered = [...input.validLoads].sort((a, b) => a - b);
    next = ordered.find((value) => value > current) ?? null;
  } else if (input.incrementKg != null && input.incrementKg > 0) {
    next = current + input.incrementKg;
  }
  if (next == null) return { next: null, limited: true, relativeJump: null };
  const relative = current > 0 ? (next - current) / current : null;
  const limit =
    input.mechanics === "ISOLATION" ? ISOLATION_RELATIVE_JUMP_LIMIT : COMPOUND_RELATIVE_JUMP_LIMIT;
  const limited = relative != null && relative > limit;
  return { next, limited, relativeJump: relative };
}

export function previousValidLoad(input: {
  current: number;
  incrementKg?: number | null;
  validLoads?: number[] | null;
  fallback?: number | null;
}): number | null {
  if (input.validLoads && input.validLoads.length) {
    const ordered = [...input.validLoads].sort((a, b) => a - b);
    const lower = [...ordered].reverse().find((value) => value < input.current);
    if (lower != null) return lower;
  }
  if (input.incrementKg != null && input.incrementKg > 0 && input.current > input.incrementKg) {
    return input.current - input.incrementKg;
  }
  return input.fallback ?? null;
}
