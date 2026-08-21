import { getLocalDateKey } from "@/lib/platform/readiness";
import type { ContinuityDecision } from "@/lib/platform/continuity/types";
import type { TrainingNotificationCandidate, TrainingNotificationKind } from "./types";
import { mapContinuityAction } from "./copy";

export type NotificationContextInput = {
  continuity: Pick<
    ContinuityDecision,
    | "action"
    | "effective_date"
    | "original_scheduled_date"
    | "next_program_day_id"
    | "resume_session_id"
    | "reconditioning_state"
    | "reason_code"
    | "previous_session_state"
  > | null;
  workoutReminders: boolean;
  progressUpdates: boolean;
  permissionDenied: boolean;
  inWorkout: boolean;
  completedProgramDayIds?: string[];
  sentKeys?: string[];
  materialProgramChange?: boolean;
  timezone?: string;
  nowLocalDate?: string;
};

export function notificationDedupeKey(kind: TrainingNotificationKind, dayId: string | null, localDate: string) {
  return `training:${kind}:${dayId ?? "none"}:${localDate}`;
}

export function getTrainingNotificationContext(input: NotificationContextInput): TrainingNotificationCandidate | null {
  if (input.inWorkout) return null;
  const localDate = input.nowLocalDate ?? getLocalDateKey();
  const dayId = input.continuity?.next_program_day_id ?? null;
  const pushOk = !input.permissionDenied && input.workoutReminders;
  const sent = new Set(input.sentKeys ?? []);
  const completed = new Set(input.completedProgramDayIds ?? []);

  if (dayId && completed.has(dayId)) return null;

  const base = (kind: TrainingNotificationKind, title: string, body: string, href: string): TrainingNotificationCandidate => {
    const dedupe_key = notificationDedupeKey(kind, dayId, kind === "RESCHEDULED_SESSION" ? (input.continuity?.effective_date ?? localDate) : localDate);
    const stale = input.continuity?.original_scheduled_date
      ? [notificationDedupeKey("UPCOMING_SESSION", dayId, input.continuity.original_scheduled_date)]
      : [];
    return {
      kind,
      title,
      body,
      href,
      dedupe_key,
      cancel_keys: stale,
      local_date: input.continuity?.effective_date ?? localDate,
      deliver_in_app: true,
      deliver_push: pushOk,
    };
  };

  if (!input.continuity) {
    if (input.materialProgramChange && input.progressUpdates) {
      const candidate = base(
        "MATERIAL_PROGRAM_UPDATE",
        "تم تحديث خطتك",
        "افتح البرنامج لمعرفة التركيز الجديد.",
        "/app/program",
      );
      if (sent.has(candidate.dedupe_key)) return null;
      return candidate;
    }
    return null;
  }

  if (input.continuity.resume_session_id || input.continuity.action === "RESUME_SESSION") {
    const copy = mapContinuityAction("RESUME_SESSION");
    const candidate = base("RESUME_SESSION", copy.title, copy.short_reason, "/app/program/workout");
    if (sent.has(candidate.dedupe_key)) return null;
    return candidate;
  }

  if (input.continuity.action === "ENTER_RECONDITIONING" || input.continuity.reconditioning_state) {
    const copy = mapContinuityAction("ENTER_RECONDITIONING");
    const candidate = base("RECONDITIONING_START", copy.title, copy.short_reason, "/app/program");
    if (sent.has(candidate.dedupe_key)) return null;
    return candidate;
  }

  if (input.continuity.action === "RESCHEDULE_SESSION" || input.continuity.action === "DEFER_SESSION") {
    const candidate = base(
      "RESCHEDULED_SESSION",
      "تم تحديث موعد حصتك",
      "تم تحديث موعد حصتك القادمة للحفاظ على ترتيب التدريب والتعافي.",
      "/app/program",
    );
    if (sent.has(candidate.dedupe_key)) return null;
    return candidate;
  }

  if (input.continuity.previous_session_state === "MISSED") {
    const candidate = base(
      "MISSED_SESSION_UPDATE",
      "حدّثنا ترتيب الحصص",
      "قمنا بتعديل ترتيب الحصص، افتح البرنامج لمعرفة الحصة التالية.",
      "/app/program",
    );
    if (sent.has(candidate.dedupe_key)) return null;
    return candidate;
  }

  if (input.materialProgramChange && input.progressUpdates) {
    const candidate = base("MATERIAL_PROGRAM_UPDATE", "تم تحديث خطتك", "افتح البرنامج لمعرفة ما تغيّر.", "/app/program");
    if (sent.has(candidate.dedupe_key)) return null;
    return candidate;
  }

  if (!input.workoutReminders) return null;
  if (input.continuity.effective_date !== localDate) return null;
  const candidate = base(
    "UPCOMING_SESSION",
    "حصة اليوم",
    "حصتك التالية جاهزة حسب ترتيب برنامجك الحالي.",
    "/app/program/workout",
  );
  if (sent.has(candidate.dedupe_key)) return null;
  return candidate;
}

export function isStaleReminder(candidate: TrainingNotificationCandidate, completedDayId: string | null) {
  if (!completedDayId) return false;
  return candidate.dedupe_key.includes(`:${completedDayId}:`);
}
