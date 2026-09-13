/**
 * Phase 4 Admin Template UI — focused presentation + recommendation tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAdminResolverCatalog,
  buildRecommendationChecks,
  matchesTemplatePresentation,
  presentProgramTemplate,
  quizGoalIdFromClientGoal,
  recommendTemplateForClient,
  runDemoRecommendationScenario,
  resolverStatusLabelAr,
} from "./admin-template-ui";
import { createEmptyTemplateContract } from "@/lib/platform/training-templates";

const root = process.cwd();
/** Offline/dev catalog: fixtures + in-memory pilots (Phase 6 DB not required in unit tests). */
const offlineCatalog = buildAdminResolverCatalog([], { includeFixtures: true, includePilots: true });

// 1–3: card presentation fields
{
  const contract = createEmptyTemplateContract({
    primaryStrategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    daysPerWeek: 3,
    targetAudience: "مبتدئون منزليون لبناء العضلات",
    templatePurpose: "أساس بناء عضلات 3 أيام",
  });
  const presentation = presentProgramTemplate({
    name_ar: "Muscle Gain Foundation",
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "HOME",
    version: 2,
    is_published: true,
    archived_at: null,
    metadata: { template_contract: contract },
  });
  assert.equal(presentation.target_audience, "مبتدئون منزليون لبناء العضلات");
  assert.equal(presentation.template_purpose, "أساس بناء عضلات 3 أيام");
  assert.ok(presentation.admin_summary);
  assert.equal(presentation.primary_strategy, "MUSCLE_GAIN");
  assert.equal(presentation.level, "BEGINNER");
  assert.equal(presentation.environment, "HOME");
  assert.equal(presentation.days, 3);
  assert.equal(presentation.status, "PUBLISHED");
  assert.ok(presentation.library_readiness);
  assert.equal(presentation.is_legacy, false);
}

// 4–7: filters
{
  const presentation = presentProgramTemplate({
    name_ar: "x",
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "HOME",
    is_published: true,
    metadata: {
      template_contract: createEmptyTemplateContract({
        primaryStrategy: "MUSCLE_GAIN",
        level: "BEGINNER",
        environment: "HOME",
        daysPerWeek: 3,
        targetAudience: "a",
        templatePurpose: "b",
      }),
    },
  });
  assert.ok(matchesTemplatePresentation(presentation, { primary_strategy: "MUSCLE_GAIN" }));
  assert.ok(matchesTemplatePresentation(presentation, { level: "BEGINNER" }));
  assert.ok(matchesTemplatePresentation(presentation, { environment: "HOME" }));
  assert.ok(matchesTemplatePresentation(presentation, { days: "3" }));
  assert.equal(matchesTemplatePresentation(presentation, { primary_strategy: "FAT_LOSS" }), false);
  assert.equal(matchesTemplatePresentation(presentation, { days: "4" }), false);
}

// 8–9: exact match + reason
{
  const result = recommendTemplateForClient(
    {
      goal: "muscle",
      trainingType: "home_only",
      level: "beginner",
      daysPerWeek: 3,
      availableEquipment: ["dumbbells", "bands"],
      homeCapabilities: {
        training_space: true,
        available_load: true,
        stable_bench_or_chair: true,
      },
    },
    offlineCatalog,
  );
  assert.ok(result.status === "MATCHED" || result.status === "MATCHED_WITH_REVIEW");
  assert.ok(result.recommended_template_slug?.includes("MUSCLE_GAIN"));
  assert.ok(result.recommendation_reason.summary.length > 0);
  const checks = buildRecommendationChecks(result);
  assert.ok(checks.some((c) => c.id === "goal" && c.ok));
  assert.equal(resolverStatusLabelAr("MATCHED"), "تطابق تام");
}

// 10: no exact match (glute home)
{
  const result = recommendTemplateForClient(
    {
      goal: "glutes",
      trainingType: "home_only",
      level: "beginner",
      daysPerWeek: 3,
    },
    offlineCatalog,
  );
  assert.equal(result.status, "NO_EXACT_MATCH");
  assert.ok(!result.recommended_template_slug?.includes("MUSCLE_GAIN") || result.fallback_used);
  assert.equal(result.fallback_used || result.status === "NO_EXACT_MATCH", true);
  assert.notEqual(result.status, "MATCHED");
}

// 11: review required (unknown capability)
{
  const demo = runDemoRecommendationScenario("review_required");
  assert.ok(
    demo.result.status === "MATCHED_WITH_REVIEW" ||
      demo.result.review_signals.length > 0 ||
      demo.result.compatibility_status === "REVIEW",
  );
}

// 12: insufficient context BOTH
{
  const result = recommendTemplateForClient(
    {
      goal: "muscle",
      trainingType: "gym_and_home",
      level: "beginner",
      daysPerWeek: 3,
    },
    offlineCatalog,
  );
  assert.equal(result.status, "INSUFFICIENT_CONTEXT");
}

// 13: coach override both choices
{
  const demo = runDemoRecommendationScenario("coach_override");
  assert.ok(demo.result.coach_override_applied);
  assert.ok(demo.result.auto_recommended_template_id);
  assert.ok(demo.result.coach_selected_template_id);
  assert.notEqual(demo.result.auto_recommended_template_id, demo.result.coach_selected_template_id);
}

// 14: legacy template does not crash / fabricate audience
{
  const legacy = presentProgramTemplate({
    name_ar: "قديم",
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "HOME",
    is_published: true,
    metadata: {},
  });
  assert.equal(legacy.is_legacy, true);
  assert.equal(legacy.target_audience, null);
  assert.equal(legacy.template_purpose, null);
}

// 15–16: draft/archived + readiness visible
{
  const draft = presentProgramTemplate({
    name_ar: "مسودة",
    is_published: false,
    archived_at: null,
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "GYM",
  });
  assert.equal(draft.status, "DRAFT");
  const archived = presentProgramTemplate({
    name_ar: "مؤرشف",
    is_published: true,
    archived_at: "2026-01-01",
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "GYM",
  });
  assert.equal(archived.status, "ARCHIVED");
  const withReady = presentProgramTemplate({
    name_ar: "جاهز",
    is_published: true,
    metadata: {
      template_contract: (() => {
        const c = createEmptyTemplateContract({
          primaryStrategy: "FAT_LOSS",
          level: "BEGINNER",
          environment: "GYM",
          daysPerWeek: 3,
          targetAudience: "a",
          templatePurpose: "b",
        });
        c.library_readiness = {
          state: "READY",
          missing_exercise_count: 0,
          missing_media_count: 0,
        };
        return c;
      })(),
    },
  });
  assert.equal(withReady.library_readiness, "READY");
  assert.ok(withReady.library_readiness_label.includes("جاهز") || withReady.library_readiness_label === "جاهز");
}

// 17–18: preview read-only + no assign in recommendation UI sources
{
  const preview = readFileSync(
    join(root, "src/components/admin/programs/ProgramTemplateDetailPanel.tsx"),
    "utf8",
  );
  assert.ok(preview.includes("قراءة فقط"));
  assert.ok(!preview.includes("assignAdminClientProgram"));
  const panel = readFileSync(
    join(root, "src/components/admin/programs/TemplateRecommendationPanel.tsx"),
    "utf8",
  );
  assert.ok(panel.includes("لا يتم التعيين تلقائياً"));
  assert.ok(!panel.includes("assignAdminClientProgram"));
  assert.ok(panel.includes("لماذا هذا القالب") || panel.includes("لماذا المراجعة"));
}

// 19: Arabic/RTL smoke — labels exist
{
  assert.equal(quizGoalIdFromClientGoal("muscle"), "muscle");
  assert.equal(quizGoalIdFromClientGoal("بناء العضلات"), "muscle");
  assert.equal(quizGoalIdFromClientGoal("glutes"), "glutes");
  assert.ok(resolverStatusLabelAr("NO_EXACT_MATCH").includes("تطابق") || resolverStatusLabelAr("NO_EXACT_MATCH").length > 0);
}

// 20: Program Library regression wiring
{
  const library = readFileSync(
    join(root, "src/components/admin/libraries/ProgramLibraryManager.tsx"),
    "utf8",
  );
  assert.ok(library.includes("ProgramTemplateCard"));
  assert.ok(library.includes("PRIMARY_TRAINING_STRATEGIES"));
  assert.ok(library.includes("TemplateRecommendationDemoStates"));
  assert.ok(library.includes("presentListItem"));
  const workspace = readFileSync(
    join(root, "src/components/admin/ClientTrainingWorkspace.tsx"),
    "utf8",
  );
  assert.ok(workspace.includes("TemplateRecommendationPanel"));
  assert.ok(workspace.includes("تعيين برنامج"));
  assert.ok(workspace.includes("includeInMemoryPilots={false}"));
  assert.ok(workspace.includes("catalogDetails={recommendationCatalog}"));
  assert.ok(library.includes("activity_role: exercise.activity_role"));
}

// Demo states A–F
for (const id of [
  "exact_match",
  "no_exact_match",
  "review_required",
  "insufficient_context",
  "coach_override",
  "legacy_template",
] as const) {
  const demo = runDemoRecommendationScenario(id);
  assert.ok(demo.title.length > 0, id);
  assert.ok(demo.result.status, id);
}

console.log("admin-template-ui Phase 4 tests passed");
