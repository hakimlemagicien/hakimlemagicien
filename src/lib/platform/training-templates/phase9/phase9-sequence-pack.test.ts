/**
 * Phase 9 final canonical master reconciliation tests.
 */
import assert from "node:assert/strict";
import {
  ACTUAL_CANONICAL_ENTRY_COUNT,
  CANONICAL_LOCKED_TEMPLATE_MASTER,
  CANONICAL_PILOT_KEYS,
  CANONICAL_REMAINING_KEYS,
  CANONICAL_TEMPLATE_COUNT,
  HISTORICAL_MASTER_LABEL,
  MASTER_COUNT_DOCUMENTATION,
  MISSING_FROM_REJECTED_33,
  NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY,
  PILOT_COUNT,
  REJECTED_33_EXTRA_KEYS,
  REMAINING_CANONICAL_COUNT,
} from "./canonical-locked-master";
import { buildRemainingCanonicalSequencePack, REMAINING_CANONICAL_EXPECTED_KEYS } from "./sequence-pack";
import { validateSequencePack } from "./validate-sequence-pack";
import { libraryHas } from "./sequence-types";

assert.equal(HISTORICAL_MASTER_LABEL, "36/36");
assert.equal(ACTUAL_CANONICAL_ENTRY_COUNT, 37);
assert.equal(CANONICAL_TEMPLATE_COUNT, 37);
assert.equal(PILOT_COUNT, 4);
assert.equal(REMAINING_CANONICAL_COUNT, 33);
assert.equal(MASTER_COUNT_DOCUMENTATION.current_33_master_result, "REJECTED");

const packs = buildRemainingCanonicalSequencePack();
const validation = validateSequencePack(packs);

assert.equal(packs.length, 33);
assert.equal(REMAINING_CANONICAL_EXPECTED_KEYS.length, 33);
assert.deepEqual([...REMAINING_CANONICAL_EXPECTED_KEYS].sort(), [...CANONICAL_REMAINING_KEYS].sort());
assert.equal(validation.ok, true, JSON.stringify(validation.issues.filter((i) => i.severity === "error"), null, 2));
assert.equal(validation.stats.broken_references, 0);
assert.equal(validation.stats.total_status_sum, 37);

for (const pilot of CANONICAL_PILOT_KEYS) {
  assert.ok(!packs.some((p) => p.template_key === pilot));
}

for (const rejected of NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY) {
  assert.ok(!packs.some((p) => p.template_key === rejected.rejected_key), rejected.rejected_key);
}

for (const extra of REJECTED_33_EXTRA_KEYS) {
  assert.ok(!packs.some((p) => p.template_key === extra), extra);
}

for (const missing of MISSING_FROM_REJECTED_33) {
  assert.ok(packs.some((p) => p.template_key === missing), missing);
}

for (const row of CANONICAL_LOCKED_TEMPLATE_MASTER.filter((r) => r.status === "REMAINING")) {
  const pack = packs.find((p) => p.template_key === row.template_key)!;
  assert.ok(pack, row.template_key);
  assert.equal(pack.level, row.level);
  assert.equal(pack.environment, row.environment);
  assert.equal(pack.days_per_week, row.days);
  assert.equal(pack.primary_strategy, row.goal);
}

assert.ok(!packs.some((p) => p.template_key.includes("GENERAL_FITNESS_PROGRESS")));
assert.ok(!packs.some((p) => p.template_key.includes("GLUTE_FOCUS") && p.environment === "HOME"));
assert.ok(!packs.some((p) => p.template_key === "FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D"));

const a06 = packs.find((p) => p.template_key === "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D")!;
assert.equal(a06.days_per_week, 4);
assert.equal(a06.sessions.filter((s) => s.day_type === "workout").length, 4);

const b06 = packs.find((p) => p.template_key === "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D")!;
assert.equal(b06.days_per_week, 5);
assert.equal(b06.sessions.filter((s) => s.day_type === "workout").length, 5);

const fl4 = packs.find((p) => p.template_key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D")!;
assert.equal(fl4.days_per_week, 4);
assert.equal(fl4.level, "BEGINNER");

for (const haKey of [
  "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D",
  "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
] as const) {
  const ha = packs.find((p) => p.template_key === haKey)!;
  assert.equal(ha.days_per_week, 4);
  let weekly = 0;
  for (const s of ha.sessions.filter((x) => x.day_type === "workout")) {
    const post = s.exercises.find((e) => e.activity_role === "POST_WORKOUT_CARDIO")!;
    weekly += Number(post.reps_label.match(/(\d+)/)![1]);
  }
  assert.equal(weekly, 60, haKey);
}

for (const endKey of [
  "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D",
  "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
] as const) {
  const end = packs.find((p) => p.template_key === endKey)!;
  let weekly = 0;
  for (const s of end.sessions.filter((x) => x.day_type === "workout")) {
    const block = s.exercises.find((e) =>
      ["AEROBIC_ENDURANCE_BLOCK", "CONTROLLED_AEROBIC_INTERVAL_BLOCK"].includes(e.activity_role),
    )!;
    weekly += Number(block.reps_label.match(/(\d+)/)![1]);
  }
  assert.equal(weekly, 75, endKey);
}

for (const p of packs) {
  for (const s of p.sessions) {
    for (const e of s.exercises) {
      if (e.external_id) assert.ok(libraryHas(e.external_id), `${p.template_key} ${e.external_id}`);
      if (e.smart_progression_eligible) assert.equal(e.activity_role, "MAIN_RESISTANCE");
    }
  }
}

assert.equal(validation.stats.approved_for_import, 33);
assert.equal(validation.stats.pending_addition, 0);
assert.ok(libraryHas("CR-026"));
assert.ok(libraryHas("CR-027"));
assert.notEqual("CR-026", "CR-001");

const flGym = packs.find((p) => p.template_key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D")!;
for (const s of flGym.sessions.filter((x) => x.day_type === "workout")) {
  const start = s.exercises.find((e) => e.slot_key === "GENERAL_WARM_UP")!;
  const post = s.exercises.find((e) => e.slot_key === "POST_WORKOUT_CARDIO")!;
  assert.equal(start.external_id, "CR-026");
  assert.equal(post.external_id, "CR-026");
}

const glute = packs.filter((p) => p.primary_strategy === "GLUTE_FOCUS");
assert.equal(glute.length, 2);
assert.ok(glute.every((p) => p.environment === "GYM"));

console.log("phase9-sequence-pack.test.ts: PASS (final import-ready 37)");
console.log(JSON.stringify(validation.stats, null, 2));
