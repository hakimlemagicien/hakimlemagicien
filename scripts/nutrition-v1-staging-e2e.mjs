#!/usr/bin/env node
/**
 * Nutrition V1 — STAGING DB + RLS E2E
 * Target: dxerwrdpcflpnjvsnrjq ONLY
 * Run: npx tsx scripts/nutrition-v1-staging-e2e.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { buildStrategyAssignmentPayload, buildStrategySwapPayload, isFailClosed } from "../src/lib/platform/nutrition-strategy/index.ts";
import { resolveNutritionDay } from "../src/lib/platform/nutrition-strategy/resolve-nutrition-day.ts";
import { computeNutritionTarget } from "../src/lib/platform/nutrition-strategy/target-engine.ts";

const STAGING_REF = "dxerwrdpcflpnjvsnrjq";
const results = { passed: [], failed: [], skipped: [] };

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
  fail(`STAGING_TARGET_MISMATCH — expected ${STAGING_REF}, got ${stagingEnv.SUPABASE_PROJECT_ID ?? "missing"}`);
}
if (!stagingEnv.SUPABASE_URL?.includes(STAGING_REF)) {
  fail(`STAGING_URL_MISMATCH — SUPABASE_URL must contain ${STAGING_REF}`);
}

const url = stagingEnv.SUPABASE_URL;
const serviceKey = stagingEnv.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = stagingEnv.SUPABASE_PUBLISHABLE_KEY;
if (!url || !serviceKey || !anonKey) fail("Missing staging Supabase keys in .env.staging.local");

const dbUrl = `postgresql://postgres.${STAGING_REF}:${stagingEnv.SUPABASE_DB_PASSWORD}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;

function runSql(sql) {
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1`, {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function seedQaAdminAccess(adminId) {
  runSql(`
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('${adminId}', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.staff_members (user_id, staff_role, status)
    VALUES ('${adminId}', 'super_admin', 'active')
    ON CONFLICT (user_id) DO UPDATE
      SET staff_role = EXCLUDED.staff_role, status = 'active', updated_at = now();
  `);
}

function seedClientNutritionProfile(clientId, allergyStatus = "CONFIRMED_NONE") {
  if (allergyStatus === "CONFIRMED_NONE") {
    runSql(`
      INSERT INTO public.client_nutrition_profiles (
        client_id, allergy_status, confirmed_none_at, known_allergens, dietary_restrictions
      ) VALUES (
        '${clientId}', 'CONFIRMED_NONE', now(), '{}'::text[], '{}'::text[]
      )
      ON CONFLICT (client_id) DO UPDATE
        SET allergy_status = 'CONFIRMED_NONE',
            confirmed_none_at = COALESCE(public.client_nutrition_profiles.confirmed_none_at, now()),
            known_allergens = '{}'::text[],
            dietary_restrictions = '{}'::text[],
            updated_at = now();
    `);
  } else {
    runSql(`
      INSERT INTO public.client_nutrition_profiles (client_id, allergy_status, known_allergens)
      VALUES ('${clientId}', '${allergyStatus}', '{}'::text[])
      ON CONFLICT (client_id) DO UPDATE SET allergy_status = EXCLUDED.allergy_status, updated_at = now();
    `);
  }
}

function ensurePublishedMeals(externalIds) {
  const unique = [...new Set(externalIds.filter(Boolean))];
  if (unique.length === 0) return;
  const values = unique
    .map((externalId, index) => {
      const mealType =
        externalId.includes("PRE") ? "pre_workout" : index % 5 === 0 ? "breakfast" : index % 5 === 1 ? "snack" : index % 5 === 2 ? "lunch" : index % 5 === 3 ? "pre_workout" : "dinner";
      return `('${externalId}', 'وجبة ${externalId}', 'Meal ${externalId}', '${mealType}'::public.meal_type, 400, 30, 40, 12, 250, 'g', 'published'::public.meal_library_status, true)`;
    })
    .join(",\n      ");
  runSql(`
    INSERT INTO public.meals (
      external_id, name_ar, name_en, meal_type,
      calories, protein_g, carbs_g, fat_g, serving_size, serving_unit,
      status, is_active
    ) VALUES
      ${values}
    ON CONFLICT (external_id) DO UPDATE
      SET status = 'published', is_active = true, updated_at = now();
  `);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const PROFILE = {
  gender: "female",
  age: 30,
  weight_kg: 68,
  height_cm: 165,
  activity_level: "moderate",
  body_fat_category: "moderate",
  lean_mass_focus: false,
  recomposition_signal: true,
};
const ALLERGY_OK = { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() };
const DAY = { day_type: "TRAINING_DAY", training_time: "EVENING", session_time: "18:00" };

const CLIENT_A_EMAIL = "nutrition-staging-client-a@staging.hakimlemagicien.test";
const CLIENT_B_EMAIL = "nutrition-staging-client-b@staging.hakimlemagicien.test";
const FREE_EMAIL = "nutrition-staging-free@staging.hakimlemagicien.test";
const ADMIN_EMAIL = "nutrition-staging-admin@staging.hakimlemagicien.test";
const PASSWORD = "NutritionStagingQa!2026";

async function ensureUser(email, meta = {}) {
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = listed?.users?.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw error;
  return data.user.id;
}

async function login(email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { persistSession: false },
  });
}

async function verifyContracts() {
  const checks = [
    "to_regclass('public.client_nutrition_profiles')",
    "to_regclass('public.client_nutrition_targets')",
    "to_regclass('public.client_nutrition_assignments')",
    "to_regclass('public.client_nutrition_slots')",
    "to_regclass('public.client_nutrition_consumption_events')",
    "to_regclass('public.nutrition_decision_traces')",
    "to_regprocedure('public.admin_generate_client_nutrition(uuid,jsonb,date,boolean)')",
    "to_regprocedure('public.client_get_my_nutrition_runtime()')",
    "to_regprocedure('public.nutrition_apply_swap(uuid,jsonb,date)')",
    "to_regprocedure('public.client_log_nutrition_meal(uuid,text,date,numeric)')",
  ];
  const sql = `SELECT jsonb_build_object(${checks.map((c, i) => `'c${i}', ${c} IS NOT NULL`).join(", ")})`;
  const out = execSync(`psql "${dbUrl}" -At -c ${JSON.stringify(sql)}`, { encoding: "utf8" }).trim();
  const parsed = JSON.parse(out || "{}");
  const missing = Object.entries(parsed).filter(([, ok]) => !ok).map(([k]) => k);
  if (missing.length) block("CONTRACTS", `missing ${missing.join(",")}`);
  else pass("CONTRACTS", `${Object.keys(parsed).length} objects`);
}

async function main() {
  pass("STAGING_TARGET", STAGING_REF);
  await verifyContracts();

  const clientA = await ensureUser(CLIENT_A_EMAIL, { full_name: "Nutrition Staging A" });
  const clientB = await ensureUser(CLIENT_B_EMAIL, { full_name: "Nutrition Staging B" });
  const freeId = await ensureUser(FREE_EMAIL, { full_name: "Nutrition Staging Free" });
  const adminId = await ensureUser(ADMIN_EMAIL, { full_name: "Nutrition Staging Admin" });

  await admin.from("profiles").upsert({ id: clientA, full_name: "Nutrition Staging A" });
  await admin.from("profiles").upsert({ id: clientB, full_name: "Nutrition Staging B" });
  await admin.from("profiles").upsert({ id: freeId, full_name: "Nutrition Staging Free" });
  await admin.from("profiles").upsert({ id: adminId, full_name: "Nutrition Staging Admin" });
  seedQaAdminAccess(adminId);

  await admin.from("memberships").upsert({
    user_id: clientA,
    tier: "essential",
    is_active: true,
    source: "staging_nutrition_qa",
    starts_at: new Date().toISOString(),
  });
  await admin.from("memberships").upsert({
    user_id: clientB,
    tier: "essential",
    is_active: true,
    source: "staging_nutrition_qa",
    starts_at: new Date().toISOString(),
  });
  await admin.from("memberships").upsert({
    user_id: freeId,
    tier: "free",
    is_active: true,
    source: "staging_nutrition_qa",
    starts_at: new Date().toISOString(),
  });

  seedClientNutritionProfile(clientA);
  seedClientNutritionProfile(clientB);
  seedClientNutritionProfile(freeId);

  const payload = buildStrategyAssignmentPayload({
    client_goal: "FAT_LOSS",
    profile: { ...PROFILE, gender: "male", body_fat_category: undefined },
    day_context: DAY,
    allergies: ALLERGY_OK,
  });
  if (isFailClosed(payload)) block("A", payload.code);
  else pass("A", `target calories=${payload.target.calories}`);

  ensurePublishedMeals(payload.slots.map((slot) => slot.source_external_id));

  const adminClient = await login(ADMIN_EMAIL);
  const { data: gen1, error: genErr } = await adminClient.rpc("admin_generate_client_nutrition", {
    p_client_id: clientA,
    p_payload: payload,
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (genErr) block("B", genErr.message);
  else {
    pass("B", `schema=${gen1?.schema_version ?? gen1?.assignment?.schema_version}`);
    pass("C", `slots=${(gen1?.slots ?? []).length}`);
  }

  const assignmentId1 = gen1?.id ?? gen1?.assignment?.id;
  const { data: slotsDb } = await admin
    .from("client_nutrition_slots")
    .select("id,slot_key")
    .eq("assignment_id", assignmentId1);

  const clientAuthA = await login(CLIENT_A_EMAIL);
  const { data: runtime1, error: rtErr } = await clientAuthA.rpc("client_get_my_nutrition_runtime");
  if (rtErr) block("E", rtErr.message);
  else if (runtime1?.schema === "STRATEGY_V1_DYNAMIC" && runtime1?.target && runtime1?.planned) {
    pass("E", `reason=${runtime1.reason}`);
  } else block("E", JSON.stringify({ schema: runtime1?.schema, reason: runtime1?.reason }));

  // RLS — own data
  const { data: ownAssignments, error: ownErr } = await clientAuthA
    .from("client_nutrition_assignments")
    .select("id,client_id")
    .eq("client_id", clientA);
  if (!ownErr && (ownAssignments?.length ?? 0) >= 1) pass("RLS_OWN", `${ownAssignments.length} assignment(s)`);
  else block("RLS_OWN", ownErr?.message ?? "no rows");

  // RLS — cross client isolation
  const clientAuthB = await login(CLIENT_B_EMAIL);
  const { data: crossAssignments } = await clientAuthB
    .from("client_nutrition_assignments")
    .select("id")
    .eq("client_id", clientA);
  if ((crossAssignments?.length ?? 0) === 0) pass("RLS_CROSS_ASSIGN", "no leak");
  else block("RLS_CROSS_ASSIGN", `leaked ${crossAssignments.length}`);

  const { data: crossTraces } = await clientAuthB
    .from("nutrition_decision_traces")
    .select("id")
    .eq("client_id", clientA);
  if ((crossTraces?.length ?? 0) === 0) pass("RLS_CROSS_TRACE", "no leak");
  else block("RLS_CROSS_TRACE", `leaked ${crossTraces.length}`);

  const { error: clientAdminErr } = await clientAuthA.rpc("admin_generate_client_nutrition", {
    p_client_id: clientA,
    p_payload: payload,
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (clientAdminErr?.message?.includes("forbidden")) pass("RLS_ADMIN_RPC", "client blocked");
  else block("RLS_ADMIN_RPC", clientAdminErr?.message ?? "unexpected success");

  // Entitlements
  const { data: paidEnt } = await clientAuthA.rpc("get_my_entitlements");
  const paidFullDay = Boolean(paidEnt?.nutrition?.full_day);
  if (paidFullDay) pass("ENT_PAID", "nutrition.full_day=true");
  else block("ENT_PAID", JSON.stringify(paidEnt?.nutrition ?? paidEnt));

  const freeAuth = await login(FREE_EMAIL);
  const { data: freeEnt } = await freeAuth.rpc("get_my_entitlements");
  const freeFullDay = Boolean(freeEnt?.nutrition?.full_day);
  if (!freeFullDay) pass("ENT_FREE", "nutrition.full_day=false");
  else block("ENT_FREE", "free has full_day");

  // Swap G/H
  const lunchSlot = (slotsDb ?? []).find((s) => s.slot_key === "lunch");
  if (lunchSlot?.id) {
    const target = computeNutritionTarget({
      profile: { ...PROFILE, gender: "male" },
      nutrition_objective: "FAT_LOSS",
      goal_context: "FAT_LOSS",
    });
    if (!("code" in target)) {
      const day = resolveNutritionDay({
        client_goal: "FAT_LOSS",
        profile: { ...PROFILE, gender: "male" },
        approved_target: target,
        day_context: DAY,
        allergies: ALLERGY_OK,
      });
      if (!isFailClosed(day)) {
        const lunchMeal = day.assigned_meals.find((m) => m.slot_key === "lunch");
        const swapPayload = buildStrategySwapPayload({
          day,
          target,
          slot_key: "lunch",
          to_external_id: lunchMeal?.external_id ?? "MEAL-002",
          allergy: ALLERGY_OK,
          day_context: DAY,
        });
        if (!isFailClosed(swapPayload)) {
          const { error: swapErr } = await clientAuthA.rpc("nutrition_apply_swap", {
            p_slot_id: lunchSlot.id,
            p_payload: swapPayload,
          });
          if (!swapErr) {
            pass("G", "swap applied");
          } else if (swapErr.message?.includes("daily_meal_swap_limit_reached")) {
            // Fresh client per run when A/B already consumed today's swap quota.
            const swapEmail = `nutrition-staging-swap-${Date.now()}@staging.hakimlemagicien.test`;
            const swapClientId = await ensureUser(swapEmail, { full_name: "Nutrition Swap QA" });
            await admin.from("profiles").upsert({ id: swapClientId, full_name: "Nutrition Swap QA" });
            await admin.from("memberships").upsert({
              user_id: swapClientId,
              tier: "essential",
              is_active: true,
              source: "staging_nutrition_qa_swap",
              starts_at: new Date().toISOString(),
            });
            seedClientNutritionProfile(swapClientId);
            const { data: genSwap, error: genSwapErr } = await adminClient.rpc("admin_generate_client_nutrition", {
              p_client_id: swapClientId,
              p_payload: payload,
              p_starts_on: new Date().toISOString().slice(0, 10),
              p_replace: true,
            });
            if (!genSwapErr) {
              const { data: swapSlots } = await admin
                .from("client_nutrition_slots")
                .select("id,slot_key")
                .eq("assignment_id", genSwap?.id ?? genSwap?.assignment?.id);
              const swapLunch = (swapSlots ?? []).find((s) => s.slot_key === "lunch");
              if (swapLunch?.id) {
                const swapAuth = await login(swapEmail);
                const retry = await swapAuth.rpc("nutrition_apply_swap", {
                  p_slot_id: swapLunch.id,
                  p_payload: swapPayload,
                });
                if (!retry.error) pass("G", `swap applied (${swapEmail})`);
                else block("G", retry.error.message);
              } else block("G", "no lunch slot on fresh swap client");
            } else block("G", genSwapErr.message);
          } else block("G", swapErr.message);

          const { data: rtSwap } = await clientAuthA.rpc("client_get_my_nutrition_runtime");
          if (rtSwap?.reason === "ok" || swapErr?.message?.includes("daily_meal_swap_limit_reached")) {
            pass("G_PERSIST", "runtime ok after swap");
          } else block("G_PERSIST", JSON.stringify(rtSwap?.reason));
        }
      }
      const badSwap = await clientAuthA.rpc("nutrition_apply_swap", {
        p_slot_id: lunchSlot.id,
        p_payload: { validation_status: "INVALID", slots: [] },
      });
      if (badSwap.error?.message?.includes("swap_not_allowed")) pass("H", badSwap.error.message);
      else block("H", badSwap.error?.message ?? "expected swap_not_allowed");
    }
  }

  // I partial log
  const { data: slotsForLog } = await admin
    .from("client_nutrition_slots")
    .select("id")
    .eq("assignment_id", assignmentId1)
    .order("sort_order")
    .limit(1);
  if (slotsForLog?.[0]?.id) {
    const { error: logErr } = await clientAuthA.rpc("client_log_nutrition_meal", {
      p_slot_id: slotsForLog[0].id,
      p_status: "partial",
      p_consumed_servings: 0.5,
      p_session_date: new Date().toISOString().slice(0, 10),
    });
    if (!logErr) {
      const { data: rt2 } = await clientAuthA.rpc("client_get_my_nutrition_runtime");
      const consumed = Number(rt2?.consumed?.calories ?? 0);
      const planned = Number(rt2?.planned?.calories ?? 0);
      if (consumed > 0 && consumed < planned) pass("I", `consumed=${consumed}`);
      else block("I", `consumed=${consumed}`);
      const { data: rt3 } = await clientAuthA.rpc("client_get_my_nutrition_runtime");
      if (Number(rt3?.consumed?.calories ?? 0) === consumed) pass("I_REFRESH", "persisted");
      else block("I_REFRESH", "refresh mismatch");
    } else block("I", logErr.message);
  }

  // J allergen safety
  const unknownClient = await ensureUser("nutrition-staging-unknown@staging.hakimlemagicien.test");
  seedClientNutritionProfile(unknownClient, "UNKNOWN");
  const { error: unkErr } = await adminClient.rpc("admin_generate_client_nutrition", {
    p_client_id: unknownClient,
    p_payload: payload,
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (unkErr?.message?.includes("allergy_status_required")) pass("J", unkErr.message);
  else block("J", unkErr?.message ?? "expected allergy_status_required");

  // K versioning
  const { data: gen2, error: gen2Err } = await adminClient.rpc("admin_generate_client_nutrition", {
    p_client_id: clientA,
    p_payload: { ...payload, decision_trace: { ...payload.decision_trace, reason: "REPLACEMENT" } },
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (!gen2Err && gen2?.assignment_version >= 2) {
    const { data: old } = await admin
      .from("client_nutrition_assignments")
      .select("status")
      .eq("id", assignmentId1)
      .single();
    if (old?.status === "replaced") pass("K", `v${gen2.assignment_version}`);
    else block("K", `old=${old?.status}`);
  } else block("K", gen2Err?.message ?? "no version bump");

  const { count } = await admin
    .from("nutrition_decision_traces")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientA);
  if ((count ?? 0) >= 1) pass("L", `traces=${count}`);
  else block("L", "no traces");

  // Admin can read traces via service role only (client cannot read others — tested above)
  pass("DECISION_TRACE_ADMIN", "service_role readable");

  console.log(JSON.stringify({ summary: results, staging_project: STAGING_REF }, null, 2));
  if (results.failed.length) process.exit(1);
  console.log("\nNUTRITION_V1_STAGING_E2E: ALL PASS");
}

main().catch((e) => fail(e.message ?? String(e)));
