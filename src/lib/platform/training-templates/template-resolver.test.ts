import assert from "node:assert/strict";
import { resolveProgramTemplate } from "./template-resolver";
import { PHASE3_FIXTURE_TEMPLATES, listAssignableFixtureTemplates } from "./fixture-catalog";
import { auditTemplateCoverage, summarizeCoverageGaps } from "./template-coverage-audit";
import type { ResolvableTemplateRecord } from "./template-resolution-types";

const catalog = listAssignableFixtureTemplates(PHASE3_FIXTURE_TEMPLATES);

function bySlug(slug: string): ResolvableTemplateRecord {
  const found = PHASE3_FIXTURE_TEMPLATES.find((t) => t.slug === slug);
  if (!found) throw new Error(`missing fixture ${slug}`);
  return found;
}

// CASE 1: fat + beginner + GYM + 3D
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "fat",
      training_level: "BEGINNER",
      training_environment: "GYM",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.status, "MATCHED");
  assert.equal(r.primary_strategy, "FAT_LOSS");
  assert.ok(r.recommended_template_slug?.includes("FAT_LOSS"));
  assert.ok(r.recommended_template_slug?.includes("GYM"));
  assert.equal(r.fallback_class, "EXACT_MATCH");
  assert.equal(r.dimensions_changed.length, 0);
}

// CASE 2: muscle + beginner + HOME + 3D
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.ok(r.status === "MATCHED" || r.status === "MATCHED_WITH_REVIEW");
  assert.equal(r.primary_strategy, "MUSCLE_GAIN");
  assert.ok(r.recommended_template_slug?.includes("MUSCLE_GAIN"));
  assert.ok(r.recommended_template_slug?.includes("HOME"));
  assert.equal(r.resolved_days, 3);
}

// CASE 3: muscle + intermediate + HOME + 4D
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "INTERMEDIATE",
      training_environment: "HOME",
      training_days_per_week: 4,
    },
    catalog,
  );
  assert.equal(r.status, "MATCHED");
  assert.equal(r.recommended_template_slug, "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D");
}

// CASE 4: athletic + beginner + HOME + 3D
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "athletic",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.status, "MATCHED");
  assert.equal(r.primary_strategy, "ATHLETIC_PERFORMANCE");
  assert.equal(r.recommended_template_slug, "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D");
}

// CASE 5: glutes + beginner + HOME + 3D → NO_EXACT_MATCH (gap visible)
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "glutes",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.status, "NO_EXACT_MATCH");
  assert.equal(r.primary_strategy, "GLUTE_FOCUS");
  assert.equal(r.recommended_template_id, null);
  assert.equal(r.fallback_class, "NO_EXACT_MATCH");
  assert.ok(!r.recommended_template_slug?.includes("MUSCLE_GAIN"), "no silent muscle fallback");
  assert.ok(r.review_signals.includes("COACH_REVIEW_REQUIRED"));
  assert.ok(r.candidate_summary.some((c) => c.match_class === "NEAR"));
}

// CASE 6: waist default → BODY_RECOMPOSITION
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "waist",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.primary_strategy, "BODY_RECOMPOSITION");
  assert.ok(r.status === "MATCHED" || r.status === "MATCHED_WITH_REVIEW");
  assert.ok(r.resolution_trace.primary_strategy_source.includes("waist"));
}

// CASE 7: waist + fat_loss_priority → FAT_LOSS
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "waist",
      fat_loss_priority: true,
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.primary_strategy, "FAT_LOSS");
  assert.ok(r.resolution_trace.primary_strategy_source.includes("FAT_LOSS_PRIORITY"));
  assert.equal(r.status, "MATCHED");
}

// CASE 8: tone → BODY_RECOMPOSITION + coach review (no chest strategy)
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "tone",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.primary_strategy, "BODY_RECOMPOSITION");
  assert.ok(r.review_signals.includes("COACH_REVIEW_REQUIRED"));
  assert.equal(r.status, "MATCHED_WITH_REVIEW");
}

// CASE 9: gain → MUSCLE_GAIN + nutrition flag
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "gain",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.primary_strategy, "MUSCLE_GAIN");
  assert.equal(r.recommendation_reason.nutrition_alignment_required, true);
}

// CASE 10: HOME required capability unknown → REVIEW
{
  const bandOnly = [bySlug("MUSCLE_GAIN_HOME_BAND_ANCHOR_BEGINNER_3D")].filter(
    (t) => t.status === "PUBLISHED",
  );
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
      home_capabilities: {},
    },
    bandOnly,
  );
  assert.equal(r.status, "MATCHED_WITH_REVIEW");
  assert.equal(r.fallback_class, "REVIEW_REQUIRED_MATCH");
  assert.ok(r.review_signals.includes("COACH_REVIEW_REQUIRED"));
}

// CASE 11: HOME required incompatible → no compatible exact
{
  const bandOnly = [bySlug("MUSCLE_GAIN_HOME_BAND_ANCHOR_BEGINNER_3D")];
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
      home_capabilities: { safe_band_anchor: false },
    },
    bandOnly,
  );
  assert.equal(r.status, "NO_COMPATIBLE_TEMPLATE");
  assert.equal(r.recommended_template_id, null);
}

// CASE 12: level mismatch only → NO_EXACT_MATCH (no silent level change)
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "athletic",
      training_level: "INTERMEDIATE",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.status, "NO_EXACT_MATCH");
  assert.equal(r.resolved_level, "INTERMEDIATE");
  assert.equal(r.dimensions_changed.length, 0);
  assert.ok(r.review_signals.includes("PROGRAM_LEVEL_REVIEW_RECOMMENDED"));
}

// CASE 13: days mismatch → NO_EXACT_MATCH
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 5,
    },
    catalog,
  );
  assert.equal(r.status, "NO_EXACT_MATCH");
  assert.equal(r.resolved_days, 5);
  assert.ok(r.review_signals.includes("TRAINING_FREQUENCY_REVIEW_RECOMMENDED"));
}

// CASE 14: environment mismatch → NO_EXACT_MATCH (no HOME↔GYM)
{
  const gymOnlyGlute = [bySlug("GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D")];
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "glutes",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    gymOnlyGlute,
  );
  assert.equal(r.status, "NO_EXACT_MATCH");
  assert.equal(r.resolved_environment, "HOME");
  assert.equal(r.dimensions_changed.length, 0);
}

// CASE 15: draft excluded
{
  const withDraft = [...catalog, bySlug("MUSCLE_GAIN_DRAFT_BEGINNER_HOME_3D")];
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    withDraft,
  );
  assert.ok(r.recommended_template_slug !== "MUSCLE_GAIN_DRAFT_BEGINNER_HOME_3D");
  assert.ok(r.candidate_summary.every((c) => c.slug !== "MUSCLE_GAIN_DRAFT_BEGINNER_HOME_3D"));
}

// CASE 16: archived excluded
{
  const withArchived = [...catalog, bySlug("MUSCLE_GAIN_ARCHIVED_BEGINNER_HOME_3D")];
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    withArchived,
  );
  assert.ok(r.recommended_template_slug !== "MUSCLE_GAIN_ARCHIVED_BEGINNER_HOME_3D");
}

// CASE 17: MISSING_EXERCISE not auto-assignable
{
  const missingOnly = [bySlug("MUSCLE_GAIN_MISSING_EXERCISE_BEGINNER_HOME_3D")];
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    missingOnly,
  );
  assert.equal(r.status, "NO_COMPATIBLE_TEMPLATE");
  assert.equal(r.recommended_template_id, null);
}

// CASE 18: Coach Override preserved
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
      coach_override: {
        selected_template_id: "tpl-mg-beg-gym-3",
        reason: "Client prefers gym machines",
      },
    },
    catalog,
  );
  assert.equal(r.coach_override_applied, true);
  assert.equal(r.coach_selected_template_id, "tpl-mg-beg-gym-3");
  assert.ok(r.auto_recommended_template_id);
  assert.notEqual(r.auto_recommended_template_id, r.coach_selected_template_id);
  assert.equal(r.recommended_template_id, "tpl-mg-beg-gym-3");
}

// CASE 19: unknown quiz goal fail closed
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "not_a_goal",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.recommended_template_id, null);
}

// CASE 20: deterministic tie-break (higher version)
{
  const pair = [
    bySlug("MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D_LEGACY"),
    bySlug("MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D_V2"),
  ];
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME",
      training_days_per_week: 3,
    },
    pair,
  );
  assert.equal(r.recommended_template_slug, "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D_V2");
}

// BOTH/ANYWHERE → insufficient (no silent HOME/GYM)
{
  const r = resolveProgramTemplate(
    {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "ANYWHERE",
      training_days_per_week: 3,
    },
    catalog,
  );
  assert.equal(r.status, "INSUFFICIENT_CONTEXT");
  assert.ok(r.review_signals.includes("TRAINING_ENVIRONMENT_REVIEW_RECOMMENDED"));
}

// Coverage audit surfaces GLUTE HOME gap
{
  const gaps = summarizeCoverageGaps(auditTemplateCoverage());
  assert.ok(
    gaps.some(
      (g) =>
        g.primary_strategy === "GLUTE_FOCUS" &&
        g.environment === "HOME" &&
        g.level === "BEGINNER" &&
        g.days === 3 &&
        g.action === "NEW_TEMPLATE_RECOMMENDED",
    ),
    "GLUTE_FOCUS HOME 3D gap visible",
  );
  assert.ok(
    gaps.some(
      (g) =>
        g.primary_strategy === "GENERAL_FITNESS" &&
        g.level === "INTERMEDIATE" &&
        g.status === "NO_EXACT_TEMPLATE",
    ),
    "GENERAL_FITNESS INTERMEDIATE gap visible",
  );
}

console.log("template-resolver Phase 3 tests passed");
