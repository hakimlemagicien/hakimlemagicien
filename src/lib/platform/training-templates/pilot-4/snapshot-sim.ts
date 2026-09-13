/**
 * Snapshot compatibility simulation for Pilot 4 (no DB assignment).
 * Mirrors relational fields that `_copy_template_to_assignment` freezes.
 */

import type { AdminProgramDetail } from "@/lib/admin/admin-programs-api";
import {
  buildAssignmentProvenanceFromContract,
  type AssignmentProvenanceFromTemplate,
} from "@/lib/platform/training-templates";
import { programTemplateContractFromMetadata } from "@/lib/admin/admin-program-builder";

export type SimulatedAssignmentSnapshot = {
  source_template_id: string;
  template_version: number;
  name_ar: string;
  goal: string | null;
  level: string | null;
  duration_weeks: number;
  days_per_week: number;
  provenance: AssignmentProvenanceFromTemplate | null;
  weeks: Array<{
    week_number: number;
    days: Array<{
      day_number: number;
      day_type: string;
      title_ar: string;
      exercises: Array<{
        exercise_external_id: string | null | undefined;
        sets: number;
        reps_min: number | null;
        reps_max: number | null;
        reps_label: string | null;
        rest_seconds: number;
        activity_role?: string | null;
      }>;
    }>;
  }>;
};

/** Freeze relational + provenance — master metadata remains separate. */
export function simulateSnapshotFromTemplate(detail: AdminProgramDetail): SimulatedAssignmentSnapshot {
  const contract = programTemplateContractFromMetadata(detail.metadata);
  return {
    source_template_id: detail.id,
    template_version: detail.version,
    name_ar: detail.name_ar,
    goal: detail.goal,
    level: detail.level,
    duration_weeks: detail.duration_weeks,
    days_per_week: detail.days_per_week,
    provenance: contract ? buildAssignmentProvenanceFromContract(contract) : null,
    weeks: detail.weeks.map((week) => ({
      week_number: week.week_number,
      days: week.days.map((day) => ({
        day_number: day.day_number,
        day_type: day.day_type,
        title_ar: day.title_ar,
        exercises: day.exercises.map((exercise) => ({
          exercise_external_id: exercise.exercise_external_id,
          sets: exercise.sets,
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          reps_label: exercise.reps_label,
          rest_seconds: exercise.rest_seconds,
          activity_role: exercise.activity_role ?? null,
        })),
      })),
    })),
  };
}

/** Master edit must not mutate a previously frozen snapshot object. */
export function assertMasterMutationDoesNotAlterSnapshot(
  snapshot: SimulatedAssignmentSnapshot,
  mutateMaster: (detail: AdminProgramDetail) => AdminProgramDetail,
  master: AdminProgramDetail,
): boolean {
  const before = JSON.stringify(snapshot);
  mutateMaster(structuredClone(master));
  const after = JSON.stringify(snapshot);
  return before === after;
}

export type ClientRuntimeShapeCheck = {
  ok: boolean;
  issues: string[];
};

/** Minimal structural checks for client runtime consumption of snapshot shape. */
export function validateClientRuntimeShape(snapshot: SimulatedAssignmentSnapshot): ClientRuntimeShapeCheck {
  const issues: string[] = [];
  if (!snapshot.source_template_id) issues.push("missing source_template_id");
  if (!snapshot.weeks.length) issues.push("missing weeks");
  for (const week of snapshot.weeks) {
    for (const day of week.days) {
      if (!day.day_type) issues.push(`day ${day.day_number}: missing day_type`);
      for (const exercise of day.exercises) {
        if (!exercise.exercise_external_id) issues.push(`day ${day.day_number}: missing external_id`);
        if (!(exercise.sets > 0)) issues.push(`day ${day.day_number}: invalid sets`);
        if (exercise.rest_seconds < 0) issues.push(`day ${day.day_number}: invalid rest`);
      }
    }
  }
  return { ok: issues.length === 0, issues };
}
