import { supabase } from "@/integrations/supabase/client";
import { recordAdminAdaptiveDecision, type AdminAssignmentDetail, type AdminSetLogRow } from "@/lib/admin/admin-client-training-api";
import type { ExerciseSetHistoryItem, ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import {
  emptyProgressionState,
  parseProgressionState,
  parseProgressionStatus,
  parseProgressionStrategy,
  strategyChangeAudit,
  type ProgressionAssignmentState,
  type ProgressionExerciseInput,
  type ProgressionStrategy,
} from "@/lib/platform/progression-strategy";

export async function setAdminClientProgressionStrategy(input: {
  assignmentId: string;
  clientId: string;
  strategy: ProgressionStrategy;
  expectedUpdatedAt: string | null;
  reason: string;
  from: ProgressionStrategy;
}): Promise<{ updated_at: string; progression_strategy: ProgressionStrategy; progression_state: ProgressionAssignmentState }> {
  const { data, error } = await supabase.rpc("admin_set_client_progression_strategy", {
    p_assignment_id: input.assignmentId,
    p_strategy: input.strategy,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_reason: input.reason,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  const audit = strategyChangeAudit({
    clientId: input.clientId,
    assignmentId: input.assignmentId,
    from: input.from,
    to: input.strategy,
    reason: input.reason,
  });
  await recordAdminAdaptiveDecision({
    clientId: input.clientId,
    assignmentId: input.assignmentId,
    decisionType: "PROGRESSION_STRATEGY_SET",
    evaluationKey: `progression-strategy:${input.assignmentId}`,
    reasonCode: input.strategy,
    confidence: "HIGH",
    snapshot: audit as unknown as Record<string, unknown>,
  });
  const strategy = parseProgressionStrategy(row.progression_strategy);
  return {
    updated_at: String(row.updated_at ?? ""),
    progression_strategy: strategy,
    progression_state: parseProgressionState(row.progression_state, strategy),
  };
}

export async function resolveAdminProgressionReview(input: {
  assignmentId: string;
  clientId: string;
  exerciseExternalId: string;
  expectedUpdatedAt: string | null;
  action: "keep";
  reasonCode?: string;
}): Promise<{ updated_at: string; progression_state: ProgressionAssignmentState }> {
  const { data, error } = await supabase.rpc("admin_resolve_progression_review", {
    p_assignment_id: input.assignmentId,
    p_exercise_external_id: input.exerciseExternalId,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_action: input.action,
    p_reason_code: input.reasonCode ?? null,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  await recordAdminAdaptiveDecision({
    clientId: input.clientId,
    assignmentId: input.assignmentId,
    decisionType: "PROGRESSION_EXERCISE_KEEP",
    evaluationKey: `progression-keep:${input.assignmentId}:${input.exerciseExternalId}`,
    reasonCode: "COACH_KEEP",
    confidence: "HIGH",
    snapshot: {
      who: "COACH",
      exercise_external_id: input.exerciseExternalId,
      result: "kept",
      reason_code: input.reasonCode ?? null,
    },
  });
  const strategy = parseProgressionStrategy(row.progression_strategy);
  return {
    updated_at: String(row.updated_at ?? ""),
    progression_state: parseProgressionState(row.progression_state, strategy),
  };
}

export function progressionFromAssignmentRow(row: {
  progression_strategy?: string | null;
  progression_status?: string | null;
  last_progression_evaluation_at?: string | null;
  progression_state?: unknown;
}): ProgressionAssignmentState {
  const strategy = parseProgressionStrategy(row.progression_strategy);
  const parsed = parseProgressionState(row.progression_state, strategy);
  return {
    ...parsed,
    strategy,
    status: parseProgressionStatus(row.progression_status ?? parsed.status),
    last_evaluation_at: row.last_progression_evaluation_at ?? parsed.last_evaluation_at,
  };
}

export function mapProgramLevelToTrainingLevel(level: string | null | undefined): ClientTrainingLevel {
  const value = String(level ?? "").toLowerCase();
  if (value === "intermediate" || value === "advanced") return "INTERMEDIATE";
  if (value === "beginner") return "BEGINNER";
  return "BEGINNER";
}

export function assignmentExercisesForProgression(detail: AdminAssignmentDetail): ProgressionExerciseInput[] {
  const seen = new Set<string>();
  const rows: ProgressionExerciseInput[] = [];
  for (const week of detail.weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (!exercise.exercise_external_id || seen.has(exercise.exercise_external_id)) continue;
        seen.add(exercise.exercise_external_id);
        rows.push({
          id: exercise.id,
          exercise_id: exercise.exercise_id,
          exercise_external_id: exercise.exercise_external_id,
          exercise_name_ar: exercise.exercise_name_ar,
          sets: exercise.sets,
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          rest_seconds: exercise.rest_seconds,
          suggested_weight_kg: exercise.suggested_weight_kg,
        });
      }
    }
  }
  return rows;
}

export function findAssignmentExerciseCoords(
  detail: AdminAssignmentDetail,
  externalId: string,
): { week: number; day: number; exercise: number } | null {
  for (let week = 0; week < detail.weeks.length; week += 1) {
    for (let day = 0; day < detail.weeks[week].days.length; day += 1) {
      const exercise = detail.weeks[week].days[day].exercises.findIndex((row) => row.exercise_external_id === externalId);
      if (exercise >= 0) return { week, day, exercise };
    }
  }
  return null;
}

export function setLogsToHistoryById(logs: AdminSetLogRow[]): Record<string, ExerciseSetHistoryItem[]> {
  const byId: Record<string, ExerciseSetHistoryItem[]> = {};
  for (const row of logs) {
    const id = row.exercise_external_id;
    if (!id) continue;
    const item: ExerciseSetHistoryItem = {
      id: row.id,
      workoutSessionId: row.session_date,
      sessionDate: row.session_date,
      setNumber: row.set_number,
      setType: "WORKING",
      prescribedLoad: null,
      actualLoad: row.weight_kg,
      prescribedRepsMin: null,
      prescribedRepsMax: null,
      actualReps: row.reps,
      effort: (row.effort as ExerciseSetHistoryItem["effort"]) ?? null,
      effortV2: null,
      skipped: row.skipped,
      setCompleted: !row.skipped,
      createdAt: row.created_at,
    };
    (byId[id] ??= []).push(item);
  }
  return byId;
}

export function progressionWriteErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("stale_update")) {
    return "تم تحديث البرنامج منذ فتح هذه الصفحة. راجع أحدث نسخة قبل الحفظ.";
  }
  if (message.includes("admin_set_client_progression_strategy") || message.includes("does not exist")) {
    return "تعذر حفظ استراتيجية التطور. طبّق ترحيل قاعدة البيانات المحلي أولاً.";
  }
  return message || "تعذر تطبيق التحديث";
}

export { emptyProgressionState };
