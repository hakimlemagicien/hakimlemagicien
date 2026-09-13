import { supabase } from "@/integrations/supabase/client";
import type { TrainingAssignmentDecisionState } from "./types";

export type TrainingAssignmentReviewRow = {
  id: string;
  client_id: string;
  client_name?: string | null;
  client_kind: "NEW" | "EXISTING";
  decision_state: TrainingAssignmentDecisionState;
  quiz_goal: string | null;
  mapped_training_goal: string | null;
  training_level: string | null;
  training_environment: string | null;
  days_per_week: number | null;
  equipment_summary: string | null;
  previous_template_id: string | null;
  previous_template_slug: string | null;
  previous_assignment_id: string | null;
  recommended_template_id: string | null;
  recommended_template_slug: string | null;
  assigned_template_id: string | null;
  assigned_template_slug: string | null;
  assignment_id: string | null;
  assignment_source: string;
  reason_code: string | null;
  reason_summary: string | null;
  resolver_trace: Record<string, unknown>;
  client_context: Record<string, unknown>;
  is_read: boolean;
  is_reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  effective_at: string;
  created_at: string;
  total_count?: number;
};

function mapReview(row: Record<string, unknown>): TrainingAssignmentReviewRow {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    client_name: (row.client_name as string | null) ?? null,
    client_kind: (row.client_kind as "NEW" | "EXISTING") ?? "EXISTING",
    decision_state: row.decision_state as TrainingAssignmentDecisionState,
    quiz_goal: (row.quiz_goal as string | null) ?? null,
    mapped_training_goal: (row.mapped_training_goal as string | null) ?? null,
    training_level: (row.training_level as string | null) ?? null,
    training_environment: (row.training_environment as string | null) ?? null,
    days_per_week: row.days_per_week == null ? null : Number(row.days_per_week),
    equipment_summary: (row.equipment_summary as string | null) ?? null,
    previous_template_id: (row.previous_template_id as string | null) ?? null,
    previous_template_slug: (row.previous_template_slug as string | null) ?? null,
    previous_assignment_id: (row.previous_assignment_id as string | null) ?? null,
    recommended_template_id: (row.recommended_template_id as string | null) ?? null,
    recommended_template_slug: (row.recommended_template_slug as string | null) ?? null,
    assigned_template_id: (row.assigned_template_id as string | null) ?? null,
    assigned_template_slug: (row.assigned_template_slug as string | null) ?? null,
    assignment_id: (row.assignment_id as string | null) ?? null,
    assignment_source: String(row.assignment_source ?? "AUTO"),
    reason_code: (row.reason_code as string | null) ?? null,
    reason_summary: (row.reason_summary as string | null) ?? null,
    resolver_trace: (row.resolver_trace as Record<string, unknown>) ?? {},
    client_context: (row.client_context as Record<string, unknown>) ?? {},
    is_read: Boolean(row.is_read),
    is_reviewed: Boolean(row.is_reviewed),
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    effective_at: String(row.effective_at),
    created_at: String(row.created_at),
    total_count: row.total_count == null ? undefined : Number(row.total_count),
  };
}

export async function upsertTrainingAssignmentReview(input: {
  clientId: string;
  clientKind: "NEW" | "EXISTING";
  decisionState: TrainingAssignmentDecisionState;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  asClient?: boolean;
}): Promise<TrainingAssignmentReviewRow> {
  if (input.asClient) {
    const { data, error } = await supabase.rpc("client_upsert_training_assignment_review", {
      p_decision_state: input.decisionState,
      p_idempotency_key: input.idempotencyKey,
      p_payload: {
        ...input.payload,
        client_kind: input.clientKind,
      },
    });
    if (error) throw error;
    return mapReview(data as Record<string, unknown>);
  }

  const { data, error } = await supabase.rpc("admin_upsert_training_assignment_review", {
    p_client_id: input.clientId,
    p_client_kind: input.clientKind,
    p_decision_state: input.decisionState,
    p_idempotency_key: input.idempotencyKey,
    p_payload: input.payload,
  });
  if (error) throw error;
  return mapReview(data as Record<string, unknown>);
}

export async function listTrainingAssignmentReviews(opts?: {
  reviewed?: boolean | null;
  decisionState?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ rows: TrainingAssignmentReviewRow[]; totalCount: number }> {
  const { data, error } = await supabase.rpc("admin_list_training_assignment_reviews", {
    p_reviewed: opts?.reviewed ?? null,
    p_decision_state: opts?.decisionState ?? null,
    p_limit: opts?.limit ?? 50,
    p_offset: opts?.offset ?? 0,
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapReview);
  return {
    rows,
    totalCount: Number(rows[0]?.total_count ?? rows.length),
  };
}

export async function markTrainingAssignmentReview(input: {
  reviewId: string;
  markRead?: boolean;
  markReviewed?: boolean;
}): Promise<TrainingAssignmentReviewRow> {
  const { data, error } = await supabase.rpc("admin_mark_training_assignment_review", {
    p_review_id: input.reviewId,
    p_mark_read: input.markRead ?? true,
    p_mark_reviewed: input.markReviewed ?? true,
  });
  if (error) throw error;
  return mapReview(data as Record<string, unknown>);
}
