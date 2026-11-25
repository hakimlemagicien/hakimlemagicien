/**
 * LOCAL_ONLY QA for scheduled → active lazy activation (cases A–F).
 */
import assert from "node:assert/strict";
import pg from "pg";

const { Client } = pg;
const DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const LOCAL_API = "http://127.0.0.1:54321";
const ADMIN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CLIENT = "b2222222-2222-2222-2222-222222222222";
const CLIENT_COACH = "b3333333-3333-3333-3333-333333333333";

async function asUser<T>(client: pg.Client, userId: string, fn: () => Promise<T>): Promise<T> {
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

const report: Record<string, unknown> = {};

try {
  const health = await fetch(`${LOCAL_API}/auth/v1/health`);
  assert.equal(health.status, 200);
  assert.match(DB, /127\.0\.0\.1:54322/);
  report.LOCAL_ENVIRONMENT_VERIFIED = "YES";

  const fn = await client.query(
    `SELECT to_regprocedure('public.activate_due_client_program_assignment(uuid)') AS p`,
  );
  assert.ok(fn.rows[0]?.p, "activation function missing — apply migration");

  const templates = await client.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM program_templates
     WHERE archived_at IS NULL AND is_published
       AND slug IN (
         'MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D',
         'FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D',
         'STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D'
       )
     ORDER BY slug`,
  );
  const bySlug = Object.fromEntries(templates.rows.map((r) => [r.slug, r.id]));
  assert.ok(bySlug.MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D);
  assert.ok(bySlug.FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D);

  // Clean workout sessions for test clients
  await client.query(`DELETE FROM workout_sessions WHERE user_id = ANY($1::uuid[])`, [
    [CLIENT, CLIENT_COACH],
  ]);

  // --- CASE A: before effective ---
  await asUser(client, ADMIN, async () => {
    await client.query(`SELECT public.admin_assign_client_program($1,$2,CURRENT_DATE,true)`, [
      CLIENT,
      bySlug.MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D,
    ]);
    await client.query(
      `SELECT public.admin_assign_client_program($1,$2,(CURRENT_DATE + 1)::date,true)`,
      [CLIENT, bySlug.FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D],
    );
  });

  let states = await client.query<{ status: string; slug: string }>(
    `SELECT a.status, t.slug
     FROM client_program_assignments a
     JOIN program_templates t ON t.id = a.source_template_id
     WHERE a.client_id = $1 AND a.status IN ('active','scheduled')
     ORDER BY a.status`,
    [CLIENT],
  );
  assert.equal(states.rows.length, 2);
  assert.ok(states.rows.some((r) => r.status === "active" && r.slug.includes("MUSCLE")));
  assert.ok(states.rows.some((r) => r.status === "scheduled" && r.slug.includes("FAT_LOSS")));
  report.CASE_A_BEFORE = "PASS";

  // Make scheduled due (starts_on = today) without activating yet
  await client.query(
    `UPDATE client_program_assignments SET starts_on = CURRENT_DATE
     WHERE client_id = $1 AND status = 'scheduled'`,
    [CLIENT],
  );

  const reviewsBefore = Number(
    (
      await client.query<{ c: string }>(
        `SELECT count(*)::text AS c FROM training_assignment_reviews WHERE client_id = $1`,
        [CLIENT],
      )
    ).rows[0]?.c ?? 0,
  );

  // Activate via client runtime
  const act1 = await asUser(client, CLIENT, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT],
    );
    return rows[0].r;
  });
  assert.equal(act1.activated, true);
  assert.equal(act1.status, "activated");

  states = await client.query<{ status: string; slug: string }>(
    `SELECT a.status, t.slug
     FROM client_program_assignments a
     JOIN program_templates t ON t.id = a.source_template_id
     WHERE a.client_id = $1 AND a.status IN ('active','scheduled','replaced')
     ORDER BY a.assigned_at DESC
     LIMIT 5`,
    [CLIENT],
  );
  const active = states.rows.find((r) => r.status === "active");
  assert.ok(active?.slug.includes("FAT_LOSS"));
  assert.equal(states.rows.filter((r) => r.status === "active").length, 1);
  assert.equal(states.rows.filter((r) => r.status === "scheduled").length, 0);
  assert.ok(states.rows.some((r) => r.status === "replaced" && r.slug.includes("MUSCLE")));
  report.CASE_A_AFTER = "PASS";

  const reviewsAfter = Number(
    (
      await client.query<{ c: string }>(
        `SELECT count(*)::text AS c FROM training_assignment_reviews WHERE client_id = $1`,
        [CLIENT],
      )
    ).rows[0]?.c ?? 0,
  );
  assert.equal(reviewsAfter, reviewsBefore);
  report.DUPLICATE_NOTIFICATIONS = 0;

  // --- CASE C: idempotent rerun ---
  const act2 = await asUser(client, CLIENT, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT],
    );
    return rows[0].r;
  });
  assert.equal(act2.activated, false);
  assert.equal(act2.status, "noop");
  const activeCount = Number(
    (
      await client.query<{ c: string }>(
        `SELECT count(*)::text AS c FROM client_program_assignments
         WHERE client_id = $1 AND status = 'active'`,
        [CLIENT],
      )
    ).rows[0]?.c ?? 0,
  );
  assert.equal(activeCount, 1);
  report.CASE_C_IDEMPOTENT = "PASS";
  report.DUPLICATE_ASSIGNMENTS = 0;

  // --- CASE B: defer while IN_PROGRESS ---
  await asUser(client, ADMIN, async () => {
    await client.query(`SELECT public.admin_assign_client_program($1,$2,CURRENT_DATE,true)`, [
      CLIENT,
      bySlug.MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D,
    ]);
    await client.query(
      `SELECT public.admin_assign_client_program($1,$2,(CURRENT_DATE + 1)::date,true)`,
      [CLIENT, bySlug.FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D],
    );
  });
  await client.query(
    `UPDATE client_program_assignments SET starts_on = CURRENT_DATE
     WHERE client_id = $1 AND status = 'scheduled'`,
    [CLIENT],
  );

  const activeId = (
    await client.query<{ id: string }>(
      `SELECT id FROM client_program_assignments WHERE client_id = $1 AND status = 'active'`,
      [CLIENT],
    )
  ).rows[0]?.id;
  assert.ok(activeId);

  // Minimal IN_PROGRESS session (assignment_day_id may be nullable depending on schema)
  const dayId = (
    await client.query<{ id: string }>(
      `SELECT d.id FROM client_program_days d
       JOIN client_program_weeks w ON w.id = d.week_id
       WHERE w.assignment_id = $1
       ORDER BY d.day_number LIMIT 1`,
      [activeId],
    )
  ).rows[0]?.id;

  await client.query(
    `INSERT INTO workout_sessions (user_id, assignment_id, assignment_day_id, status, session_key, session_date, started_at, last_activity_at)
     VALUES ($1, $2, $3, 'IN_PROGRESS', $4, CURRENT_DATE, now(), now())`,
    [CLIENT, activeId, dayId ?? null, `qa-activation-${Date.now()}`],
  );

  const deferred = await asUser(client, CLIENT, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT],
    );
    return rows[0].r;
  });
  assert.equal(deferred.status, "deferred_in_progress");
  assert.equal(deferred.activated, false);

  const still = await client.query<{ status: string; c: string }>(
    `SELECT status, count(*)::text AS c FROM client_program_assignments
     WHERE client_id = $1 AND status IN ('active','scheduled')
     GROUP BY status ORDER BY status`,
    [CLIENT],
  );
  assert.ok(still.rows.some((r) => r.status === "active" && r.c === "1"));
  assert.ok(still.rows.some((r) => r.status === "scheduled" && r.c === "1"));
  report.CASE_B_DEFER = "PASS";

  // Complete session → next call activates
  await client.query(
    `UPDATE workout_sessions SET status = 'COMPLETED', completed_at = now()
     WHERE user_id = $1 AND status = 'IN_PROGRESS'`,
    [CLIENT],
  );
  const afterWorkout = await asUser(client, CLIENT, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT],
    );
    return rows[0].r;
  });
  assert.equal(afterWorkout.activated, true);
  report.CASE_B_NEXT_SESSION = "PASS";

  // --- CASE D: coach override ---
  await asUser(client, ADMIN, async () => {
    await client.query(`SELECT public.admin_assign_client_program($1,$2,CURRENT_DATE,true)`, [
      CLIENT_COACH,
      bySlug.STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D,
    ]);
  });
  await client.query(
    `UPDATE client_program_assignments SET progression_strategy = 'COACH_MANAGED'
     WHERE client_id = $1 AND status = 'active'`,
    [CLIENT_COACH],
  );
  const sched = await asUser(client, ADMIN, async () => {
    const { rows } = await client.query<{ tree: { id: string } }>(
      `SELECT public.admin_assign_client_program($1,$2,(CURRENT_DATE + 1)::date,true) AS tree`,
      [CLIENT_COACH, bySlug.FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D],
    );
    return rows[0].tree;
  });
  await client.query(
    `UPDATE client_program_assignments SET starts_on = CURRENT_DATE WHERE id = $1`,
    [sched.id],
  );
  // Mark as AUTO/RECONCILE review
  await client.query(
    `INSERT INTO training_assignment_reviews (
       client_id, client_kind, decision_state, assignment_id, assignment_source,
       idempotency_key, reason_code
     ) VALUES ($1,'EXISTING','AUTO_UPDATED',$2,'RECONCILE',$3,'qa_coach_protect')
     ON CONFLICT (client_id, idempotency_key) DO NOTHING`,
    [CLIENT_COACH, sched.id, `qa-coach-${sched.id}`],
  );

  const skipped = await asUser(client, CLIENT_COACH, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT_COACH],
    );
    return rows[0].r;
  });
  assert.equal(skipped.status, "skipped_coach_override");
  const coachActive = await client.query<{ progression_strategy: string; status: string }>(
    `SELECT progression_strategy, status FROM client_program_assignments
     WHERE client_id = $1 AND status = 'active'`,
    [CLIENT_COACH],
  );
  assert.equal(coachActive.rows[0]?.progression_strategy, "COACH_MANAGED");
  report.CASE_D_COACH_OVERRIDE = "PASS";

  // --- CASE E: manual admin schedule (no AUTO review) activates ---
  await client.query(`DELETE FROM workout_sessions WHERE user_id = $1`, [CLIENT_COACH]);
  // Cancel the protected scheduled
  await client.query(
    `UPDATE client_program_assignments SET status = 'cancelled', ended_at = now()
     WHERE client_id = $1 AND status = 'scheduled'`,
    [CLIENT_COACH],
  );
  const manualSched = await asUser(client, ADMIN, async () => {
    const { rows } = await client.query<{ tree: { id: string } }>(
      `SELECT public.admin_assign_client_program($1,$2,(CURRENT_DATE + 1)::date,true) AS tree`,
      [CLIENT_COACH, bySlug.FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D],
    );
    return rows[0].tree;
  });
  await client.query(
    `UPDATE client_program_assignments SET starts_on = CURRENT_DATE WHERE id = $1`,
    [manualSched.id],
  );
  // Ensure active still COACH_MANAGED but scheduled has no AUTO review → allow (admin intent)
  const manualAct = await asUser(client, ADMIN, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT_COACH],
    );
    return rows[0].r;
  });
  assert.equal(manualAct.activated, true);
  report.CASE_E_ADMIN_MANUAL = "PASS";

  // --- CASE F: immediate assign still works ---
  const imm = await asUser(client, ADMIN, async () => {
    const { rows } = await client.query<{ tree: { id: string; status: string } }>(
      `SELECT public.admin_assign_client_program($1,$2,CURRENT_DATE,true) AS tree`,
      [CLIENT, bySlug.MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D],
    );
    return rows[0].tree;
  });
  assert.equal(imm.status, "active");
  const noopImm = await asUser(client, CLIENT, async () => {
    const { rows } = await client.query<{ r: Record<string, unknown> }>(
      `SELECT public.activate_due_client_program_assignment($1) AS r`,
      [CLIENT],
    );
    return rows[0].r;
  });
  assert.equal(noopImm.status, "noop");
  report.CASE_F_IMMEDIATE = "PASS";

  report.STATUS = "PASS";
  report.SCHEDULED_ASSIGNMENT_AUTO_ACTIVATION = "YES";
  report.MANUAL_ACTIVATION_REQUIRED = "NO";
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(JSON.stringify({ STATUS: "BLOCKED", error: String(error), ...report }, null, 2));
  process.exitCode = 1;
} finally {
  await client.end();
}
