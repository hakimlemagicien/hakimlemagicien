/**
 * Phase 9 sequence pack validator — Locked Product Master (37 entries) parity.
 */
import {
  ACTUAL_CANONICAL_ENTRY_COUNT,
  CANONICAL_LOCKED_TEMPLATE_MASTER,
  CANONICAL_PILOT_KEYS,
  CANONICAL_REMAINING_KEYS,
  CANONICAL_TEMPLATE_COUNT,
  NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY,
  PILOT_COUNT,
  REMAINING_CANONICAL_COUNT,
} from "./canonical-locked-master";
import { CORE_100_SET, libraryHas, type TemplateSequencePack } from "./sequence-types";

export type ValidationIssue = {
  severity: "error" | "warning";
  template_key?: string;
  code: string;
  message: string;
};

const REQUIRED_REMAINING = [
  "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D",
  "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D",
  "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D",
  "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
  "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D",
  "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
] as const;

function weeklyMinutes(
  pack: TemplateSequencePack,
  roles: string[],
): number {
  let weekly = 0;
  for (const s of pack.sessions.filter((x) => x.day_type === "workout")) {
    const block = s.exercises.find((e) => roles.includes(e.activity_role));
    const m = block?.reps_label.match(/(\d+)\s*min/);
    weekly += m ? Number(m[1]) : 0;
  }
  return weekly;
}

export function validateSequencePack(packs: TemplateSequencePack[]): {
  ok: boolean;
  issues: ValidationIssue[];
  stats: Record<string, number | boolean | string>;
} {
  const issues: ValidationIssue[] = [];
  const keys = packs.map((p) => p.template_key);
  const keySet = new Set(keys);
  const remainingSet = new Set(CANONICAL_REMAINING_KEYS);
  const byCanonical = new Map(CANONICAL_LOCKED_TEMPLATE_MASTER.map((r) => [r.template_key, r]));

  if (CANONICAL_TEMPLATE_COUNT !== ACTUAL_CANONICAL_ENTRY_COUNT || CANONICAL_TEMPLATE_COUNT !== 37) {
    issues.push({
      severity: "error",
      code: "CANONICAL_COUNT",
      message: `Canonical count must be 37, got ${CANONICAL_TEMPLATE_COUNT}`,
    });
  }

  if (packs.length !== REMAINING_CANONICAL_COUNT) {
    issues.push({
      severity: "error",
      code: "REMAINING_COUNT",
      message: `Expected ${REMAINING_CANONICAL_COUNT} remaining packs, got ${packs.length}`,
    });
  }

  if (new Set(keys).size !== keys.length) {
    issues.push({ severity: "error", code: "DUPLICATE_KEY", message: "Duplicate template_key in pack" });
  }

  for (const expected of CANONICAL_REMAINING_KEYS) {
    if (!keySet.has(expected)) {
      issues.push({ severity: "error", code: "MISSING_CANONICAL", message: `Missing canonical remaining ${expected}` });
    }
  }

  for (const required of REQUIRED_REMAINING) {
    if (!keySet.has(required)) {
      issues.push({ severity: "error", code: "MISSING_REQUIRED", message: `Missing required key ${required}` });
    }
  }

  for (const key of keys) {
    if (!remainingSet.has(key)) {
      issues.push({ severity: "error", code: "UNKNOWN_OR_EXTRA_KEY", message: `Unknown/extra template key ${key}` });
    }
    if (CANONICAL_PILOT_KEYS.includes(key)) {
      issues.push({ severity: "error", code: "PILOT_IN_REMAINING", message: `Pilot counted as remaining: ${key}` });
    }
  }

  for (const rejected of NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY) {
    if (keySet.has(rejected.rejected_key)) {
      issues.push({
        severity: "error",
        code: "NON_EXISTENT_IN_PACK",
        message: `${rejected.rejected_key} must not appear in sequence pack (${rejected.classification})`,
      });
    }
  }

  if (packs.some((p) => p.template_key === "FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D")) {
    issues.push({
      severity: "error",
      code: "FAT_LOSS_INT_HOME",
      message: "Fat Loss Intermediate HOME is not in Locked Product Master",
    });
  }
  if (packs.some((p) => p.template_key.includes("GENERAL_FITNESS_PROGRESS"))) {
    issues.push({ severity: "error", code: "GF_INTERMEDIATE", message: "GF Intermediate not canonical" });
  }
  if (packs.some((p) => p.template_key.includes("GLUTE_FOCUS") && p.environment === "HOME")) {
    issues.push({ severity: "error", code: "GLUTE_HOME", message: "Glute HOME must not be in pack" });
  }
  if (packs.some((p) => p.template_key === "STRENGTH_PROGRESS_INTERMEDIATE_GYM_5D")) {
    issues.push({ severity: "error", code: "STRENGTH_5D", message: "Strength GYM 5D is not canonical" });
  }
  if (packs.some((p) => p.template_key === "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D")) {
    issues.push({
      severity: "error",
      code: "MG_GENERIC_5D",
      message: "Use 06A/06B keys — not generic MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D",
    });
  }

  let broken = 0;
  const existingUsed = new Set<string>();
  const coreUsed = new Set<string>();
  let additionRefs = 0;

  for (const pack of packs) {
    const canon = byCanonical.get(pack.template_key);
    if (!canon) continue;

    if (pack.level !== canon.level) {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "WRONG_LEVEL",
        message: `Expected ${canon.level}, got ${pack.level}`,
      });
    }
    if (pack.environment !== canon.environment) {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "WRONG_ENVIRONMENT",
        message: `Expected ${canon.environment}, got ${pack.environment}`,
      });
    }
    if (pack.days_per_week !== canon.days) {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "WRONG_DAY_COUNT",
        message: `Expected ${canon.days}D, got ${pack.days_per_week}`,
      });
    }
    if (pack.primary_strategy !== canon.goal) {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "WRONG_FAMILY",
        message: `Expected ${canon.goal}, got ${pack.primary_strategy}`,
      });
    }

    if (pack.content_status === "BLOCKED") {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "UNEXPECTED_BLOCKED",
        message: "Canonical remaining templates must not be BLOCKED",
      });
      continue;
    }

    const workouts = pack.sessions.filter((s) => s.day_type === "workout");
    if (workouts.length !== pack.days_per_week) {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "SESSION_COUNT",
        message: `Expected ${pack.days_per_week} workouts, got ${workouts.length}`,
      });
    }

    for (const session of workouts) {
      const warmups = session.exercises.filter((e) =>
        ["GENERAL_WARM_UP", "TARGETED_DYNAMIC_WARM_UP"].includes(e.activity_role),
      );
      const mains = session.exercises.filter((e) => e.activity_role === "MAIN_RESISTANCE");
      if (warmups.length !== 3) {
        issues.push({
          severity: "error",
          template_key: pack.template_key,
          code: "WARMUP_COUNT",
          message: `${session.session_key}: expected 3 warm-ups, got ${warmups.length}`,
        });
      }
      if (mains.length !== 6) {
        issues.push({
          severity: "error",
          template_key: pack.template_key,
          code: "MAIN_COUNT",
          message: `${session.session_key}: expected 6 mains, got ${mains.length}`,
        });
      }

      for (const ex of session.exercises) {
        if (ex.smart_progression_eligible && ex.activity_role !== "MAIN_RESISTANCE") {
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "SMART_SCOPE",
            message: `${ex.slot_key}: Smart only on MAIN_RESISTANCE`,
          });
        }
        if (ex.content_status === "EXERCISE_LIBRARY_ADDITION_REQUIRED") {
          additionRefs += 1;
          if (ex.external_id != null) {
            issues.push({
              severity: "error",
              template_key: pack.template_key,
              code: "ADDITION_HAS_ID",
              message: `${ex.slot_key}: must not invent external_id`,
            });
          }
          continue;
        }
        if (!ex.external_id || !libraryHas(ex.external_id)) {
          broken += 1;
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "BROKEN_REF",
            message: `${ex.slot_key}: unresolved ${ex.external_id}`,
          });
        } else {
          existingUsed.add(ex.external_id);
          if (CORE_100_SET.has(ex.external_id)) coreUsed.add(ex.external_id);
        }
      }

      if (pack.primary_strategy === "FAT_LOSS" && pack.environment === "GYM") {
        const start = session.exercises.find((e) => e.slot_key === "GENERAL_WARM_UP");
        const post = session.exercises.find((e) => e.slot_key === "POST_WORKOUT_CARDIO");
        if (start?.addition_spec_id !== "ADD_TREADMILL_BRISK_WALK" || post?.addition_spec_id !== "ADD_TREADMILL_BRISK_WALK") {
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "FAT_LOSS_CARDIO",
            message: `${session.session_key}: Fat Loss GYM requires Treadmill Brisk Walk addition`,
          });
        }
        if (session.exercises.some((e) => e.external_id === "CR-001")) {
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "FAT_LOSS_RUN_SUBSTITUTE",
            message: "CR-001 forbidden as Fat Loss brisk walk",
          });
        }
      }

      if (
        pack.template_key === "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D" ||
        pack.template_key === "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D"
      ) {
        const post = session.exercises.find((e) => e.activity_role === "POST_WORKOUT_CARDIO");
        if (post?.reps_label !== "15 min") {
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "HA_CARDIO_DURATION",
            message: `${session.session_key}: expected 15 min post aerobic`,
          });
        }
      }
    }

    for (const haKey of [
      "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D",
      "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
    ] as const) {
      if (pack.template_key === haKey) {
        const weekly = weeklyMinutes(pack, ["POST_WORKOUT_CARDIO"]);
        if (weekly !== 60) {
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "HA_WEEKLY_CARDIO",
            message: `Expected 60 min/week post aerobic, got ${weekly}`,
          });
        }
      }
    }

    for (const endKey of [
      "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D",
      "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
    ] as const) {
      if (pack.template_key === endKey) {
        const weekly = weeklyMinutes(pack, ["AEROBIC_ENDURANCE_BLOCK", "CONTROLLED_AEROBIC_INTERVAL_BLOCK"]);
        if (weekly !== 75) {
          issues.push({
            severity: "error",
            template_key: pack.template_key,
            code: "ENDURANCE_WEEKLY",
            message: `Expected 75 min/week aerobic, got ${weekly}`,
          });
        }
      }
    }

    if (
      pack.content_status === "CONTENT_APPROVED_FOR_IMPORT" &&
      pack.sessions.some((s) => s.exercises.some((e) => e.content_status === "EXERCISE_LIBRARY_ADDITION_REQUIRED"))
    ) {
      issues.push({
        severity: "error",
        template_key: pack.template_key,
        code: "STATUS_CONFLICT",
        message: "FOR_IMPORT cannot include addition-required slots",
      });
    }
  }

  const approved = packs.filter((p) => p.content_status === "CONTENT_APPROVED_FOR_IMPORT").length;
  const pending = packs.filter((p) => p.content_status === "CONTENT_APPROVED_PENDING_LIBRARY_ADDITION").length;
  const review = packs.filter((p) => p.content_status === "CONTENT_REVIEW_REQUIRED").length;
  const blocked = packs.filter((p) => p.content_status === "BLOCKED").length;
  const statusSum = approved + pending + review + blocked + PILOT_COUNT;

  if (statusSum !== CANONICAL_TEMPLATE_COUNT) {
    issues.push({
      severity: "error",
      code: "STATUS_SUM",
      message: `Status sum ${statusSum} != canonical ${CANONICAL_TEMPLATE_COUNT}`,
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    issues,
    stats: {
      canonical_template_count: CANONICAL_TEMPLATE_COUNT,
      pilot_count: PILOT_COUNT,
      remaining_canonical_count: REMAINING_CANONICAL_COUNT,
      packs: packs.length,
      broken_references: broken,
      unique_existing_exercises: existingUsed.size,
      unique_core_100: coreUsed.size,
      addition_slot_refs: additionRefs,
      approved_for_import: approved,
      pending_addition: pending,
      review_required: review,
      blocked,
      already_imported: PILOT_COUNT,
      total_status_sum: statusSum,
      historical_master_label: "36/36",
      actual_canonical_entry_count: ACTUAL_CANONICAL_ENTRY_COUNT,
    },
  };
}
