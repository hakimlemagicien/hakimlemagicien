/**
 * Local-only smoke: freeze preferred_media_variant on assign + runtime.
 * Does not generate media. Does not touch Staging/Production.
 */
import assert from "node:assert/strict";
import pg from "pg";
import { runtimeToWeekdayPlans, type ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { preferredMediaVariantFromAssignment } from "@/lib/platform/exercise-media-variants";
import { resolvePreferredExerciseStillThumb } from "@/lib/platform/exercise-media-variants";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";

const { Client } = pg;
/** LOCAL_ONLY — never follow shell DATABASE_URL that may point at Staging/Production. */
const DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const ADMIN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CLIENT = "b1111111-1111-1111-1111-111111111111";

async function asRole<T>(client: pg.Client, userId: string, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
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
  // Column + historical default
  const col = await client.query<{ column_default: string | null }>(
    `SELECT column_default FROM information_schema.columns
     WHERE table_schema='public' AND table_name='client_program_assignments'
       AND column_name='preferred_media_variant'`,
  );
  assert.ok(col.rows[0], "preferred_media_variant column exists");
  assert.match(String(col.rows[0].column_default), /STANDARD/);

  const glute = (
    await client.query<{ id: string; metadata: Record<string, unknown> }>(
      `SELECT id, metadata FROM program_templates
       WHERE slug = 'GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D' AND archived_at IS NULL
       LIMIT 1`,
    )
  ).rows[0];
  assert.ok(glute, "Glute Foundation template present");
  const glutePref =
    (glute.metadata as { template_contract?: { media_preference?: { preferred_media_variant?: string } } })
      ?.template_contract?.media_preference?.preferred_media_variant;
  assert.equal(glutePref, "FEMALE", "TEMPLATE_PREFERENCE_PRESENT");

  const control = (
    await client.query<{ id: string; metadata: Record<string, unknown> }>(
      `SELECT id, metadata FROM program_templates
       WHERE slug = 'FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D' AND archived_at IS NULL
       LIMIT 1`,
    )
  ).rows[0];
  assert.ok(control, "Control Fat Loss template present");
  const controlPref =
    (control.metadata as { template_contract?: { media_preference?: { preferred_media_variant?: string } } })
      ?.template_contract?.media_preference?.preferred_media_variant ?? "STANDARD";
  assert.equal(controlPref === "FEMALE" ? "FEMALE" : "STANDARD", "STANDARD");

  // Ensure published for assign
  await client.query(
    `UPDATE program_templates SET is_published = true WHERE id = ANY($1::uuid[])`,
    [[glute.id, control.id]],
  );

  const gluteAssign = await asRole(client, ADMIN, async () => {
    const { rows } = await client.query(
      `SELECT public.admin_assign_client_program($1::uuid, $2::uuid, CURRENT_DATE, true) AS tree`,
      [CLIENT, glute.id],
    );
    return rows[0].tree as Record<string, unknown>;
  });
  assert.equal(gluteAssign.preferred_media_variant, "FEMALE", "GLUTE_NEW_ASSIGNMENT_PREFERENCE");
  const gluteAssignmentId = String(gluteAssign.id);

  // Master mutation must not change frozen assignment
  await client.query(
    `UPDATE program_templates
     SET metadata = jsonb_set(
       COALESCE(metadata, '{}'::jsonb),
       '{template_contract,media_preference,preferred_media_variant}',
       '"STANDARD"'::jsonb,
       true
     )
     WHERE id = $1`,
    [glute.id],
  );
  const frozenAfterMaster = (
    await client.query<{ preferred_media_variant: string }>(
      `SELECT preferred_media_variant FROM client_program_assignments WHERE id = $1`,
      [gluteAssignmentId],
    )
  ).rows[0];
  assert.equal(frozenAfterMaster.preferred_media_variant, "FEMALE", "SNAPSHOT_IMMUTABILITY");

  // Restore master preference for cleanliness
  await client.query(
    `UPDATE program_templates
     SET metadata = jsonb_set(
       COALESCE(metadata, '{}'::jsonb),
       '{template_contract,media_preference,preferred_media_variant}',
       '"FEMALE"'::jsonb,
       true
     )
     WHERE id = $1`,
    [glute.id],
  );

  const gluteRuntime = await asRole(client, CLIENT, async () => {
    const { rows } = await client.query(`SELECT public.client_get_my_training_runtime() AS rt`);
    return rows[0].rt as Record<string, unknown>;
  });
  const assignment = gluteRuntime.assignment as Record<string, unknown>;
  assert.equal(assignment.preferred_media_variant, "FEMALE", "GLUTE_RUNTIME_PREFERENCE");

  const runtimeTyped: ClientTrainingRuntime = {
    reason: (gluteRuntime.reason as ClientTrainingRuntime["reason"]) ?? "ok",
    snapshotComplete: Boolean(gluteRuntime.snapshot_complete),
    currentWeekNumber: gluteRuntime.current_week_number == null ? null : Number(gluteRuntime.current_week_number),
    assignment: {
      id: String(assignment.id),
      status: String(assignment.status),
      name_ar: (assignment.name_ar as string | null) ?? null,
      starts_on: (assignment.starts_on as string | null) ?? null,
      template_version: Number(assignment.template_version ?? 1),
      duration_weeks: assignment.duration_weeks == null ? null : Number(assignment.duration_weeks),
      days_per_week: assignment.days_per_week == null ? null : Number(assignment.days_per_week),
      preferred_media_variant: preferredMediaVariantFromAssignment(assignment),
    },
    days: ((gluteRuntime.days as ClientTrainingRuntime["days"]) ?? []).map((day) => ({
      ...day,
      exercises: day.exercises ?? [],
    })),
  };
  const plans = runtimeToWeekdayPlans(runtimeTyped);
  const workout = Object.values(plans).find((p) => !p.isRestDay);
  assert.ok(workout, "has workout day");
  assert.equal(workout!.preferredMediaVariant, "FEMALE", "WORKOUT_PLAN_PREFERENCE");

  const still = resolvePreferredExerciseStillThumb({
    externalId: "GL-001",
    preferredVariant: workout!.preferredMediaVariant,
  });
  const standard = getExerciseStageListThumb("GL-001");
  assert.equal(still, standard, "FEMALE_MISSING_FALLBACK → STANDARD still");

  // Reassignment to control → new snapshot STANDARD; old stays FEMALE
  const controlAssign = await asRole(client, ADMIN, async () => {
    const { rows } = await client.query(
      `SELECT public.admin_assign_client_program($1::uuid, $2::uuid, CURRENT_DATE, true) AS tree`,
      [CLIENT, control.id],
    );
    return rows[0].tree as Record<string, unknown>;
  });
  assert.equal(controlAssign.preferred_media_variant, "STANDARD", "REASSIGNMENT_NEW_STANDARD");
  const oldStill = (
    await client.query<{ preferred_media_variant: string; status: string }>(
      `SELECT preferred_media_variant, status FROM client_program_assignments WHERE id = $1`,
      [gluteAssignmentId],
    )
  ).rows[0];
  assert.equal(oldStill.preferred_media_variant, "FEMALE", "old snapshot unchanged");
  assert.equal(oldStill.status, "replaced");

  const controlRuntime = await asRole(client, CLIENT, async () => {
    const { rows } = await client.query(`SELECT public.client_get_my_training_runtime() AS rt`);
    return rows[0].rt as Record<string, unknown>;
  });
  assert.equal(
    (controlRuntime.assignment as Record<string, unknown>).preferred_media_variant,
    "STANDARD",
    "CONTROL_RUNTIME_PREFERENCE",
  );

  console.log(
    JSON.stringify({
      STATUS: "PASS",
      TEMPLATE_PREFERENCE: glutePref,
      GLUTE_ASSIGNMENT: gluteAssign.preferred_media_variant,
      GLUTE_RUNTIME: assignment.preferred_media_variant,
      FALLBACK_STILL: still,
      CONTROL_ASSIGNMENT: controlAssign.preferred_media_variant,
      IMMUTABILITY: "PASS",
      MEDIA_GENERATED: 0,
    }),
  );
} finally {
  await client.end();
}
