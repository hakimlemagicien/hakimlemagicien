import { getLocalDateKey } from "@/lib/platform/readiness";

export function addLocalDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const utc = Date.UTC(year, (month ?? 1) - 1, day ?? 1);
  const next = new Date(utc + days * 24 * 60 * 60 * 1000);
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function localDaysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function hoursBetween(fromIso: string, to: Date): number {
  return (to.getTime() - Date.parse(fromIso)) / (60 * 60 * 1000);
}

/**
 * Frequency-aware allowed shift after the scheduled local date.
 * 3-day programs get more room than 6-day programs.
 * Midnight on the scheduled day never closes the window (spec 11).
 */
export function permittedShiftDays(daysPerWeek: number | null): number {
  const frequency = daysPerWeek ?? 3;
  if (frequency <= 3) return 2;
  if (frequency <= 4) return 1;
  return 1;
}

export function windowClosed(input: {
  scheduledLocalDate: string;
  nowLocalDate: string;
  daysPerWeek: number | null;
}): boolean {
  const latest = addLocalDays(input.scheduledLocalDate, permittedShiftDays(input.daysPerWeek));
  return input.nowLocalDate > latest;
}

export function localDateFromIso(iso: string | null | undefined, timezone: string, fallback: string): string {
  if (!iso) return fallback;
  return getLocalDateKey(new Date(iso), timezone);
}

export function isoDayOfLocalDate(localDate: string): number {
  const [year, month, day] = localDate.split("-").map(Number);
  const js = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)).getUTCDay();
  return js === 0 ? 7 : js;
}

export function dateOnOrAfterIsoDay(fromLocal: string, isoDay: number): string {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addLocalDays(fromLocal, offset);
    if (isoDayOfLocalDate(candidate) === isoDay) return candidate;
  }
  return fromLocal;
}

export function expectedOccurrence(input: {
  isoDay: number;
  nowLocal: string;
  afterLocalDate?: string | null;
}): string {
  const from = input.afterLocalDate && input.afterLocalDate > "0000-01-01"
    ? addLocalDays(input.afterLocalDate, 1)
    : addLocalDays(input.nowLocal, -6);
  const occurrence = dateOnOrAfterIsoDay(from, input.isoDay);
  return occurrence;
}
