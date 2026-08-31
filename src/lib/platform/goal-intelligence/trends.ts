import type { BodyMeasurementEntry } from "@/lib/platform/progress-storage";
import type { BodyTrend } from "./types";

const MIN_POINTS = 3;
const MIN_SPAN_DAYS = 14;

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export function classifyMeasurementTrend(entries: BodyMeasurementEntry[], key: BodyMeasurementEntry["key"]): BodyTrend {
  const series = entries
    .filter((row) => row.key === key)
    .slice()
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (series.length < MIN_POINTS) return "INSUFFICIENT";
  const span = daysBetween(series[0]!.dateKey, series[series.length - 1]!.dateKey);
  if (span < MIN_SPAN_DAYS) return "INSUFFICIENT";

  const first = series[0]!.value;
  const last = series[series.length - 1]!.value;
  if (first <= 0) return "INSUFFICIENT";
  const pct = (last - first) / first;
  const weekly = pct / (span / 7);

  const noisy = series.some((row, index) => {
    if (index === 0) return false;
    const prev = series[index - 1]!.value;
    if (prev <= 0) return false;
    return Math.abs(row.value - prev) / prev > 0.04;
  });
  if (noisy && Math.abs(weekly) < 0.005) return "INSUFFICIENT";

  if (weekly <= -0.01) return "DECLINING_FAST";
  if (weekly <= -0.003) return "DECLINING";
  if (weekly >= 0.004) return "INCREASING";
  return "STABLE";
}

export function photosAreNotBodyTruth(photosPresent: boolean | undefined): { photos_present: boolean; inferred: false } {
  return { photos_present: Boolean(photosPresent), inferred: false };
}
