import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ATTENTION_SIGNAL_CONTRACTS, CLIENT_APP_PREFIX, isClientAppPath } from "./admin-architecture";
import { ADMIN_AUDIT_PAGE_SIZE, clampAdminAuditLimit } from "./admin-audit-api";
import { ADMIN_CLIENT_MIN_QUERY, ADMIN_CLIENT_PAGE_SIZE, clampAdminClientLimit } from "./admin-clients-api";
import { COACH_NOTE_MAX_LENGTH, isValidCoachNoteBody } from "./admin-notes-api";
import { isValidPaymentRejectReason } from "../admin-payments-api";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(clampAdminClientLimit(100) === ADMIN_CLIENT_PAGE_SIZE, "client list never exceeds 25");
assert(clampAdminClientLimit(0) === 1, "client list lower bound");
assert(clampAdminClientLimit(Number.NaN) === ADMIN_CLIENT_PAGE_SIZE, "client list NaN fallback");
assert(ADMIN_CLIENT_MIN_QUERY >= 2, "client search is not load-all");

assert(clampAdminAuditLimit(500) === ADMIN_AUDIT_PAGE_SIZE, "audit list never exceeds 50");
assert(clampAdminAuditLimit(-3) === 1, "audit list lower bound");

assert(isValidCoachNoteBody("ok"), "note body accepts text");
assert(!isValidCoachNoteBody("   "), "note body rejects blank");
assert(!isValidCoachNoteBody("x".repeat(COACH_NOTE_MAX_LENGTH + 1)), "note body rejects overflow");
assert(isValidPaymentRejectReason("سبب واضح"), "reject reason accepts 3+ chars");
assert(!isValidPaymentRejectReason("لا"), "reject reason rejects short text");
assert(!isValidPaymentRejectReason(undefined), "reject reason required");

assert(ATTENTION_SIGNAL_CONTRACTS.some((item) => item.id === "open_support" && item.status === "LIVE"), "support list contract exists");
assert(
  ATTENTION_SIGNAL_CONTRACTS.some((item) => item.id === "low_adherence" && item.status === "DOMAIN_RULE_REQUIRED"),
  "adherence is not invented",
);
assert(
  ATTENTION_SIGNAL_CONTRACTS.some((item) => item.id === "nutrition_issue" && item.status === "DOMAIN_RULE_REQUIRED"),
  "diet quality is not invented",
);
assert(
  ATTENTION_SIGNAL_CONTRACTS.some((item) => item.id === "no_active_nutrition" && item.status === "LIVE"),
  "missing nutrition plan is an objective live signal",
);
assert(!isClientAppPath("/admin/clients"), "admin clients is not the member app");
assert(isClientAppPath(`${CLIENT_APP_PREFIX}/nutrition`), "member nutrition stays on /app");

const root = process.cwd();
const browserClient = readFileSync(join(root, "src/integrations/supabase/client.ts"), "utf8");
assert(!browserClient.includes("SERVICE_ROLE"), "browser supabase client has no service_role");
assert(browserClient.includes("VITE_SUPABASE_PUBLISHABLE_KEY"), "browser uses publishable key");

const memberAppFiles = ["src/routes/app.tsx", "src/routes/app/index.tsx"];
for (const file of memberAppFiles) {
  try {
    const source = readFileSync(join(root, file), "utf8");
    assert(!source.includes("admin_list_clients"), `${file} must not call admin client list`);
    assert(!source.includes("admin_list_client_notes"), `${file} must not call coach notes`);
    assert(!source.includes("admin_list_audit_events"), `${file} must not read admin audit`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

const notesRoute = readFileSync(join(root, "src/routes/admin/clients/$clientId.tsx"), "utf8");
assert(notesRoute.includes("listAdminClientNotes"), "client 360 notes tab is connected");
assert(notesRoute.includes("fetchAdminClientOverview"), "client 360 uses overview contract");
assert(!notesRoute.includes("fetchCoachingInbox"), "client 360 does not load the full inbox");

const migration = readFileSync(
  join(root, "supabase/migrations/20260820210000_admin_command_center_data_contracts.sql"),
  "utf8",
);
assert(migration.includes("prevent_self_admin_escalation"), "privilege escalation trigger exists");
assert(migration.includes("coach_client_notes"), "coach notes table exists");
assert(!/CREATE TABLE[\s\S]*admin_clients/.test(migration), "no parallel admin_clients table");
assert(!/CREATE TABLE[\s\S]*admin_exercises/.test(migration), "no parallel admin_exercises table");
assert(!/CREATE TABLE[\s\S]*admin_meals/.test(migration), "no parallel admin_meals table");
assert(migration.includes("client_program_assignments"), "assignment snapshot exists");
assert(migration.includes("assignment_immutable"), "frozen assignment versions");
assert(migration.includes("_require_admin"), "admin RPCs gate on role");
assert(migration.includes("REVOKE ALL ON public.coach_client_notes FROM anon, authenticated"), "notes DML revoked");
assert(migration.includes("coach_client_notes_admin_select"), "notes select is admin-only");
assert(migration.includes("REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon"), "anon cannot write roles");
assert(migration.includes("reason_required"), "payment reject requires reason");
assert(migration.includes("invalid_transition"), "support status transitions are constrained");
assert(migration.includes("LEAST(GREATEST(COALESCE(p_limit, 25), 1), 25)") || migration.includes("LEAST(GREATEST"), "RPC pagination is clamped");

const phase5 = readFileSync(
  join(root, "supabase/migrations/20260820230000_admin_library_management.sql"),
  "utf8",
);
assert(phase5.includes("_require_admin"), "phase 5 RPCs reuse admin gate");
assert(!/CREATE TABLE[\s\S]*admin_exercises/.test(phase5), "phase 5 has no parallel exercise table");
assert(phase5.includes("client_list_hidden_library_keys"), "client overlay exclusions exist");

console.log("admin-data-contracts tests passed");
