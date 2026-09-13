/**
 * Preference handoff: template contract → assignment freeze → runtime → weekday plan → resolver.
 * No media generation. No training sequence changes.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runtimeToWeekdayPlans, type ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { runtimeDayToPlan } from "@/lib/platform/continuity/apply";
import {
  normalizePreferredMediaVariant,
  preferredMediaVariantFromAssignment,
  preferredMediaVariantFromContract,
  preferredMediaVariantFromTemplateMetadata,
  registerExerciseMediaAsset,
  resolveExerciseListStill,
  resolvePreferredExerciseStillThumb,
  publicExerciseVariantImageThumbPath,
  GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS,
} from "@/lib/platform/exercise-media-variants";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import { createEmptyTemplateContract } from "@/lib/platform/training-templates/contract";
import { buildAssignmentProvenanceFromContract } from "@/lib/platform/training-templates/snapshot-policy";

const known = new Set(GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS);

// Template preferences
const gluteContract = createEmptyTemplateContract({
  primaryStrategy: "GLUTE_FOCUS",
  level: "BEGINNER",
  environment: "GYM",
  daysPerWeek: 3,
  targetAudience: "عميلات تركيز أرداف",
  templatePurpose: "اختبار تفضيل ميديا",
});
gluteContract.media_preference = {
  preferred_demonstrator: "FEMALE",
  preferred_media_variant: "FEMALE",
  duplicates_exercise_identity: false,
};
assert.equal(preferredMediaVariantFromContract(gluteContract), "FEMALE");

const controlContract = createEmptyTemplateContract({
  primaryStrategy: "FAT_LOSS",
  level: "BEGINNER",
  environment: "GYM",
  daysPerWeek: 3,
  targetAudience: "عموم",
  templatePurpose: "تحكم",
});
assert.equal(preferredMediaVariantFromContract(controlContract), "STANDARD");

// Snapshot provenance freezes media_preference (TS policy helper)
const provenance = buildAssignmentProvenanceFromContract(gluteContract);
assert.equal(provenance.media_preference.preferred_media_variant, "FEMALE");

// Historical missing → STANDARD
assert.equal(normalizePreferredMediaVariant(undefined), "STANDARD");
assert.equal(normalizePreferredMediaVariant(null), "STANDARD");
assert.equal(preferredMediaVariantFromAssignment({}), "STANDARD");
assert.equal(preferredMediaVariantFromAssignment(null), "STANDARD");

// Glute runtime → weekday plans carry FEMALE
const gluteRuntime: ClientTrainingRuntime = {
  reason: "ok",
  snapshotComplete: true,
  currentWeekNumber: 1,
  assignment: {
    id: "g1",
    status: "active",
    name_ar: "جلوت",
    starts_on: "2026-09-01",
    template_version: 1,
    duration_weeks: 8,
    days_per_week: 3,
    preferred_media_variant: "FEMALE",
  },
  days: [
    {
      day_id: "d1",
      day_number: 1,
      day_type: "workout",
      title_ar: "أرداف",
      muscle_focus: "أرداف",
      estimated_minutes: 45,
      estimated_calories: 350,
      exercises: [
        {
          id: "ex1",
          exercise_id: "uuid-gl",
          external_id: "GL-001",
          name_ar: "هيب ثراست",
          sets: 3,
          reps_min: 10,
          reps_max: 12,
          reps_label: "10-12",
          rest_seconds: 90,
          suggested_weight_kg: 40,
          notes_ar: null,
        },
      ],
    },
  ],
};

const glutePlans = runtimeToWeekdayPlans(gluteRuntime);
const gluteDay = Object.values(glutePlans).find((p) => !p.isRestDay);
assert.ok(gluteDay);
assert.equal(gluteDay!.preferredMediaVariant, "FEMALE");
assert.equal(runtimeDayToPlan(gluteRuntime, "d1", "mon").preferredMediaVariant, "FEMALE");

const controlRuntime: ClientTrainingRuntime = {
  ...gluteRuntime,
  assignment: {
    ...gluteRuntime.assignment!,
    id: "c1",
    preferred_media_variant: "STANDARD",
  },
};
assert.equal(runtimeToWeekdayPlans(controlRuntime).mon.preferredMediaVariant, "STANDARD");

// Historical runtime without field → STANDARD plans
const legacyRuntime: ClientTrainingRuntime = {
  ...gluteRuntime,
  assignment: {
    id: "legacy",
    status: "active",
    name_ar: "قديم",
    starts_on: "2026-01-01",
    template_version: 1,
    duration_weeks: 4,
    days_per_week: 3,
  },
};
assert.equal(runtimeToWeekdayPlans(legacyRuntime).mon.preferredMediaVariant, "STANDARD");

// Resolver uses runtime preference: FEMALE preferred + missing → STANDARD fallback
const standardStill = getExerciseStageListThumb("GL-001");
assert.ok(standardStill);
const missingFemale = resolvePreferredExerciseStillThumb({
  externalId: "GL-001",
  preferredVariant: "FEMALE",
});
assert.equal(missingFemale, standardStill);

const femaleReady = registerExerciseMediaAsset({
  exerciseExternalId: "GL-001",
  variant: "FEMALE",
  mediaType: "IMAGE",
  path: publicExerciseVariantImageThumbPath("GL-001", "FEMALE"),
  status: "READY",
  knownExternalIds: known,
  assetExists: () => true,
});
assert.ok(femaleReady.ok);
if (femaleReady.ok) {
  const hit = resolveExerciseListStill({
    externalId: "GL-001",
    preferredVariant: "FEMALE",
    metadata: femaleReady.metadata,
    standardStillUrl: standardStill,
  });
  assert.equal(hit.selectedVariant, "FEMALE");
  assert.equal(hit.fallbackUsed, false);
}

// Control preference → STANDARD still
assert.equal(
  resolvePreferredExerciseStillThumb({
    externalId: "GL-001",
    preferredVariant: "STANDARD",
  }),
  standardStill,
);

// Preview uses template metadata preference (no assignment)
assert.equal(
  preferredMediaVariantFromTemplateMetadata({
    template_contract: gluteContract,
  }),
  "FEMALE",
);
assert.equal(preferredMediaVariantFromTemplateMetadata({ template_contract: controlContract }), "STANDARD");

// Snapshot immutability (logical): frozen assignment value ≠ later master change
const frozen = preferredMediaVariantFromAssignment({ preferred_media_variant: "FEMALE" });
const masterLater = preferredMediaVariantFromContract({
  ...gluteContract,
  media_preference: {
    preferred_demonstrator: "STANDARD",
    preferred_media_variant: "STANDARD",
    duplicates_exercise_identity: false,
  },
});
assert.equal(frozen, "FEMALE");
assert.equal(masterLater, "STANDARD");
assert.notEqual(frozen, masterLater);

// Migration file exists and freezes column
const migration = readFileSync(
  resolve("supabase/migrations/20260913140000_freeze_preferred_media_variant_on_assignment.sql"),
  "utf8",
);
assert.match(migration, /preferred_media_variant/);
assert.match(migration, /admin_assign_client_program/);
assert.match(migration, /media_preference/);
assert.match(migration, /DEFAULT 'STANDARD'/);

console.log("female-media-preference-handoff.test.ts: PASS");
