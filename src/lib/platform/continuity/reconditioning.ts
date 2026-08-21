import { SHORT_BREAK_MAX_DAYS, SHORT_BREAK_MAX_MISSED } from "./types";

export type AbsenceClass = "NONE" | "SHORT_BREAK" | "LONG_BREAK";

/**
 * Reconditioning is evidence-based: missed expected exposures AND absence duration.
 * Not a universal 7/14/30-day percentage cut.
 */
export function classifyAbsence(input: {
  daysSinceLastExposure: number | null;
  missedExpectedExposures: number;
  daysPerWeek: number | null;
}): AbsenceClass {
  const days = input.daysSinceLastExposure;
  const missed = input.missedExpectedExposures;
  if (days == null && missed === 0) return "NONE";
  const duration = days ?? 0;
  const frequency = input.daysPerWeek ?? 3;
  const normalGap = Math.max(1, Math.round(7 / frequency));
  if (missed === 0 && duration <= normalGap + 1) return "NONE";
  if (missed <= SHORT_BREAK_MAX_MISSED && duration <= SHORT_BREAK_MAX_DAYS) {
    return duration > 0 || missed > 0 ? "SHORT_BREAK" : "NONE";
  }
  const longByMissed = missed >= 3;
  const longByDuration = duration >= 8 && missed >= 2;
  const longSparse = frequency <= 3 && duration >= 10 && missed >= 2;
  const longDense = frequency >= 5 && missed >= 4;
  if (longByMissed || longByDuration || longSparse || longDense) return "LONG_BREAK";
  if (missed > 0 || duration > 0) return "SHORT_BREAK";
  return "NONE";
}

export function shouldRecalibrate(input: {
  absence: AbsenceClass;
  demand: "LOW" | "MODERATE" | "HIGH";
  hasEstablishedHistory: boolean;
}): boolean {
  if (input.absence !== "LONG_BREAK") return false;
  if (!input.hasEstablishedHistory) return false;
  return input.demand === "HIGH" || input.demand === "MODERATE";
}
