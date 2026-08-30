import type { WeekdayId } from "@/lib/platform/training-assignment";
import { WEEKDAY_TO_ISO } from "@/lib/platform/training-assignment";

/** Canonical weekday ids — re-exported from training-assignment (single source). */
export type { WeekdayId };

/** Calendar week order (Sunday-first) — display-independent internal ordering. */
export const WEEKDAY_CALENDAR_ORDER: WeekdayId[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export const WEEKDAY_IDS = WEEKDAY_CALENDAR_ORDER;

export type PreferredWeekdayId = WeekdayId;

export function isWeekdayId(value: string): value is WeekdayId {
  return (WEEKDAY_CALENDAR_ORDER as readonly string[]).includes(value);
}

export function sortWeekdays(days: WeekdayId[]): WeekdayId[] {
  return [...days].sort((a, b) => WEEKDAY_TO_ISO[a] - WEEKDAY_TO_ISO[b]);
}

export type PreferredWeekdayNormalization = {
  days: PreferredWeekdayId[];
  warnings: string[];
};

/**
 * Normalizes preferred training days:
 * - rejects invalid ids;
 * - removes duplicates (first occurrence wins in calendar order);
 * - returns deterministic sorted order.
 */
export function normalizePreferredTrainingDays(
  days?: PreferredWeekdayId[] | null,
): PreferredWeekdayNormalization {
  if (!days?.length) return { days: [], warnings: [] };

  const warnings: string[] = [];
  const seen = new Set<WeekdayId>();
  const valid: WeekdayId[] = [];

  for (const day of days) {
    if (!isWeekdayId(day)) {
      warnings.push(`INVALID_WEEKDAY:${String(day)}`);
      continue;
    }
    if (seen.has(day)) {
      warnings.push(`DUPLICATE_WEEKDAY:${day}`);
      continue;
    }
    seen.add(day);
    valid.push(day);
  }

  return { days: sortWeekdays(valid), warnings };
}
