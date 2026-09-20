import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";

const APPROVED_EMAILS = [
  "onboarding-a@example.test",
  "onboarding-b@example.test",
  "staging-client-a@qa.test",
  "tahaboukrim@gmail.com",
  "hakimlecien9977@gmail.com",
  "hakimlemagicien00@gmail.com",
  "hakimlemagicien9977@gmail.com",
  "fitmaak@gmail.com",
  "hakimuboukrimu@gmail.com",
  "hakimlemagicienbr@gmail.com",
];

const PRESERVED_ADMIN_EMAILS = [
  "hakimlemagicien@gmail.com",
  "onboarding-admin@example.test",
  "staging-admin@qa.test",
];

const REQUIRED_CONFIRMATION = "DELETE_10_APPROVED_TEST_ACCOUNTS";
const apply = process.argv.includes("--apply");
const confirmation = process.argv.find((arg) => arg.startsWith("--confirm="))?.slice(10);
if (apply && confirmation !== REQUIRED_CONFIRMATION) {
  throw new Error(`Apply requires --confirm=${REQUIRED_CONFIRMATION}`);
}

const projectRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const envText = readFileSync(join(projectRoot, ".env"), "utf8");

function envValue(name) {
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!match) throw new Error(`Missing ${name}`);
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

const baseUrl = envValue("VITE_SUPABASE_URL");
const projectRef = new URL(baseUrl).hostname.split(".")[0];
const keyMetadata = JSON.parse(
  execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ),
);
const serviceKey = keyMetadata.find(
  (entry) => entry.name === "service_role" && entry.type === "legacy",
)?.api_key;
if (!serviceKey) throw new Error("Production service-role key is unavailable");

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Accept-Profile": "public",
  "Content-Profile": "public",
};

const openApiResponse = await fetch(`${baseUrl}/rest/v1/`, { headers });
if (!openApiResponse.ok) throw new Error(`OpenAPI preflight failed (${openApiResponse.status})`);
const definitions = (await openApiResponse.json()).definitions ?? {};

async function rows(table, select = "*") {
  if (!definitions[table]) return [];
  const response = await fetch(
    `${baseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=5000`,
    { headers },
  );
  if (!response.ok) throw new Error(`Read failed for ${table} (${response.status})`);
  return response.json();
}

async function exactCount(table, column, value) {
  if (!definitions[table]?.properties?.[column]) return 0;
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set(column, `eq.${value}`);
  const response = await fetch(url, {
    method: "HEAD",
    headers: { ...headers, Prefer: "count=exact" },
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`Count failed for ${table}.${column} (${response.status})`);
  }
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

async function deleteScoped(table, column, value) {
  if (!definitions[table]?.properties?.[column]) return 0;
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.searchParams.set(column, `eq.${value}`);
  const response = await fetch(url, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=representation" },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Scoped delete failed for ${table}.${column} (${response.status}): ${detail}`);
  }
  const deleted = await response.json();
  return Array.isArray(deleted) ? deleted.length : 0;
}

async function authUser(id) {
  const response = await fetch(`${baseUrl}/auth/v1/admin/users/${id}`, { headers });
  if (!response.ok) {
    return { ok: false, status: response.status, detail: (await response.text()).slice(0, 300) };
  }
  return { ok: true, status: response.status, user: await response.json() };
}

async function deleteAuthUser(id) {
  const response = await fetch(`${baseUrl}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ should_soft_delete: false }),
  });
  if (!response.ok) {
    return { ok: false, status: response.status, detail: (await response.text()).slice(0, 500) };
  }
  return { ok: true, status: response.status };
}

const profiles = await rows("profiles", "id,email,full_name,account_status");
const roles = await rows("user_roles", "user_id,role");
const staff = await rows("staff_members", "user_id,staff_role,status");

const identities = [];
for (const profile of profiles) {
  const auth = await authUser(profile.id);
  identities.push({ profile, auth });
}

function identityEmail(identity) {
  return (identity.auth.ok ? identity.auth.user.email : identity.profile.email)?.toLowerCase() ?? null;
}

const targets = APPROVED_EMAILS.map((email) => {
  const matches = identities.filter((identity) => identityEmail(identity) === email);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one identity for ${email}; found ${matches.length}`);
  }
  const identity = matches[0];
  const userRoles = roles.filter((row) => row.user_id === identity.profile.id).map((row) => row.role);
  const staffRows = staff.filter((row) => row.user_id === identity.profile.id);
  const appRole = identity.auth.ok ? identity.auth.user.app_metadata?.role : null;
  if (userRoles.includes("admin") || userRoles.includes("owner") || staffRows.length > 0) {
    throw new Error(`Protected admin/staff identity entered delete scope: ${email}`);
  }
  if (appRole === "service_role" || identity.auth.user?.is_service_account === true) {
    throw new Error(`Protected service identity entered delete scope: ${email}`);
  }
  return {
    email,
    id: identity.profile.id,
    roles: userRoles,
    staff: staffRows,
    auth_lookup: identity.auth.ok ? "PASS" : `HTTP_${identity.auth.status}`,
  };
});

const preservedAdmins = PRESERVED_ADMIN_EMAILS.map((email) => {
  const matches = identities.filter((identity) => identityEmail(identity) === email);
  if (matches.length !== 1) throw new Error(`Preserved admin identity missing or ambiguous: ${email}`);
  const identity = matches[0];
  const userRoles = roles.filter((row) => row.user_id === identity.profile.id).map((row) => row.role);
  const staffRows = staff.filter((row) => row.user_id === identity.profile.id);
  if (!userRoles.includes("admin") || staffRows.length === 0) {
    throw new Error(`Preserved identity is not confirmed admin+staff: ${email}`);
  }
  return { email, id: identity.profile.id, roles: userRoles, staff: staffRows.length };
});

const masterTables = [
  "program_templates",
  "program_template_weeks",
  "program_template_days",
  "program_template_exercises",
  "exercises",
  "meals",
  "meal_ingredients",
  "membership_tiers",
  "product_runtime_settings",
];

async function tableCount(table) {
  if (!definitions[table]) return null;
  const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=0`, {
    method: "HEAD",
    headers: { ...headers, Prefer: "count=exact" },
  });
  if (!response.ok && response.status !== 206) throw new Error(`Table count failed: ${table}`);
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

const masterBefore = Object.fromEntries(
  await Promise.all(masterTables.map(async (table) => [table, await tableCount(table)])),
);

const deleteSpecs = [
  ["workout_set_logs", "user_id", "id"],
  ["daily_readiness_checks", "user_id", "id"],
  ["client_training_safety_signals", "user_id", "id"],
  ["adaptive_decision_logs", "user_id", "id"],
  ["workout_sessions", "user_id", "id"],
  ["client_exercise_experience", "user_id", "id"],
  ["client_goal_history", "user_id", "id"],
  ["client_training_levels", "user_id", "id"],
  ["client_nutrition_consumption_events", "user_id", "id"],
  ["client_nutrition_meal_logs", "user_id", "id"],
  ["nutrition_meal_swaps", "user_id", "id"],
  ["discover_content_likes", "user_id", "id"],
  ["discover_content_saves", "user_id", "id"],
  ["media_consents", "user_id", "id"],
  ["coaching_notifications", "user_id", "id"],
  ["coaching_messages", "sender_id", "id"],
  ["coaching_conversations", "member_id", "id"],
  ["coach_client_notes", "client_id", "id"],
  ["coach_client_notes", "author_id", "id"],
  ["renewal_reminders", "user_id", "id"],
  ["payment_provider_events", "user_id", "id"],
  ["payments", "user_id", "id"],
  ["plans", "user_id", "id"],
  ["memberships", "user_id", "id"],
  ["policy_acceptances", "user_id", "id"],
  ["support_tickets", "user_id", "id"],
  ["support_tickets", "email", "email"],
  ["leads", "user_id", "id"],
  ["leads", "email", "email"],
  ["account_deletion_requests", "user_id", "id"],
  ["client_account_deletion_requests", "client_id", "id"],
  ["training_assignment_reviews", "client_id", "id"],
  ["client_customer_journeys", "user_id", "id"],
  ["nutrition_decision_traces", "client_id", "id"],
  ["client_nutrition_assignments", "client_id", "id"],
  ["client_nutrition_targets", "client_id", "id"],
  ["client_nutrition_profiles", "client_id", "id"],
  ["client_program_assignments", "client_id", "id"],
  ["quiz_answers", "user_id", "id"],
  ["training_profiles", "user_id", "id"],
  ["onboarding_drafts", "finalized_user_id", "id"],
  ["onboarding_drafts", "email", "email"],
  ["user_roles", "user_id", "id"],
  ["profiles", "id", "id"],
];

const before = {};
for (const target of targets) {
  before[target.email] = {};
  for (const [table, column, valueKey] of deleteSpecs) {
    const value = valueKey === "email" ? target.email : target.id;
    before[target.email][`${table}.${column}`] = await exactCount(table, column, value);
  }
}

const report = {
  mode: apply ? "APPLY" : "DRY_RUN",
  project_ref: projectRef,
  approved_emails: APPROVED_EMAILS,
  targets,
  preserved_admins: preservedAdmins,
  master_before: masterBefore,
  before,
  deleted: {},
  auth_delete: {},
  after: {},
  master_after: null,
  preserved_admins_after: null,
};

if (apply) {
  for (const target of targets) {
    report.deleted[target.email] = {};
    for (const [table, column, valueKey] of deleteSpecs) {
      const value = valueKey === "email" ? target.email : target.id;
      const count = await deleteScoped(table, column, value);
      report.deleted[target.email][`${table}.${column}`] = count;
    }
    report.auth_delete[target.email] = await deleteAuthUser(target.id);
  }

  for (const target of targets) {
    report.after[target.email] = {};
    for (const [table, column, valueKey] of deleteSpecs) {
      const value = valueKey === "email" ? target.email : target.id;
      report.after[target.email][`${table}.${column}`] = await exactCount(table, column, value);
    }
    const auth = await authUser(target.id);
    report.after[target.email].auth_status = auth.status;
  }

  report.master_after = Object.fromEntries(
    await Promise.all(masterTables.map(async (table) => [table, await tableCount(table)])),
  );
  report.preserved_admins_after = [];
  for (const admin of preservedAdmins) {
    const profileCount = await exactCount("profiles", "id", admin.id);
    const roleRows = (await rows("user_roles", "user_id,role")).filter((row) => row.user_id === admin.id);
    const staffRows = (await rows("staff_members", "user_id,status")).filter((row) => row.user_id === admin.id);
    const auth = await authUser(admin.id);
    report.preserved_admins_after.push({
      email: admin.email,
      profile_count: profileCount,
      admin_role: roleRows.some((row) => row.role === "admin"),
      active_staff: staffRows.some((row) => row.status === "active"),
      auth_status: auth.status,
    });
  }
}

const reportRoot = join(projectRoot, ".launch-backups", "test-data-reset-reports");
mkdirSync(reportRoot, { recursive: true, mode: 0o700 });
chmodSync(reportRoot, 0o700);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = join(reportRoot, `${timestamp}-${apply ? "apply" : "dry-run"}.json`);
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
chmodSync(reportPath, 0o600);

console.log(JSON.stringify({
  mode: report.mode,
  targets: targets.map(({ email, id, roles, staff: staffRows, auth_lookup }) => ({
    email,
    id,
    roles,
    staff_rows: staffRows.length,
    auth_lookup,
    dependent_rows: Object.values(before[email]).reduce((sum, value) => sum + value, 0),
  })),
  preserved_admins: preservedAdmins,
  master_before: masterBefore,
  auth_delete: report.auth_delete,
  master_after: report.master_after,
  preserved_admins_after: report.preserved_admins_after,
  report_path: reportPath,
}, null, 2));
