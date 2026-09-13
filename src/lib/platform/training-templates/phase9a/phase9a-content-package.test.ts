/**
 * Phase 9A content package tests — specification only (no DB writes).
 */
import assert from "node:assert/strict";
import { APPROVED_36_TEMPLATE_REFS } from "../phase8/approved-36-reference";
import { PILOT_4_DEFINITIONS } from "../pilot-4/definitions";
import {
  ADDITION_SPECS,
  HOME_CARDIO_POOL,
  runPhase9aContentPackage,
} from "./content-package";

const pack = runPhase9aContentPackage();
const pilotKeys = new Set(PILOT_4_DEFINITIONS.map((d) => d.key));

assert.equal(APPROVED_36_TEMPLATE_REFS.length, 36);
assert.equal(pack.remaining_reviewed, 32);
assert.equal(pack.constraints.templates_imported, 0);
assert.equal(pack.constraints.exercises_created, 0);
assert.equal(pack.constraints.media_created, 0);

assert.equal(pack.pilot_4.length, 4);
assert.ok(pack.pilot_4.every((p) => p.IMPORT_READINESS === "ALREADY_IMPORTED"));

assert.equal(pack.treadmill_brisk_walk, "ADDITION_SPEC_CREATED");
assert.equal(pack.home_brisk_walk, "ADDITION_SPEC_CREATED");
assert.equal(ADDITION_SPECS.length, 2);
assert.ok(ADDITION_SPECS.every((s) => s.external_id === "DO_NOT_INVENT"));
assert.ok(ADDITION_SPECS.every((s) => s.duplicate_check.length > 0));

assert.ok(HOME_CARDIO_POOL.some((p) => p.status === "ADDITION_REQUIRED"));
assert.ok(HOME_CARDIO_POOL.some((p) => p.status === "EXISTING_LIBRARY_RECORD" && "external_id" in p && p.external_id === "WU-023"));

assert.equal(pack.import_readiness_counts.READY_FOR_PHASE9_IMPORT, 0);
assert.equal(pack.import_readiness_counts.READY_FOR_PHASE9_IMPORT_WITH_REVIEW_FLAG, 0);
assert.ok(pack.import_readiness_counts.CONTENT_ADDITION_REQUIRED >= 3);
assert.ok(pack.import_readiness_counts.PM_SEQUENCE_APPROVAL_REQUIRED >= 1);
assert.equal(pack.import_readiness_counts.BLOCKED_BY_REFERENCE, 2);

for (const t of pack.templates) {
  assert.equal(t.EXACT_APPROVED_EXERCISE_SEQUENCE_EXISTS, false);
  assert.equal(t.SESSION_EXERCISE_MAP.status, "NOT_EMITTED");
  assert.ok(!pilotKeys.has(t.TEMPLATE_KEY));
}

const gluteHome = pack.templates.filter(
  (t) => t.PRIMARY_STRATEGY === "GLUTE_FOCUS" && t.ENVIRONMENT === "HOME",
);
assert.equal(gluteHome.length, 2);
assert.ok(gluteHome.every((t) => t.IMPORT_READINESS === "BLOCKED_BY_REFERENCE"));

const gluteGym = pack.templates.filter(
  (t) => t.PRIMARY_STRATEGY === "GLUTE_FOCUS" && t.ENVIRONMENT === "GYM",
);
assert.ok(gluteGym.every((t) => t.SEQUENCE_STATUS === "GLUTE_SEQUENCE_REVIEW_REQUIRED"));

assert.equal(pack.female_media_manifest.FEMALE_MEDIA_AVAILABLE, 0);
assert.ok(pack.female_media_manifest.TOTAL_UNIQUE_EXERCISES > 0);

assert.equal(pack.batches.RECOMMENDED_BATCH_A.length, 0);
assert.equal(pack.phase_9b_ready, "NO");

assert.equal(
  pack.import_readiness_counts.READY_FOR_PHASE9_IMPORT +
    pack.import_readiness_counts.READY_FOR_PHASE9_IMPORT_WITH_REVIEW_FLAG +
    pack.import_readiness_counts.CONTENT_ADDITION_REQUIRED +
    pack.import_readiness_counts.PM_SEQUENCE_APPROVAL_REQUIRED +
    pack.import_readiness_counts.BLOCKED_BY_REFERENCE,
  32,
);

console.log("phase9a-content-package.test.ts: PASS");
console.log(JSON.stringify(pack.import_readiness_counts, null, 2));
