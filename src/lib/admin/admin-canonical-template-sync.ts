/**
 * Sync the Locked Product Master (37 canonical templates) into the connected Admin DB.
 * Uses admin RPCs (save + publish) so Production can be populated from the logged-in coach session.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  listAdminProgramTemplates,
  publishAdminProgramTemplate,
  saveAdminProgramTemplate,
  type AdminProgramDetail,
} from "@/lib/admin/admin-programs-api";
import { writeTemplateContractToMetadata } from "@/lib/platform/training-templates";
import { PILOT_4_DEFINITIONS } from "@/lib/platform/training-templates/pilot-4/definitions";
import {
  CANONICAL_ALL_KEYS,
  CANONICAL_TEMPLATE_COUNT,
  type CanonicalTemplateRow,
  CANONICAL_LOCKED_TEMPLATE_MASTER,
} from "@/lib/platform/training-templates/phase9/canonical-locked-master";
import { buildRemainingCanonicalSequencePack } from "@/lib/platform/training-templates/phase9/sequence-pack";
import {
  buildPhase9ImportDefinitions,
  type Phase9ImportDefinition,
} from "@/lib/platform/training-templates/phase9/pack-to-import-def";

export type CanonicalTemplateSyncReport = {
  expected: number;
  present_before: number;
  created: number;
  updated: number;
  published: number;
  skipped_published: number;
  failed: Array<{ slug: string; error: string }>;
  missing_exercises: string[];
  present_after: number;
};

const STRATEGY_AR: Record<string, string> = {
  FAT_LOSS: "خسارة الدهون",
  MUSCLE_GAIN: "بناء العضلات",
  BODY_RECOMPOSITION: "إعادة التركيب",
  GLUTE_FOCUS: "تركيز الألوية",
  STRENGTH: "القوة",
  ATHLETIC_PERFORMANCE: "الأداء الرياضي",
  GENERAL_FITNESS: "اللياقة العامة",
  HEALTHY_AGING_ACTIVE_LIFE: "الحياة النشطة",
  ENDURANCE: "التحمل",
  MOBILITY_FUNCTIONAL: "الحركة الوظيفية",
};

const LEVEL_AR = { BEGINNER: "مبتدئ", INTERMEDIATE: "متوسط" } as const;
const ENV_AR = { GYM: "صالة", HOME: "منزل" } as const;

function stageAr(key: string): string {
  if (key.includes("_FOUNDATION_")) return "أساس";
  if (key.includes("_PROGRESS_")) return "تقدم";
  if (key.includes("_UPPER_LOWER_")) return "علوي/سفلي";
  if (key.includes("_ADVANCED_SPLIT_")) return "تقسيم متقدم";
  return "برنامج";
}

export function arabicCanonicalTemplateName(row: CanonicalTemplateRow): string {
  const strategy = STRATEGY_AR[row.goal] ?? row.goal;
  return `${stageAr(row.template_key)} ${strategy} – ${LEVEL_AR[row.level]} ${ENV_AR[row.environment]} ${row.days} أيام`;
}

function masterByKey(): Map<string, CanonicalTemplateRow> {
  return new Map(CANONICAL_LOCKED_TEMPLATE_MASTER.map((row) => [row.template_key, row]));
}

function pilotToImportDefinition(): Phase9ImportDefinition[] {
  return PILOT_4_DEFINITIONS.map((def) => ({
    key: def.key,
    slug: def.slug,
    name_ar: def.name_ar,
    name_en: def.name_en,
    description_ar: def.description_ar,
    version: def.version,
    legacy_goal: def.legacy_goal,
    level: def.level,
    days_per_week: def.days_per_week,
    duration_weeks: def.duration_weeks,
    training_location: def.training_location,
    equipment: def.equipment,
    contract: def.contract,
    week: {
      title_ar: def.week.title_ar,
      days: def.week.days.map((day) => ({
        day_number: day.day_number,
        day_type: day.day_type,
        title_ar: day.title_ar,
        muscle_focus: day.muscle_focus,
        estimated_minutes: day.estimated_minutes,
        exercises: day.exercises.map((exercise) => ({
          external_id: exercise.external_id,
          sets: exercise.sets,
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          reps_label: exercise.reps_label,
          rest_seconds: exercise.rest_seconds,
          role: exercise.role,
          activity_role: exercise.activity_role,
          notes_ar: exercise.notes_ar ?? null,
        })),
      })),
    },
  }));
}

export function buildAllCanonicalImportDefinitions(): Phase9ImportDefinition[] {
  const bySlug = new Map<string, Phase9ImportDefinition>();
  for (const def of pilotToImportDefinition()) bySlug.set(def.slug, def);
  for (const def of buildPhase9ImportDefinitions(buildRemainingCanonicalSequencePack())) {
    bySlug.set(def.slug, def);
  }
  const master = masterByKey();
  return CANONICAL_ALL_KEYS.map((key) => {
    const def = bySlug.get(key);
    if (!def) throw new Error(`canonical_definition_missing:${key}`);
    const row = master.get(key);
    return row ? { ...def, name_ar: arabicCanonicalTemplateName(row) } : def;
  });
}

async function resolveExerciseIds(externalIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(externalIds.filter(Boolean))];
  const map = new Map<string, string>();
  const chunkSize = 80;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("exercises")
      .select("id, external_id")
      .in("external_id", chunk);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.external_id && row.id) map.set(String(row.external_id), String(row.id));
    }
  }
  return map;
}

function buildSavePayload(
  def: Phase9ImportDefinition,
  exerciseMap: Map<string, string>,
  existingId: string | null,
): Record<string, unknown> {
  const missing = def.week.days
    .flatMap((day) => day.exercises)
    .map((ex) => ex.external_id)
    .filter((id) => !exerciseMap.has(id));
  if (missing.length) {
    throw new Error(`missing_exercises:${[...new Set(missing)].join(",")}`);
  }

  const metadata = writeTemplateContractToMetadata(
    {
      training_location: def.training_location,
      session_minutes: 55,
      equipment: def.equipment,
      phase9_key: def.key,
      canonical_sync: true,
      builder: {
        coach_notes: def.description_ar,
        progression_notes: "تعيين المدرب له الأولوية القصوى (COACH_MANAGED).",
        exercises: def.week.days.flatMap((day, dayIndex) =>
          day.exercises.map((exercise, sort) => ({
            week: 0,
            day: dayIndex,
            sort,
            role: exercise.role,
            activity_role: exercise.activity_role,
          })),
        ),
      },
    },
    {
      ...def.contract,
      progression: {
        ...def.contract.progression,
        compatible_strategies: ["COACH_MANAGED", "SMART_PROGRESSION_EXERCISE_LOCKED"],
      },
    },
  );

  return {
    id: existingId,
    slug: def.slug,
    name_ar: def.name_ar,
    name_en: def.name_en,
    description_ar: def.description_ar,
    goal: def.legacy_goal,
    level: def.level,
    duration_weeks: def.duration_weeks,
    days_per_week: def.days_per_week,
    metadata,
    weeks: [
      {
        week_number: 1,
        title_ar: def.week.title_ar,
        notes_ar: null,
        days: def.week.days.map((day) => ({
          day_number: day.day_number,
          day_type: day.day_type,
          title_ar: day.title_ar,
          muscle_focus: day.muscle_focus,
          estimated_minutes: day.estimated_minutes,
          estimated_calories: null,
          exercises: day.exercises.map((exercise) => ({
            exercise_id: exerciseMap.get(exercise.external_id)!,
            sets: exercise.sets,
            reps_min: exercise.reps_min,
            reps_max: exercise.reps_max,
            reps_label: exercise.reps_label,
            rest_seconds: exercise.rest_seconds,
            suggested_weight_kg: null,
            notes_ar: exercise.notes_ar,
            activity_role: exercise.activity_role,
          })),
        })),
      },
    ],
  };
}

export async function syncCanonicalTemplatesToLibrary(options?: {
  onProgress?: (done: number, total: number, slug: string) => void;
}): Promise<CanonicalTemplateSyncReport> {
  const definitions = buildAllCanonicalImportDefinitions();
  const listed = await listAdminProgramTemplates({ status: null, limit: 50, offset: 0 });
  const bySlug = new Map(listed.rows.map((row) => [row.slug, row]));
  const presentBefore = listed.rows.filter((row) => CANONICAL_ALL_KEYS.includes(row.slug)).length;

  const allExternalIds = definitions.flatMap((def) =>
    def.week.days.flatMap((day) => day.exercises.map((ex) => ex.external_id)),
  );
  const exerciseMap = await resolveExerciseIds(allExternalIds);
  const missingExercises = [...new Set(allExternalIds.filter((id) => !exerciseMap.has(id)))];

  const report: CanonicalTemplateSyncReport = {
    expected: CANONICAL_TEMPLATE_COUNT,
    present_before: presentBefore,
    created: 0,
    updated: 0,
    published: 0,
    skipped_published: 0,
    failed: [],
    missing_exercises: missingExercises,
    present_after: presentBefore,
  };

  if (missingExercises.length) {
    // Still try templates that don't need the missing ids; failures recorded per template.
  }

  let done = 0;
  for (const def of definitions) {
    done += 1;
    options?.onProgress?.(done, definitions.length, def.slug);
    const existing = bySlug.get(def.slug);
    if (existing?.is_published && !existing.archived_at) {
      report.skipped_published += 1;
      continue;
    }
    try {
      const payload = buildSavePayload(def, exerciseMap, existing?.id ?? null);
      const saved = await saveAdminProgramTemplate(payload, existing?.updated_at ?? null);
      if (existing?.id) report.updated += 1;
      else report.created += 1;
      bySlug.set(def.slug, saved);
      if (!saved.is_published) {
        await publishAdminProgramTemplate(saved.id);
        report.published += 1;
      }
    } catch (err) {
      report.failed.push({
        slug: def.slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const after = await listAdminProgramTemplates({ status: "published", limit: 50, offset: 0 });
  report.present_after = after.rows.filter((row) => CANONICAL_ALL_KEYS.includes(row.slug)).length;
  return report;
}

export function isCanonicalProgramDetail(detail: Pick<AdminProgramDetail, "slug">): boolean {
  return CANONICAL_ALL_KEYS.includes(detail.slug);
}
