/**
 * Phase 8 focused audit tests — library readiness (no template import).
 */
import assert from "node:assert/strict";
import { CORE_100_EXTERNAL_IDS } from "@/lib/platform/strategy-matrix/config/core-100-external-ids";
import { PILOT_4_DEFINITIONS } from "../pilot-4/definitions";
import { APPROVED_36_COUNT, APPROVED_36_TEMPLATE_REFS } from "./approved-36-reference";
import {
  auditHomeCardio,
  auditMobility,
  auditPower,
  auditWarmups,
  classifyActivityRoleRendering,
  detectDuplicateExternalIds,
  detectDuplicateSlugs,
  detectTreadmillBriskWalk,
  rampUpLibraryModelSupported,
  runPhase8LibraryAudit,
  validateCore100,
  validateKnownIds,
  auditHomeEquipment,
  auditFemaleMedia,
  auditGeneralMedia,
  missingExerciseAdditions,
} from "./library-audit";

const audit = runPhase8LibraryAudit();

// 1–2 Core 100
{
  const core = validateCore100();
  assert.equal(core.expected_count, 100);
  assert.equal(CORE_100_EXTERNAL_IDS.length, 100);
  assert.equal(core.result, "PASS");
  assert.equal(core.missing_from_library.length, 0);
}

// 3 Known IDs
{
  const known = validateKnownIds();
  assert.ok(known.every((k) => k.found), `missing known ids: ${known.filter((k) => !k.found).map((k) => k.external_id)}`);
  assert.equal(audit.known_ids.result, "PASS");
}

// 4–5 Duplicates
{
  assert.deepEqual(detectDuplicateExternalIds(), []);
  // slug collisions would be accidental same-name entries; catalog has none
  assert.equal(detectDuplicateSlugs().length, 0);
}

// 6–7 Warm-up / mobility counts
{
  const wu = auditWarmups();
  const mo = auditMobility();
  assert.equal(wu.count, 25);
  assert.equal(mo.count, 25);
  assert.ok(wu.supports_3_per_session_across_36);
}

// 8 Treadmill Brisk Walk — Phase 9 added CR-026
{
  const brisk = detectTreadmillBriskWalk();
  assert.equal(brisk.status, "EXISTS");
  assert.equal(brisk.fat_loss_gym_cardio_activity, "READY");
  assert.ok(brisk.matching_ids.includes("CR-026"));
}

// 9 HOME cardio alternatives — Phase 9 added CR-027
{
  const home = auditHomeCardio();
  assert.ok(home.HOME_AEROBIC_OPTIONS_COUNT >= 1);
  assert.ok(["READY", "REVIEW", "ADDITION_REQUIRED"].includes(home.HOME_CARDIO_READINESS));
  assert.equal(home.HOME_CARDIO_READINESS, "READY");
  assert.equal(home.has_brisk_walk, true);
}

// 10 Power readiness classification
{
  const power = auditPower();
  assert.ok(power.classified.every((c) => c.tags.length > 0));
  assert.ok(power.candidate_count >= 1);
}

// 11 Ramp-up same-exercise model
{
  const ramp = rampUpLibraryModelSupported();
  assert.equal(ramp.RAMP_UP_LIBRARY_MODEL, "SUPPORTED");
}

// 12–13 HOME equipment + capability gap
{
  const homeEq = auditHomeEquipment();
  assert.ok(homeEq.home_compatible_count > 0);
  assert.equal(homeEq.CAPABILITY_METADATA_GAP, true);
  assert.ok(homeEq.missing_capability_fields.includes("safe_band_anchor"));
}

// 14–16 Female + standard + missing media
{
  const female = auditFemaleMedia();
  assert.equal(female.FEMALE_MEDIA_READY, 0);
  assert.ok(female.STANDARD_ONLY >= 0);
  assert.equal(female.FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE, true);
  const media = auditGeneralMedia();
  assert.ok(media.MEDIA_PARTIAL + media.MEDIA_MISSING + media.MEDIA_READY === audit.counts.exercise_library_total);
  assert.ok(media.MEDIA_PARTIAL > 0 || media.MEDIA_MISSING > 0);
}

// 17 Missing exercise additions — Phase 9 closed CR-026/CR-027 gap
{
  const missing = missingExerciseAdditions();
  assert.ok(!missing.some((m) => m.desired_name.includes("Treadmill Brisk Walk")));
  assert.ok(!missing.some((m) => m.desired_name.toLowerCase().includes("brisk walk")));
  const fatLoss = audit.template_36_readiness.find((t) => t.TEMPLATE_KEY === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D");
  assert.ok(fatLoss);
  assert.ok(
    fatLoss!.OVERALL_IMPORT_READINESS === "READY_FOR_IMPORT" ||
      fatLoss!.OVERALL_IMPORT_READINESS === "READY_WITH_REVIEW",
    `Fat Loss readiness unexpected: ${fatLoss!.OVERALL_IMPORT_READINESS}`,
  );
}

// 18 Full-library fallback accepted (Core 100 preferred, not hard max)
{
  assert.equal(audit.counts.exercise_library_total, 323);
  assert.ok(audit.counts.exercise_library_total > audit.counts.core_100);
}

// 19 Family readiness computed
{
  assert.equal(audit.family_readiness.length, 10);
  assert.ok(audit.family_readiness.every((f) => ["READY", "READY_WITH_REVIEW", "CONTENT_GAPS"].includes(f.gym)));
  assert.ok(audit.family_readiness.every((f) => ["READY", "READY_WITH_REVIEW", "CONTENT_GAPS"].includes(f.home)));
}

// 20 36-template readiness records
{
  assert.equal(APPROVED_36_TEMPLATE_REFS.length, APPROVED_36_COUNT);
  assert.equal(audit.template_36_readiness.length, 36);
  assert.equal(
    audit.readiness_counts.READY_FOR_IMPORT +
      audit.readiness_counts.READY_WITH_REVIEW +
      audit.readiness_counts.CONTENT_ADDITION_REQUIRED +
      audit.readiness_counts.BLOCKED_BY_REFERENCE,
    36,
  );
}

// 21 Runtime activity-role rendering classified
{
  const roles = classifyActivityRoleRendering();
  assert.equal(roles.MAIN_RESISTANCE, "FULLY_RENDERED");
  assert.equal(roles.POST_WORKOUT_CARDIO, "GENERIC_RENDERING");
  assert.equal(roles.DAILY_ACTIVITY, "NOT_SUPPORTED");
}

// 22 Pilot 4 still valid
{
  assert.equal(PILOT_4_DEFINITIONS.length, 4);
  assert.equal(audit.pilot_4_regression.result, "PASS");
  assert.equal(audit.pilot_4_regression.broken_references, 0);
}

// 23–24 No templates imported / no remote changes claimed by audit
{
  assert.equal(audit.counts.templates_imported_total, 4);
  assert.equal(audit.counts.template_5_plus_imported, 0);
  assert.equal(audit.staging_changed, false);
  assert.equal(audit.production_changed, false);
  assert.equal(audit.migrations_created, 0);
}

console.log("phase8-audit.test.ts: PASS");
console.log(
  JSON.stringify(
    {
      library_total: audit.counts.exercise_library_total,
      core100: audit.core_100.result,
      known: audit.known_ids.result,
      readiness_counts: audit.readiness_counts,
      treadmill_brisk_walk: audit.cardio.treadmill_brisk_walk.status,
      home_cardio: audit.cardio.home.HOME_CARDIO_READINESS,
      phase_9: audit.phase_9.ready,
    },
    null,
    2,
  ),
);
