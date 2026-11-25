/**
 * Phase 9 — idempotent import of remaining 33 canonical templates into LOCAL Postgres.
 * Never Staging/Production. Resolves exercise_id by external_id only.
 */

import pg from "pg";
import { writeTemplateContractToMetadata, validateProgramTemplateContract } from "@/lib/platform/training-templates";
import { CANONICAL_PILOT_KEYS, CANONICAL_REMAINING_KEYS, CANONICAL_TEMPLATE_COUNT } from "./canonical-locked-master";
import { buildRemainingCanonicalSequencePack } from "./sequence-pack";
import { buildPhase9ImportDefinitions, type Phase9ImportDefinition } from "./pack-to-import-def";
import { libraryHas } from "./sequence-types";
import {
  HOME_BRISK_WALK_EXTERNAL_ID,
  TREADMILL_BRISK_WALK_EXTERNAL_ID,
} from "./library-additions";
import { validateSequencePack } from "./validate-sequence-pack";

const { Client } = pg;

export type Phase9DbImportReport = {
  storage: "LOCAL_DB";
  database_applied: true;
  canonical_template_count: number;
  remaining_expected: number;
  imported_count: number;
  created_count: number;
  updated_count: number;
  failed: string[];
  template_ids: Record<string, string>;
  broken_exercise_references: number;
  missing_external_ids: string[];
  treadmill_brisk_walk_external_id: string;
  home_brisk_walk_external_id: string;
  pilot_existing: number;
  total_canonical_in_db: number;
  duplicates: number;
  published: number;
  idempotent: true;
};

function localDbUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  );
}

async function resolveExerciseMap(client: pg.Client, externalIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(externalIds)];
  const { rows } = await client.query<{ id: string; external_id: string }>(
    `SELECT id::text, external_id FROM public.exercises WHERE external_id = ANY($1::text[])`,
    [unique],
  );
  return new Map(rows.map((r) => [r.external_id, r.id]));
}

async function upsertTemplate(
  client: pg.Client,
  def: Phase9ImportDefinition,
  exerciseMap: Map<string, string>,
): Promise<{ id: string; created: boolean }> {
  const metadata = writeTemplateContractToMetadata(
    {
      training_location: def.training_location,
      session_minutes: 55,
      equipment: def.equipment,
      phase9_key: def.key,
      phase9_import: true,
      builder: {
        coach_notes: def.description_ar,
        progression_notes: "Smart AUTO = WEIGHT + REPS only.",
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
    def.contract,
  );

  const existing = await client.query<{ id: string }>(
    `SELECT id::text FROM public.program_templates WHERE slug = $1 LIMIT 1`,
    [def.slug],
  );

  let templateId: string;
  let created = false;

  if (existing.rows[0]) {
    templateId = existing.rows[0].id;
    await client.query(
      `UPDATE public.program_templates SET
        name_ar = $2, name_en = $3, description_ar = $4,
        goal = $5::public.program_goal, level = $6::public.program_level,
        duration_weeks = $7, days_per_week = $8,
        metadata = $9::jsonb,
        is_published = false,
        version = $10,
        archived_at = NULL,
        updated_at = now()
      WHERE id = $1::uuid`,
      [
        templateId,
        def.name_ar,
        def.name_en,
        def.description_ar,
        def.legacy_goal,
        def.level,
        def.duration_weeks,
        def.days_per_week,
        JSON.stringify(metadata),
        def.version,
      ],
    );
    await client.query(`DELETE FROM public.program_template_weeks WHERE template_id = $1::uuid`, [templateId]);
  } else {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO public.program_templates (
        slug, name_ar, name_en, description_ar, goal, level, duration_weeks, days_per_week,
        metadata, is_published, version
      ) VALUES ($1,$2,$3,$4,$5::public.program_goal,$6::public.program_level,$7,$8,$9::jsonb,false,$10)
      RETURNING id::text`,
      [
        def.slug,
        def.name_ar,
        def.name_en,
        def.description_ar,
        def.legacy_goal,
        def.level,
        def.duration_weeks,
        def.days_per_week,
        JSON.stringify(metadata),
        def.version,
      ],
    );
    templateId = inserted.rows[0]!.id;
    created = true;
  }

  const weekIns = await client.query<{ id: string }>(
    `INSERT INTO public.program_template_weeks (template_id, week_number, title_ar, notes_ar)
     VALUES ($1::uuid, 1, $2, NULL) RETURNING id::text`,
    [templateId, def.week.title_ar],
  );
  const weekId = weekIns.rows[0]!.id;

  for (const day of def.week.days) {
    const dayIns = await client.query<{ id: string }>(
      `INSERT INTO public.program_template_days (
        week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
      ) VALUES ($1::uuid, $2, $3::public.program_day_type, $4, $5, $6, NULL)
      RETURNING id::text`,
      [weekId, day.day_number, day.day_type, day.title_ar, day.muscle_focus, day.estimated_minutes],
    );
    const dayId = dayIns.rows[0]!.id;
    let sort = 0;
    for (const exercise of day.exercises) {
      const exerciseId = exerciseMap.get(exercise.external_id);
      if (!exerciseId) {
        throw new Error(`LOCAL_EXERCISE_LIBRARY_SYNC_REQUIRED: missing ${exercise.external_id}`);
      }
      await client.query(
        `INSERT INTO public.program_template_exercises (
          day_id, exercise_id, sort_order, sets, reps_min, reps_max, reps_label,
          rest_seconds, suggested_weight_kg, notes_ar, activity_role
        ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, NULL, $9, $10)`,
        [
          dayId,
          exerciseId,
          sort,
          exercise.sets,
          exercise.reps_min,
          exercise.reps_max,
          exercise.reps_label,
          exercise.rest_seconds,
          exercise.notes_ar,
          exercise.activity_role,
        ],
      );
      sort += 1;
    }
  }

  await client.query(
    `UPDATE public.program_templates SET is_published = true, updated_at = now() WHERE id = $1::uuid`,
    [templateId],
  );

  return { id: templateId, created };
}

export async function importPhase9RemainingToLocalDb(): Promise<Phase9DbImportReport> {
  if (!libraryHas(TREADMILL_BRISK_WALK_EXTERNAL_ID) || !libraryHas(HOME_BRISK_WALK_EXTERNAL_ID)) {
    throw new Error("LIBRARY_ADDITIONS_NOT_IN_CATALOG: sync CR-026/CR-027 first");
  }

  const packs = buildRemainingCanonicalSequencePack();
  const validation = validateSequencePack(packs);
  if (!validation.ok) {
    throw new Error(`SEQUENCE_PACK_INVALID: ${JSON.stringify(validation.issues.filter((i) => i.severity === "error"))}`);
  }

  const failed: string[] = [];
  let defs: Phase9ImportDefinition[] = [];
  try {
    defs = buildPhase9ImportDefinitions(packs);
  } catch (error) {
    throw error;
  }

  for (const def of defs) {
    const v = validateProgramTemplateContract(def.contract);
    if (!v.ok) {
      failed.push(`${def.key}:CONTRACT:${v.issues.map((i) => i.code).join(",")}`);
    }
  }
  if (failed.length) {
    throw new Error(`IMPORT_VALIDATION_FAIL: ${failed.join(" | ")}`);
  }

  const allIds = defs.flatMap((d) => d.week.days.flatMap((day) => day.exercises.map((e) => e.external_id)));
  const missingCatalog = [...new Set(allIds)].filter((id) => !libraryHas(id));
  if (missingCatalog.length) {
    throw new Error(`CONTENT_REFERENCE_REVIEW_REQUIRED: catalog missing ${missingCatalog.join(",")}`);
  }

  const client = new Client({ connectionString: localDbUrl() });
  await client.connect();

  try {
    const exerciseMap = await resolveExerciseMap(client, allIds);
    const unresolved = [...new Set(allIds)].filter((id) => !exerciseMap.has(id));
    if (unresolved.length) {
      throw new Error(`LOCAL_EXERCISE_LIBRARY_SYNC_REQUIRED: DB missing ${unresolved.join(",")}`);
    }

    await client.query("BEGIN");
    let created_count = 0;
    let updated_count = 0;
    const template_ids: Record<string, string> = {};

    for (const def of defs) {
      const result = await upsertTemplate(client, def, exerciseMap);
      template_ids[def.slug] = result.id;
      if (result.created) created_count += 1;
      else updated_count += 1;
    }

    const { rows: dupRows } = await client.query<{ slug: string; c: string }>(
      `SELECT slug, count(*)::text AS c FROM public.program_templates
       WHERE slug = ANY($1::text[]) GROUP BY slug HAVING count(*) > 1`,
      [CANONICAL_REMAINING_KEYS],
    );
    if (dupRows.length) {
      throw new Error(`duplicate_canonical_slugs: ${dupRows.map((r) => r.slug).join(",")}`);
    }

    await client.query("COMMIT");

    const allCanonical = [...CANONICAL_PILOT_KEYS, ...CANONICAL_REMAINING_KEYS];
    const { rows: published } = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM public.program_templates
       WHERE slug = ANY($1::text[]) AND is_published AND archived_at IS NULL`,
      [allCanonical],
    );
    const { rows: pilotRows } = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM public.program_templates
       WHERE slug = ANY($1::text[]) AND is_published AND archived_at IS NULL`,
      [CANONICAL_PILOT_KEYS],
    );

    return {
      storage: "LOCAL_DB",
      database_applied: true,
      canonical_template_count: CANONICAL_TEMPLATE_COUNT,
      remaining_expected: CANONICAL_REMAINING_KEYS.length,
      imported_count: defs.length,
      created_count,
      updated_count,
      failed: [],
      template_ids,
      broken_exercise_references: 0,
      missing_external_ids: [],
      treadmill_brisk_walk_external_id: TREADMILL_BRISK_WALK_EXTERNAL_ID,
      home_brisk_walk_external_id: HOME_BRISK_WALK_EXTERNAL_ID,
      pilot_existing: Number(pilotRows[0]?.c ?? 0),
      total_canonical_in_db: Number(published[0]?.c ?? 0),
      duplicates: 0,
      published: Number(published[0]?.c ?? 0),
      idempotent: true,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}
