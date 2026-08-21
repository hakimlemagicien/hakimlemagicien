import { fetchMyTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { fetchExercisesV2ByExternalIds } from "@/lib/platform/exercise-library-v2-api";
import { getLocalDateKey } from "@/lib/platform/readiness";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import { mapLegacyGoalId, type ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import { ensureTrainingLevel, listOwnRecentWorkoutSessions } from "@/lib/platform/training-v2-api";
import { supabase } from "@/integrations/supabase/client";
import type {
  VolumeSetInput,
  PrescribedVolumeInput,
  VolumeAction,
} from "@/lib/platform/volume/types";
import type { GoalAction } from "@/lib/platform/goal-intelligence/types";
import { evaluateClientLoop } from "./evaluate";
import { listOwnAdaptiveDecisions, persistClientLoopEvaluation } from "./persist";
import { isoWeekKey, weeksBetweenKeys } from "./dates";
import {
  CLIENT_LOOP_GOAL_DECISION,
  CLIENT_LOOP_VOLUME_DECISION,
  type ClientLoopEvaluation,
  type LoopEvidence,
  type PersistedAdaptiveDecision,
} from "./types";

let inFlight: Promise<ClientLoopEvaluation | null> | null = null;

function asVolumeAction(value: unknown): VolumeAction | null {
  return typeof value === "string" ? (value as VolumeAction) : null;
}

function asGoalAction(value: unknown): GoalAction | null {
  return typeof value === "string" ? (value as GoalAction) : null;
}

async function listOwnLoopSetEvidence(days = 28): Promise<VolumeSetInput[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("workout_set_logs")
    .select(
      "exercise_external_id, session_date, set_type, skipped, set_completed, effort_v2, actual_reps, actual_load, weight_kg, reps, prescribed_rest_seconds, actual_rest_seconds",
    )
    .eq("user_id", userId)
    .gte("session_date", sinceKey)
    .order("session_date", { ascending: true })
    .limit(400);
  if (error) {
    console.warn("[client-loop] listOwnLoopSetEvidence failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const sessionDate = String(row.session_date);
    return {
      weekKey: isoWeekKey(sessionDate),
      sessionDate,
      externalId: String(row.exercise_external_id),
      setType: (row.set_type as VolumeSetInput["setType"]) ?? "WORKING",
      skipped: Boolean(row.skipped),
      setCompleted: row.set_completed == null ? !row.skipped : Boolean(row.set_completed),
      effortV2: row.effort_v2 as VolumeSetInput["effortV2"],
      actualReps:
        row.actual_reps == null
          ? row.reps == null
            ? null
            : Number(row.reps)
          : Number(row.actual_reps),
      actualLoad:
        row.actual_load == null
          ? row.weight_kg == null
            ? null
            : Number(row.weight_kg)
          : Number(row.actual_load),
      prescribedRestSeconds:
        row.prescribed_rest_seconds == null ? null : Number(row.prescribed_rest_seconds),
      actualRestSeconds: row.actual_rest_seconds == null ? null : Number(row.actual_rest_seconds),
    };
  });
}

function prescribedFromRuntime(
  days: Array<{ exercises: Array<{ external_id: string; sets: number }> }>,
  weekKeys: string[],
): PrescribedVolumeInput[] {
  const rows: PrescribedVolumeInput[] = [];
  for (const weekKey of weekKeys) {
    for (const day of days) {
      for (const exercise of day.exercises) {
        rows.push({ weekKey, externalId: exercise.external_id, workingSets: exercise.sets });
      }
    }
  }
  return rows;
}

export function lastVolumeFromLogs(rows: PersistedAdaptiveDecision[], currentWeek: string) {
  const row = rows.find((item) => item.decision_type === CLIENT_LOOP_VOLUME_DECISION);
  if (!row) return null;
  const view = row.input_snapshot.progress_view as { program_action?: string } | undefined;
  const action = asVolumeAction(view?.program_action ?? row.reason_code);
  if (!action) return null;
  const week = String(row.input_snapshot.evaluation_week ?? currentWeek);
  return { action, validWeeksAgo: weeksBetweenKeys(week, currentWeek) };
}

export function lastGoalFromLogs(rows: PersistedAdaptiveDecision[], currentWeek: string) {
  const row = rows.find((item) => item.decision_type === CLIENT_LOOP_GOAL_DECISION);
  if (!row) return { action: null as GoalAction | null, weeksAgo: 99 };
  const view = row.input_snapshot.progress_view as { action?: string } | undefined;
  const action = asGoalAction(view?.action ?? row.input_snapshot.action);
  const week = String(row.input_snapshot.evaluation_week ?? currentWeek);
  return { action, weeksAgo: weeksBetweenKeys(week, currentWeek) };
}

export function resolveLoopGoalId(assignmentGoal?: string | null): string | null {
  const quiz = readQuizProgress()?.goalId ?? null;
  const mapped = mapLegacyGoalId(quiz ?? assignmentGoal ?? "");
  return mapped.canonicalId ?? quiz ?? assignmentGoal ?? null;
}

export async function gatherLoopEvidence(): Promise<LoopEvidence | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return null;
  const [runtime, sets, sessions, level, decisions] = await Promise.all([
    fetchMyTrainingRuntime().catch(() => null),
    listOwnLoopSetEvidence(),
    listOwnRecentWorkoutSessions(16),
    ensureTrainingLevel(),
    listOwnAdaptiveDecisions(12),
  ]);
  const evaluationDate = getLocalDateKey();
  const week = isoWeekKey(evaluationDate);
  const weekKeys = [...new Set([week, ...sets.map((row) => row.weekKey)])].slice(-3);
  const ids = [...new Set(sets.map((row) => row.externalId))];
  if (runtime?.days) {
    for (const day of runtime.days) {
      for (const exercise of day.exercises) ids.push(exercise.external_id);
    }
  }
  const catalog = await fetchExercisesV2ByExternalIds(ids);
  const exercises = Object.fromEntries(catalog.map((item) => [item.external_id, item]));
  const lastVolume = lastVolumeFromLogs(decisions, week);
  const lastGoal = lastGoalFromLogs(decisions, week);
  const inProgress = sessions.some((row) => row.status === "IN_PROGRESS");

  return {
    goalId: resolveLoopGoalId(),
    trainingLevel: (level?.trainingLevel ?? "UNASSESSED") as ClientTrainingLevel,
    assignmentId: runtime?.assignment?.id ?? null,
    programVersion: runtime?.assignment?.template_version ?? null,
    evaluationDate,
    exercises,
    sets,
    prescribed: runtime?.days ? prescribedFromRuntime(runtime.days, weekKeys) : [],
    continuityState: "NORMAL",
    reconditioningActive: false,
    lastVolumeAction: lastVolume,
    lastGoalAction: lastGoal.action,
    lastGoalActionWeeksAgo: lastGoal.weeksAgo,
    activeWorkoutInProgress: inProgress,
  };
}

export async function runClientLoopEvaluation(): Promise<ClientLoopEvaluation | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const evidence = await gatherLoopEvidence();
      if (!evidence) return null;
      const evaluation = evaluateClientLoop(evidence);
      await persistClientLoopEvaluation(evaluation);
      return evaluation;
    } catch (error) {
      console.warn(
        "[client-loop] evaluation failed",
        error instanceof Error ? error.message : error,
      );
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export async function runClientLoopAfterSession(isV2: boolean) {
  if (!isV2) return null;
  return runClientLoopEvaluation();
}
