import { generateTrainingProgram } from "@/lib/platform/program-generation";
import { getCoreExercisePrescription } from "@/lib/platform/prescription";
import { getNextSessionProgression } from "@/lib/platform/progression";
import { getWeeklyVolumeDecision } from "@/lib/platform/volume";
import { evaluateRegionalResponse, evaluateGoalResponse } from "@/lib/platform/goal-intelligence";
import { getClientTrainingProgressSummary } from "@/lib/platform/training-progress";
import { toDecisionTrace } from "@/lib/platform/training-progress/observability";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { TrainingV2CanonicalGoal, ClientTrainingLevel, ExerciseSetHistoryItem } from "@/lib/platform/training-v2-contracts";
import type { ProgressionAction } from "@/lib/platform/progression/types";
import type { VolumeAction } from "@/lib/platform/volume/types";
import type { GoalResponseState } from "@/lib/platform/goal-intelligence/types";
import { historySession, volumePrescribed, volumeWorking } from "./fixtures";

export type WeekTrace = {
  week: number;
  prescription_status: string;
  progression_action: ProgressionAction | null;
  volume_action: VolumeAction;
  load: number | null;
};

export type MultiWeekSimulation = {
  program_version: number;
  regenerated: false;
  lead_exercise: string;
  weeks: WeekTrace[];
  goal_response: GoalResponseState | null;
  traces: ReturnType<typeof toDecisionTrace>[];
  client_title: string;
};

export function simulateMultiWeek(input: {
  exercises: ExerciseV2Metadata[];
  goalId: TrainingV2CanonicalGoal;
  trainingLevel?: ClientTrainingLevel;
  daysPerWeek?: 2 | 3 | 4 | 5;
  weeks?: number;
}): MultiWeekSimulation {
  const weeks = input.weeks ?? 8;
  const generated = generateTrainingProgram({
    goalId: input.goalId,
    trainingLevel: input.trainingLevel ?? "INTERMEDIATE",
    daysPerWeek: input.daysPerWeek ?? 3,
    availableMinutes: 60,
    location: "GYM",
    exercises: input.exercises,
    reason: "INITIAL_PROGRAM_GENERATION",
  });
  if (!generated.candidate) {
    throw new Error(`program blocked: ${generated.status}`);
  }
  const lead = generated.candidate.sessions[0]?.exercises[0];
  if (!lead) throw new Error("empty program");
  const meta = input.exercises.find((row) => row.external_id === lead.external_id);
  if (!meta) throw new Error("lead metadata missing");

  const byId: Record<string, ExerciseV2Metadata> = { [meta.external_id]: meta };
  let history: ExerciseSetHistoryItem[] = [];
  let load: number | null = null;
  const weekTraces: WeekTrace[] = [];
  const traces = [
    toDecisionTrace({
      engine: "program",
      action: generated.status,
      reason_code: generated.generation_reason,
      object_type: "program",
      program_version: generated.candidate.version,
      confidence: "HIGH",
    }),
  ];

  for (let week = 1; week <= weeks; week += 1) {
    const date = `2026-06-${String(week * 2).padStart(2, "0")}`;
    const prescription = getCoreExercisePrescription({
      goalId: input.goalId,
      trainingLevel: input.trainingLevel ?? "INTERMEDIATE",
      exerciseExperience: history.length ? "FAMILIAR" : "NEW",
      exercise: meta,
      location: "GYM",
      recentHistory: history,
      assigned: { sets: lead.sets, rest_seconds: lead.rest_seconds, reps: "8-12", suggested_weight_kg: null },
      preserveAssignedStructure: true,
    });
    if (week === 1) {
      traces.push(
        toDecisionTrace({
          engine: "progression",
          action: prescription.status,
          reason_code: prescription.prescription_reason,
          object_type: "exercise",
          object_id: lead.external_id,
          program_version: generated.candidate.version,
          confidence: prescription.confidence,
        }),
      );
    }
    const currentLoad = load ?? 40;
    const allTop = week >= 4;
    const reps = allTop ? [12, 12, 12] : week === 1 ? [8, 8, 8] : week === 2 ? [9, 9, 8] : [10, 10, 10];
    history = [...history, ...historySession(`w${week}`, date, reps, { load: currentLoad })];
    const progression = getNextSessionProgression({
      externalId: lead.external_id,
      exercise: meta,
      history,
      trainingLevel: input.trainingLevel ?? "INTERMEDIATE",
      requiredWorkingSets: 3,
      repMin: 8,
      repMax: 12,
      availableIncrementKg: 2.5,
    });
    if (progression.action === "INCREASE_LOAD" && progression.next_load != null) {
      load = progression.next_load;
    } else {
      load = progression.next_load ?? currentLoad;
    }
    const volume = getWeeklyVolumeDecision({
      goalId: input.goalId,
      trainingLevel: input.trainingLevel ?? "INTERMEDIATE",
      exercises: byId,
      sets: volumeWorking(`2026-W${String(20 + week).padStart(2, "0")}`, date, lead.external_id, 3, {
        actualLoad: currentLoad,
        actualReps: reps[0],
      }),
      prescribed: [volumePrescribed(`2026-W${String(20 + week).padStart(2, "0")}`, lead.external_id, 3)],
    });
    weekTraces.push({
      week,
      prescription_status: prescription.status,
      progression_action: progression.action,
      volume_action: volume.program_action,
      load,
    });
  }

  const regional = evaluateRegionalResponse({
    region: input.goalId === "GLUTE_GROWTH" ? "GLUTES" : input.goalId === "TONED_ARMS_UPPER_BODY" ? "BICEPS" : "UPPER_BACK",
    priority: "PRIMARY",
    validMicrocycles: weeks,
    prescribedVolume: 12,
    completedVolume: 12,
    effectiveVolume: 10,
    directPrimaryShare: 0.7,
    performanceTrend: "IMPROVING",
    localFatigue: "NONE",
    globalRecovery: "NORMAL",
    progressionActions: weekTraces.map((row) => row.progression_action).filter((item): item is ProgressionAction => Boolean(item)),
    exerciseResponse: "POSITIVE",
  });
  const goal = evaluateGoalResponse({
    goalId: input.goalId,
    regions: [regional],
    globalRecovery: "NORMAL",
    adherenceShare: 1,
  });
  const summary = getClientTrainingProgressSummary({
    goalId: input.goalId,
    goalDecision: {
      goal_response: goal.goal_response,
      action: goal.action,
      reason_code: goal.reason_code,
      limiting_factor: goal.limiting_factor,
      client_explanation: goal.client_explanation,
    },
  });

  return {
    program_version: generated.candidate.version,
    regenerated: false,
    lead_exercise: lead.external_id,
    weeks: weekTraces,
    goal_response: goal.goal_response,
    traces,
    client_title: summary.goal_card.title,
  };
}
