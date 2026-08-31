import { supabase } from "@/integrations/supabase/client";
import { getLocalDateKey } from "@/lib/platform/readiness";
import {
  mapLegacyGoalId,
  type ClientTrainingLevel,
  type ExerciseExperienceState,
  type ExerciseSetHistoryItem,
  type LegacyEffort,
  type PrescriptionState,
  type TrainingV2Effort,
  type WorkoutSessionStatus,
  type WorkoutSetType,
} from "@/lib/platform/training-v2-contracts";

export type WorkoutSessionRecord = {
  id: string;
  sessionKey: string;
  sessionDate: string;
  status: WorkoutSessionStatus;
  startedAt: string | null;
  completedAt?: string | null;
  lastActivityAt: string;
  assignmentId: string | null;
  assignmentDayId?: string | null;
  prescribedWorkingSets?: number | null;
  completedWorkingSets?: number | null;
  prescribedExerciseCount?: number | null;
  completedExerciseCount?: number | null;
};

export async function ensureWorkoutSession(input: {
  sessionKey: string;
  sessionDate?: string;
  assignmentId?: string | null;
  assignmentDayId?: string | null;
  prescribedExerciseCount?: number | null;
  prescribedWorkingSets?: number | null;
}): Promise<WorkoutSessionRecord | null> {
  const { data, error } = await supabase.rpc("client_ensure_workout_session", {
    p_session_key: input.sessionKey,
    p_session_date: input.sessionDate ?? getLocalDateKey(),
    p_assignment_id: input.assignmentId ?? null,
    p_assignment_day_id: input.assignmentDayId ?? null,
    p_prescribed_exercise_count: input.prescribedExerciseCount ?? null,
    p_prescribed_working_sets: input.prescribedWorkingSets ?? null,
  });
  if (error) {
    console.warn("[training-v2] ensureWorkoutSession failed", error.message);
    return null;
  }
  const row = (data ?? {}) as Record<string, unknown>;
  if (!row.id) return null;
  return {
    id: String(row.id),
    sessionKey: String(row.session_key ?? input.sessionKey),
    sessionDate: String(row.session_date ?? input.sessionDate ?? ""),
    status: row.status as WorkoutSessionStatus,
    startedAt: row.started_at ? String(row.started_at) : null,
    lastActivityAt: String(row.last_activity_at ?? ""),
    assignmentId: row.assignment_id ? String(row.assignment_id) : null,
  };
}

export async function getActiveWorkoutSession(): Promise<WorkoutSessionRecord | null> {
  const { data, error } = await supabase.rpc("client_get_active_workout_session");
  if (error) {
    console.warn("[training-v2] getActiveWorkoutSession failed", error.message);
    return null;
  }
  const session = (data as { session?: Record<string, unknown> | null } | null)?.session;
  if (!session?.id) return null;
  return {
    id: String(session.id),
    sessionKey: String(session.session_key ?? ""),
    sessionDate: String(session.session_date ?? ""),
    status: session.status as WorkoutSessionStatus,
    startedAt: session.started_at ? String(session.started_at) : null,
    lastActivityAt: String(session.last_activity_at ?? ""),
    assignmentId: session.assignment_id ? String(session.assignment_id) : null,
    assignmentDayId: session.assignment_day_id ? String(session.assignment_day_id) : null,
  };
}

export async function updateWorkoutSessionStatus(
  sessionId: string,
  status: WorkoutSessionStatus,
): Promise<{ id: string; status: WorkoutSessionStatus } | null> {
  const { data, error } = await supabase.rpc("client_update_workout_session_status", {
    p_session_id: sessionId,
    p_status: status,
  });
  if (error) {
    console.warn("[training-v2] updateWorkoutSessionStatus failed", error.message);
    return null;
  }
  const row = (data ?? {}) as Record<string, unknown>;
  return { id: String(row.id), status: row.status as WorkoutSessionStatus };
}

export async function listExerciseSetHistory(
  externalId: string,
  limit = 20,
): Promise<ExerciseSetHistoryItem[]> {
  const { data, error } = await supabase.rpc("client_list_exercise_set_history", {
    p_external_id: externalId,
    p_limit: limit,
  });
  if (error) {
    console.warn("[training-v2] listExerciseSetHistory failed", error.message);
    return [];
  }
  const rows = Array.isArray(data) ? data : [];
  return rows.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.id),
      workoutSessionId: row.workout_session_id ? String(row.workout_session_id) : null,
      sessionDate: String(row.session_date ?? ""),
      setNumber: Number(row.set_number ?? 0),
      setType: (row.set_type as WorkoutSetType | null) ?? null,
      prescribedLoad: row.prescribed_load == null ? null : Number(row.prescribed_load),
      actualLoad: row.actual_load == null ? null : Number(row.actual_load),
      prescribedRepsMin: row.prescribed_reps_min == null ? null : Number(row.prescribed_reps_min),
      prescribedRepsMax: row.prescribed_reps_max == null ? null : Number(row.prescribed_reps_max),
      actualReps: row.actual_reps == null ? null : Number(row.actual_reps),
      prescribedDurationSeconds:
        row.prescribed_duration_seconds == null ? null : Number(row.prescribed_duration_seconds),
      actualDurationSeconds:
        row.actual_duration_seconds == null ? null : Number(row.actual_duration_seconds),
      effort: (row.effort as LegacyEffort | null) ?? null,
      effortV2: (row.effort_v2 as TrainingV2Effort | null) ?? null,
      skipped: Boolean(row.skipped),
      setCompleted: row.set_completed == null ? null : Boolean(row.set_completed),
      createdAt: String(row.created_at ?? ""),
    };
  });
}

export async function fetchCanonicalGoalMapping(legacyId: string) {
  const local = mapLegacyGoalId(legacyId);
  const { data, error } = await supabase.rpc("client_map_legacy_goal", { p_legacy_id: legacyId });
  if (error || !data) return local;
  const row = data as Record<string, unknown>;
  return {
    legacyId: String(row.legacy_id ?? legacyId),
    canonicalId: (row.canonical_id as typeof local.canonicalId) ?? null,
    mappingStatus: (row.mapping_status as typeof local.mappingStatus) ?? "LEGACY_UNMAPPED",
    notes: row.notes ? String(row.notes) : local.notes,
  };
}

export async function ensureTrainingLevel(): Promise<{
  trainingLevel: ClientTrainingLevel;
  prescriptionState: PrescriptionState | null;
} | null> {
  const { data, error } = await supabase.rpc("client_ensure_training_level");
  if (error) {
    console.warn("[training-v2] ensureTrainingLevel failed", error.message);
    return null;
  }
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    trainingLevel: (row.training_level as ClientTrainingLevel) ?? "UNASSESSED",
    prescriptionState: (row.prescription_state as PrescriptionState | null) ?? null,
  };
}

export async function ensureExerciseExperience(externalId: string): Promise<{
  externalId: string;
  state: ExerciseExperienceState;
} | null> {
  const { data, error } = await supabase.rpc("client_ensure_exercise_experience", {
    p_external_id: externalId,
  });
  if (error) {
    console.warn("[training-v2] ensureExerciseExperience failed", error.message);
    return null;
  }
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    externalId: String(row.exercise_external_id ?? externalId),
    state: (row.experience_state as ExerciseExperienceState) ?? "NEW",
  };
}

export async function listOwnRecentWorkoutSessions(limit = 24): Promise<WorkoutSessionRecord[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, session_key, session_date, status, started_at, completed_at, last_activity_at, assignment_id, assignment_day_id, prescribed_working_sets, completed_working_sets, prescribed_exercise_count, completed_exercise_count",
    )
    .eq("user_id", userId)
    .order("last_activity_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[training-v2] listOwnRecentWorkoutSessions failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    sessionKey: String(row.session_key ?? ""),
    sessionDate: String(row.session_date ?? ""),
    status: row.status as WorkoutSessionStatus,
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    lastActivityAt: String(row.last_activity_at ?? ""),
    assignmentId: row.assignment_id ? String(row.assignment_id) : null,
    assignmentDayId: row.assignment_day_id ? String(row.assignment_day_id) : null,
    prescribedWorkingSets: row.prescribed_working_sets == null ? null : Number(row.prescribed_working_sets),
    completedWorkingSets: row.completed_working_sets == null ? null : Number(row.completed_working_sets),
    prescribedExerciseCount: row.prescribed_exercise_count == null ? null : Number(row.prescribed_exercise_count),
    completedExerciseCount: row.completed_exercise_count == null ? null : Number(row.completed_exercise_count),
  }));
}

export async function listOwnRecentWorkingSetSummaries(limit = 80) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("workout_set_logs")
    .select(
      "exercise_external_id, session_date, actual_load, actual_reps, actual_duration_seconds, effort_v2, set_completed, skipped, weight_kg, reps",
    )
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[training-v2] listOwnRecentWorkingSetSummaries failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    exercise_external_id: String(row.exercise_external_id),
    session_date: String(row.session_date),
    actual_load: row.actual_load == null ? (row.weight_kg == null ? null : Number(row.weight_kg)) : Number(row.actual_load),
    actual_reps: row.actual_reps == null ? (row.reps == null ? null : Number(row.reps)) : Number(row.actual_reps),
    actual_duration_seconds: row.actual_duration_seconds == null ? null : Number(row.actual_duration_seconds),
    effort_v2: row.effort_v2 ? String(row.effort_v2) : null,
    set_completed: row.set_completed,
    skipped: Boolean(row.skipped),
  }));
}
