/**
 * Phase 5 — Pilot 4 import & end-to-end validation tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateProgramTemplateContract } from "@/lib/platform/training-templates";
import {
  PILOT_4_DEFINITIONS,
  PILOT_4_TEMPLATE_KEYS,
  assertPilotSessionPolicies,
  getPilot4Catalog,
  listPilotResolvableTemplates,
  mergeResolverCatalogPreferringPilots,
  simulateSnapshotFromTemplate,
  assertMasterMutationDoesNotAlterSnapshot,
  validateClientRuntimeShape,
} from "@/lib/platform/training-templates/pilot-4";
import { importPilot4Local } from "@/lib/platform/training-templates/pilot-4/import-idempotent";
import { PHASE3_FIXTURE_TEMPLATES, listAssignableFixtureTemplates } from "@/lib/platform/training-templates";
import {
  buildAdminResolverCatalog,
  recommendTemplateForClient,
  presentDetail,
  presentListItem,
} from "@/lib/admin/admin-template-ui";

const root = process.cwd();

// Import idempotent
{
  const first = importPilot4Local({ force: true });
  const second = importPilot4Local();
  assert.equal(first.imported_count, 4);
  assert.equal(second.imported_count, 4);
  assert.equal(first.duplicates, 0);
  assert.equal(first.database_applied, false);
  assert.equal(first.broken_exercise_references, 0);
  assert.deepEqual(first.templates, [...PILOT_4_TEMPLATE_KEYS]);
}

const catalog = getPilot4Catalog();
assert.equal(catalog.length, 4);

// 1–4 contracts + versions + non-legacy
for (const row of catalog) {
  const validation = validateProgramTemplateContract(row.definition.contract);
  assert.equal(validation.ok, true, `${row.definition.key}: ${validation.issues.map((i) => i.message).join("; ")}`);
  // Pilot Fat Loss master bumped to v2 (CR-026 cardio); other pilots remain v1.
  const expectedVersion = row.definition.key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D" ? 2 : 1;
  assert.equal(row.definition.version, expectedVersion);
  const presentation = presentDetail(row.detail);
  assert.equal(presentation.is_legacy, false, row.definition.key);
  assert.ok(presentation.target_audience);
  assert.ok(presentation.template_purpose);
  assert.equal(presentation.has_contract, true);
}

// unique slugs
assert.equal(new Set(catalog.map((r) => r.definition.slug)).size, 4);

// 5–6 admin list/detail contract
for (const row of catalog) {
  const listPresentation = presentListItem({
    ...row.detail,
    metadata: row.detail.metadata,
    template_contract: row.detail.metadata.template_contract as Record<string, unknown>,
  });
  assert.equal(listPresentation.is_legacy, false);
  assert.equal(listPresentation.primary_strategy, row.definition.contract.primary_strategy);
}

// 7–10 resolver exact matches against real pilots (fixtures must not win)
{
  // Phase 6: unit tests still opt into in-memory pilots (no DB required).
  const merged = buildAdminResolverCatalog([], { includeFixtures: true, includePilots: true });
  const pilots = listPilotResolvableTemplates();
  const fixtures = listAssignableFixtureTemplates(PHASE3_FIXTURE_TEMPLATES);
  assert.equal(
    mergeResolverCatalogPreferringPilots(fixtures, pilots).length,
    merged.length,
  );

  const a = recommendTemplateForClient(
    {
      goal: "fat",
      trainingType: "gym_only",
      level: "beginner",
      daysPerWeek: 3,
      availableEquipment: ["treadmill", "dumbbells_or_machines", "dumbbells", "machines", "barbell"],
    },
    merged,
  );
  assert.ok(a.status === "MATCHED" || a.status === "MATCHED_WITH_REVIEW");
  assert.equal(a.recommended_template_slug, "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D");

  const b = recommendTemplateForClient(
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
    merged,
  );
  assert.ok(b.status === "MATCHED" || b.status === "MATCHED_WITH_REVIEW");
  assert.equal(b.recommended_template_slug, "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D");

  const c = recommendTemplateForClient(
    {
      primary_strategy: "STRENGTH",
      trainingType: "gym_only",
      level: "intermediate",
      daysPerWeek: 4,
      availableEquipment: ["barbell", "squat_rack_or_smith", "bench", "dumbbells", "machines"],
    },
    merged,
  );
  assert.ok(c.status === "MATCHED" || c.status === "MATCHED_WITH_REVIEW");
  assert.equal(c.recommended_template_slug, "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D");

  const d = recommendTemplateForClient(
    {
      goal: "athletic",
      trainingType: "home_only",
      level: "beginner",
      daysPerWeek: 3,
      availableEquipment: ["dumbbells_or_bands", "open_floor", "dumbbells", "bands"],
      homeCapabilities: { training_space: true },
    },
    merged,
  );
  assert.ok(d.status === "MATCHED" || d.status === "MATCHED_WITH_REVIEW");
  assert.equal(d.recommended_template_slug, "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D");
}

// 11 Fat Loss cardio roles
{
  const fat = PILOT_4_DEFINITIONS.find((d) => d.key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D")!;
  const issues = assertPilotSessionPolicies(fat);
  assert.equal(issues.length, 0, issues.join("; "));
  const day = fat.week.days.find((d) => d.day_type === "workout")!;
  assert.ok(day.exercises.some((e) => e.activity_role === "POST_WORKOUT_CARDIO" && e.reps_label === "15 min"));
  assert.ok(
    !fat.contract.progression.smart_auto_variables.some((v) => String(v).includes("CARDIO")),
  );
}

// 12 HOME unknown capability review
{
  const muscle = catalog.find((r) => r.definition.key === "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D")!;
  assert.equal(muscle.definition.contract.eligibility.unknown_required_capability_policy, "REVIEW_REQUIRED");
  assert.ok(muscle.definition.contract.eligibility.capability_requirements.some((c) => c.required));
  const result = recommendTemplateForClient(
    {
      goal: "muscle",
      trainingType: "home_only",
      level: "beginner",
      daysPerWeek: 3,
      homeCapabilities: { training_space: "unknown", available_load: "unknown", stable_bench_or_chair: "unknown" },
    },
    listPilotResolvableTemplates(),
  );
  assert.ok(
    result.status === "MATCHED_WITH_REVIEW" ||
      result.compatibility_status === "REVIEW" ||
      result.review_signals.length > 0 ||
      result.recommendation_reason.capability === "REVIEW_REQUIRED",
  );
}

// 13 Strength ramp-up
{
  const strength = PILOT_4_DEFINITIONS.find((d) => d.key === "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D")!;
  assert.equal(assertPilotSessionPolicies(strength).length, 0);
  for (const day of strength.week.days.filter((d) => d.day_type === "workout")) {
    const ramp = day.exercises.find((e) => e.activity_role === "EXERCISE_SPECIFIC_RAMP_UP");
    assert.ok(ramp);
    assert.equal(ramp!.excluded_from_main_volume, true);
    assert.equal(day.exercises.filter((e) => e.activity_role === "MAIN_RESISTANCE").length, 6);
  }
}

// 14 Athletic power
{
  const athletic = PILOT_4_DEFINITIONS.find((d) => d.key === "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D")!;
  assert.equal(assertPilotSessionPolicies(athletic).length, 0);
  for (const day of athletic.week.days.filter((d) => d.day_type === "workout")) {
    const power = day.exercises.find((e) => e.activity_role === "POWER_SKILL_BLOCK");
    assert.ok(power);
    assert.equal(power!.excluded_from_main_volume, true);
  }
  assert.ok(athletic.contract.progression.coach_controlled_variables.includes("POWER_PROGRESSION"));
}

// 15 Smart scope
for (const row of catalog) {
  assert.deepEqual(row.definition.contract.progression.smart_auto_variables, ["WEIGHT", "REPS"]);
}

// 16 broken refs
assert.equal(
  catalog.reduce((sum, row) => sum + row.exercise_audit.broken_references, 0),
  0,
);

// 17–18 snapshot
{
  const detail = catalog[0]!.detail;
  const snap = simulateSnapshotFromTemplate(detail);
  assert.equal(snap.source_template_id, detail.id);
  assert.equal(snap.template_version, detail.version);
  assert.ok(snap.weeks[0]?.days.length);
  assert.equal(validateClientRuntimeShape(snap).ok, true);
  assert.equal(
    assertMasterMutationDoesNotAlterSnapshot(
      snap,
      (master) => {
        master.name_ar = "MUTATED MASTER";
        return master;
      },
      detail,
    ),
    true,
  );
}

// 19–20 preview read-only + no assign
{
  const preview = readFileSync(
    join(root, "src/components/admin/programs/ProgramTemplateDetailPanel.tsx"),
    "utf8",
  );
  assert.ok(preview.includes("قراءة فقط"));
  assert.ok(!preview.includes("assignAdminClientProgram"));
  const importMod = readFileSync(
    join(root, "src/lib/platform/training-templates/pilot-4/import-idempotent.ts"),
    "utf8",
  );
  assert.ok(importMod.includes("database_applied: false"));
  assert.ok(!importMod.includes("admin_assign_client_program"));
}

// 22 filters on real pilot metadata
{
  const fat = catalog.find((r) => r.definition.key.startsWith("FAT_LOSS"))!;
  const presentation = presentDetail(fat.detail);
  assert.equal(presentation.primary_strategy, "FAT_LOSS");
  assert.equal(presentation.environment, "GYM");
  assert.equal(presentation.days, 3);
}

// Remaining templates not imported
assert.equal(PILOT_4_DEFINITIONS.length, 4);

console.log("pilot-4 Phase 5 tests passed");
