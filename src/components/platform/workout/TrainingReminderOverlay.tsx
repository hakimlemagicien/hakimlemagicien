import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import { useMembership } from "@/hooks/useMembership";
import { getProfileSettings } from "@/lib/platform/profile-settings-storage";
import { getTrainingNotificationContext } from "@/lib/platform/training-progress/notifications";
import { getLocalDateKey } from "@/lib/platform/readiness";

const SENT_KEY = "hakim:training-reminder-sent:v1";

function readSentKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(SENT_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSentKeys(keys: string[]) {
  localStorage.setItem(SENT_KEY, JSON.stringify(keys.slice(-40)));
}

export function TrainingReminderOverlay() {
  const location = useLocation();
  const { features } = useMembership();
  const enabled = Boolean(features?.workout_program);
  const runtimeQuery = useAssignedTrainingRuntime(enabled);
  const continuity = useProgramContinuity(runtimeQuery.data, enabled && runtimeQuery.data?.reason === "ok");
  const inWorkout = location.pathname.includes("/program/workout");
  const [dismissed, setDismissed] = useState(false);

  const candidate = useMemo(() => {
    const prefs = getProfileSettings().notifications;
    return getTrainingNotificationContext({
      continuity: continuity.decision,
      workoutReminders: prefs.workoutReminders,
      progressUpdates: prefs.progressUpdates,
      permissionDenied: typeof Notification !== "undefined" && Notification.permission === "denied",
      inWorkout,
      sentKeys: readSentKeys(),
      nowLocalDate: getLocalDateKey(),
    });
  }, [continuity.decision, inWorkout]);

  useEffect(() => {
    if (!candidate || dismissed) return;
    const keys = readSentKeys().filter((key) => !candidate.cancel_keys.includes(key));
    if (!keys.includes(candidate.dedupe_key)) writeSentKeys([...keys, candidate.dedupe_key]);
  }, [candidate, dismissed]);

  if (!candidate || dismissed || inWorkout) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-3 sm:bottom-6">
      <div
        role="status"
        className="mx-auto flex max-w-md items-start gap-3 rounded-3xl border border-border bg-card p-3 shadow-lg"
      >
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[12px] font-black text-foreground">{candidate.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{candidate.body}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Link
            to={candidate.href === "/app/program/workout" ? "/app/program/workout" : "/app/program"}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-primary px-3 text-[11px] font-black text-primary-foreground"
            onClick={() => setDismissed(true)}
          >
            فتح
          </Link>
          <button
            type="button"
            className="text-[10px] font-bold text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            لاحقًا
          </button>
        </div>
      </div>
    </div>
  );
}
