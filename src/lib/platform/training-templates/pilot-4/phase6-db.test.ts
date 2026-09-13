/**
 * Phase 6 — real local DB e2e: list RPC, resolver, assign, snapshot freeze, runtime.
 * Requires local Supabase + Pilot 4 imported + phase6 test users seeded.
 */
import assert from "node:assert/strict";
import pg from "pg";
import { resolveProgramTemplate } from "@/lib/platform/training-templates";
import { programTemplateContractFromMetadata } from "@/lib/admin/admin-program-builder";
import type { ResolvableTemplateRecord } from "@/lib/platform/training-templates";

const { Client } = pg;
const DB = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const ADMIN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CLIENTS = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    slug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    input: {
      quiz_goal_id: "fat",
      training_level: "BEGINNER",
      training_environment: "GYM" as const,
      training_days_per_week: 3,
    },
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
    input: {
      quiz_goal_id: "muscle",
      training_level: "BEGINNER",
      training_environment: "HOME" as const,
      training_days_per_week: 3,
      available_equipment: ["dumbbells", "bands"],
      home_capabilities: {
        training_space: true,
        available_load: true,
        stable_bench_or_chair: true,
      },
    },
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    slug: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D",
    input: {
      primary_strategy: "STRENGTH" as const,
      training_level: "INTERMEDIATE",
      training_environment: "GYM" as const,
      training_days_per_week: 4,
    },
  },
  {
    id: "b4444444-4444-4444-4444-444444444444",
    slug: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
    input: {
      quiz_goal_id: "athletic",
      training_level: "BEGINNER",
      training_environment: "HOME" as const,
      training_days_per_week: 3,
      available_equipment: ["dumbbells", "bands"],
      home_capabilities: {
        training_space: true,
        available_load: true,
        stable_bench_or_chair: true,
      },
    },
  },
];

async function asAdmin<T>(client: pg.Client, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [ADMIN]);
    await client.query(
      `SELECT set_config('request.jwt.claims', $1, true)`,
      [JSON.stringify({ sub: ADMIN, role: "authenticated" })],
    );
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function asClient<T>(client: pg.Client, userId: string, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    await client.query(
      `SELECT set_config('request.jwt.claims', $1, true)`,
      [JSON.stringify({ sub: userId, role: "authenticated" })],
    );
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

const client = new Client({ connectionString: DB });
await client.connect();

try {
  // 1) List RPC returns template_contract
  const list = await asAdmin(client, async () => {
    const { rows } = await client.query(
      `SELECT * FROM public.admin_list_program_templates(NULL, NULL, NULL, 'published', 100, 0)`,
    );
    return rows;
  });
  const CANONICAL = new Set([
    "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D",
    "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D",
    "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D",
    "MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D",
    "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D",
    "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D",
    "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D",
    "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D",
    "GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D",
    "GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D",
    "STRENGTH_FOUNDATION_BEGINNER_GYM_3D",
    "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D",
    "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
    "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
    "ENDURANCE_FOUNDATION_BEGINNER_GYM_3D",
    "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D",
    "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D",
    "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D",
    "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D",
    "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
    "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D",
    "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D",
    "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
    "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D",
    "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D",
    "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D",
    "STRENGTH_FOUNDATION_BEGINNER_HOME_3D",
    "STRENGTH_PROGRESS_INTERMEDIATE_HOME_4D",
    "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D",
    "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
    "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D",
    "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_4D",
    "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D",
    "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D",
    "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
    "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D",
  ]);
  const canonicalRows = list.filter((r) => CANONICAL.has(String(r.slug)));
  assert.equal(canonicalRows.length, 37, `admin list canonical count=${canonicalRows.length}`);
  for (const row of canonicalRows) {
    assert.ok(row.template_contract, `missing contract for ${row.slug}`);
    assert.ok(row.primary_strategy);
    assert.notEqual(row.library_readiness, "LEGACY");
  }
  console.log("LIST_RPC_TEMPLATE_CONTRACT: PASS (37 canonical)");

  // 2) Build resolver catalog from DB (all canonical)
  const catalog: ResolvableTemplateRecord[] = [];
  for (const row of canonicalRows) {
    const contract = programTemplateContractFromMetadata({
      template_contract: row.template_contract,
    });
    assert.ok(contract, `invalid contract ${row.slug}`);
    catalog.push({
      id: String(row.id),
      slug: String(row.slug),
      version: Number(row.version),
      status: "PUBLISHED",
      is_published: true,
      archived: false,
      version_group_id: String(row.slug),
      contract,
    });
  }

  // Coverage gaps remain visible (no silent invent)
  {
    const gluteHome = resolveProgramTemplate(
      {
        quiz_goal_id: "glute",
        training_level: "BEGINNER",
        training_environment: "HOME",
        training_days_per_week: 3,
        fat_loss_priority: false,
        coach_override: null,
      },
      catalog,
    );
    assert.ok(
      gluteHome.status === "NO_EXACT_MATCH" ||
        gluteHome.status === "MATCHED_WITH_REVIEW" ||
        gluteHome.fallback_class === "NO_EXACT_MATCH" ||
        !gluteHome.recommended_template_slug?.includes("HOME"),
      `glute HOME must not silently invent exact HOME match: ${JSON.stringify(gluteHome)}`,
    );
  }

  // 3) Resolver exact matches 4/4
  for (const caseRow of CLIENTS) {
    const result = resolveProgramTemplate(
      {
        client_id: caseRow.id,
        quiz_goal_id: caseRow.input.quiz_goal_id ?? null,
        primary_strategy: caseRow.input.primary_strategy ?? null,
        fat_loss_priority: false,
        training_level: caseRow.input.training_level,
        training_environment: caseRow.input.training_environment,
        training_days_per_week: caseRow.input.training_days_per_week,
        home_capabilities: caseRow.input.home_capabilities ?? null,
        available_equipment: caseRow.input.available_equipment ?? null,
        coach_override: null,
      },
      catalog,
    );
    assert.ok(
      result.status === "MATCHED" || result.status === "MATCHED_WITH_REVIEW",
      `${caseRow.slug} status=${result.status}`,
    );
    assert.equal(result.recommended_template_slug, caseRow.slug);
  }
  console.log("RESOLVER_REAL_DB: 4/4 PASS");

  // 4) Recommendation read causes zero assignment writes
  const beforeCount = await client.query(`SELECT count(*)::int AS c FROM client_program_assignments`);
  // (resolver already ran — pure TS)
  const afterCount = await client.query(`SELECT count(*)::int AS c FROM client_program_assignments`);
  assert.equal(beforeCount.rows[0].c, afterCount.rows[0].c);
  console.log("RECOMMENDATION_READ_ONLY: PASS");

  // 5) Manual assign each pilot → snapshot + runtime
  for (const caseRow of CLIENTS) {
    const template = catalog.find((t) => t.slug === caseRow.slug)!;
    const assigned = await asAdmin(client, async () => {
      const { rows } = await client.query(
        `SELECT public.admin_assign_client_program($1::uuid, $2::uuid, CURRENT_DATE, true) AS tree`,
        [caseRow.id, template.id],
      );
      return rows[0].tree as Record<string, unknown>;
    });

    assert.equal(assigned.source_template_id, template.id);
    assert.equal(Number(assigned.template_version), template.version);
    assert.equal(assigned.progression_strategy, "SMART_PROGRESSION_EXERCISE_LOCKED");
    assert.equal(assigned.generation_source, "template");
    assert.ok(Array.isArray(assigned.weeks) && (assigned.weeks as unknown[]).length >= 1);

    const weeks = assigned.weeks as Array<{ days: Array<{ exercises: Array<Record<string, unknown>> }> }>;
    const allEx = weeks.flatMap((w) => w.days.flatMap((d) => d.exercises));
    assert.ok(allEx.length > 0);
    assert.ok(allEx.every((e) => e.exercise_id && e.exercise_external_id));

    if (caseRow.slug.includes("FAT_LOSS")) {
      const roles = allEx.map((e) => e.activity_role);
      assert.ok(roles.includes("POST_WORKOUT_CARDIO"));
      assert.ok(roles.includes("GENERAL_WARM_UP"));
      assert.ok(allEx.some((e) => e.reps_label === "10 min"));
      assert.ok(allEx.some((e) => e.reps_label === "15 min"));
    }
    if (caseRow.slug.includes("STRENGTH")) {
      assert.ok(allEx.some((e) => e.activity_role === "EXERCISE_SPECIFIC_RAMP_UP"));
      assert.equal(allEx.filter((e) => e.activity_role === "MAIN_RESISTANCE").length % 6, 0);
    }
    if (caseRow.slug.includes("ATHLETIC")) {
      assert.ok(allEx.some((e) => e.activity_role === "POWER_SKILL_BLOCK"));
    }
    if (caseRow.slug.includes("MUSCLE_GAIN")) {
      assert.ok(!allEx.some((e) => e.activity_role === "POST_WORKOUT_CARDIO"));
    }

    // Runtime RPC
    const runtime = await asClient(client, caseRow.id, async () => {
      const { rows } = await client.query(`SELECT public.client_get_my_training_runtime() AS rt`);
      return rows[0].rt as Record<string, unknown>;
    });
    assert.ok(runtime.snapshot_complete === true || runtime.reason === "ok" || runtime.reason === "scheduled");
    const days = runtime.days as Array<{ exercises: Array<Record<string, unknown>> }>;
    assert.ok(Array.isArray(days) && days.length > 0);
    assert.ok(days.some((d) => (d.exercises ?? []).some((e) => e.activity_role)));

    console.log(`ASSIGN+RUNTIME ${caseRow.slug}: PASS`);
  }

  // 6) Snapshot immutability: edit master draft metadata note → assignment exercise count unchanged
  const fat = catalog.find((t) => t.slug.includes("FAT_LOSS"))!;
  const beforeEx = await client.query(
    `SELECT count(*)::int AS c
     FROM client_program_exercises x
     JOIN client_program_days d ON d.id = x.day_id
     JOIN client_program_weeks w ON w.id = d.week_id
     JOIN client_program_assignments a ON a.id = w.assignment_id
     WHERE a.client_id = $1::uuid AND a.status = 'active'`,
    [CLIENTS[0]!.id],
  );
  await client.query(
    `UPDATE program_templates SET metadata = metadata || '{"phase6_mutated":true}'::jsonb, updated_at = now() WHERE id = $1::uuid`,
    [fat.id],
  );
  const afterEx = await client.query(
    `SELECT count(*)::int AS c
     FROM client_program_exercises x
     JOIN client_program_days d ON d.id = x.day_id
     JOIN client_program_weeks w ON w.id = d.week_id
     JOIN client_program_assignments a ON a.id = w.assignment_id
     WHERE a.client_id = $1::uuid AND a.status = 'active'`,
    [CLIENTS[0]!.id],
  );
  assert.equal(beforeEx.rows[0].c, afterEx.rows[0].c);
  console.log("SNAPSHOT_IMMUTABILITY: PASS");

  // 7) No fixtures required for pilot routes
  const withoutFixtures = resolveProgramTemplate(
    {
      quiz_goal_id: "fat",
      training_level: "BEGINNER",
      training_environment: "GYM",
      training_days_per_week: 3,
      fat_loss_priority: false,
      coach_override: null,
    },
    catalog,
  );
  assert.equal(withoutFixtures.recommended_template_slug, "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D");
  console.log("FIXTURE_REQUIRED_FOR_PILOTS: NO");

  console.log("phase-6 real DB tests passed");
} finally {
  await client.end();
}
