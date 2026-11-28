#!/usr/bin/env node
/**
 * Seeds 6 STAGING-only review clients (5 paid profiles + 1 free) so the workout screens can be
 * reviewed with real strategy-assigned programs. Programs are NOT written here — the real paid
 * auto-assign runs in the app on first visit, exactly like a customer.
 *
 * Target: dxerwrdpcflpnjvsnrjq ONLY. Password: QA_REVIEW_PASSWORD in .env.staging.local
 * (generated on first run, never printed).
 * Run: node scripts/qa-staging-seed-review-clients.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const STAGING_REF = "dxerwrdpcflpnjvsnrjq";
const ENV_FILE = ".env.staging.local";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
if (env.SUPABASE_PROJECT_ID !== STAGING_REF || !String(env.SUPABASE_URL).includes(STAGING_REF)) {
  console.error(`STAGING_TARGET_MISMATCH — expected ${STAGING_REF}. Aborting.`);
  process.exit(1);
}

let password = env.QA_REVIEW_PASSWORD;
if (!password) {
  password = `Rv!${randomBytes(12).toString("base64url")}`;
  appendFileSync(ENV_FILE, `\nQA_REVIEW_PASSWORD=${password}\n`);
  console.log("Generated QA_REVIEW_PASSWORD in .env.staging.local");
}

const dbUrl = `postgresql://postgres.${STAGING_REF}:${env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;
const runSql = (sql) =>
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -q`, { input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const CLIENTS = [
  {
    key: "r1",
    label: "رجل · بناء عضلات · جيم · 4 أيام · متوسط",
    name: "أحمد",
    tier: "essential",
    level: "INTERMEDIATE",
    answers: { gender: "male", goalId: "muscle", trainingEnvironment: "gym", trainingDaysPerWeek: 4, preferredTrainingDays: ["sun", "tue", "wed", "fri"], age: 28, heightCm: 178, weightKg: 76, activityLevel: "moderate", bodyType: "average" },
  },
  {
    key: "r2",
    label: "رجل · خسارة دهون · منزل · 3 أيام · مبتدئ",
    name: "يوسف",
    tier: "essential",
    level: "BEGINNER",
    answers: { gender: "male", goalId: "fat", trainingEnvironment: "home", trainingDaysPerWeek: 3, preferredTrainingDays: ["mon", "wed", "fri"], age: 35, heightCm: 174, weightKg: 92, activityLevel: "light", bodyType: "overweight", challengeId: "belly" },
  },
  {
    key: "r3",
    label: "امرأة · شد الخصر · جيم · 3 أيام",
    name: "سارة",
    tier: "essential",
    level: "INTERMEDIATE",
    answers: { gender: "female", goalId: "waist", trainingEnvironment: "gym", trainingDaysPerWeek: 3, preferredTrainingDays: ["mon", "wed", "fri"], age: 27, heightCm: 165, weightKg: 63, activityLevel: "moderate", bodyType: "average" },
  },
  {
    key: "r4",
    label: "امرأة · تكبير الأرداف · جيم · 4 أيام",
    name: "ليلى",
    tier: "essential",
    level: "INTERMEDIATE",
    answers: { gender: "female", goalId: "glutes", trainingEnvironment: "gym", trainingDaysPerWeek: 4, preferredTrainingDays: ["sun", "tue", "thu", "fri"], age: 25, heightCm: 168, weightKg: 58, activityLevel: "high", bodyType: "slim" },
  },
  {
    key: "r5",
    label: "امرأة · خسارة وزن · منزل · 3 أيام · مبتدئة",
    name: "مريم",
    tier: "essential",
    level: "BEGINNER",
    answers: { gender: "female", goalId: "fat", trainingEnvironment: "home", trainingDaysPerWeek: 3, preferredTrainingDays: ["sun", "wed", "fri"], age: 38, heightCm: 160, weightKg: 78, activityLevel: "sedentary", bodyType: "overweight" },
  },
  {
    key: "r6",
    label: "مجاني · رجل · خسارة دهون · جيم",
    name: "كريم",
    tier: "free",
    level: "BEGINNER",
    answers: { gender: "male", goalId: "fat", trainingEnvironment: "gym", trainingDaysPerWeek: 3, preferredTrainingDays: ["mon", "wed", "fri"], age: 30, heightCm: 180, weightKg: 95, activityLevel: "light", bodyType: "overweight", challengeId: "belly" },
  },
];

const emailFor = (key) => `maakfit.review.${key}@example.com`;

async function ensureUser(admin, email) {
  const user_metadata = { password_set: true };
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata });
  if (created.data?.user) return created.data.user.id;
  if (created.error && !/already|registered|exists/i.test(created.error.message)) throw created.error;
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const row = list.data.users.find((u) => u.email === email);
  if (!row) throw new Error(`user not found: ${email}`);
  await admin.auth.admin.updateUserById(row.id, { password, user_metadata });
  return row.id;
}

async function main() {
  const switcher = [];
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  for (const client of CLIENTS) {
    const email = emailFor(client.key);
    const id = await ensureUser(admin, email);
    const answers = { ...client.answers, injuryIds: ["none"], investment: "standard", lastStep: "contact" };
    const goal = answers.goalId;
    const env_ = answers.trainingEnvironment;
    runSql(`
      UPDATE public.profiles SET full_name = ${q(client.name)}, goal = ${q(goal)},
        training_type = ${q(env_)}, location_preference = ${q(env_)},
        onboarding_completed_at = COALESCE(onboarding_completed_at, now()),
        first_login_seen_at = COALESCE(first_login_seen_at, now()), updated_at = now()
      WHERE id = '${id}';

      INSERT INTO public.training_profiles (user_id, goal, training_type, location_preference, answers, updated_at)
      VALUES ('${id}', ${q(goal)}, ${q(env_)}, ${q(env_)}, ${q(JSON.stringify(answers))}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET goal = EXCLUDED.goal, training_type = EXCLUDED.training_type,
        location_preference = EXCLUDED.location_preference, answers = EXCLUDED.answers, updated_at = now();

      INSERT INTO public.client_training_levels (user_id, training_level)
      VALUES ('${id}', ${q(client.level)})
      ON CONFLICT (user_id) DO UPDATE SET training_level = EXCLUDED.training_level, updated_at = now();

      UPDATE public.memberships SET is_active = false, updated_at = now() WHERE user_id = '${id}' AND is_active;
      INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
      VALUES ('${id}', ${q(client.tier)}, true, 'qa_review_clients', now())
      ON CONFLICT (user_id, tier) DO UPDATE SET is_active = true, updated_at = now();
    `);
    switcher.push({ key: client.key, name: client.name, email, tier: client.tier, label: client.label });
    console.log(`OK ${client.key} ${client.name} · ${client.tier} · ${goal} · ${env_}`);
  }
  // Dev-only switcher reads this (untracked .tmp/, served by Vite dev only).
  mkdirSync(".tmp", { recursive: true });
  writeFileSync(".tmp/review-clients.json", JSON.stringify({ password, clients: switcher }));
  console.log("Wrote .tmp/review-clients.json for the dev switcher");
}

main().catch((error) => {
  console.error("FAILED:", error.message ?? error);
  process.exit(1);
});
