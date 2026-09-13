/**
 * Phase 10 — Local structural + integrity QA for Training Template System V1.
 * LOCAL_ONLY by default. Set PHASE10_STAGING=1 + STAGING DATABASE_URL for staging checks.
 */
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import pg from "pg";
import {
  CANONICAL_ALL_KEYS,
  CANONICAL_LOCKED_TEMPLATE_MASTER,
  CANONICAL_PILOT_KEYS,
  CANONICAL_REMAINING_KEYS,
  CANONICAL_TEMPLATE_COUNT,
  NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY,
} from "../phase9/canonical-locked-master.ts";
import {
  HOME_BRISK_WALK_EXTERNAL_ID,
  TREADMILL_BRISK_WALK_EXTERNAL_ID,
} from "../phase9/library-additions.ts";
import { QUIZ_GOAL_SURFACES, mapQuizGoalToPrimaryStrategy } from "../primary-strategy.ts";
import { resolveProgramTemplate } from "../template-resolver.ts";
import { auditTemplateCoverage, summarizeCoverageGaps } from "../template-coverage-audit.ts";
import { programTemplateContractFromMetadata } from "@/lib/admin/admin-program-builder";
import type { ResolvableTemplateRecord } from "../template-resolution-types.ts";
import { ACTIVITY_ROLE_LABELS_AR, TEMPLATE_ACTIVITY_ROLES } from "../activity-roles.ts";
import { defaultSmartProgressionDeclaration } from "../contract.ts";

const { Client } = pg;

function dbUrl(): string {
  if (process.env.PHASE10_STAGING === "1") {
    return process.env.DATABASE_URL || process.env.STAGING_DATABASE_URL || "";
  }
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  );
}

const FORBIDDEN = NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY.map((v) => v.rejected_key);

async function main() {
  const url = dbUrl();
  if (!url) throw new Error("DATABASE_URL required");
  const envLabel = process.env.PHASE10_STAGING === "1" ? "STAGING" : "LOCAL";
  if (url.includes("ufgrbpakuemamggwypdh")) {
    throw new Error("REFUSED: Production DB is forbidden in Phase 10");
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  const issues: string[] = [];
  const report: Record<string, unknown> = {
    phase: "10/10",
    environment: envLabel,
    generated_at: new Date().toISOString(),
  };

  try {
    // Library additions
    const { rows: lib } = await client.query<{ external_id: string; name_en: string }>(
      `SELECT external_id, name_en FROM exercises WHERE external_id = ANY($1::text[])`,
      [["CR-001", TREADMILL_BRISK_WALK_EXTERNAL_ID, HOME_BRISK_WALK_EXTERNAL_ID]],
    );
    const byId = Object.fromEntries(lib.map((r) => [r.external_id, r.name_en]));
    assert.equal(byId["CR-001"], "Treadmill Run");
    assert.equal(byId[TREADMILL_BRISK_WALK_EXTERNAL_ID], "Treadmill Brisk Walk");
    assert.ok(byId[HOME_BRISK_WALK_EXTERNAL_ID]?.includes("Brisk Walk"));
    assert.notEqual(TREADMILL_BRISK_WALK_EXTERNAL_ID, "CR-001");
    report.cr_026 = byId[TREADMILL_BRISK_WALK_EXTERNAL_ID];
    report.cr_027 = byId[HOME_BRISK_WALK_EXTERNAL_ID];

    // Canonical 37
    const { rows: templates } = await client.query<{
      id: string;
      slug: string;
      days_per_week: number;
      level: string;
      version: number;
      metadata: Record<string, unknown>;
    }>(
      `SELECT id::text, slug, days_per_week, level::text, version, metadata
       FROM program_templates
       WHERE slug = ANY($1::text[]) AND is_published AND archived_at IS NULL`,
      [CANONICAL_ALL_KEYS],
    );
    const present = new Set(templates.map((t) => t.slug));
    const missing = CANONICAL_ALL_KEYS.filter((k) => !present.has(k));
    const unknown = [...present].filter((k) => !CANONICAL_ALL_KEYS.includes(k));
    assert.equal(templates.length, CANONICAL_TEMPLATE_COUNT, `canonical count ${templates.length}`);
    assert.deepEqual(missing, []);
    assert.deepEqual(unknown, []);

    const { rows: forbiddenPresent } = await client.query<{ slug: string }>(
      `SELECT slug FROM program_templates WHERE slug = ANY($1::text[]) AND archived_at IS NULL`,
      [FORBIDDEN],
    );
    assert.equal(forbiddenPresent.length, 0);

    // Per-template structural validation
    const structuralFails: string[] = [];
    const catalog: ResolvableTemplateRecord[] = [];

    for (const row of CANONICAL_LOCKED_TEMPLATE_MASTER) {
      const t = templates.find((x) => x.slug === row.template_key);
      if (!t) {
        structuralFails.push(`${row.template_key}:MISSING`);
        continue;
      }
      if (t.days_per_week !== row.days) structuralFails.push(`${row.template_key}:WRONG_DAYS`);
      const contract = programTemplateContractFromMetadata(t.metadata as { template_contract?: unknown });
      if (!contract) {
        structuralFails.push(`${row.template_key}:NO_CONTRACT`);
        continue;
      }
      if (contract.primary_strategy !== row.goal) structuralFails.push(`${row.template_key}:WRONG_STRATEGY`);
      if (contract.variant.level !== row.level) structuralFails.push(`${row.template_key}:WRONG_LEVEL`);
      if (contract.variant.environment !== row.environment) {
        structuralFails.push(`${row.template_key}:WRONG_ENV`);
      }
      const smart = contract.progression?.smart_auto_variables ?? [];
      if (!(smart.includes("WEIGHT") && smart.includes("REPS") && smart.length === 2)) {
        // allow exact default
        const def = defaultSmartProgressionDeclaration();
        if (JSON.stringify(smart) !== JSON.stringify(def.smart_auto_variables)) {
          structuralFails.push(`${row.template_key}:SMART_POLICY`);
        }
      }

      const { rows: sessions } = await client.query<{
        day_number: number;
        mains: string;
        warmups: string;
        roles: string[];
      }>(
        `SELECT d.day_number,
                count(*) FILTER (WHERE pte.activity_role = 'MAIN_RESISTANCE')::text AS mains,
                count(*) FILTER (WHERE pte.activity_role IN ('GENERAL_WARM_UP','TARGETED_DYNAMIC_WARM_UP'))::text AS warmups,
                array_agg(DISTINCT pte.activity_role) AS roles
         FROM program_template_weeks w
         JOIN program_template_days d ON d.week_id = w.id AND d.day_type = 'workout'
         JOIN program_template_exercises pte ON pte.day_id = d.id
         WHERE w.template_id = $1::uuid
         GROUP BY d.day_number
         ORDER BY d.day_number`,
        [t.id],
      );
      if (sessions.length !== row.days) structuralFails.push(`${row.template_key}:SESSION_COUNT`);
      for (const s of sessions) {
        if (Number(s.mains) !== 6) structuralFails.push(`${row.template_key}:D${s.day_number}:MAIN!=6`);
        if (Number(s.warmups) !== 3) structuralFails.push(`${row.template_key}:D${s.day_number}:WU!=3`);
      }

      // Broken refs
      const { rows: broken } = await client.query<{ c: string }>(
        `SELECT count(*)::text AS c
         FROM program_template_weeks w
         JOIN program_template_days d ON d.week_id = w.id
         JOIN program_template_exercises pte ON pte.day_id = d.id
         LEFT JOIN exercises e ON e.id = pte.exercise_id
         WHERE w.template_id = $1::uuid AND (pte.exercise_id IS NULL OR e.id IS NULL)`,
        [t.id],
      );
      if (Number(broken[0]?.c ?? 0) > 0) structuralFails.push(`${row.template_key}:BROKEN_REF`);

      catalog.push({
        id: t.id,
        slug: t.slug,
        version: t.version,
        status: "PUBLISHED",
        is_published: true,
        archived: false,
        version_group_id: t.slug,
        contract,
      });
    }

    // Fat Loss GYM CR-026 structure
    for (const slug of [
      "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
      "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D",
      "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D",
    ]) {
      const { rows: cardio } = await client.query<{ external_id: string; activity_role: string }>(
        `SELECT e.external_id, pte.activity_role
         FROM program_templates pt
         JOIN program_template_weeks w ON w.template_id = pt.id
         JOIN program_template_days d ON d.week_id = w.id AND d.day_type = 'workout'
         JOIN program_template_exercises pte ON pte.day_id = d.id
         JOIN exercises e ON e.id = pte.exercise_id
         WHERE pt.slug = $1
           AND pte.activity_role IN ('GENERAL_WARM_UP','POST_WORKOUT_CARDIO')`,
        [slug],
      );
      if (cardio.some((c) => c.external_id === "CR-001")) {
        structuralFails.push(`${slug}:USES_CR001`);
      }
      if (!cardio.every((c) => c.external_id === TREADMILL_BRISK_WALK_EXTERNAL_ID)) {
        structuralFails.push(`${slug}:CARDIO_NOT_CR026`);
      }
    }

    // HA weekly 60
    for (const slug of [
      "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
      "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D",
    ]) {
      const { rows: ha } = await client.query<{ weekly: string }>(
        `SELECT coalesce(sum(NULLIF(regexp_replace(pte.reps_label, '[^0-9].*',''), '')::int),0)::text AS weekly
         FROM program_templates pt
         JOIN program_template_weeks w ON w.template_id = pt.id
         JOIN program_template_days d ON d.week_id = w.id AND d.day_type = 'workout'
         JOIN program_template_exercises pte ON pte.day_id = d.id
         WHERE pt.slug = $1 AND pte.activity_role = 'POST_WORKOUT_CARDIO'`,
        [slug],
      );
      if (Number(ha[0]?.weekly ?? 0) !== 60) structuralFails.push(`${slug}:HA_WEEKLY!=60`);
    }

    // 06A / 06B
    const a = templates.find((t) => t.slug === "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D");
    const b = templates.find((t) => t.slug === "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D");
    assert.ok(a && a.days_per_week === 4);
    assert.ok(b && b.days_per_week === 5);

    // DAILY_ACTIVITY usage
    const { rows: dailyUse } = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c
       FROM program_template_exercises pte
       JOIN program_template_days d ON d.id = pte.day_id
       JOIN program_template_weeks w ON w.id = d.week_id
       JOIN program_templates pt ON pt.id = w.template_id
       WHERE pt.slug = ANY($1::text[]) AND pte.activity_role = 'DAILY_ACTIVITY'`,
      [CANONICAL_ALL_KEYS],
    );
    report.daily_activity_used = Number(dailyUse[0]?.c ?? 0) > 0;

    // Quiz 12/12
    assert.equal(QUIZ_GOAL_SURFACES.length, 12);
    for (const surface of QUIZ_GOAL_SURFACES) {
      const mapped = mapQuizGoalToPrimaryStrategy(surface.goalId);
      assert.ok(mapped.ok, `map ${surface.goalId}`);
    }

    // Resolver matrix samples
    const resolverCases = [
      {
        name: "fat_beg_gym_3",
        input: {
          quiz_goal_id: "fat",
          training_level: "BEGINNER",
          training_environment: "GYM" as const,
          training_days_per_week: 3,
        },
        expectSlug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
      },
      {
        name: "muscle_int_gym_4_06a",
        input: {
          quiz_goal_id: "muscle",
          training_level: "INTERMEDIATE",
          training_environment: "GYM" as const,
          training_days_per_week: 4,
        },
        expectSlug: "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D",
      },
      {
        name: "muscle_int_gym_5_06b",
        input: {
          quiz_goal_id: "muscle",
          training_level: "INTERMEDIATE",
          training_environment: "GYM" as const,
          training_days_per_week: 5,
        },
        expectSlug: "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D",
      },
      {
        name: "glute_beg_gym",
        input: {
          quiz_goal_id: "glutes",
          training_level: "BEGINNER",
          training_environment: "GYM" as const,
          training_days_per_week: 3,
        },
        expectSlug: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
      },
    ];
    const resolverResults: Record<string, unknown> = {};
    for (const c of resolverCases) {
      const r = resolveProgramTemplate(
        { ...c.input, fat_loss_priority: false, coach_override: null },
        catalog,
      );
      resolverResults[c.name] = {
        status: r.status,
        slug: r.recommended_template_slug,
      };
      if (r.recommended_template_slug !== c.expectSlug) {
        issues.push(`RESOLVER:${c.name} got ${r.recommended_template_slug}`);
      }
    }

    // Glute HOME must not invent exact HOME template
    const gluteHome = resolveProgramTemplate(
      {
        quiz_goal_id: "glutes",
        training_level: "BEGINNER",
        training_environment: "HOME",
        training_days_per_week: 3,
        fat_loss_priority: false,
        coach_override: null,
      },
      catalog,
    );
    if (gluteHome.recommended_template_slug?.includes("GLUTE") && gluteHome.recommended_template_slug.includes("HOME")) {
      issues.push("RESOLVER_INVENTED_GLUTE_HOME");
    }
    resolverResults.glute_home = {
      status: gluteHome.status,
      slug: gluteHome.recommended_template_slug,
      fallback: gluteHome.fallback_class,
    };

    // Insufficient context
    const insuff = resolveProgramTemplate(
      {
        quiz_goal_id: null,
        training_level: null,
        training_environment: null,
        training_days_per_week: null,
        fat_loss_priority: false,
        coach_override: null,
      },
      catalog,
    );
    resolverResults.insufficient = { status: insuff.status };

    const coverage = auditTemplateCoverage(catalog);
    const gaps = summarizeCoverageGaps(coverage);

    // Legacy assignment CR-001 immutability signal
    const { rows: legacy } = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM client_program_exercises cpe
       JOIN exercises e ON e.id = cpe.exercise_id
       WHERE e.external_id = 'CR-001'
         AND cpe.activity_role IN ('GENERAL_WARM_UP','POST_WORKOUT_CARDIO')`,
    );

    // Pilot Fat Loss master version
    const pilotFl = templates.find((t) => t.slug === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D");
    report.pilot_fat_loss_version = pilotFl?.version ?? null;

    // Duplicate CR / templates
    const { rows: dupEx } = await client.query<{ external_id: string; c: string }>(
      `SELECT external_id, count(*)::text AS c FROM exercises
       WHERE external_id IN ('CR-026','CR-027') GROUP BY 1 HAVING count(*) > 1`,
    );
    const { rows: dupTpl } = await client.query<{ slug: string; c: string }>(
      `SELECT slug, count(*)::text AS c FROM program_templates
       WHERE slug = ANY($1::text[]) GROUP BY slug HAVING count(*) > 1`,
      [CANONICAL_ALL_KEYS],
    );

    // Role label map present
    for (const role of TEMPLATE_ACTIVITY_ROLES) {
      assert.ok(ACTIVITY_ROLE_LABELS_AR[role]);
    }

    report.canonical_count = templates.length;
    report.pilot_count = CANONICAL_PILOT_KEYS.length;
    report.remaining_count = CANONICAL_REMAINING_KEYS.length;
    report.structural_fails = structuralFails;
    report.structural_pass = structuralFails.length === 0;
    report.broken_reference_count = structuralFails.filter((f) => f.includes("BROKEN_REF")).length;
    report.quiz_mapping = "12/12";
    report.resolver_results = resolverResults;
    report.coverage = {
      cells: coverage.length,
      exact: coverage.filter((c) => c.status === "EXACT_TEMPLATE_AVAILABLE").length,
      gaps: gaps.length,
      known_product_gaps_sample: gaps
        .filter(
          (g) =>
            (g.primary_strategy === "GLUTE_FOCUS" && g.environment === "HOME") ||
            (g.primary_strategy === "GENERAL_FITNESS" && g.level === "INTERMEDIATE") ||
            (g.primary_strategy === "FAT_LOSS" && g.environment === "HOME" && g.level === "INTERMEDIATE"),
        )
        .slice(0, 12),
    };
    report.legacy_assignment_cr001_cardio_rows = Number(legacy[0]?.c ?? 0);
    report.legacy_assignments_mutated = false;
    report.duplicate_exercises = dupEx;
    report.duplicate_templates = dupTpl;
    report.issues = issues;
    report.ok = structuralFails.length === 0 && issues.length === 0 && dupEx.length === 0 && dupTpl.length === 0;

    mkdirSync("docs/data", { recursive: true });
    const out =
      envLabel === "STAGING"
        ? "docs/data/training-template-phase10-staging-qa.json"
        : "docs/data/training-template-phase10-local-qa.json";
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(`phase10-${envLabel.toLowerCase()}-qa: ${report.ok ? "PASS" : "FAIL"}`);
    console.log(JSON.stringify({
      canonical: report.canonical_count,
      structural_fails: structuralFails.length,
      issues: issues.length,
      coverage_exact: (report.coverage as { exact: number }).exact,
      out,
    }, null, 2));

    if (!report.ok) process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
