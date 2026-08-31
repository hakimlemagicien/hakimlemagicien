import type { DaysPerWeek } from "@/lib/platform/program-generation/types";

/** Supported generator frequencies — must match `SUPPORTED_DAYS_PER_WEEK`. */
export const STRATEGY_SUPPORTED_DAYS_PER_WEEK = [2, 3, 4, 5] as const;

export type StrategySupportedDaysPerWeek = (typeof STRATEGY_SUPPORTED_DAYS_PER_WEEK)[number];

export function isStrategySupportedDaysPerWeek(value: number): value is StrategySupportedDaysPerWeek {
  return (STRATEGY_SUPPORTED_DAYS_PER_WEEK as readonly number[]).includes(value);
}

/**
 * Prior admin generation path used 50 minutes when client duration was unknown.
 * Used only when no authoritative client duration exists.
 */
export const STRATEGY_FALLBACK_SESSION_DURATION_MINUTES = 50;

export {
  WEEKDAY_CALENDAR_ORDER,
  WEEKDAY_IDS,
  type PreferredWeekdayId,
  type WeekdayId,
} from "./weekdays";
