/**
 * Phase 7 — versioned assignment: v1/v2 coexist, reassignment preserves history, runtime current.
 * Local Supabase only. Prefer existing admin_assign / admin_clone / list RPCs.
 */
import assert from "node:assert/strict";
import pg from "pg";

const { Client } = pg;
const DB = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const ADMIN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CLIENT_A = "b2222222-2222-2222-2222-222222222222"; // Muscle HOME
const CLIENT_B = "b1111111-1111-1111-1111-111111111111"; // reuse Fat client as Client B for v2

async function asAdmin<T>(client: pg.Client, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [ADMIN]);
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: ADMIN, role: "authenticated" }),
    ]);
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
  const v1 = (
    await client.query<{ id: string; version: number; slug: string; metadata: Record<string, unknown> }>(
      `SELECT id, version, slug, metadata
       FROM program_templates
       WHERE slug = 'MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D' AND archived_at IS NULL
       LIMIT 1`,
    )
  ).rows[0];
  assert.ok(v1, "Muscle Gain HOME v1 must exist (Phase 6 pilot)");
  assert.equal(Number(v1.version), 1);

  // 1) Assign v1 → Client A
  const assignV1 = await asAdmin(client, async () => {
    const { rows } = await client.query(
      `SELECT public.admin_assign_client_program($1::uuid, $2::uuid, CURRENT_DATE, true) AS tree`,
      [CLIENT_A, v1.id],
    );
    return rows[0].tree as Record<string, unknown>;
  });
  assert.equal(assignV1.source_template_id, v1.id);
  assert.equal(Number(assignV1.template_version), 1);
  assert.equal(assignV1.status, "active");
  assert.equal(assignV1.generation_source, "template");
  assert.equal(assignV1.progression_strategy, "SMART_PROGRESSION_EXERCISE_LOCKED");
  const v1AssignmentId = String(assignV1.id);
  const v1ExerciseCount = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c
       FROM client_program_exercises e
       JOIN client_program_days d ON d.id = e.day_id
       JOIN client_program_weeks w ON w.id = d.week_id
       WHERE w.assignment_id = $1`,
      [v1AssignmentId],
    )
  ).rows[0].c;
  assert.ok(v1ExerciseCount > 0);
  console.log("TEMPLATE_V1_ASSIGNMENT: PASS");

  // 2) Create v2 via admin_clone_program_template(new_version)
  const cloned = await asAdmin(client, async () => {
    const { rows } = await client.query(
      `SELECT public.admin_clone_program_template($1::uuid, 'new_version') AS tree`,
      [v1.id],
    );
    return rows[0].tree as Record<string, unknown>;
  });
  const v2Id = String(cloned.id);
  assert.equal(Number(cloned.version), 2);
  assert.notEqual(v2Id, v1.id);

  // Publish v2 + harmless visible metadata change (admin_summary)
  await asAdmin(client, async () => {
    await client.query(
      `UPDATE program_templates
       SET is_published = true,
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{template_contract,admin_summary}',
             to_jsonb('Phase7 Muscle HOME v2 test summary'::text),
             true
           ),
           updated_at = now()
       WHERE id = $1`,
      [v2Id],
    );
  });

  const lineage = await client.query<{
    version_group_id: string | null;
    clone_mode: string | null;
    cloned_from: string | null;
  }>(
    `SELECT metadata->>'version_group_id' AS version_group_id,
            metadata->>'clone_mode' AS clone_mode,
            metadata->>'cloned_from' AS cloned_from
     FROM program_templates WHERE id = $1`,
    [v2Id],
  );
  assert.equal(lineage.rows[0].clone_mode, "new_version");
  assert.equal(lineage.rows[0].cloned_from, v1.id);
  assert.ok(lineage.rows[0].version_group_id);
  console.log("TEMPLATE_V2_CREATED: PASS");
  console.log("VERSION_LINEAGE: PASS");

  // 3) Master v2 must NOT mutate Client A v1 snapshot
  const afterV2Count = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c
       FROM client_program_exercises e
       JOIN client_program_days d ON d.id = e.day_id
       JOIN client_program_weeks w ON w.id = d.week_id
       WHERE w.assignment_id = $1`,
      [v1AssignmentId],
    )
  ).rows[0].c;
  assert.equal(afterV2Count, v1ExerciseCount);

  const stillV1 = (
    await client.query<{ template_version: number; source_template_id: string; status: string }>(
      `SELECT template_version, source_template_id::text, status
       FROM client_program_assignments WHERE id = $1`,
      [v1AssignmentId],
    )
  ).rows[0];
  assert.equal(Number(stillV1.template_version), 1);
  assert.equal(stillV1.source_template_id, v1.id);
  assert.equal(stillV1.status, "active");
  console.log("MASTER_V2_MUTATES_V1_CLIENT: NO");
  console.log("SNAPSHOT_V1_IMMUTABLE: PASS");

  // 4) Assign v2 → Client B (coexist)
  const assignV2B = await asAdmin(client, async () => {
    const { rows } = await client.query(
      `SELECT public.admin_assign_client_program($1::uuid, $2::uuid, CURRENT_DATE, true) AS tree`,
      [CLIENT_B, v2Id],
    );
    return rows[0].tree as Record<string, unknown>;
  });
  assert.equal(Number(assignV2B.template_version), 2);
  assert.equal(assignV2B.source_template_id, v2Id);
  assert.equal(assignV2B.status, "active");

  const aStill = (
    await client.query<{ template_version: number; status: string }>(
      `SELECT template_version, status FROM client_program_assignments WHERE id = $1`,
      [v1AssignmentId],
    )
  ).rows[0];
  assert.equal(Number(aStill.template_version), 1);
  assert.equal(aStill.status, "active");
  console.log("V1_V2_COEXIST: PASS");
  console.log("TEMPLATE_V2_ASSIGNMENT: PASS");

  // 5) Recommendation / preview read must not replace (count before/after pure list)
  const beforeHist = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM client_program_assignments WHERE client_id = $1`,
      [CLIENT_A],
    )
  ).rows[0].c;
  // list only
  await asAdmin(client, async () => {
    await client.query(`SELECT * FROM public.admin_list_client_assignments($1::uuid, 25, 0)`, [CLIENT_A]);
  });
  const afterHist = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM client_program_assignments WHERE client_id = $1`,
      [CLIENT_A],
    )
  ).rows[0].c;
  assert.equal(beforeHist, afterHist);
  console.log("RECOMMENDATION_READ_NO_REPLACE: PASS");

  // 6) Explicit reassignment Client A: v1 → v2
  const reassigned = await asAdmin(client, async () => {
    const { rows } = await client.query(
      `SELECT public.admin_assign_client_program($1::uuid, $2::uuid, CURRENT_DATE, true) AS tree`,
      [CLIENT_A, v2Id],
    );
    return rows[0].tree as Record<string, unknown>;
  });
  assert.equal(Number(reassigned.template_version), 2);
  assert.equal(reassigned.source_template_id, v2Id);
  assert.equal(reassigned.status, "active");
  assert.notEqual(String(reassigned.id), v1AssignmentId);

  const oldRow = (
    await client.query<{ status: string; template_version: number; ended_at: string | null }>(
      `SELECT status, template_version, ended_at::text FROM client_program_assignments WHERE id = $1`,
      [v1AssignmentId],
    )
  ).rows[0];
  assert.equal(oldRow.status, "replaced");
  assert.equal(Number(oldRow.template_version), 1);
  assert.ok(oldRow.ended_at);
  assert.equal(
    (
      await client.query<{ c: number }>(
        `SELECT count(*)::int AS c
         FROM client_program_exercises e
         JOIN client_program_days d ON d.id = e.day_id
         JOIN client_program_weeks w ON w.id = d.week_id
         WHERE w.assignment_id = $1`,
        [v1AssignmentId],
      )
    ).rows[0].c,
    v1ExerciseCount,
  );
  console.log("REASSIGNMENT_CREATES_NEW_SNAPSHOT: PASS");
  console.log("OLD_ASSIGNMENT_PRESERVED: YES");
  console.log("OLD_ASSIGNMENT_STATUS: replaced PASS");
  console.log("NEW_ASSIGNMENT_STATUS: active PASS");

  // 7) History list returns provenance fields
  const history = await asAdmin(client, async () => {
    const { rows } = await client.query(
      `SELECT * FROM public.admin_list_client_assignments($1::uuid, 25, 0)`,
      [CLIENT_A],
    );
    return rows as Array<Record<string, unknown>>;
  });
  assert.ok(history.length >= 2);
  const histOld = history.find((r) => String(r.id) === v1AssignmentId);
  const histNew = history.find((r) => String(r.id) === String(reassigned.id));
  assert.ok(histOld && histNew);
  assert.equal(histOld.status, "replaced");
  assert.equal(Number(histOld.template_version), 1);
  assert.equal(histNew.status, "active");
  assert.equal(Number(histNew.template_version), 2);
  assert.ok("generation_source" in histNew);
  assert.ok("progression_strategy" in histNew);
  console.log("ASSIGNMENT_HISTORY_LIST: PASS");

  // 8) Runtime resolves current = v2
  const runtime = await asClient(client, CLIENT_A, async () => {
    const { rows } = await client.query(`SELECT public.client_get_my_training_runtime() AS tree`);
    return rows[0].tree as Record<string, unknown>;
  });
  assert.equal(runtime.reason, "ok");
  const assignment = runtime.assignment as Record<string, unknown>;
  assert.equal(String(assignment.id), String(reassigned.id));
  assert.equal(Number(assignment.template_version), 2);
  console.log("CLIENT_RUNTIME_AFTER_REASSIGN: PASS");
  console.log("CURRENT_ASSIGNMENT_RESOLUTION: PASS");

  // 9) No auto-upgrade smoke: create another harmless master edit on v2 — Client A snapshot count frozen
  const v2AssignId = String(reassigned.id);
  const v2ExBefore = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c
       FROM client_program_exercises e
       JOIN client_program_days d ON d.id = e.day_id
       JOIN client_program_weeks w ON w.id = d.week_id
       WHERE w.assignment_id = $1`,
      [v2AssignId],
    )
  ).rows[0].c;
  await client.query(
    `UPDATE program_templates
     SET description_ar = coalesce(description_ar,'') || ' [phase7-master-edit]',
         updated_at = now()
     WHERE id = $1`,
    [v2Id],
  );
  const v2ExAfter = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c
       FROM client_program_exercises e
       JOIN client_program_days d ON d.id = e.day_id
       JOIN client_program_weeks w ON w.id = d.week_id
       WHERE w.assignment_id = $1`,
      [v2AssignId],
    )
  ).rows[0].c;
  assert.equal(v2ExAfter, v2ExBefore);
  console.log("NO_AUTO_UPGRADE: PASS");

  // 10) Template count still Pilot 4 (+ one version clone, not template 5+)
  const pilots = (
    await client.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM program_templates
       WHERE slug IN (
         'FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D',
         'MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D',
         'STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D',
         'ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D'
       )`,
    )
  ).rows[0].c;
  assert.equal(pilots, 4);
  console.log("TEMPLATES_PILOT_BASE: 4");

  console.log("phase-7 versioned assignment tests passed");
} finally {
  await client.end();
}
