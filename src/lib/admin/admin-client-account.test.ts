import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canChangeAccountLifecycle,
  emailsMatchForDeletion,
  parseAccountRpcError,
} from "./admin-client-account";
import { classifyAdminAction, hasAdminPermission, permissionsForRole } from "./admin-permissions";
import { formatAuditEventLabel } from "./admin-dashboard-present";
import type { AdminAuditEvent } from "./admin-audit-api";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const migration = readFileSync(resolve(root, "supabase/migrations/20260901180000_admin_client_account_lifecycle.sql"), "utf8");
const panel = readFileSync(resolve(root, "src/components/admin/ClientAccountManagementPanel.tsx"), "utf8");
const dialog = readFileSync(resolve(root, "src/components/admin/ClientAccountDeleteDialog.tsx"), "utf8");
const client360 = readFileSync(resolve(root, "src/routes/admin/clients/$clientId.tsx"), "utf8");
const directory = readFileSync(resolve(root, "src/routes/admin/clients/index.tsx"), "utf8");
const browserClient = readFileSync(resolve(root, "src/integrations/supabase/client.ts"), "utf8");
const matrix = readFileSync(resolve(root, "src/components/admin/MatrixImpactCard.tsx"), "utf8");
const core100 = readFileSync(resolve(root, "src/lib/platform/strategy-matrix/core-100.ts"), "utf8");
const platform = readFileSync(resolve(root, "src/routes/_platform/route.tsx"), "utf8");

assert(canChangeAccountLifecycle("active", "suspend"), "suspend from active");
assert(canChangeAccountLifecycle("suspended", "reactivate"), "reactivate");
assert(canChangeAccountLifecycle("archived", "restore"), "restore");
assert(!canChangeAccountLifecycle("deletion_pending", "suspend"), "no suspend during deletion");
assert(!canChangeAccountLifecycle("active", "restore"), "no restore from active");

assert(emailsMatchForDeletion("Hakim@example.com", "hakim@example.com"), "email match");
assert(!emailsMatchForDeletion("a@example.com", "b@example.com"), "email mismatch");
assert(!emailsMatchForDeletion("a@example.com", ""), "empty email blocks");

assert(classifyAdminAction("client_account_delete") === "SENSITIVE", "delete is sensitive");
assert(
  hasAdminPermission(
    { userId: "1", staffRole: "super_admin", permissions: permissionsForRole("super_admin") },
    "staff.manage",
  ),
  "super admin can delete",
);
assert(
  !hasAdminPermission(
    { userId: "2", staffRole: "coach", permissions: permissionsForRole("coach") },
    "staff.manage",
  ),
  "coach cannot delete",
);
assert(
  !hasAdminPermission(
    { userId: "2", staffRole: "coach", permissions: permissionsForRole("coach") },
    "clients.write",
  ),
  "coach cannot lifecycle write",
);

assert(migration.includes("_require_staff_permission('staff.manage')"), "delete server permission");
assert(migration.includes("_require_staff_permission('clients.write')"), "lifecycle server permission");
assert(migration.includes("confirmation_mismatch"), "exact confirmation");
assert(migration.includes("idempotency_key"), "idempotency");
assert(migration.includes("client_account_deletion_blockers"), "financial blockers");
assert(!migration.includes("ON DELETE CASCADE") || migration.includes("Does not CASCADE-delete"), "no broad cascade policy");
assert(migration.includes("banned_until"), "auth ban not auth delete");
assert(!migration.includes("DELETE FROM public.memberships"), "memberships retained");
assert(!migration.includes("DELETE FROM public.payments"), "payments retained");
assert(!migration.includes("DELETE FROM public.audit_events"), "audit retained");
assert(!migration.includes("DELETE FROM public.workout_set_logs"), "training retained");
assert(!migration.includes("core_100"), "core 100 untouched in lifecycle sql");

assert(panel.includes("منطقة حساسة"), "danger zone");
assert(panel.includes("إدارة الحساب"), "account management");
assert(dialog.includes("تأكيد الحذف"), "strong confirm");
assert(dialog.includes("السبب (إلزامي)"), "reason required");
assert(dialog.includes("submitting"), "double submit");
assert(client360.includes("هذا الحساب موقوف مؤقتًا"), "suspended banner");
assert(client360.includes("هذا العميل مؤرشف"), "archived banner");
assert(client360.includes("طلب حذف الحساب قيد المعالجة"), "deletion banner");
assert(directory.includes("مؤرشف"), "archive filter");
assert(platform.includes("fetchMyAccountLifecycle"), "client app gate");

assert(!browserClient.includes("SERVICE_ROLE"), "no service role in browser");
assert(!matrix.includes("متابعة رغم"), "matrix no bypass");
assert(core100.includes("MAAKFIT_V1_CORE_100"), "core 100 intact");

const event = (type: string): AdminAuditEvent => ({
  id: "1",
  actorId: "a",
  subjectUserId: "b",
  eventType: type,
  metadata: {},
  createdAt: new Date().toISOString(),
});
assert(formatAuditEventLabel(event("client_account_suspended")) === "تم إيقاف حساب عميل", "suspend audit label");
assert(formatAuditEventLabel(event("client_account_deletion_executed")).includes("حذف"), "delete audit label");
assert(parseAccountRpcError({ message: "forbidden" }).includes("صلاحية"), "forbidden copy");

console.log("admin-client-account tests passed");
