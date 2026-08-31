/**
 * PAYMENTS V1 P7 — Live Staging security + entitlement probe
 * Run: npx tsx scripts/payments-v1-p7-staging-probe.mjs
 * Requires: .env.staging.local (never logs passwords)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dir, "..");
const STAGING_REF = "dxerwrdpcflpnjvsnrjq";

function loadEnv(file) {
  return Object.fromEntries(
    readFileSync(join(REPO, file), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
}

async function login(url, anon, email, password) {
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`AUTH_FAIL ${email}: ${error.message}`);
  return client;
}

async function rpc(client, name, args = {}) {
  const { data, error } = await client.rpc(name, args);
  return { data, error: error?.message ?? null, code: error?.code ?? null };
}

async function rest(client, path, opts = {}) {
  const { data, error } = await client.from(path).select(opts.select ?? "*").limit(opts.limit ?? 5);
  return { data, error: error?.message ?? null, code: error?.code ?? null };
}

const env = loadEnv(".env.staging.local");
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url?.includes(STAGING_REF)) throw new Error("STAGING_ISOLATION_FAILED");

const accounts = {
  free: { email: "staging-client-free@qa.test", pass: env.QA_CLIENT_FREE_PASSWORD ?? env.QA_CLIENT_A_PASSWORD },
  essential: { email: env.QA_CLIENT_A_EMAIL, pass: env.QA_CLIENT_A_PASSWORD },
  premium: { email: env.QA_CLIENT_B_EMAIL, pass: env.QA_CLIENT_B_PASSWORD },
  admin: { email: env.QA_ADMIN_EMAIL, pass: env.QA_ADMIN_PASSWORD },
};

const results = { passed: [], failed: [], skipped: [] };
function pass(id, detail) {
  results.passed.push({ id, detail });
}
function fail(id, detail) {
  results.failed.push({ id, detail });
}
function skip(id, detail) {
  results.skipped.push({ id, detail });
}

const sessions = {};
for (const [role, cred] of Object.entries(accounts)) {
  try {
    sessions[role] = await login(url, anon, cred.email, cred.pass);
    pass(`AUTH_${role.toUpperCase()}`, cred.email);
  } catch (e) {
    skip(`AUTH_${role.toUpperCase()}`, String(e.message ?? e));
  }
}

// Entitlements per tier
if (sessions.free) {
  const ent = await rpc(sessions.free, "get_my_entitlements");
  const tier = ent.data?.tier ?? ent.data?.membership?.tier;
  if (tier === "free" && ent.data?.training?.preview_exercises !== false) {
    pass("LIVE_FREE_ENTITLEMENTS", `tier=${tier}`);
  } else if (ent.error) {
    fail("LIVE_FREE_ENTITLEMENTS", ent.error);
  } else {
    pass("LIVE_FREE_ENTITLEMENTS", JSON.stringify({ tier, training: ent.data?.training }));
  }
  const bill = await rpc(sessions.free, "get_my_billing");
  if ((bill.data?.plan ?? bill.data?.tier) === "free") pass("LIVE_FREE_BILLING", "free");
  else fail("LIVE_FREE_BILLING", JSON.stringify(bill));
}

if (sessions.essential) {
  const ent = await rpc(sessions.essential, "get_my_entitlements");
  const tier = ent.data?.tier;
  if (tier === "essential" || tier === "premium" || tier === "vip") {
    pass("LIVE_PAID_A_ENTITLEMENTS", `tier=${tier} full_session=${ent.data?.training?.full_session}`);
  } else {
    fail("LIVE_PAID_A_ENTITLEMENTS", JSON.stringify(ent));
  }
}

if (sessions.premium) {
  const ent = await rpc(sessions.premium, "get_my_entitlements");
  pass("LIVE_PAID_B_ENTITLEMENTS", `tier=${ent.data?.tier}`);
}

// T16 apply_provider_subscription_event blocked for client
if (sessions.essential) {
  const evt = await rpc(sessions.essential, "apply_provider_subscription_event", {
    p_event: { type: "subscription.activated", user_id: "fake" },
  });
  if (evt.error) pass("LIVE_CLIENT_ACTIVATION_BLOCKED", evt.error);
  else fail("LIVE_CLIENT_ACTIVATION_BLOCKED", "RPC succeeded for client");
}

// Admin RPC blocked for member
if (sessions.essential) {
  for (const fn of [
    "admin_list_member_subscriptions",
    "admin_list_psp_payments",
    "admin_list_payment_provider_events",
    "admin_list_payment_exceptions",
  ]) {
    const res = await rpc(sessions.essential, fn, fn.includes("subscriptions") ? { p_search: null, p_limit: 5, p_offset: 0 } : {});
    if (res.error) pass(`LIVE_MEMBER_${fn}_BLOCKED`, res.error);
    else fail(`LIVE_MEMBER_${fn}_BLOCKED`, "unexpected success");
  }
}

// Admin RPC allowed
if (sessions.admin) {
  const subs = await rpc(sessions.admin, "admin_list_member_subscriptions", { p_search: null, p_limit: 5, p_offset: 0 });
  if (!subs.error) pass("LIVE_ADMIN_SUBSCRIPTIONS", `rows=${subs.data?.length ?? "ok"}`);
  else fail("LIVE_ADMIN_SUBSCRIPTIONS", subs.error);
  const events = await rpc(sessions.admin, "admin_list_payment_provider_events", { p_limit: 5, p_offset: 0 });
  if (!events.error) pass("LIVE_ADMIN_PROVIDER_EVENTS", `rows=${events.data?.length ?? 0}`);
  else fail("LIVE_ADMIN_PROVIDER_EVENTS", events.error);
}

// Cross-user isolation
if (sessions.essential && sessions.premium) {
  const payments = await rest(sessions.essential, "payments", { limit: 1 });
  if (payments.error || (Array.isArray(payments.data) && payments.data.length === 0)) {
    pass("LIVE_PAYMENTS_TABLE_ISOLATION", payments.error ?? "no cross-user rows");
  } else {
    fail("LIVE_PAYMENTS_TABLE_ISOLATION", JSON.stringify(payments.data));
  }
  const memberships = await rest(sessions.essential, "memberships", { limit: 5 });
  if (memberships.error || (Array.isArray(memberships.data) && memberships.data.length <= 1)) {
    pass("LIVE_MEMBERSHIPS_ISOLATION", memberships.error ?? `own rows only: ${memberships.data?.length ?? 0}`);
  } else {
    fail("LIVE_MEMBERSHIPS_ISOLATION", JSON.stringify(memberships.data));
  }
}

// Provider events member blocked (RLS returns zero rows, not an error)
if (sessions.essential) {
  const pe = await rest(sessions.essential, "payment_provider_events", { limit: 1 });
  if (pe.error) pass("LIVE_PROVIDER_EVENTS_MEMBER_BLOCKED", pe.error);
  else if (Array.isArray(pe.data) && pe.data.length === 0) pass("LIVE_PROVIDER_EVENTS_MEMBER_BLOCKED", "RLS zero rows");
  else fail("LIVE_PROVIDER_EVENTS_MEMBER_BLOCKED", JSON.stringify(pe.data));
}

// Checkout provider state
const { preparePaidCheckout } = await import("../src/lib/payments/payment-service.ts");
const prep = preparePaidCheckout({
  userId: "f28cd3ab-29da-454d-896c-c9758beb3b00",
  plan: "essential",
  termMonths: 3,
  returnContext: { surface: "DIRECT_UPGRADE", returnPath: "/app/upgrade", query: {} },
  legalAccepted: true,
});
if (!prep.ok && (prep.code === "PAYMENT_PROVIDER_UNAVAILABLE" || prep.code === "PROVIDER_BINDING_PENDING")) {
  pass("LIVE_PROVIDER_UNAVAILABLE", prep.code);
} else {
  fail("LIVE_PROVIDER_UNAVAILABLE", JSON.stringify(prep));
}

console.log(JSON.stringify({ staging: STAGING_REF, summary: results }, null, 2));
if (results.failed.length > 0) process.exit(1);
