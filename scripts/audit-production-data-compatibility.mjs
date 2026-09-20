import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");

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

if (!serviceKey) throw new Error("Production service-role audit key is unavailable");

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Accept-Profile": "public",
};

async function openApi() {
  const response = await fetch(`${baseUrl}/rest/v1/`, { headers });
  if (!response.ok) throw new Error(`OpenAPI request failed (${response.status})`);
  return response.json();
}

async function exactCount(table) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=0`, {
    method: "HEAD",
    headers: { ...headers, Prefer: "count=exact" },
  });
  if (response.status === 404) return null;
  if (!response.ok && response.status !== 206) {
    throw new Error(`Count failed for ${table} (${response.status})`);
  }
  const contentRange = response.headers.get("content-range");
  return Number(contentRange?.split("/")[1] ?? 0);
}

async function rows(table, columns) {
  const output = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const params = new URLSearchParams({ select: columns.join(",") });
    const response = await fetch(`${baseUrl}/rest/v1/${table}?${params}`, {
      headers: { ...headers, Range: `${from}-${to}` },
    });
    if (!response.ok && response.status !== 206) {
      throw new Error(`Read failed for ${table} (${response.status})`);
    }
    const page = await response.json();
    output.push(...page);
    if (page.length < pageSize) break;
  }
  return output;
}

function countNulls(items, columns) {
  return Object.fromEntries(
    columns.map((column) => [column, items.filter((row) => row[column] == null).length]),
  );
}

function grouped(items, column) {
  const result = {};
  for (const row of items) {
    const key = row[column] == null ? "NULL" : String(row[column]);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function duplicateSummary(items, key, predicate = () => true) {
  const counts = new Map();
  for (const row of items) {
    if (!predicate(row)) continue;
    const value = key(row);
    if (!value || value.includes("undefined") || value.includes("null")) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const duplicates = [...counts.values()].filter((count) => count > 1);
  return {
    groups: duplicates.length,
    rows: duplicates.reduce((sum, count) => sum + count, 0),
  };
}

function orphanCount(items, foreignColumn, parentItems, parentColumn = "id") {
  const parents = new Set(parentItems.map((row) => row[parentColumn]).filter(Boolean));
  return items.filter((row) => row[foreignColumn] && !parents.has(row[foreignColumn])).length;
}

const schema = await openApi();
const definitions = schema.definitions ?? {};
const requestedTables = [
  "profiles",
  "memberships",
  "program_templates",
  "program_template_weeks",
  "program_template_days",
  "program_template_exercises",
  "client_program_assignments",
  "client_program_weeks",
  "client_program_days",
  "client_program_exercises",
  "client_nutrition_profiles",
  "client_nutrition_assignments",
  "client_nutrition_targets",
  "client_nutrition_slots",
  "client_customer_journeys",
  "product_runtime_settings",
  "payments",
  "payment_provider_events",
  "user_roles",
  "staff_members",
  "product_prices",
  "product_promotions",
  "promo_codes",
  "promo_code_redemptions",
  "nutrition_templates",
];

const tablePresence = Object.fromEntries(
  requestedTables.map((table) => [table, Boolean(definitions[table])]),
);
const tableCounts = {};
for (const table of requestedTables) {
  tableCounts[table] = tablePresence[table] ? await exactCount(table) : null;
}

const data = {};
async function load(table, columns) {
  if (!tablePresence[table]) return [];
  const available = new Set(Object.keys(definitions[table]?.properties ?? {}));
  const selected = columns.filter((column) => available.has(column));
  data[table] = await rows(table, selected);
  return data[table];
}

const profiles = await load("profiles", ["id", "email", "goal", "account_status"]);
const memberships = await load("memberships", [
  "id", "user_id", "tier", "is_active", "source", "subscription_status", "provider",
]);
const templates = await load("program_templates", [
  "id", "slug", "goal", "level", "days_per_week", "is_published", "version", "archived_at",
]);
const templateWeeks = await load("program_template_weeks", ["id", "template_id"]);
const templateDays = await load("program_template_days", ["id", "week_id"]);
const templateExercises = await load("program_template_exercises", ["id", "day_id", "exercise_id"]);
const assignments = await load("client_program_assignments", [
  "id", "client_id", "source_template_id", "status", "goal", "level", "days_per_week", "starts_on",
]);
const assignmentWeeks = await load("client_program_weeks", ["id", "assignment_id"]);
const assignmentDays = await load("client_program_days", ["id", "week_id"]);
const assignmentExercises = await load("client_program_exercises", ["id", "day_id", "exercise_id"]);
const nutritionProfiles = await load("client_nutrition_profiles", [
  "client_id", "allergy_status", "known_allergens",
]);
const nutritionAssignments = await load("client_nutrition_assignments", [
  "id", "client_id", "status", "watch_allergens", "resolved_snapshot",
]);
const journeys = await load("client_customer_journeys", [
  "user_id", "status", "preferred_training_days", "normalized_training_days", "training_meal_window",
  "matched_template_id", "assignment_id", "failure_code", "grandfathered",
]);
const runtimeSettings = await load("product_runtime_settings", [
  "singleton", "first_app_preparation_minutes", "missing_input_window_minutes",
]);
const payments = await load("payments", [
  "id", "user_id", "membership_id", "method", "status", "provider", "tier", "billing_period_months",
  "provider_event_id",
]);
const providerEvents = await load("payment_provider_events", [
  "id", "provider", "provider_event_id", "event_type", "processing_status", "user_id",
]);
const userRoles = await load("user_roles", ["id", "user_id", "role"]);
const staff = await load("staff_members", ["user_id", "staff_role", "status"]);

const activeAssignmentStatuses = new Set(["active", "published"]);
const report = {
  audit_mode: "READ_ONLY_AGGREGATES_NO_CUSTOMER_ROWS_EMITTED",
  table_presence: tablePresence,
  exact_row_counts: tableCounts,
  null_compatibility: {
    profiles: countNulls(profiles, ["id", "email"]),
    memberships: countNulls(memberships, ["id", "user_id", "tier", "is_active"]),
    program_templates: countNulls(templates, ["id", "slug", "goal", "level", "days_per_week", "version"]),
    program_template_exercises: countNulls(templateExercises, ["id", "day_id", "exercise_id"]),
    client_program_assignments: countNulls(assignments, ["id", "client_id", "status"]),
    client_program_exercises: countNulls(assignmentExercises, ["id", "day_id", "exercise_id"]),
    client_nutrition_profiles: countNulls(nutritionProfiles, ["client_id", "allergy_status"]),
    client_nutrition_assignments: countNulls(nutritionAssignments, ["id", "client_id", "status"]),
    client_customer_journeys: countNulls(journeys, ["user_id", "status"]),
    payments: countNulls(payments, ["id", "user_id", "method", "status"]),
    payment_provider_events: countNulls(providerEvents, ["id", "provider", "provider_event_id", "event_type", "processing_status"]),
    user_roles: countNulls(userRoles, ["user_id", "role"]),
    staff_members: countNulls(staff, ["user_id", "staff_role", "status"]),
  },
  duplicate_compatibility: {
    active_memberships_by_user: duplicateSummary(memberships, (row) => row.user_id, (row) => row.is_active === true),
    active_program_assignments_by_client: duplicateSummary(
      assignments,
      (row) => row.client_id,
      (row) => activeAssignmentStatuses.has(String(row.status).toLowerCase()),
    ),
    active_nutrition_assignments_by_client: duplicateSummary(
      nutritionAssignments,
      (row) => row.client_id,
      (row) => activeAssignmentStatuses.has(String(row.status).toLowerCase()),
    ),
    provider_events: duplicateSummary(providerEvents, (row) => `${row.provider}:${row.provider_event_id}`),
    user_roles: duplicateSummary(userRoles, (row) => `${row.user_id}:${row.role}`),
    staff_members: duplicateSummary(staff, (row) => row.user_id),
    template_slug_versions: duplicateSummary(templates, (row) => `${row.slug}:${row.version}`),
  },
  foreign_key_compatibility: {
    memberships_without_profile: orphanCount(memberships, "user_id", profiles),
    program_assignments_without_profile: orphanCount(assignments, "client_id", profiles),
    program_assignments_without_template: orphanCount(assignments, "source_template_id", templates),
    template_weeks_without_template: orphanCount(templateWeeks, "template_id", templates),
    template_days_without_week: orphanCount(templateDays, "week_id", templateWeeks),
    template_exercises_without_day: orphanCount(templateExercises, "day_id", templateDays),
    assignment_weeks_without_assignment: orphanCount(assignmentWeeks, "assignment_id", assignments),
    assignment_days_without_week: orphanCount(assignmentDays, "week_id", assignmentWeeks),
    assignment_exercises_without_day: orphanCount(assignmentExercises, "day_id", assignmentDays),
    nutrition_profiles_without_profile: orphanCount(nutritionProfiles, "client_id", profiles),
    nutrition_assignments_without_profile: orphanCount(nutritionAssignments, "client_id", profiles),
    journeys_without_profile: orphanCount(journeys, "user_id", profiles),
    journey_templates_missing: orphanCount(journeys, "matched_template_id", templates),
    journey_assignments_missing: orphanCount(journeys, "assignment_id", assignments),
    payments_without_profile: orphanCount(payments, "user_id", profiles),
    payments_without_membership: orphanCount(payments, "membership_id", memberships),
    provider_events_without_profile: orphanCount(providerEvents, "user_id", profiles),
    roles_without_profile: orphanCount(userRoles, "user_id", profiles),
    staff_without_profile: orphanCount(staff, "user_id", profiles),
  },
  value_distributions: {
    membership_tier: grouped(memberships, "tier"),
    membership_subscription_status: grouped(memberships, "subscription_status"),
    membership_provider: grouped(memberships, "provider"),
    program_assignment_status: grouped(assignments, "status"),
    nutrition_assignment_status: grouped(nutritionAssignments, "status"),
    nutrition_allergy_status: grouped(nutritionProfiles, "allergy_status"),
    journey_status: grouped(journeys, "status"),
    payment_method: grouped(payments, "method"),
    payment_status: grouped(payments, "status"),
    payment_provider: grouped(payments, "provider"),
    provider_event_processing_status: grouped(providerEvents, "processing_status"),
    user_roles: grouped(userRoles, "role"),
    staff_status: grouped(staff, "status"),
  },
  check_compatibility: {
    invalid_preferred_training_days: journeys.filter(
      (row) => row.preferred_training_days != null &&
        (row.preferred_training_days < 2 || row.preferred_training_days > 6),
    ).length,
    invalid_normalized_training_days: journeys.filter(
      (row) => row.normalized_training_days != null &&
        (row.normalized_training_days < 3 || row.normalized_training_days > 6),
    ).length,
    ready_journeys_without_assignment: journeys.filter(
      (row) => row.status === "ready" && !row.assignment_id,
    ).length,
    ready_journeys_without_link_but_with_active_assignment: journeys.filter(
      (row) => row.status === "ready" && !row.assignment_id && assignments.some(
        (assignment) => assignment.client_id === row.user_id &&
          activeAssignmentStatuses.has(String(assignment.status).toLowerCase()),
      ),
    ).length,
    ready_journeys_without_any_active_assignment: journeys.filter(
      (row) => row.status === "ready" && !assignments.some(
        (assignment) => assignment.client_id === row.user_id &&
          activeAssignmentStatuses.has(String(assignment.status).toLowerCase()),
      ),
    ).length,
    ready_journeys_grandfathered: journeys.filter(
      (row) => row.status === "ready" && row.grandfathered === true,
    ).length,
    runtime_settings_rows_not_one: runtimeSettings.length === 1 ? 0 : runtimeSettings.length,
    invalid_preparation_minutes: runtimeSettings.filter(
      (row) => !Number.isFinite(row.first_app_preparation_minutes) || row.first_app_preparation_minutes < 1,
    ).length,
    invalid_completion_window_minutes: runtimeSettings.filter(
      (row) => !Number.isFinite(row.missing_input_window_minutes) || row.missing_input_window_minutes < 1,
    ).length,
  },
  migration_backfill_scope: {
    nutrition_assignments_preferences_backfill: nutritionAssignments.filter((assignment) =>
      ["draft", "scheduled", "active"].includes(String(assignment.status).toLowerCase()) &&
      nutritionProfiles.some((profile) => profile.client_id === assignment.client_id),
    ).length,
    program_template_exercises_activity_role_default_null: templateExercises.length,
    client_program_exercises_activity_role_default_null: assignmentExercises.length,
  },
};

console.log(JSON.stringify(report, null, 2));
