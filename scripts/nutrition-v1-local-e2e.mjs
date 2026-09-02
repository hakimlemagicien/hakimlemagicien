#!/usr/bin/env node
/**
 * Nutrition V1 — LOCAL DB E2E (A–L)
 * Prereq: Docker + `supabase start` + `supabase db reset --local`
 * Run: npx tsx scripts/nutrition-v1-local-e2e.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { buildStrategyAssignmentPayload, buildStrategySwapPayload, isFailClosed } from "../src/lib/platform/nutrition-strategy/index.ts";
import { resolveNutritionDay } from "../src/lib/platform/nutrition-strategy/resolve-nutrition-day.ts";
import { computeNutritionTarget } from "../src/lib/platform/nutrition-strategy/target-engine.ts";

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

const results = { passed: [], failed: [], skipped: [] };

function runLocalSql(sql) {
  const dbUrl = status.DB_URL;
  if (!dbUrl) fail("Missing DB_URL from `supabase status -o env`");
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1`, {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function seedQaAdminAccess(adminId) {
  runLocalSql(`
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('${adminId}', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.staff_members (user_id, staff_role, status)
    VALUES ('${adminId}', 'super_admin', 'active')
    ON CONFLICT (user_id) DO UPDATE
      SET staff_role = EXCLUDED.staff_role, status = 'active', updated_at = now();
  `);
}

function seedClientNutritionProfile(clientId) {
  runLocalSql(`
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
  runLocalSql(`
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

function parseSupabaseStatus() {
  try {
    const raw = execSync("supabase status -o env", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    const env = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      env[t.slice(0, i)] = t.slice(i + 1).replace(/^"|"$/g, "");
    }
    return env;
  } catch (e) {
    return null;
  }
}

const status = parseSupabaseStatus();
if (!status?.API_URL?.includes("127.0.0.1") && !status?.API_URL?.includes("localhost")) {
  fail(
    "LOCAL_SUPABASE_UNAVAILABLE — start Docker Desktop, then: supabase start && supabase db reset --local",
  );
}

const url = status.API_URL;
const serviceKey = status.SERVICE_ROLE_KEY;
const anonKey = status.ANON_KEY;
if (!url || !serviceKey || !anonKey) fail("Missing local Supabase keys from `supabase status -o env`");

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

const CLIENT_EMAIL = "nutrition-qa-client@local.test";
const ADMIN_EMAIL = "nutrition-qa-admin@local.test";
const PASSWORD = "NutritionQaLocal!2026";

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

async function main() {
  const clientId = await ensureUser(CLIENT_EMAIL, { full_name: "Nutrition QA Client" });
  const adminId = await ensureUser(ADMIN_EMAIL, { full_name: "Nutrition QA Admin" });

  await admin.from("profiles").upsert({ id: clientId, full_name: "Nutrition QA Client" });
  await admin.from("profiles").upsert({ id: adminId, full_name: "Nutrition QA Admin" });
  seedQaAdminAccess(adminId);
  await admin.from("memberships").upsert({
    user_id: clientId,
    tier: "essential",
    is_active: true,
    source: "local_qa",
    starts_at: new Date().toISOString(),
  });
  seedClientNutritionProfile(clientId);

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
    p_client_id: clientId,
    p_payload: payload,
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (genErr) block("B", genErr.message);
  else {
    pass("B", `schema=${gen1?.schema_version ?? gen1?.assignment?.schema_version}`);
    const slots = gen1?.slots ?? [];
    if (slots.length >= 4) pass("C", `slots=${slots.length}`);
    else block("C", `only ${slots.length} slots`);
  }

  const assignmentId1 = gen1?.id ?? gen1?.assignment?.id;
  const { data: slotsDb } = await admin
    .from("client_nutrition_slots")
    .select("id,slot_key,source_external_id,counts_toward_day_totals,slot_state")
    .eq("assignment_id", assignmentId1);
  if ((slotsDb?.length ?? 0) >= 4) pass("C_DB", `${slotsDb.length} rows`);

  const clientAuth = await login(CLIENT_EMAIL);
  const { data: runtime1, error: rtErr } = await clientAuth.rpc("client_get_my_nutrition_runtime");
  if (rtErr) block("E", rtErr.message);
  else if (runtime1?.schema === "STRATEGY_V1_DYNAMIC" && runtime1?.target && runtime1?.planned) {
    pass("E", `reason=${runtime1.reason} target≠planned`);
  } else block("E", JSON.stringify({ schema: runtime1?.schema, reason: runtime1?.reason }));

  // F — legacy via admin_assign path (4 slots)
  const { data: meals } = await admin.from("meals").select("id,external_id").eq("status", "published").limit(4);
  if ((meals?.length ?? 0) >= 4) {
    const legacyClient = await ensureUser("nutrition-qa-legacy@local.test");
    await admin.from("profiles").upsert({ id: legacyClient, full_name: "Legacy Client" });
    seedClientNutritionProfile(legacyClient);
    const legacyAdmin = await login(ADMIN_EMAIL);
    const { data: leg, error: legErr } = await legacyAdmin.rpc("admin_assign_client_nutrition", {
      p_client_id: legacyClient,
      p_payload: {
        name_ar: "Legacy 4",
        watch_allergens: [],
        slots: ["breakfast", "snack", "lunch", "dinner"].map((k, i) => ({
          slot_key: k,
          meal_id: meals[i].id,
          servings: 1,
        })),
      },
      p_starts_on: new Date().toISOString().slice(0, 10),
      p_replace: true,
    });
    if (!legErr) {
      const legAuth = await login("nutrition-qa-legacy@local.test");
      const { data: legRt } = await legAuth.rpc("client_get_my_nutrition_runtime");
      if (legRt?.schema === "LEGACY_4_SLOT" && (legRt?.slots?.length ?? 0) === 4) pass("F", "legacy 4 slots");
      else block("F", JSON.stringify(legRt));
    } else block("F", legErr.message);
  } else {
    results.skipped.push({ id: "F", detail: "not enough published meals" });
  }

  // G/H swap
  const lunchSlot = (slotsDb ?? []).find((s) => s.slot_key === "lunch");
  if (lunchSlot?.id && runtime1?.assignment) {
    const target = computeNutritionTarget({
      profile: { ...PROFILE, gender: "male" },
      nutrition_objective: "FAT_LOSS",
      goal_context: "FAT_LOSS",
    });
    if ("code" in target) {
      block("G", target.code);
    } else {
      const day = resolveNutritionDay({
        client_goal: "FAT_LOSS",
        profile: { ...PROFILE, gender: "male" },
        approved_target: target,
        day_context: DAY,
        allergies: ALLERGY_OK,
      });
      if (!isFailClosed(day)) {
        const lunchMeal = day.assigned_meals.find((m) => m.slot_key === "lunch");
        const toId = lunchMeal?.external_id ?? "MEAL-002";
        const swapPayload = buildStrategySwapPayload({
          day,
          target,
          slot_key: "lunch",
          to_external_id: toId,
          allergy: ALLERGY_OK,
          day_context: DAY,
        });
        if (!isFailClosed(swapPayload)) {
          const { error: swapErr } = await clientAuth.rpc("nutrition_apply_swap", {
            p_slot_id: lunchSlot.id,
            p_payload: swapPayload,
          });
          if (!swapErr) pass("G", "swap applied");
          else block("G", swapErr.message);
        } else block("G", swapPayload.code);
      }
      const badSwap = await clientAuth.rpc("nutrition_apply_swap", {
        p_slot_id: lunchSlot.id,
        p_payload: { validation_status: "INVALID", slots: [] },
      });
      if (badSwap.error?.message?.includes("swap_not_allowed")) pass("H", badSwap.error.message);
      else block("H", badSwap.error?.message ?? "expected swap_not_allowed");
    }
  }

  // I partial consumption — strategy swap replaces slot row IDs; refresh before logging.
  const { data: slotsForLog } = await admin
    .from("client_nutrition_slots")
    .select("id")
    .eq("assignment_id", assignmentId1)
    .order("sort_order")
    .limit(1);
  const slotForLog = slotsForLog?.[0] ?? (slotsDb ?? [])[0];
  if (slotForLog?.id) {
    const { error: logErr } = await clientAuth.rpc("client_log_nutrition_meal", {
      p_slot_id: slotForLog.id,
      p_status: "partial",
      p_consumed_servings: 0.5,
      p_session_date: new Date().toISOString().slice(0, 10),
    });
    if (!logErr) {
      const { data: rt2 } = await clientAuth.rpc("client_get_my_nutrition_runtime");
      const consumed = Number(rt2?.consumed?.calories ?? 0);
      const planned = Number(rt2?.planned?.calories ?? 0);
      if (consumed > 0 && consumed < planned) pass("I", `consumed=${consumed} planned=${planned}`);
      else block("I", `consumed=${consumed}`);
    } else block("I", logErr.message);
  }

  // J UNKNOWN allergy
  const unknownClient = await ensureUser("nutrition-qa-unknown@local.test");
  await admin.from("profiles").upsert({ id: unknownClient, full_name: "Unknown Allergy" });
  runLocalSql(`
    INSERT INTO public.client_nutrition_profiles (client_id, allergy_status, known_allergens)
    VALUES ('${unknownClient}', 'UNKNOWN', '{}'::text[])
    ON CONFLICT (client_id) DO UPDATE SET allergy_status = 'UNKNOWN', updated_at = now();
  `);
  const unkAdmin = await login(ADMIN_EMAIL);
  const { error: unkErr } = await unkAdmin.rpc("admin_generate_client_nutrition", {
    p_client_id: unknownClient,
    p_payload: payload,
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (unkErr?.message?.includes("allergy_status_required")) pass("J", unkErr.message);
  else block("J", unkErr?.message ?? "expected allergy_status_required");

  // K versioning
  const { data: gen2, error: gen2Err } = await adminClient.rpc("admin_generate_client_nutrition", {
    p_client_id: clientId,
    p_payload: { ...payload, decision_trace: { ...payload.decision_trace, reason: "REPLACEMENT" } },
    p_starts_on: new Date().toISOString().slice(0, 10),
    p_replace: true,
  });
  if (!gen2Err && gen2?.assignment_version >= 2) {
    const { data: old } = await admin
      .from("client_nutrition_assignments")
      .select("id,status,assignment_version")
      .eq("id", assignmentId1)
      .single();
    if (old?.status === "replaced") pass("K", `v${gen2.assignment_version} replaced old`);
    else block("K", `old status=${old?.status}`);
  } else block("K", gen2Err?.message ?? "no version bump");

  // L decision trace
  const { count } = await admin
    .from("nutrition_decision_traces")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);
  if ((count ?? 0) >= 1) pass("L", `traces=${count}`);
  else block("L", "no traces");

  console.log(JSON.stringify({ summary: results }, null, 2));
  if (results.failed.length) process.exit(1);
  console.log("\nNUTRITION_V1_LOCAL_E2E: ALL PASS");
}

main().catch((e) => fail(e.message ?? String(e)));
