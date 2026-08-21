export const ASSIGNMENT_STATUSES = [
  "scheduled",
  "active",
  "completed",
  "replaced",
  "cancelled",
  "archived",
] as const;

/** Client assignment snapshots freeze structure. Template live-row versioning remains incomplete. */
export const ASSIGNMENT_SNAPSHOT_VERSION_SAFE = true;
export const LEGACY_ASSIGNMENT_REVIEW_REQUIRED = true;

export type WeekdayId = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export const ISO_DAY_TO_WEEKDAY: Record<number, WeekdayId> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
  7: "sun",
};

export const WEEKDAY_TO_ISO: Record<WeekdayId, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

export function assignmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "مجدول",
    active: "نشط",
    completed: "مكتمل",
    replaced: "مستبدل",
    cancelled: "ملغى",
    archived: "مؤرشف",
  };
  return labels[status] ?? status;
}

export function formatRepsLabel(input: {
  reps_label?: string | null;
  reps_min?: number | null;
  reps_max?: number | null;
}): string | undefined {
  if (input.reps_label?.trim()) return input.reps_label.trim();
  if (input.reps_min != null && input.reps_max != null && input.reps_min !== input.reps_max) {
    return `${input.reps_min} - ${input.reps_max}`;
  }
  if (input.reps_min != null) return String(input.reps_min);
  if (input.reps_max != null) return String(input.reps_max);
  return undefined;
}

export function currentWeekNumber(input: {
  startsOn: string | null;
  durationWeeks: number | null;
  today?: string;
}): { week: number; reason: "ok" | "scheduled" | "ended" } {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  if (!input.startsOn) return { week: 1, reason: "ok" };
  const start = Date.parse(`${input.startsOn}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  const elapsed = Math.floor((now - start) / 86_400_000);
  if (elapsed < 0) return { week: 1, reason: "scheduled" };
  const duration = input.durationWeeks && input.durationWeeks > 0 ? input.durationWeeks : 1;
  if (elapsed >= duration * 7) return { week: duration, reason: "ended" };
  return { week: Math.min(duration, Math.max(1, Math.floor(elapsed / 7) + 1)), reason: "ok" };
}

export type ObjectiveTrainingSignal =
  | "no_active_program"
  | "program_starts_soon"
  | "program_ended"
  | "legacy_assignment";

export function objectiveTrainingSignals(input: {
  status: string | null;
  startsOn: string | null;
  durationWeeks: number | null;
  snapshotComplete: boolean | null;
  today?: string;
}): ObjectiveTrainingSignal[] {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  if (!input.status) return ["no_active_program"];
  const signals: ObjectiveTrainingSignal[] = [];
  if (input.snapshotComplete === false) signals.push("legacy_assignment");
  if (input.status === "scheduled" && input.startsOn) {
    const diff = Math.floor(
      (Date.parse(`${input.startsOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
    );
    if (diff >= 0 && diff <= 7) signals.push("program_starts_soon");
  }
  if (
    input.status === "active" &&
    currentWeekNumber({
      startsOn: input.startsOn,
      durationWeeks: input.durationWeeks,
      today,
    }).reason === "ended"
  ) {
    signals.push("program_ended");
  }
  return signals;
}

export function objectiveSignalLabel(signal: ObjectiveTrainingSignal): string {
  if (signal === "no_active_program") return "لا برنامج تدريبي نشط";
  if (signal === "program_starts_soon") return "البرنامج يبدأ قريباً";
  if (signal === "program_ended") return "انتهت مدة البرنامج حسب تاريخ البداية";
  return "تعيين قديم بلا لقطة بنية — يحتاج مراجعة";
}

export function logIsLegacyUnlinked(assignmentId: string | null | undefined): boolean {
  return !assignmentId;
}

export function validateClientPrescription(input: {
  sets: number;
  rest_seconds: number;
  reps_min?: number | null;
  reps_max?: number | null;
  suggested_weight_kg?: number | null;
}): string | null {
  if (!Number.isFinite(input.sets) || input.sets < 1) return "invalid_sets";
  if (!Number.isFinite(input.rest_seconds) || input.rest_seconds < 0) return "invalid_rest";
  if (input.reps_min != null && input.reps_min < 0) return "invalid_sets";
  if (input.reps_max != null && input.reps_max < 0) return "invalid_sets";
  if (input.suggested_weight_kg != null && input.suggested_weight_kg < 0) return "invalid_macros";
  return null;
}
