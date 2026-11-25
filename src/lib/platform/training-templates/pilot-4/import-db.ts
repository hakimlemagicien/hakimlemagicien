/**
 * Phase 6 — idempotent Pilot 4 import into REAL local Postgres.
 * Resolves exercise_id by external_id. Never invents UUIDs.
 * LOCAL only — never Staging/Production.
 */

import pg from "pg";
import { writeTemplateContractToMetadata } from "@/lib/platform/training-templates";
import { validateProgramTemplateContract } from "@/lib/platform/training-templates";
import { assertPilotSessionPolicies, auditPilotExercises, loadExerciseCatalogIndex } from "./exercise-audit";
import { PILOT_4_DEFINITIONS } from "./definitions";
import { PILOT_4_TEMPLATE_KEYS } from "./types";
import type { PilotTemplateDefinition } from "./types";

const { Client } = pg;

export type PilotDbImportReport = {
  storage: "LOCAL_DB";
  database_applied: true;
  imported_count: number;
  updated_count: number;
  created_count: number;
  templates: string[];
  template_ids: Record<string, string>;
  contract_valid: number;
  broken_exercise_references: number;
  missing_external_ids: string[];
  session_policy_issues: string[];
  idempotent: true;
  duplicates: number;
  published: number;
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
  const map = new Map(rows.map((r) => [r.external_id, r.id]));
  return map;
}

function collectExternalIds(def: PilotTemplateDefinition): string[] {
  return def.week.days.flatMap((d) => d.exercises.map((e) => e.external_id));
}

async function upsertPilot(
  client: pg.Client,
  def: PilotTemplateDefinition,
  exerciseMap: Map<string, string>,
): Promise<{ id: string; created: boolean }> {
  const metadata = writeTemplateContractToMetadata(
    {
      training_location: def.training_location,
      session_minutes: 55,
      equipment: def.equipment,
      pilot_key: def.key,
      pilot_phase: 6,
      builder: {
        coach_notes: def.description_ar,
        progression_notes: "Smart AUTO = WEIGHT + REPS only.",
        exercises: def.week.days.flatMap((day, dayIndex) =>
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

  const existing = await client.query<{ id: string; version: number; is_published: boolean }>(
    `SELECT id::text, version, is_published FROM public.program_templates WHERE slug = $1 LIMIT 1`,
    [def.slug],
  );

  let templateId: string;
  let created = false;

  if (existing.rows[0]) {
    templateId = existing.rows[0].id;
    // If published, structure is immutable via admin_save — for local import we allow rewrite
    // by temporarily unpublishing, replacing weeks, then republishing (idempotent refresh).
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

  for (const day of def.week.days) {
    // one week only for pilots
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
      [
        weekId,
        day.day_number,
        day.day_type,
        day.title_ar,
        day.muscle_focus,
        day.estimated_minutes,
      ],
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

export async function importPilot4ToLocalDb(): Promise<PilotDbImportReport> {
  const catalogIndex = loadExerciseCatalogIndex();
  const session_policy_issues = PILOT_4_DEFINITIONS.flatMap((d) => assertPilotSessionPolicies(d));
  let contract_valid = 0;
  let broken = 0;
  const missing = new Set<string>();

  for (const def of PILOT_4_DEFINITIONS) {
    const validation = validateProgramTemplateContract(def.contract);
    if (validation.ok) contract_valid += 1;
    const audit = auditPilotExercises(def, catalogIndex);
    broken += audit.broken_references;
    for (const id of audit.missing_exercises) missing.add(id);
  }

  if (missing.size > 0 || broken > 0) {
    throw new Error(
      `LOCAL_EXERCISE_LIBRARY_SYNC_REQUIRED: missing=${[...missing].join(",") || "none"} broken=${broken}`,
    );
  }

  const allIds = PILOT_4_DEFINITIONS.flatMap(collectExternalIds);
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

    for (const def of PILOT_4_DEFINITIONS) {
      const result = await upsertPilot(client, def, exerciseMap);
      template_ids[def.slug] = result.id;
      if (result.created) created_count += 1;
      else updated_count += 1;
    }

    // Idempotency: ensure no duplicate slugs among pilots
    const { rows: slugRows } = await client.query<{ slug: string; c: string }>(
      `SELECT slug, count(*)::text AS c FROM public.program_templates
       WHERE slug = ANY($1::text[]) GROUP BY slug HAVING count(*) > 1`,
      [PILOT_4_TEMPLATE_KEYS],
    );
    if (slugRows.length) {
      throw new Error(`duplicate_pilot_slugs: ${slugRows.map((r) => r.slug).join(",")}`);
    }

    await client.query("COMMIT");

    const { rows: published } = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM public.program_templates
       WHERE slug = ANY($1::text[]) AND is_published AND archived_at IS NULL`,
      [PILOT_4_TEMPLATE_KEYS],
    );

    return {
      storage: "LOCAL_DB",
      database_applied: true,
      imported_count: PILOT_4_DEFINITIONS.length,
      updated_count,
      created_count,
      templates: [...PILOT_4_TEMPLATE_KEYS],
      template_ids,
      contract_valid,
      broken_exercise_references: 0,
      missing_external_ids: [],
      session_policy_issues,
      idempotent: true,
      duplicates: 0,
      published: Number(published[0]?.c ?? 0),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}
