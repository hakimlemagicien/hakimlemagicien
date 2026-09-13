/**
 * Exercise reference audit for Pilot 4 against scripts/exercise-library.json + Core 100.
 * Browser-safe: catalog loads via static JSON import (no node:fs in client bundles).
 */

import exerciseLibraryJson from "../../../../../scripts/exercise-library.json";
import { CORE_100_EXTERNAL_IDS } from "@/lib/platform/strategy-matrix/config/core-100-external-ids";
import type { LibraryReadinessState } from "@/lib/platform/training-templates";
import type { PilotExerciseAudit, PilotTemplateDefinition } from "./types";

export type ExerciseCatalogIndex = {
  ids: Set<string>;
  names: Map<string, string>;
};

const CORE_SET = new Set(CORE_100_EXTERNAL_IDS);

let cachedIndex: ExerciseCatalogIndex | null = null;

export function loadExerciseCatalogIndex(): ExerciseCatalogIndex {
  if (cachedIndex) return cachedIndex;
  const raw = exerciseLibraryJson as Record<string, unknown>;
  const ids = new Set<string>();
  const names = new Map<string, string>();
  for (const value of Object.values(raw)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const id = String(row.id ?? "");
      if (!id) continue;
      ids.add(id);
      names.set(id, String(row.name_ar ?? row.name_en ?? row.name ?? id));
    }
  }
  cachedIndex = { ids, names };
  return cachedIndex;
}

export function auditPilotExercises(
  definition: PilotTemplateDefinition,
  index: ExerciseCatalogIndex = loadExerciseCatalogIndex(),
): PilotExerciseAudit {
  const refs: string[] = [];
  for (const day of definition.week.days) {
    for (const exercise of day.exercises) {
      refs.push(exercise.external_id);
    }
  }
  const unique = [...new Set(refs)];
  const missing = unique.filter((id) => !index.ids.has(id));
  const coreCount = refs.filter((id) => CORE_SET.has(id)).length;
  const fullCount = refs.length - coreCount;
  const broken = missing.length;
  const readiness: LibraryReadinessState = broken > 0 ? "MISSING_EXERCISE" : "READY";

  return {
    template_key: definition.key,
    total_exercise_references: refs.length,
    unique_external_ids: unique,
    core_100_references: coreCount,
    full_library_references: fullCount,
    missing_exercises: missing,
    missing_media: 0,
    broken_references: broken,
    library_readiness: readiness,
  };
}

export function assertPilotSessionPolicies(definition: PilotTemplateDefinition): string[] {
  const issues: string[] = [];
  const workouts = definition.week.days.filter((d) => d.day_type === "workout");
  for (const day of workouts) {
    const warmups = day.exercises.filter((e) =>
      ["GENERAL_WARM_UP", "TARGETED_DYNAMIC_WARM_UP"].includes(e.activity_role),
    );
    const mains = day.exercises.filter((e) => e.activity_role === "MAIN_RESISTANCE");
    const ramps = day.exercises.filter((e) => e.activity_role === "EXERCISE_SPECIFIC_RAMP_UP");
    const power = day.exercises.filter((e) => e.activity_role === "POWER_SKILL_BLOCK");

    if (warmups.length !== 3) {
      issues.push(`${definition.key} day ${day.day_number}: expected 3 warm-ups, got ${warmups.length}`);
    }
    if (mains.length !== 6) {
      issues.push(`${definition.key} day ${day.day_number}: expected 6 main, got ${mains.length}`);
    }
    if (ramps.some((r) => !r.excluded_from_main_volume)) {
      issues.push(`${definition.key} day ${day.day_number}: ramp-up must be excluded from main volume`);
    }
    if (power.some((r) => !r.excluded_from_main_volume)) {
      issues.push(`${definition.key} day ${day.day_number}: power block must be excluded from main 6`);
    }
  }

  if (definition.key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D") {
    let treadmillMinutes = 0;
    for (const day of workouts) {
      const start = day.exercises.find(
        (e) => e.activity_role === "GENERAL_WARM_UP" && e.external_id === "CR-026",
      );
      const post = day.exercises.find(
        (e) => e.activity_role === "POST_WORKOUT_CARDIO" && e.external_id === "CR-026",
      );
      if (!start || start.reps_label !== "10 min") issues.push("Fat Loss: missing 10 min start treadmill");
      if (!post || post.reps_label !== "15 min") issues.push("Fat Loss: missing 15 min post treadmill");
      if (day.exercises.some((e) => e.external_id === "CR-001" && ["GENERAL_WARM_UP", "POST_WORKOUT_CARDIO"].includes(e.activity_role))) {
        issues.push("Fat Loss: must use CR-026 brisk walk, not CR-001 run");
      }
      treadmillMinutes += 10 + 15;
    }
    if (treadmillMinutes !== 75) issues.push(`Fat Loss weekly treadmill expected 75, got ${treadmillMinutes}`);
    if (definition.contract.progression.smart_auto_variables.includes("CARDIO_DURATION" as never)) {
      issues.push("Fat Loss: cardio must not be Smart AUTO");
    }
  }

  if (definition.key === "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D") {
    const hasCardio = workouts.some((d) =>
      d.exercises.some((e) => e.activity_role === "POST_WORKOUT_CARDIO"),
    );
    if (hasCardio) issues.push("Muscle HOME: mandatory cardio present");
    if (
      JSON.stringify(definition.contract.progression.smart_auto_variables) !==
      JSON.stringify(["WEIGHT", "REPS"])
    ) {
      issues.push("Muscle HOME: smart auto must be WEIGHT+REPS only");
    }
  }

  if (definition.key === "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D") {
    if (workouts.length !== 4) issues.push("Strength: expected 4 workout days");
    if (!workouts.every((d) => d.exercises.some((e) => e.activity_role === "EXERCISE_SPECIFIC_RAMP_UP"))) {
      issues.push("Strength: each session needs ramp-up");
    }
  }

  if (definition.key === "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D") {
    if (!workouts.every((d) => d.exercises.some((e) => e.activity_role === "POWER_SKILL_BLOCK"))) {
      issues.push("Athletic: each session needs power skill block");
    }
  }

  return issues;
}
