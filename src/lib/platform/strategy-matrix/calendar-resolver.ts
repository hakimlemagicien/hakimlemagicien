import type { WeekdayId } from "@/lib/platform/training-assignment";
import type { StrategySupportedDaysPerWeek } from "./constants";
import { isStrategySupportedDaysPerWeek } from "./constants";
import { resolveSessionLocationSemantics } from "./resolve-session-location";
import type { PreferredWeekdayId, TrainingStrategyLocation } from "./types";
import { MAAKFIT_TRAINING_STRATEGY_V1 } from "./version";
import {
  normalizePreferredTrainingDays,
  sortWeekdays,
  WEEKDAY_CALENDAR_ORDER,
} from "./weekdays";

export type CalendarSessionDemand = "HIGH" | "MODERATE" | "LOW";

export type CalendarSessionInput = {
  sequenceIndex: number;
  programDayId: string;
  role?: string | null;
  title?: string | null;
  primaryRegions?: string[];
  demand?: CalendarSessionDemand;
};

export type DayPlacementSource = "CLIENT_PREFERENCE" | "FALLBACK" | "RECOVERY_ADJUSTED";

export type WeeklySchedulePlacementSource = "CLIENT_PREFERENCE" | "FALLBACK" | "MIXED";

export type WeeklyCalendarDayKind = "WORKOUT" | "REST";

export type WeeklyCalendarWorkout = {
  sequenceIndex: number;
  programDayId: string;
  role: string | null;
  title: string | null;
  placementSource: DayPlacementSource;
  sessionLocation: ReturnType<typeof resolveSessionLocationSemantics>;
};

export type WeeklyCalendarDay = {
  weekdayId: WeekdayId;
  dayKind: WeeklyCalendarDayKind;
  workout?: WeeklyCalendarWorkout;
};

export type WeeklyTrainingSchedule = {
  strategyVersion: typeof MAAKFIT_TRAINING_STRATEGY_V1;
  trainingDaysPerWeek: StrategySupportedDaysPerWeek;
  placementSource: WeeklySchedulePlacementSource;
  warnings: string[];
  days: WeeklyCalendarDay[];
};

export type ResolveWeeklyTrainingScheduleInput = {
  sessions: CalendarSessionInput[];
  trainingDaysPerWeek: number;
  preferredTrainingDays?: PreferredWeekdayId[] | null;
  trainingLocation?: TrainingStrategyLocation;
};

/**
 * Deterministic fallback weekday anchors when the client has frequency but no preferred days.
 * Even spacing across the week; documented in Phase 2 report.
 */
export const SCHEDULE_FALLBACK_WEEKDAYS: Record<StrategySupportedDaysPerWeek, WeekdayId[]> = {
  2: ["tue", "fri"],
  3: ["mon", "wed", "fri"],
  4: ["mon", "tue", "thu", "sat"],
  5: ["mon", "tue", "wed", "thu", "fri"],
};

function weekdayIndex(id: WeekdayId): number {
  return WEEKDAY_CALENDAR_ORDER.indexOf(id);
}

function areConsecutive(a: WeekdayId, b: WeekdayId): boolean {
  const ai = weekdayIndex(a);
  const bi = weekdayIndex(b);
  if (ai < 0 || bi < 0) return false;
  return bi === ai + 1 || (ai === 6 && bi === 0);
}

function regionsOverlap(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const set = new Set(a);
  return b.some((region) => set.has(region));
}

function selectTargetWeekdays(input: {
  frequency: StrategySupportedDaysPerWeek;
  preferred: PreferredWeekdayId[];
}): { weekdays: WeekdayId[]; sources: DayPlacementSource[]; warnings: string[] } {
  const warnings: string[] = [];
  const fallback = SCHEDULE_FALLBACK_WEEKDAYS[input.frequency];
  const preferred = sortWeekdays(input.preferred);

  if (!preferred.length) {
    return {
      weekdays: [...fallback],
      sources: fallback.map(() => "FALLBACK" as const),
      warnings: ["SCHEDULE_FALLBACK_NO_PREFERRED_DAYS"],
    };
  }

  if (preferred.length > input.frequency) {
    warnings.push("PREFERRED_DAYS_EXCEED_FREQUENCY");
  }

  const selected: WeekdayId[] = [];
  const sources: DayPlacementSource[] = [];

  for (const day of preferred) {
    if (selected.length >= input.frequency) break;
    selected.push(day);
    sources.push("CLIENT_PREFERENCE");
  }

  if (selected.length < input.frequency) {
    warnings.push("PREFERRED_DAYS_INCOMPLETE");
    for (const day of fallback) {
      if (selected.length >= input.frequency) break;
      if (selected.includes(day)) continue;
      selected.push(day);
      sources.push("FALLBACK");
    }
  }

  return { weekdays: sortWeekdays(selected), sources, warnings };
}

function adjustForRecoverySpacing(input: {
  weekdays: WeekdayId[];
  sources: DayPlacementSource[];
  sessions: CalendarSessionInput[];
}): { weekdays: WeekdayId[]; sources: DayPlacementSource[]; warnings: string[] } {
  const warnings: string[] = [];
  const weekdays = [...input.weekdays];
  const sources = [...input.sources];
  const sessionBySeq = new Map(input.sessions.map((session) => [session.sequenceIndex, session]));

  for (let i = 0; i < weekdays.length - 1; i += 1) {
    const left = weekdays[i];
    const right = weekdays[i + 1];
    if (!areConsecutive(left, right)) continue;

    const leftSession = sessionBySeq.get(i);
    const rightSession = sessionBySeq.get(i + 1);
    if (!leftSession || !rightSession) continue;
    if (leftSession.demand !== "HIGH" || rightSession.demand !== "HIGH") continue;
    if (!regionsOverlap(leftSession.primaryRegions ?? [], rightSession.primaryRegions ?? [])) continue;

    const swapIndex = weekdays.findIndex(
      (day, index) => index > i + 1 && !areConsecutive(left, day) && !areConsecutive(day, right),
    );
    if (swapIndex < 0) {
      warnings.push("RECOVERY_SPACING_WARNING");
      continue;
    }

    const tmpDay = weekdays[i + 1];
    weekdays[i + 1] = weekdays[swapIndex];
    weekdays[swapIndex] = tmpDay;

    const tmpSource = sources[i + 1];
    sources[i + 1] = sources[swapIndex];
    sources[swapIndex] = tmpSource;
    sources[i + 1] = "RECOVERY_ADJUSTED";

    warnings.push("RECOVERY_SPACING_ADJUSTED");
  }

  return { weekdays, sources, warnings };
}

function overallPlacementSource(sources: DayPlacementSource[]): WeeklySchedulePlacementSource {
  const hasClient = sources.some((source) => source === "CLIENT_PREFERENCE");
  const hasFallback = sources.some(
    (source) => source === "FALLBACK" || source === "RECOVERY_ADJUSTED",
  );
  if (hasClient && hasFallback) return "MIXED";
  if (hasClient) return "CLIENT_PREFERENCE";
  return "FALLBACK";
}

/**
 * Maps abstract generated sessions onto a 7-day weekly calendar.
 * Does not prescribe exercises — placement only.
 */
export function resolveWeeklyTrainingSchedule(
  input: ResolveWeeklyTrainingScheduleInput,
): WeeklyTrainingSchedule | { ok: false; warnings: string[] } {
  if (!isStrategySupportedDaysPerWeek(input.trainingDaysPerWeek)) {
    return { ok: false, warnings: ["UNSUPPORTED_TRAINING_FREQUENCY"] };
  }

  const frequency = input.trainingDaysPerWeek;
  const sessionCount = input.sessions.length;
  if (sessionCount !== frequency) {
    return {
      ok: false,
      warnings: [`SESSION_COUNT_MISMATCH:${sessionCount}_vs_${frequency}`],
    };
  }

  const normalized = normalizePreferredTrainingDays(input.preferredTrainingDays);
  const warnings = [...normalized.warnings];

  const selected = selectTargetWeekdays({
    frequency,
    preferred: normalized.days,
  });
  warnings.push(...selected.warnings);

  const adjusted = adjustForRecoverySpacing({
    weekdays: selected.weekdays,
    sources: selected.sources,
    sessions: input.sessions,
  });
  warnings.push(...adjusted.warnings);

  const sessionLocation = resolveSessionLocationSemantics(input.trainingLocation ?? "UNKNOWN");
  const placementByWeekday = new Map<WeekdayId, { session: CalendarSessionInput; source: DayPlacementSource }>();
  adjusted.weekdays.forEach((weekday, index) => {
    const session = input.sessions[index];
    if (!session) return;
    placementByWeekday.set(weekday, { session, source: adjusted.sources[index] ?? "FALLBACK" });
  });

  const days: WeeklyCalendarDay[] = WEEKDAY_CALENDAR_ORDER.map((weekdayId) => {
    const placement = placementByWeekday.get(weekdayId);
    if (!placement) {
      return { weekdayId, dayKind: "REST" as const };
    }
    return {
      weekdayId,
      dayKind: "WORKOUT" as const,
      workout: {
        sequenceIndex: placement.session.sequenceIndex,
        programDayId: placement.session.programDayId,
        role: placement.session.role ?? null,
        title: placement.session.title ?? null,
        placementSource: placement.source,
        sessionLocation,
      },
    };
  });

  return {
    strategyVersion: MAAKFIT_TRAINING_STRATEGY_V1,
    trainingDaysPerWeek: frequency,
    placementSource: overallPlacementSource(adjusted.sources),
    warnings,
    days,
  };
}

export function countWorkoutDays(schedule: WeeklyTrainingSchedule): number {
  return schedule.days.filter((day) => day.dayKind === "WORKOUT").length;
}

export function restWeekdayIds(schedule: WeeklyTrainingSchedule): WeekdayId[] {
  return schedule.days.filter((day) => day.dayKind === "REST").map((day) => day.weekdayId);
}
