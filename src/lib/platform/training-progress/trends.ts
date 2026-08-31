import type { ProgressionAction, ProgressionReasonCode } from "@/lib/platform/progression/types";

export type RecentSetRow = {
  exercise_external_id: string;
  name_ar?: string;
  session_date: string;
  actual_load: number | null;
  actual_reps: number | null;
  actual_duration_seconds: number | null;
  effort_v2?: string | null;
  set_completed?: boolean | null;
  skipped?: boolean;
};

export function aggregateExerciseTrends(rows: RecentSetRow[], limit = 4) {
  const byId = new Map<string, RecentSetRow[]>();
  for (const row of rows) {
    if (row.skipped || row.set_completed === false) continue;
    const list = byId.get(row.exercise_external_id) ?? [];
    list.push(row);
    byId.set(row.exercise_external_id, list);
  }
  const samples: Array<{
    external_id: string;
    name_ar: string;
    action: ProgressionAction | null;
    reason_code: ProgressionReasonCode;
    from_load: number | null;
    to_load: number | null;
    from_reps: number | null;
    to_reps: number | null;
    from_duration: number | null;
    to_duration: number | null;
    is_bodyweight: boolean;
  }> = [];

  for (const [id, list] of byId) {
    const sorted = [...list].sort((a, b) => a.session_date.localeCompare(b.session_date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last || first.session_date === last.session_date) continue;
    samples.push({
      external_id: id,
      name_ar: last.name_ar ?? id,
      action: null,
      reason_code: "INSUFFICIENT_HISTORY",
      from_load: first.actual_load,
      to_load: last.actual_load,
      from_reps: first.actual_reps,
      to_reps: last.actual_reps,
      from_duration: first.actual_duration_seconds,
      to_duration: last.actual_duration_seconds,
      is_bodyweight: first.actual_load == null && last.actual_load == null,
    });
    if (samples.length >= limit) break;
  }
  return samples;
}

export const TREND_AGGREGATOR_NOTE =
  "Display aggregation of factual loads/reps/duration. Coaching action still comes from Phase 6 when provided.";
