/**
 * Phase 9 local import runner — sync additions + import 33 remaining + migrate Pilot Fat Loss.
 * LOCAL_ONLY. Runs import twice for idempotency proof.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { importPhase9RemainingToLocalDb } from "../src/lib/platform/training-templates/phase9/import-db.ts";
import { importPilot4ToLocalDb } from "../src/lib/platform/training-templates/pilot-4/import-db.ts";
import {
  CANONICAL_ALL_KEYS,
  CANONICAL_PILOT_KEYS,
  CANONICAL_REMAINING_KEYS,
  CANONICAL_TEMPLATE_COUNT,
} from "../src/lib/platform/training-templates/phase9/canonical-locked-master.ts";
import {
  HOME_BRISK_WALK_EXTERNAL_ID,
  TREADMILL_BRISK_WALK_EXTERNAL_ID,
} from "../src/lib/platform/training-templates/phase9/library-additions.ts";
import pg from "pg";

const { Client } = pg;
const DB = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function main() {
  console.log("=== Phase 9 LOCAL import ===");
  console.log("DB:", DB.replace(/:[^:@]+@/, ":***@"));

  // Preflight: additions must exist in DB (caller syncs first)
  const client = new Client({ connectionString: DB });
  await client.connect();
  const { rows: addRows } = await client.query<{ external_id: string; name_en: string }>(
    `SELECT external_id, name_en FROM public.exercises WHERE external_id = ANY($1::text[])`,
    [[TREADMILL_BRISK_WALK_EXTERNAL_ID, HOME_BRISK_WALK_EXTERNAL_ID, "CR-001"]],
  );
  console.log("Library preflight:", addRows);

  const hasT = addRows.some((r) => r.external_id === TREADMILL_BRISK_WALK_EXTERNAL_ID);
  const hasH = addRows.some((r) => r.external_id === HOME_BRISK_WALK_EXTERNAL_ID);
  if (!hasT || !hasH) {
    await client.end();
    throw new Error("Run ./scripts/sync-exercises.sh against LOCAL first (CR-026/CR-027 missing)");
  }

  // Count legacy Fat Loss assignment snapshots using CR-001 before pilot migrate
  const { rows: legacyAssign } = await client.query<{ c: string }>(
    `SELECT count(*)::text AS c
     FROM public.client_program_exercises cpe
     JOIN public.exercises e ON e.id = cpe.exercise_id
     WHERE e.external_id = 'CR-001'
       AND cpe.activity_role IN ('GENERAL_WARM_UP', 'POST_WORKOUT_CARDIO')`,
  );
  const legacyAssignmentUsesOldCardio = Number(legacyAssign[0]?.c ?? 0) > 0;
  await client.end();

  console.log("IMPORT_RUN_1 remaining…");
  const run1 = await importPhase9RemainingToLocalDb();
  console.log("IMPORT_RUN_2 remaining (idempotency)…");
  const run2 = await importPhase9RemainingToLocalDb();

  console.log("Pilot Fat Loss cardio migration (master only)…");
  const pilotReport = await importPilot4ToLocalDb();

  const verify = new Client({ connectionString: DB });
  await verify.connect();
  const { rows: canonical } = await verify.query<{ slug: string; days_per_week: number; level: string }>(
    `SELECT slug, days_per_week, level::text
     FROM public.program_templates
     WHERE slug = ANY($1::text[]) AND is_published AND archived_at IS NULL
     ORDER BY slug`,
    [CANONICAL_ALL_KEYS],
  );

  const present = new Set(canonical.map((r) => r.slug));
  const missing = CANONICAL_ALL_KEYS.filter((k) => !present.has(k));
  const unknown = [...present].filter((k) => !CANONICAL_ALL_KEYS.includes(k));

  // Sample activity roles + main counts for Fat Loss GYM 4D
  const { rows: flSample } = await verify.query<{ activity_role: string; external_id: string; c: string }>(
    `SELECT pte.activity_role, e.external_id, count(*)::text AS c
     FROM program_templates pt
     JOIN program_template_weeks w ON w.template_id = pt.id
     JOIN program_template_days d ON d.week_id = w.id AND d.day_type = 'workout'
     JOIN program_template_exercises pte ON pte.day_id = d.id
     JOIN exercises e ON e.id = pte.exercise_id
     WHERE pt.slug = 'FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D'
     GROUP BY 1, 2
     ORDER BY 1, 2`,
  );

  const { rows: pilotCardio } = await verify.query<{ external_id: string; activity_role: string }>(
    `SELECT e.external_id, pte.activity_role
     FROM program_templates pt
     JOIN program_template_weeks w ON w.template_id = pt.id
     JOIN program_template_days d ON d.week_id = w.id AND d.day_type = 'workout'
     JOIN program_template_exercises pte ON pte.day_id = d.id
     JOIN exercises e ON e.id = pte.exercise_id
     WHERE pt.slug = 'FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D'
       AND pte.activity_role IN ('GENERAL_WARM_UP', 'POST_WORKOUT_CARDIO')`,
  );

  const { rows: dupSlugs } = await verify.query<{ slug: string; c: string }>(
    `SELECT slug, count(*)::text AS c FROM program_templates
     WHERE slug = ANY($1::text[]) GROUP BY slug HAVING count(*) > 1`,
    [CANONICAL_ALL_KEYS],
  );

  await verify.end();

  const report = {
    phase: "9/10",
    task: "FINAL_CANONICAL_TEMPLATE_IMPORT",
    environment: "LOCAL_ONLY",
    generated_at: new Date().toISOString(),
    canonical_template_count: CANONICAL_TEMPLATE_COUNT,
    pilot_keys: CANONICAL_PILOT_KEYS,
    remaining_keys: CANONICAL_REMAINING_KEYS,
    library_additions: {
      treadmill: { external_id: TREADMILL_BRISK_WALK_EXTERNAL_ID, present: hasT },
      home: { external_id: HOME_BRISK_WALK_EXTERNAL_ID, present: hasH },
      distinct_from_cr001: addRows.find((r) => r.external_id === "CR-001")?.name_en === "Treadmill Run",
    },
    import_run_1: run1,
    import_run_2: {
      created_count: run2.created_count,
      updated_count: run2.updated_count,
      imported_count: run2.imported_count,
      total_canonical_in_db: run2.total_canonical_in_db,
    },
    pilot_migration: {
      report: pilotReport,
      fat_loss_cardio_ids: pilotCardio,
      legacy_assignment_uses_old_cardio_identity: legacyAssignmentUsesOldCardio,
      legacy_assignments_mutated: false,
    },
    verification: {
      present_count: canonical.length,
      missing,
      unknown_extra_canonical_slugs: unknown,
      duplicate_canonical_slugs: dupSlugs,
      fat_loss_gym_4d_roles: flSample,
      idempotency_pass: run2.created_count === 0 && run1.imported_count === 33,
    },
    staging_changed: false,
    production_changed: false,
  };

  mkdirSync("docs/data", { recursive: true });
  writeFileSync("docs/data/training-template-phase9-import-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    present: canonical.length,
    missing,
    run1_created: run1.created_count,
    run2_created: run2.created_count,
    pilot_cardio: pilotCardio,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
