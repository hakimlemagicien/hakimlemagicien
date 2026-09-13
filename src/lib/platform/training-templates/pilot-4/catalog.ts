/**
 * Pilot 4 catalog builders — Admin detail + resolver records.
 * Local authoritative import of exactly 4 templates (Phase 5).
 */

import { writeTemplateContractToMetadata } from "@/lib/platform/training-templates";
import type { AdminProgramDay, AdminProgramDetail, AdminProgramExercise } from "@/lib/admin/admin-programs-api";
import type { ResolvableTemplateRecord } from "@/lib/platform/training-templates";
import { auditPilotExercises, loadExerciseCatalogIndex } from "./exercise-audit";
import { PILOT_4_DEFINITIONS } from "./definitions";
import type { PilotCatalogRecord, PilotTemplateDefinition } from "./types";

/** Stable local IDs — not DB UUIDs until apply-to-database. */
export function pilotLocalId(slug: string): string {
  return `pilot-local-${slug.toLowerCase()}`;
}

function exercisePlaceholderUuid(externalId: string): string {
  // Deterministic pseudo-UUID for local catalog / snapshot sim (not a DB id).
  const hex = Array.from(externalId)
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .padEnd(32, "0")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function toAdminExercise(
  spec: PilotTemplateDefinition["week"]["days"][number]["exercises"][number],
  sort_order: number,
  nameAr: string,
): AdminProgramExercise {
  return {
    exercise_id: exercisePlaceholderUuid(spec.external_id),
    sort_order,
    sets: spec.sets,
    reps_min: spec.reps_min,
    reps_max: spec.reps_max,
    reps_label: spec.reps_label,
    rest_seconds: spec.rest_seconds,
    suggested_weight_kg: null,
    notes_ar: spec.notes_ar ?? null,
    exercise_name_ar: nameAr,
    exercise_external_id: spec.external_id,
    role: spec.role,
    activity_role: spec.activity_role,
  };
}

export function buildPilotAdminDetail(
  def: PilotTemplateDefinition,
  nameByExternalId: Map<string, string>,
): AdminProgramDetail {
  const days: AdminProgramDay[] = def.week.days.map((day) => ({
    day_number: day.day_number,
    day_type: day.day_type,
    title_ar: day.title_ar,
    muscle_focus: day.muscle_focus,
    estimated_minutes: day.estimated_minutes,
    estimated_calories: null,
    notes_ar: null,
    exercises: day.exercises.map((exercise, index) =>
      toAdminExercise(
        exercise,
        index,
        nameByExternalId.get(exercise.external_id) ?? exercise.external_id,
      ),
    ),
  }));

  const metadata = writeTemplateContractToMetadata(
    {
      training_location: def.training_location,
      session_minutes: 55,
      equipment: def.equipment,
      pilot_key: def.key,
      pilot_phase: 5,
      builder: {
        coach_notes: def.description_ar,
        progression_notes: "Smart AUTO = WEIGHT + REPS only. Coach controls sets/rest/identity/days/cardio/power.",
        exercises: days.flatMap((day, dayIndex) =>
          day.exercises.map((exercise, sort) => ({
            week: 0,
            day: dayIndex,
            sort,
            role: exercise.role ?? "main",
            activity_role: exercise.activity_role ?? null,
          })),
        ),
      },
    },
    def.contract,
  );

  return {
    id: pilotLocalId(def.slug),
    slug: def.slug,
    name_ar: def.name_ar,
    name_en: def.name_en,
    goal: def.legacy_goal,
    level: def.level,
    duration_weeks: def.duration_weeks,
    days_per_week: def.days_per_week,
    version: def.version,
    is_published: def.status === "PUBLISHED",
    archived_at: null,
    assignment_count: 0,
    updated_at: new Date().toISOString(),
    training_location: def.training_location,
    description_ar: def.description_ar,
    versioning_complete: true,
    session_minutes: 55,
    equipment: def.equipment,
    metadata,
    weeks: [
      {
        week_number: 1,
        title_ar: def.week.title_ar,
        notes_ar: null,
        days,
      },
    ],
  };
}

export function buildPilotResolvable(detail: AdminProgramDetail, def: PilotTemplateDefinition): ResolvableTemplateRecord {
  return {
    id: detail.id,
    slug: detail.slug,
    version: detail.version,
    status: def.status,
    is_published: detail.is_published,
    archived: false,
    version_group_id: detail.slug,
    contract: def.contract,
    equipment_tags: def.equipment.split(/[,\s]+/).filter(Boolean),
  };
}

let cachedCatalog: PilotCatalogRecord[] | null = null;

export function getPilot4Catalog(forceRefresh = false): PilotCatalogRecord[] {
  if (cachedCatalog && !forceRefresh) return cachedCatalog;
  const index = loadExerciseCatalogIndex();
  cachedCatalog = PILOT_4_DEFINITIONS.map((definition) => {
    const detail = buildPilotAdminDetail(definition, index.names);
    const exercise_audit = auditPilotExercises(definition, index);
    // Reflect audit into contract readiness
    definition.contract.library_readiness = {
      state: exercise_audit.library_readiness,
      missing_exercise_count: exercise_audit.missing_exercises.length,
      missing_media_count: exercise_audit.missing_media,
      notes: exercise_audit.broken_references
        ? "Broken exercise references present"
        : "Pilot validated against scripts/exercise-library.json",
    };
    const detailFresh = buildPilotAdminDetail(definition, index.names);
    return {
      definition,
      detail: detailFresh,
      resolvable: buildPilotResolvable(detailFresh, definition),
      exercise_audit,
    };
  });
  return cachedCatalog;
}

export function listPilotResolvableTemplates(): ResolvableTemplateRecord[] {
  return getPilot4Catalog()
    .filter((row) => row.resolvable.status === "PUBLISHED")
    .map((row) => row.resolvable);
}

export function listPilotAdminDetails(): AdminProgramDetail[] {
  return getPilot4Catalog().map((row) => row.detail);
}

export function findPilotBySlug(slug: string): PilotCatalogRecord | undefined {
  return getPilot4Catalog().find((row) => row.definition.slug === slug);
}

/** Real pilots first; fixtures only fill non-overlapping routes. */
export function mergeResolverCatalogPreferringPilots(
  fixtures: ResolvableTemplateRecord[],
  pilots: ResolvableTemplateRecord[] = listPilotResolvableTemplates(),
): ResolvableTemplateRecord[] {
  const pilotSlugs = new Set(pilots.map((p) => p.slug));
  const pilotKeys = new Set(
    pilots.map((p) =>
      [
        p.contract.primary_strategy,
        p.contract.variant.level,
        p.contract.variant.environment,
        p.contract.variant.days_per_week,
      ].join("|"),
    ),
  );
  const filteredFixtures = fixtures.filter((f) => {
    if (pilotSlugs.has(f.slug)) return false;
    const key = [
      f.contract.primary_strategy,
      f.contract.variant.level,
      f.contract.variant.environment,
      f.contract.variant.days_per_week,
    ].join("|");
    return !pilotKeys.has(key);
  });
  return [...pilots, ...filteredFixtures];
}
