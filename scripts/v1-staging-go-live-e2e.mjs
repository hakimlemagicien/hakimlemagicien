#!/usr/bin/env node
/**
 * MAAKFIT V1 — Staging go-live smoke (Training + gates)
 * Target: dxerwrdpcflpnjvsnrjq ONLY
 * Run: npx tsx scripts/v1-staging-go-live-e2e.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { loadAuthoredV2Metadata, toV2Contract } from "../src/lib/platform/exercise-library-v2-validator.ts";
import { buildProgramGenerationContextFromProfile } from "../src/lib/platform/strategy-matrix/build-from-profile.ts";
import {
  generateTrainingProgram,
  canActivateProgram,
} from "../src/lib/platform/program-generation/index.ts";
import { assignmentPayloadFromResult } from "../src/lib/platform/client-loop/assignment.ts";

const STAGING_REF = "dxerwrdpcflpnjvsnrjq";
const results = { passed: [], failed: [] };

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}
function pass(id, detail = "ok") {
  results.passed.push({ id, detail });
  console.log(`PASS ${id}: ${detail}`);
}
function block(id, detail) {
  results.failed.push({ id, detail });
  console.error(`FAIL ${id}: ${detail}`);
}

function loadStagingEnv() {
  const env = {};
  for (const line of readFileSync(".env.staging.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}

const stagingEnv = loadStagingEnv();
if (stagingEnv.SUPABASE_PROJECT_ID !== STAGING_REF) {
  fail(`STAGING_TARGET_MISMATCH — expected ${STAGING_REF}`);
}

const url = stagingEnv.SUPABASE_URL;
const serviceKey = stagingEnv.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = stagingEnv.SUPABASE_PUBLISHABLE_KEY;
const dbUrl = `postgresql://postgres.${STAGING_REF}:${stagingEnv.SUPABASE_DB_PASSWORD}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;

function runSql(sql) {
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1`, {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

async function ensureUser(email, password = "V1StagingGoLive!2026") {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error && !created.error.message.includes("already")) {
    throw new Error(created.error.message);
  }
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const row = list.data.users.find((u) => u.email === email);
  if (!row) throw new Error(`user not found: ${email}`);
  return row.id;
}

async function login(email, password = "V1StagingGoLive!2026") {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { persistSession: false },
  });
}

function seedTrainingProfile(userId, goal = "glutes") {
  runSql(`
    INSERT INTO public.training_profiles (user_id, goal, training_type, location_preference, answers, updated_at)
    VALUES (
      '${userId}',
      '${goal}',
      'gym',
      'gym',
      '{"training_days_per_week":3,"session_duration_minutes":55,"injuries":["none"]}'::jsonb,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      goal = EXCLUDED.goal,
      training_type = EXCLUDED.training_type,
      location_preference = EXCLUDED.location_preference,
      answers = EXCLUDED.answers,
      updated_at = now();

    INSERT INTO public.client_training_levels (user_id, training_level)
    VALUES ('${userId}', 'INTERMEDIATE')
    ON CONFLICT (user_id) DO UPDATE SET training_level = EXCLUDED.training_level, updated_at = now();
  `);
}

function seedFreeMembership(userId) {
  runSql(`
    UPDATE public.memberships SET is_active = false, updated_at = now() WHERE user_id = '${userId}' AND is_active;
    INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
    VALUES ('${userId}', 'free', true, 'v1_staging_go_live', now())
    ON CONFLICT (user_id, tier) DO UPDATE SET is_active = true, updated_at = now();
  `);
}

function seedPaidMembership(userId) {
  runSql(`
    UPDATE public.memberships SET is_active = false, updated_at = now() WHERE user_id = '${userId}' AND is_active;
    INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
    VALUES ('${userId}', 'essential', true, 'v1_staging_go_live', now())
    ON CONFLICT (user_id, tier) DO UPDATE SET is_active = true, updated_at = now();
  `);
}

function clearAssignments(userId) {
  runSql(`
    DELETE FROM public.client_program_exercises WHERE day_id IN (
      SELECT d.id FROM public.client_program_days d
      JOIN public.client_program_weeks w ON w.id = d.week_id
      JOIN public.client_program_assignments a ON a.id = w.assignment_id
      WHERE a.client_id = '${userId}'
    );
    DELETE FROM public.client_program_days WHERE week_id IN (
      SELECT w.id FROM public.client_program_weeks w
      JOIN public.client_program_assignments a ON a.id = w.assignment_id
      WHERE a.client_id = '${userId}'
    );
    DELETE FROM public.client_program_weeks WHERE assignment_id IN (
      SELECT id FROM public.client_program_assignments WHERE client_id = '${userId}'
    );
    DELETE FROM public.client_program_assignments WHERE client_id = '${userId}';
  `);
}

async function main() {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const ts = Date.now();

  // --- Matrix / Free preview (pure generator — no DB) ---
  const exercises = loadAuthoredV2Metadata().map((row) => toV2Contract(row, "placeholder"));
  const built = buildProgramGenerationContextFromProfile(
    {
      userId: "preview",
      rawGoalId: "glutes",
      assessedTrainingLevel: "INTERMEDIATE",
      trainingDaysPerWeek: 3,
      sessionDurationMinutes: 55,
      trainingEnvironment: "gym",
      injuryIds: ["none"],
    },
    { exercises },
  );
  if (!built.ok) block("FREE_PREVIEW_BUILD", built.resolution.errors?.[0]?.code ?? "build failed");
  else {
    const gen = generateTrainingProgram(built.context);
    if (gen.candidate && canActivateProgram(gen.validation, gen.status)) {
      pass("FREE_PREVIEW", `sessions=${gen.candidate.sessions.length} status=${gen.status}`);
    } else block("FREE_PREVIEW", gen.status ?? "no candidate");
  }

  // --- Free tier entitlements + runtime ---
  const freeEmail = `v1-staging-free-${ts}@staging.hakimlemagicien.test`;
  const freeId = await ensureUser(freeEmail);
  seedTrainingProfile(freeId);
  seedFreeMembership(freeId);
  clearAssignments(freeId);
  const freeClient = await login(freeEmail);
  const { data: freeEnt } = await freeClient.rpc("get_my_entitlements");
  if (freeEnt?.capabilities?.workout_program !== true) pass("FREE_ENTITLEMENT", "workout_program=false");
  else block("FREE_ENTITLEMENT", "free tier has workout_program");
  const { data: freeRt, error: freeRtErr } = await freeClient.rpc("client_get_my_training_runtime");
  if (!freeRtErr && freeRt?.reason !== "ok") pass("FREE_RUNTIME", freeRt?.reason ?? "not ok");
  else block("FREE_RUNTIME", freeRtErr?.message ?? freeRt?.reason ?? "unexpected ok");

  // --- Paid auto-assign via client RPC ---
  const paidEmail = `v1-staging-paid-${ts}@staging.hakimlemagicien.test`;
  const paidId = await ensureUser(paidEmail);
  seedTrainingProfile(paidId);
  seedPaidMembership(paidId);
  clearAssignments(paidId);
  const paidClient = await login(paidEmail);
  const { data: paidEnt } = await paidClient.rpc("get_my_entitlements");
  if (paidEnt?.capabilities?.workout_program === true) pass("PAID_ENTITLEMENT", "workout_program=true");
  else block("PAID_ENTITLEMENT", JSON.stringify(paidEnt?.capabilities));

  const paidGen = generateTrainingProgram(built.context);
  const payload = assignmentPayloadFromResult(paidGen, "برنامجك الشخصي");
  if (!payload) block("PAID_PAYLOAD", "null payload");
  else {
    const { data: assignData, error: assignErr } = await paidClient.rpc("client_assign_generated_v2_program", {
      p_starts_on: new Date().toISOString().slice(0, 10),
      p_replace: true,
      p_generation_status: paidGen.status,
      p_validation_status: paidGen.validation.status,
      p_payload: payload,
    });
    if (assignErr) block("PAID_AUTO_ASSIGN", assignErr.message);
    else pass("PAID_AUTO_ASSIGN", `assignment=${assignData?.id ?? "ok"}`);

    const { data: paidRt, error: paidRtErr } = await paidClient.rpc("client_get_my_training_runtime");
    if (!paidRtErr && paidRt?.reason === "ok" && (paidRt?.days?.length ?? 0) >= 1) {
      pass("PAID_RUNTIME", `days=${paidRt.days.length}`);
    } else block("PAID_RUNTIME", paidRtErr?.message ?? JSON.stringify(paidRt?.reason));
  }

  // --- RPC presence ---
  const rpcs = execSync(
    `psql "${dbUrl}" -t -A -c "SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('client_assign_generated_v2_program','client_get_my_training_runtime','nutrition_apply_swap') ORDER BY 1;"`,
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  if (rpcs.length === 3) pass("RPC_PRESENCE", rpcs.join(", "));
  else block("RPC_PRESENCE", rpcs.join(", ") || "missing");

  console.log(JSON.stringify({ summary: results, staging_project: STAGING_REF }, null, 2));
  if (results.failed.length) process.exit(1);
  console.log("\nV1_STAGING_GO_LIVE_E2E: ALL PASS");
}

main().catch((e) => fail(e.message ?? String(e)));
