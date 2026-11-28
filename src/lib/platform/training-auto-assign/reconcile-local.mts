/**
 * LOCAL_ONLY — idempotent reconciliation of active clients vs Template Resolver.
 * Usage: npx tsx src/lib/platform/training-auto-assign/reconcile-local.mts
 */
import assert from "node:assert/strict";
import pg from "pg";
import {
  decideTrainingAssignment,
  buildTrainingAssignIdempotencyKey,
  fingerprintClientContext,
} from "@/lib/platform/training-auto-assign/types";
import { recommendTemplateForClient } from "@/lib/admin/admin-template-ui";
import { programTemplateContractFromMetadata } from "@/lib/admin/admin-program-builder";
import type { ResolvableTemplateRecord } from "@/lib/platform/training-templates";
import { mapClientTrainingLocation } from "@/lib/admin/admin-program-ops";
import {
  templateEnvironmentFromLocation,
  templateLevelFromProgramLevel,
} from "@/lib/platform/training-templates";

const { Client } = pg;
const DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const LOCAL_API = "http://127.0.0.1:54321";
const SEED_ADMIN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

type Report = {
  scanned: number;
  NO_CHANGE_REQUIRED: number;
  AUTO_UPDATED: number;
  REVIEW_REQUIRED: number;
  COACH_OVERRIDE_ACTIVE: number;
  BLOCKED_NO_EXACT_MATCH: number;
  AUTO_ASSIGNED: number;
  assign_failures: number;
  review_rows_after_pass1: number;
  review_rows_after_pass2: number;
  idempotent_second_pass: boolean;
  duplicates_created: number;
};

const report: Report = {
  scanned: 0,
  NO_CHANGE_REQUIRED: 0,
  AUTO_UPDATED: 0,
  REVIEW_REQUIRED: 0,
  COACH_OVERRIDE_ACTIVE: 0,
  BLOCKED_NO_EXACT_MATCH: 0,
  AUTO_ASSIGNED: 0,
  assign_failures: 0,
  review_rows_after_pass1: 0,
  review_rows_after_pass2: 0,
  idempotent_second_pass: false,
  duplicates_created: 0,
};

async function verifyLocal(client: pg.Client) {
  const health = await fetch(`${LOCAL_API}/auth/v1/health`);
  assert.equal(health.status, 200, "local API not healthy");
  assert.match(DB, /127\.0\.0\.1:54322/);
  const db = await client.query<{ db: string }>(`SELECT current_database() AS db`);
  assert.equal(db.rows[0]?.db, "postgres");
  const table = await client.query(
    `SELECT to_regclass('public.training_assignment_reviews') AS t`,
  );
  assert.ok(table.rows[0]?.t, "training_assignment_reviews missing — apply migration first");
  console.log("LOCAL_ENVIRONMENT_VERIFIED=YES");
}

async function upsertReview(
  client: pg.Client,
  payload: {
    clientId: string;
    decisionState: string;
    idempotencyKey: string;
    body: Record<string, unknown>;
  },
) {
  const { rows } = await client.query<{ id: string; inserted: boolean }>(
    `INSERT INTO training_assignment_reviews (
       client_id, client_kind, decision_state, quiz_goal, mapped_training_goal,
       training_level, training_environment, days_per_week, equipment_summary,
       previous_template_id, previous_template_slug, previous_assignment_id,
       recommended_template_id, recommended_template_slug,
       assigned_template_id, assigned_template_slug, assignment_id,
       assignment_source, reason_code, reason_summary, resolver_trace, client_context,
       idempotency_key, is_reviewed
     ) VALUES (
       $1,'EXISTING',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
       'RECONCILE',$17,$18,$19::jsonb,$20::jsonb,$21,
       CASE WHEN $2 = 'NO_CHANGE_REQUIRED' THEN true ELSE false END
     )
     ON CONFLICT (client_id, idempotency_key) DO UPDATE SET
       updated_at = training_assignment_reviews.updated_at
     RETURNING id, (xmax = 0) AS inserted`,
    [
      payload.clientId,
      payload.decisionState,
      payload.body.quiz_goal ?? null,
      payload.body.mapped_training_goal ?? null,
      payload.body.training_level ?? null,
      payload.body.training_environment ?? null,
      payload.body.days_per_week ?? null,
      payload.body.equipment_summary ?? null,
      payload.body.previous_template_id ?? null,
      payload.body.previous_template_slug ?? null,
      payload.body.previous_assignment_id ?? null,
      payload.body.recommended_template_id ?? null,
      payload.body.recommended_template_slug ?? null,
      payload.body.assigned_template_id ?? null,
      payload.body.assigned_template_slug ?? null,
      payload.body.assignment_id ?? null,
      payload.body.reason_code ?? null,
      payload.body.reason_summary ?? null,
      JSON.stringify(payload.body.resolver_trace ?? {}),
      JSON.stringify(payload.body.client_context ?? {}),
      payload.idempotencyKey,
    ],
  );
  return rows[0];
}

const client = new Client({ connectionString: DB });
await client.connect();

try {
  await verifyLocal(client);

  const templates = (
    await client.query<{
      id: string;
      slug: string;
      version: number;
      is_published: boolean;
      archived_at: string | null;
      metadata: Record<string, unknown> | null;
    }>(
      `SELECT id, slug, version, is_published, archived_at, metadata
       FROM program_templates
       WHERE archived_at IS NULL AND is_published = true`,
    )
  ).rows;

  const catalog: ResolvableTemplateRecord[] = [];
  for (const row of templates) {
    const contract = programTemplateContractFromMetadata(row.metadata ?? {});
    if (!contract) continue;
    catalog.push({
      id: row.id,
      slug: row.slug,
      version: Number(row.version),
      status: "PUBLISHED",
      is_published: true,
      archived: false,
      version_group_id: row.slug,
      contract,
    });
  }
  assert.ok(catalog.length > 0, "no published contract templates");

  const clients = (
    await client.query<{
      client_id: string;
      assignment_id: string;
      source_template_id: string | null;
      progression_strategy: string;
      template_slug: string | null;
      goal: string | null;
      training_type: string | null;
      location_preference: string | null;
      answers: Record<string, unknown> | null;
      training_level: string | null;
    }>(
      `SELECT
         a.client_id,
         a.id AS assignment_id,
         a.source_template_id,
         a.progression_strategy,
         t.slug AS template_slug,
         tp.goal,
         tp.training_type,
         tp.location_preference,
         tp.answers,
         ctl.training_level
       FROM client_program_assignments a
       LEFT JOIN program_templates t ON t.id = a.source_template_id
       LEFT JOIN training_profiles tp ON tp.user_id = a.client_id
       LEFT JOIN client_training_levels ctl ON ctl.user_id = a.client_id
       WHERE a.status = 'active'`,
    )
  ).rows;

  report.scanned = clients.length;

  await client.query(
    `INSERT INTO public.user_roles (user_id, role)
     VALUES ($1::uuid, 'admin')
     ON CONFLICT DO NOTHING`,
    [SEED_ADMIN],
  );

  async function reconcileOne(
    row: (typeof clients)[0],
    pass: 1 | 2,
  ): Promise<string> {
    const answers = row.answers ?? {};
    const location = mapClientTrainingLocation(row.training_type ?? row.location_preference);
    const env =
      location === "BOTH"
        ? "BOTH"
        : templateEnvironmentFromLocation(location as "HOME" | "GYM") ?? String(location);
    const level =
      row.training_level && row.training_level !== "UNASSESSED"
        ? templateLevelFromProgramLevel(row.training_level) ?? row.training_level
        : null;
    const days =
      typeof answers.trainingDaysPerWeek === "number"
        ? Number(answers.trainingDaysPerWeek)
        : typeof answers.training_days_per_week === "number"
          ? Number(answers.training_days_per_week)
          : null;
    const equipment = Array.isArray(answers.availableEquipment)
      ? (answers.availableEquipment as string[])
      : null;

    const resolver = recommendTemplateForClient(
      {
        clientId: row.client_id,
        goal: row.goal,
        trainingType:
          env === "HOME" ? "home" : env === "GYM" ? "gym" : "both",
        level,
        daysPerWeek: days,
        fatLossPriority: Boolean(answers.fat_loss_priority ?? answers.fatLossPriority),
        availableEquipment: equipment,
      },
      catalog,
    );

    const decision = decideTrainingAssignment({
      clientKind: "EXISTING",
      resolver,
      activeAssignment: {
        id: row.assignment_id,
        source_template_id: row.source_template_id,
        status: "active",
        progression_strategy: row.progression_strategy,
      },
      coachOverrideProtected: row.progression_strategy === "COACH_MANAGED",
    });

    const fp = fingerprintClientContext({
      quizGoal: row.goal,
      level,
      environment: env,
      days,
      equipment,
    });
    const key = buildTrainingAssignIdempotencyKey({
      clientId: row.client_id,
      decisionState: decision.decision_state,
      recommendedTemplateId: decision.recommended_template_id,
      activeAssignmentId: row.assignment_id,
      contextFingerprint: fp,
    });

    let assignedTemplateId: string | null = null;
    let assignedTemplateSlug: string | null = null;
    let newAssignmentId: string | null = null;

    // Pass 1 only: create deferred assignment for AUTO_UPDATED (tomorrow = in-progress session safe boundary)
    if (pass === 1 && decision.should_assign && decision.recommended_template_id) {
      const startsOn = new Date();
      startsOn.setDate(startsOn.getDate() + 1);
      const starts = startsOn.toISOString().slice(0, 10);

      try {
        await client.query("BEGIN");
        await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [SEED_ADMIN]);
        await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
          JSON.stringify({ sub: SEED_ADMIN, role: "authenticated" }),
        ]);
        const { rows: assigned } = await client.query<{ id: string }>(
          `SELECT (public.admin_assign_client_program($1::uuid,$2::uuid,$3::date,true)->>'id') AS id`,
          [row.client_id, decision.recommended_template_id, starts],
        );
        await client.query("COMMIT");
        newAssignmentId = assigned[0]?.id ?? null;
        assignedTemplateId = decision.recommended_template_id;
        assignedTemplateSlug = decision.recommended_template_slug;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        report.assign_failures += 1;
        console.warn("assign failed", row.client_id, String(error));
      }
    }

    const up = await upsertReview(client, {
      clientId: row.client_id,
      decisionState: decision.decision_state,
      idempotencyKey: key,
      body: {
        quiz_goal: row.goal,
        mapped_training_goal: resolver.primary_strategy,
        training_level: level,
        training_environment: env,
        days_per_week: days,
        equipment_summary: (equipment ?? []).join(", ") || null,
        previous_template_id: row.source_template_id,
        previous_template_slug: row.template_slug,
        previous_assignment_id: row.assignment_id,
        recommended_template_id: decision.recommended_template_id,
        recommended_template_slug: decision.recommended_template_slug,
        assigned_template_id: assignedTemplateId,
        assigned_template_slug: assignedTemplateSlug,
        assignment_id: newAssignmentId ?? row.assignment_id,
        reason_code: decision.reason_code,
        reason_summary: decision.reason_summary,
        resolver_trace: {
          status: resolver.status,
          fallback_class: resolver.fallback_class,
          compatibility_status: resolver.compatibility_status,
        },
        client_context: { goal: row.goal, level, env, days },
      },
    });

    if (pass === 1) {
      const k = decision.decision_state as keyof Report;
      if (typeof report[k] === "number") {
        (report[k] as number) += 1;
      }
    } else if (up?.inserted) {
      report.duplicates_created += 1;
    }

    return decision.decision_state;
  }

  for (const row of clients) {
    await reconcileOne(row, 1);
  }

  report.review_rows_after_pass1 = Number(
    (
      await client.query<{ c: string }>(`SELECT count(*)::text AS c FROM training_assignment_reviews`)
    ).rows[0]?.c ?? 0,
  );

  for (const row of clients) {
    await reconcileOne(row, 2);
  }

  report.review_rows_after_pass2 = Number(
    (
      await client.query<{ c: string }>(`SELECT count(*)::text AS c FROM training_assignment_reviews`)
    ).rows[0]?.c ?? 0,
  );

  report.idempotent_second_pass =
    report.review_rows_after_pass1 === report.review_rows_after_pass2 &&
    report.duplicates_created === 0;

  console.log(JSON.stringify({ STATUS: "PASS", ...report }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ STATUS: "BLOCKED", error: String(error), ...report }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end();
}
