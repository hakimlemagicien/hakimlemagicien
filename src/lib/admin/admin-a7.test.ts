import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_PERMISSIONS,
  canAccessNavItem,
  canAccessRoute,
  canAdmin,
  classifyAdminAction,
  FORBIDDEN_ADMIN_ACTIONS,
  hasAdminPermission,
  isForbiddenAdminAction,
  permissionsForRole,
  STAFF_ROLE_LABELS,
  type StaffSession,
} from "./admin-permissions";
import { ADMIN_NAV_GROUPS } from "./admin-nav";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831200000_admin_v1_a7_staff_permissions.sql"),
  "utf8",
);
const permissionsSource = readFileSync(resolve(process.cwd(), "src/lib/admin/admin-permissions.ts"), "utf8");
const accessSource = readFileSync(resolve(process.cwd(), "src/lib/admin/admin-access.ts"), "utf8");
const confirmSource = readFileSync(resolve(process.cwd(), "src/components/admin/AdminConfirmDialog.tsx"), "utf8");
const shellSource = readFileSync(resolve(process.cwd(), "src/components/admin/AdminShell.tsx"), "utf8");
const settingsSource = readFileSync(resolve(process.cwd(), "src/routes/admin/settings.tsx"), "utf8");
const staffPanel = readFileSync(resolve(process.cwd(), "src/components/admin/AdminStaffManagementPanel.tsx"), "utf8");
const paymentsSource = readFileSync(resolve(process.cwd(), "src/routes/admin/payments.tsx"), "utf8");
const matrixSource = readFileSync(resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"), "utf8");
const forbiddenRoute = readFileSync(resolve(process.cwd(), "src/routes/admin/forbidden.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

const superAdmin: StaffSession = { userId: "1", staffRole: "super_admin", permissions: [...ADMIN_PERMISSIONS] };
const coach: StaffSession = {
  userId: "2",
  staffRole: "coach",
  permissions: permissionsForRole("coach"),
};
const nutrition: StaffSession = {
  userId: "3",
  staffRole: "nutrition",
  permissions: permissionsForRole("nutrition"),
};
const support: StaffSession = {
  userId: "4",
  staffRole: "support",
  permissions: permissionsForRole("support"),
};
const finance: StaffSession = {
  userId: "5",
  staffRole: "finance",
  permissions: permissionsForRole("finance"),
};
const readOnly: StaffSession = {
  userId: "6",
  staffRole: "read_only",
  permissions: permissionsForRole("read_only"),
};

// T1–T6 roles
assert(hasAdminPermission(superAdmin, "staff.manage"), "super admin");
assert(hasAdminPermission(coach, "training.manage"), "coach training");
assert(hasAdminPermission(nutrition, "nutrition.manage"), "nutrition");
assert(hasAdminPermission(support, "support.manage"), "support");
assert(hasAdminPermission(finance, "legacy_payments.manage"), "finance");
assert(!hasAdminPermission(readOnly, "training.manage"), "read only");

// T7–T15 boundaries
assert(canAdmin(coach, "training.manage"), "coach training allowed");
assert(!canAdmin(coach, "legacy_payments.manage"), "coach payment blocked");
assert(canAdmin(nutrition, "meal_library.manage"), "nutrition meals");
assert(!canAdmin(nutrition, "training.manage"), "nutrition training blocked");
assert(canAdmin(finance, "payments.read"), "finance payments read");
assert(!canAdmin(finance, "training.manage"), "finance training blocked");
assert(canAccessNavItem(support, "support.manage"), "support nav");
assert(!canAdmin(support, "legacy_payments.manage"), "support legacy blocked");
assert(!canAdmin(readOnly, "client_notes.write"), "read only notes blocked");

// T16–T20 UI/server
assert(shellSource.includes("canAccessNavItem"), "nav gating");
assert(migration.includes("_require_staff_permission"), "server permission gate");
assert(forbiddenRoute.includes("صلاحية غير كافية"), "forbidden route");
assert(accessSource.includes("fallbackStaffSession"), "backward compatible admin");
assert(migration.includes("prevent_staff_role_escalation"), "self escalation blocked");

// T21–T23 staff management
assert(staffPanel.includes("updateStaffRole"), "staff role change");
assert(migration.includes("admin_update_staff_role"), "staff RPC");
assert(migration.includes("super_admin"), "admin backfill");

// T24–T29 confirmations
assert(classifyAdminAction("open_client") === "SAFE", "safe action");
assert(classifyAdminAction("support_status") === "REVIEW", "review action");
assert(classifyAdminAction("legacy_payment_approve") === "SENSITIVE", "sensitive action");
assert(confirmSource.includes("reasonRequired"), "reason support");
assert(confirmSource.includes("cc-dialog__diff"), "before after diff");
assert(confirmSource.includes("submitting"), "double submit guard");

// T30–T34 matrix
assert(matrixSource.includes('review.status !== "BLOCKED"'), "matrix blocked ui");
assert(!matrixSource.includes("متابعة رغم"), "no matrix bypass");
assert(isForbiddenAdminAction("matrix.bypass"), "forbidden matrix bypass");
assert(!ADMIN_PERMISSIONS.some((p) => p.includes("matrix")), "no matrix bypass permission");

// T35–T39 payments
assert(FORBIDDEN_ADMIN_ACTIONS.includes("payment.psp.mark_paid"), "no mark paid permission");
assert(FORBIDDEN_ADMIN_ACTIONS.includes("membership.activate_paid_manually"), "no manual activation");
assert(migration.includes("legacy_payments.manage"), "legacy permission on server");
assert(paymentsSource.includes("canLegacyReview"), "legacy ui gate");
assert(!paymentsSource.includes("Grant Premium"), "no grant premium");

// T40–T43 library protection hooks
assert(permissionsSource.includes("exercise.safety_edit"), "exercise safety perm");
assert(permissionsSource.includes("meal.safety_edit"), "meal safety perm");

// T44–T45 destructive
assert(staffPanel.includes("cc-danger-zone"), "danger zone");
assert(!staffPanel.includes("deleteClient"), "no raw delete");

// T46–T50 audit
assert(migration.includes("staff_role_changed"), "role audit event");
assert(staffPanel.includes("reasonRequired: true"), "role change reason");
assert(confirmSource.includes("before:"), "diff before");

// T51–T55 UX
assert(shellSource.includes("StaffPermissionsProvider"), "permission context");
assert(STAFF_ROLE_LABELS.super_admin === "مدير النظام", "arabic role label");
assert(styles.includes(".cc-dialog__diff"), "rtl diff styles");
assert(confirmSource.includes("aria-modal"), "a11y dialog");

// T56–T60 regression hooks
assert(settingsSource.includes("RequirePermission"), "settings guarded");
assert(ADMIN_NAV_GROUPS.some((g) => g.items.some((i) => i.to === "/admin/settings" && i.status === "live")), "settings live");

console.log("admin-a7.test.ts: all assertions passed");
