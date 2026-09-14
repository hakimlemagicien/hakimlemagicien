import assert from "node:assert/strict";
import {
  buildTrainingAssignIdempotencyKey,
  decideTrainingAssignment,
  fingerprintClientContext,
} from "./types";
import type { TemplateResolverResult } from "@/lib/platform/training-templates";

function baseResolver(over: Partial<TemplateResolverResult> = {}): TemplateResolverResult {
  return {
    status: "MATCHED",
    recommended_template_id: "tpl-glute-foundation",
    recommended_template_slug: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
    primary_strategy: "GLUTE_FOCUS",
    resolved_level: "BEGINNER",
    resolved_environment: "GYM",
    resolved_days: 3,
    compatibility_status: "SAFE",
    recommendation_reason: {
      goal: "GLUTE_FOCUS",
      level: "BEGINNER",
      environment: "GYM",
      days: 3,
      equipment: "SUPPORTED",
      capability: "N/A",
      compatibility: "SAFE",
      review_signals: [],
      summary: "exact",
    },
    review_signals: [],
    candidate_count: 1,
    candidate_summary: [],
    fallback_used: false,
    fallback_class: "EXACT_MATCH",
    fallback_reason: null,
    dimensions_changed: [],
    coach_override_required: false,
    coach_override_applied: false,
    auto_recommended_template_id: "tpl-glute-foundation",
    coach_selected_template_id: null,
    override_reason: null,
    resolution_trace: {
      quiz_goal: "glute",
      training_v2_goal: null,
      primary_strategy: "GLUTE_FOCUS",
      primary_strategy_source: "quiz",
      level: "BEGINNER",
      environment: "GYM",
      environment_selection_note: null,
      days: 3,
      initial_candidate_count: 1,
      strategy_filtered_count: 1,
      level_filtered_count: 1,
      environment_filtered_count: 1,
      days_filtered_count: 1,
      equipment_filtered_count: 1,
      eligibility_filtered_count: 1,
      readiness_filtered_count: 1,
      final_candidate_count: 1,
      selected_template: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
      review_signals: [],
      dimensions_changed: [],
    },
    ...over,
  };
}

// A) already correct
{
  const d = decideTrainingAssignment({
    clientKind: "EXISTING",
    resolver: baseResolver(),
    activeAssignment: {
      id: "a1",
      source_template_id: "tpl-glute-foundation",
      status: "active",
    },
  });
  assert.equal(d.decision_state, "NO_CHANGE_REQUIRED");
  assert.equal(d.should_assign, false);
}

// B) different exact match → AUTO_UPDATED
{
  const d = decideTrainingAssignment({
    clientKind: "EXISTING",
    resolver: baseResolver(),
    activeAssignment: {
      id: "a1",
      source_template_id: "tpl-other",
      status: "active",
    },
  });
  assert.equal(d.decision_state, "AUTO_UPDATED");
  assert.equal(d.should_assign, true);
  assert.equal(d.should_replace, true);
  assert.equal(d.requires_admin_approval, false);
}

// C) coach override protected
{
  const d = decideTrainingAssignment({
    clientKind: "EXISTING",
    resolver: baseResolver(),
    activeAssignment: {
      id: "a1",
      source_template_id: "tpl-other",
      status: "active",
      progression_strategy: "COACH_MANAGED",
    },
  });
  assert.equal(d.decision_state, "COACH_OVERRIDE_ACTIVE");
  assert.equal(d.should_assign, false);
}

// D) missing context without recommendation
{
  const d = decideTrainingAssignment({
    clientKind: "NEW",
    resolver: baseResolver({ status: "INSUFFICIENT_CONTEXT", recommended_template_id: null }),
  });
  assert.equal(d.decision_state, "REVIEW_REQUIRED");
  assert.equal(d.should_assign, false);
}

// E) coverage gap without recommendation
{
  const d = decideTrainingAssignment({
    clientKind: "NEW",
    resolver: baseResolver({
      status: "NO_EXACT_MATCH",
      recommended_template_id: null,
      fallback_used: false,
      compatibility_status: "INCOMPATIBLE",
    }),
  });
  assert.equal(d.decision_state, "BLOCKED_NO_EXACT_MATCH");
  assert.equal(d.should_assign, false);
}

// New client exact → AUTO_ASSIGNED
{
  const d = decideTrainingAssignment({
    clientKind: "NEW",
    resolver: baseResolver(),
  });
  assert.equal(d.decision_state, "AUTO_ASSIGNED");
  assert.equal(d.should_assign, true);
  assert.equal(d.requires_admin_approval, false);
}

// MATCHED_WITH_REVIEW with template → auto-assign + admin notify
{
  const d = decideTrainingAssignment({
    clientKind: "NEW",
    resolver: baseResolver({ status: "MATCHED_WITH_REVIEW", compatibility_status: "REVIEW" }),
  });
  assert.equal(d.decision_state, "AUTO_ASSIGNED");
  assert.equal(d.should_assign, true);
  assert.equal(d.reason_code, "MATCHED_WITH_REVIEW_AUTO");
  assert.equal(d.admin_review_only, true);
}

// Best-available near match → auto-assign
{
  const d = decideTrainingAssignment({
    clientKind: "NEW",
    resolver: baseResolver({
      status: "NO_EXACT_MATCH",
      fallback_used: true,
      fallback_class: "CONTEXTUAL_MATCH",
      compatibility_status: "REVIEW",
    }),
  });
  assert.equal(d.decision_state, "AUTO_ASSIGNED");
  assert.equal(d.should_assign, true);
  assert.equal(d.reason_code, "BEST_AVAILABLE_TEMPLATE");
}

// Idempotency key stable
{
  const fp = fingerprintClientContext({
    quizGoal: "glute",
    level: "BEGINNER",
    environment: "GYM",
    days: 3,
    equipment: ["barbell"],
  });
  const k1 = buildTrainingAssignIdempotencyKey({
    clientId: "c1",
    decisionState: "NO_CHANGE_REQUIRED",
    recommendedTemplateId: "tpl-glute-foundation",
    activeAssignmentId: "a1",
    contextFingerprint: fp,
  });
  const k2 = buildTrainingAssignIdempotencyKey({
    clientId: "c1",
    decisionState: "NO_CHANGE_REQUIRED",
    recommendedTemplateId: "tpl-glute-foundation",
    activeAssignmentId: "a1",
    contextFingerprint: fp,
  });
  assert.equal(k1, k2);
}

console.log("training-auto-assign.test.ts: PASS");
