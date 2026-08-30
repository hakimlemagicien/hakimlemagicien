import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";
import {
  logTrainingStrategyEvent,
  validateV2AssignmentPayload,
  validateValidationStatuses,
} from "@/lib/platform/training-strategy-hardening";

export type AdminAssignmentSummary = {
  id: string;
  source_template_id: string | null;
  template_version: number;
  status: string;
  name_ar: string | null;
  starts_on: string | null;
  assigned_at: string;
  ended_at: string | null;
  snapshot_complete: boolean;
};

export type AdminAssignmentExercise = {
  id: string;
  exercise_id: string | null;
  exercise_external_id: string;
  exercise_name_ar: string;
  exercise_name_en: string | null;
  sort_order: number;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  reps_label: string | null;
  rest_seconds: number;
  suggested_weight_kg: number | null;
  notes_ar: string | null;
};

export type AdminAssignmentDay = {
  id: string;
  day_number: number;
  day_type: string;
  title_ar: string;
  muscle_focus: string | null;
  estimated_minutes: number | null;
  estimated_calories: number | null;
  exercises: AdminAssignmentExercise[];
};

export type AdminAssignmentWeek = {
  id: string;
  week_number: number;
  title_ar: string | null;
  notes_ar: string | null;
  days: AdminAssignmentDay[];
};

export type AdminAssignmentDetail = AdminAssignmentSummary & {
  client_id: string;
  assigned_by: string | null;
  name_en: string | null;
  goal: string | null;
  level: string | null;
  duration_weeks: number | null;
  days_per_week: number | null;
  updated_at: string;
  exercise_count: number;
  weeks: AdminAssignmentWeek[];
};

export type AdminSetLogRow = {
  id: string;
  exercise_id: string | null;
  exercise_external_id: string;
  session_date: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  effort: string | null;
  skipped: boolean;
  assignment_id: string | null;
  created_at: string;
};

function mapDetail(row: Record<string, unknown>): AdminAssignmentDetail {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    source_template_id: row.source_template_id ? String(row.source_template_id) : null,
    template_version: Number(row.template_version ?? 1),
    status: String(row.status),
    name_ar: (row.name_ar as string | null) ?? null,
    name_en: (row.name_en as string | null) ?? null,
    starts_on: (row.starts_on as string | null) ?? null,
    assigned_at: String(row.assigned_at),
    assigned_by: (row.assigned_by as string | null) ?? null,
    ended_at: (row.ended_at as string | null) ?? null,
    snapshot_complete: Boolean(row.snapshot_complete),
    goal: (row.goal as string | null) ?? null,
    level: (row.level as string | null) ?? null,
    duration_weeks: row.duration_weeks == null ? null : Number(row.duration_weeks),
    days_per_week: row.days_per_week == null ? null : Number(row.days_per_week),
    updated_at: String(row.updated_at),
    exercise_count: Number(row.exercise_count ?? 0),
    weeks: ((row.weeks as AdminAssignmentWeek[]) ?? []).map((week) => ({
      ...week,
      days: (week.days ?? []).map((day) => ({ ...day, exercises: day.exercises ?? [] })),
    })),
  };
}

export async function assignAdminClientProgram(input: {
  clientId: string;
  templateId: string;
  startsOn: string;
  replace: boolean;
}): Promise<AdminAssignmentDetail> {
  const { data, error } = await supabase.rpc("admin_assign_client_program", {
    p_client_id: input.clientId,
    p_template_id: input.templateId,
    p_starts_on: input.startsOn,
    p_replace: input.replace,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function getAdminClientAssignment(id: string): Promise<AdminAssignmentDetail> {
  const { data, error } = await supabase.rpc("admin_get_client_assignment", { p_assignment_id: id });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function listAdminClientAssignments(clientId: string, offset = 0) {
  const { data, error } = await supabase.rpc("admin_list_client_assignments", {
    p_client_id: clientId,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(offset, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    source_template_id: row.source_template_id ? String(row.source_template_id) : null,
    template_version: Number(row.template_version),
    status: String(row.status),
    name_ar: (row.name_ar as string | null) ?? null,
    starts_on: (row.starts_on as string | null) ?? null,
    assigned_at: String(row.assigned_at),
    ended_at: (row.ended_at as string | null) ?? null,
    snapshot_complete: Boolean(row.snapshot_complete),
  }));
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}

export async function assignGeneratedV2Program(input: {
  clientId: string;
  startsOn: string;
  replace: boolean;
  generationStatus: string;
  validationStatus: string;
  payload: Record<string, unknown>;
}): Promise<AdminAssignmentDetail> {
  const statusError = validateValidationStatuses({
    generationStatus: input.generationStatus,
    validationStatus: input.validationStatus,
  });
  if (statusError) {
    logTrainingStrategyEvent({
      scope: "assignment",
      action: "assign_blocked",
      clientId: input.clientId,
      validationStatus: input.validationStatus,
      blockingReasons: [statusError],
    });
    throw new Error(statusError);
  }
  const payloadError = validateV2AssignmentPayload(input.payload);
  if (payloadError) {
    logTrainingStrategyEvent({
      scope: "assignment",
      action: "assign_blocked",
      clientId: input.clientId,
      blockingReasons: [payloadError],
    });
    throw new Error(payloadError);
  }
  const { data, error } = await supabase.rpc("admin_assign_generated_v2_program", {
    p_client_id: input.clientId,
    p_starts_on: input.startsOn,
    p_replace: input.replace,
    p_generation_status: input.generationStatus,
    p_validation_status: input.validationStatus,
    p_payload: input.payload,
  });
  if (error) throw error;
  logTrainingStrategyEvent({
    scope: "assignment",
    action: "assign_success",
    clientId: input.clientId,
    assignmentId: String((data as Record<string, unknown>)?.id ?? ""),
    validationStatus: input.validationStatus,
    changeSource: "COACH_REQUEST",
  });
  return mapDetail(data as Record<string, unknown>);
}

export async function recordAdminAdaptiveDecision(input: {
  clientId: string;
  decisionType: string;
  evaluationKey: string;
  reasonCode: string;
  confidence: string;
  snapshot: Record<string, unknown>;
  assignmentId?: string | null;
  programVersion?: number | null;
}) {
  const { error } = await supabase.rpc("admin_record_adaptive_decision", {
    p_client_id: input.clientId,
    p_decision_type: input.decisionType,
    p_evaluation_key: input.evaluationKey,
    p_reason_code: input.reasonCode,
    p_confidence: input.confidence,
    p_input_snapshot: input.snapshot,
    p_assignment_id: input.assignmentId ?? null,
    p_program_version: input.programVersion ?? null,
  });
  if (error) throw error;
}

export async function listAdminClientAdaptiveDecisions(clientId: string, limit = 20) {
  const { data, error } = await supabase.rpc("admin_list_client_adaptive_decisions", {
    p_client_id: clientId,
    p_limit: limit,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function endAdminClientProgram(id: string, status: "completed" | "cancelled") {
  const { data, error } = await supabase.rpc("admin_end_client_program", {
    p_assignment_id: id,
    p_status: status,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function saveAdminClientAssignmentExercises(
  assignmentId: string,
  exercises: Array<Record<string, unknown>>,
  expectedUpdatedAt: string | null,
) {
  const { data, error } = await supabase.rpc("admin_save_client_assignment_exercises", {
    p_assignment_id: assignmentId,
    p_payload: { exercises },
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function listAdminClientSetLogs(opts: {
  clientId: string;
  exerciseId?: string | null;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc("admin_list_client_set_logs", {
    p_client_id: opts.clientId,
    p_exercise_id: opts.exerciseId || null,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(opts.offset ?? 0, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    exercise_id: (row.exercise_id as string | null) ?? null,
    exercise_external_id: String(row.exercise_external_id),
    session_date: String(row.session_date),
    set_number: Number(row.set_number),
    weight_kg: row.weight_kg == null ? null : Number(row.weight_kg),
    reps: row.reps == null ? null : Number(row.reps),
    effort: (row.effort as string | null) ?? null,
    skipped: Boolean(row.skipped),
    assignment_id: (row.assignment_id as string | null) ?? null,
    created_at: String(row.created_at),
  })) satisfies AdminSetLogRow[];
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}
