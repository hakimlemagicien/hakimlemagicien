import { supabase } from "@/integrations/supabase/client";
import type { EffortLevel } from "@/lib/platform/workout-session";
import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import type { WorkoutSetType } from "@/lib/platform/training-v2-contracts";
import { effortV2ToLegacy } from "@/lib/platform/workout-runtime/effort";
import {
  enqueuePending,
  readPendingQueue,
  setIdentity,
  writePendingQueue,
  type PendingSetWrite,
} from "@/lib/platform/workout-runtime/pending-sync";

export type WorkoutSetLogInput = {
  exerciseId: string;
  exerciseExternalId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  effort: EffortLevel | null;
  notes: string;
  skipped: boolean;
  sessionDate?: string;
  assignmentId?: string | null;
  assignmentExerciseId?: string | null;
  workoutSessionId?: string | null;
  setType?: WorkoutSetType | null;
  prescribedLoad?: number | null;
  actualLoad?: number | null;
  prescribedRepsMin?: number | null;
  prescribedRepsMax?: number | null;
  actualReps?: number | null;
  prescribedDurationSeconds?: number | null;
  actualDurationSeconds?: number | null;
  prescribedRestSeconds?: number | null;
  actualRestSeconds?: number | null;
  effortV2?: TrainingV2Effort | null;
  setCompleted?: boolean | null;
  startedAt?: string | null;
  completedAt?: string | null;
  restStartedAt?: string | null;
  restCompletedAt?: string | null;
};

export type SetSaveResult = { status: "SAVED" } | { status: "PENDING_SYNC"; error?: string };

function toRow(userId: string, input: WorkoutSetLogInput, sessionDate: string) {
  const effortV2 = input.effortV2 ?? null;
  const actualLoad = input.actualLoad ?? input.weightKg;
  const actualReps = input.actualReps ?? input.reps;
  const skipped = input.skipped;
  return {
    user_id: userId,
    exercise_id: input.exerciseId,
    exercise_external_id: input.exerciseExternalId,
    session_date: sessionDate,
    set_number: input.setNumber,
    weight_kg: actualLoad,
    reps: actualReps,
    effort: input.effort ?? (effortV2 ? effortV2ToLegacy(effortV2) : null),
    notes: input.notes.trim() || null,
    skipped,
    assignment_id: input.assignmentId || null,
    assignment_exercise_id: input.assignmentExerciseId || null,
    workout_session_id: input.workoutSessionId || null,
    set_type: input.setType ?? "WORKING",
    prescribed_load: input.prescribedLoad ?? null,
    actual_load: skipped ? null : actualLoad,
    prescribed_reps_min: input.prescribedRepsMin ?? null,
    prescribed_reps_max: input.prescribedRepsMax ?? null,
    actual_reps: skipped ? null : actualReps,
    prescribed_duration_seconds: input.prescribedDurationSeconds ?? null,
    actual_duration_seconds: skipped ? null : (input.actualDurationSeconds ?? null),
    prescribed_rest_seconds: input.prescribedRestSeconds ?? null,
    actual_rest_seconds: input.actualRestSeconds ?? null,
    effort_v2: skipped ? null : effortV2,
    set_completed: skipped ? false : input.setCompleted !== false,
    started_at: input.startedAt ?? null,
    completed_at: skipped ? null : (input.completedAt ?? new Date().toISOString()),
    rest_started_at: input.restStartedAt ?? null,
    rest_completed_at: input.restCompletedAt ?? null,
  };
}

export async function upsertWorkoutSetLog(input: WorkoutSetLogInput): Promise<SetSaveResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "PENDING_SYNC", error: "not_authenticated" };

  const sessionDate = input.sessionDate ?? new Date().toISOString().slice(0, 10);
  const row = toRow(user.id, input, sessionDate);
  const identity = setIdentity({
    sessionDate,
    exerciseExternalId: input.exerciseExternalId,
    setNumber: input.setNumber,
  });

  const { error } = await supabase.from("workout_set_logs").upsert(row, {
    onConflict: "user_id,session_date,exercise_external_id,set_number",
  });

  if (error) {
    console.warn("[workout-set-logs] failed to sync set log", error.message);
    const pending: PendingSetWrite = {
      identity,
      payload: { ...input, sessionDate },
      queuedAt: new Date().toISOString(),
      attempts: 1,
    };
    writePendingQueue(enqueuePending(readPendingQueue(), pending));
    return { status: "PENDING_SYNC", error: error.message };
  }

  writePendingQueue(readPendingQueue().filter((item) => item.identity !== identity));
  return { status: "SAVED" };
}

export async function flushPendingWorkoutSetLogs(): Promise<number> {
  const queue = readPendingQueue();
  if (!queue.length) return 0;
  let flushed = 0;
  for (const item of queue) {
    const payload = item.payload as WorkoutSetLogInput;
    const result = await upsertWorkoutSetLog(payload);
    if (result.status === "SAVED") flushed += 1;
  }
  return flushed;
}

export async function listOwnSetLogsForDate(sessionDate: string) {
  const { data, error } = await supabase
    .from("workout_set_logs")
    .select(
      "exercise_external_id,exercise_id,set_number,weight_kg,reps,effort,effort_v2,skipped,set_completed,actual_load,actual_reps,actual_duration_seconds,prescribed_load,prescribed_reps_min,prescribed_reps_max,prescribed_rest_seconds,actual_rest_seconds,set_type,notes,started_at,completed_at,updated_at",
    )
    .eq("session_date", sessionDate)
    .order("set_number", { ascending: true });
  if (error) {
    console.warn("[workout-set-logs] list failed", error.message);
    return [];
  }
  return data ?? [];
}

export async function insertSafetySignal(input: {
  signal: "pain" | "discomfort" | "unsafe_execution";
  exerciseExternalId?: string | null;
  workoutSessionId?: string | null;
  reason?: string | null;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("client_training_safety_signals").insert({
    user_id: user.id,
    safety_signal: input.signal,
    exercise_external_id: input.exerciseExternalId ?? null,
    workout_session_id: input.workoutSessionId ?? null,
    safety_reason: input.reason ?? null,
  });
  if (error) console.warn("[safety-signal] insert failed", error.message);
}
