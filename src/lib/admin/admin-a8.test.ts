/**
 * MAAKFIT Admin V1 — A8 Final QA & Daily Workflow Validation Suite
 * QA-first: static/regression gates across A1–A7 surfaces. No feature expansion.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildAttentionQueue } from "./admin-attention";
import { buildDashboardQuickStatus } from "./admin-dashboard";
import {
  canAccessNavItem,
  canAccessRoute,
  canAdmin,
  classifyAdminAction,
  FORBIDDEN_ADMIN_ACTIONS,
  hasAdminPermission,
  isForbiddenAdminAction,
  permissionsForRole,
  ROUTE_REQUIRED_PERMISSION,
  STAFF_ROLE_LABELS,
  type StaffSession,
} from "./admin-permissions";
import { ADMIN_NAV_GROUPS, listAdminNavHrefs } from "./admin-nav";
import { CLIENT_360_SECTIONS } from "./admin-architecture";
import { resolveAdminEnvironment } from "./admin-environment";
import { detectExerciseSensitiveChanges, detectMealSensitiveChanges } from "./admin-library-safety";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const dashboard = read("src/routes/admin/index.tsx");
const clients = read("src/routes/admin/clients/index.tsx");
const client360 = read("src/routes/admin/clients/$clientId.tsx");
const trainingOps = read("src/routes/admin/training/index.tsx");
const trainingReviews = read("src/routes/admin/training/reviews.tsx");
const nutritionOps = read("src/routes/admin/nutrition/operations.tsx");
const billing = read("src/routes/admin/billing/index.tsx");
const memberships = read("src/components/admin/AdminMembershipsPage.tsx");
const payments = read("src/routes/admin/payments.tsx");
const settings = read("src/routes/admin/settings.tsx");
const forbidden = read("src/routes/admin/forbidden.tsx");
const shell = read("src/components/admin/AdminShell.tsx");
const matrix = read("src/components/admin/MatrixImpactCard.tsx");
const trainingWs = read("src/components/admin/ClientTrainingWorkspace.tsx");
const nutritionWs = read("src/components/admin/ClientNutritionWorkspace.tsx");
const membershipWs = read("src/components/admin/ClientMembershipWorkspace.tsx");
const confirm = read("src/components/admin/AdminConfirmDialog.tsx");
const exerciseLib = read("src/components/admin/libraries/ExerciseLibraryManager.tsx");
const mealLib = read("src/components/admin/libraries/NutritionLibraryManager.tsx");
const audit = read("src/routes/admin/audit.tsx");
const a7Migration = read("supabase/migrations/20260831200000_admin_v1_a7_staff_permissions.sql");
const styles = read("src/styles.css");

const superAdmin: StaffSession = {
  userId: "1",
  staffRole: "super_admin",
  permissions: permissionsForRole("super_admin"),
};
const coach: StaffSession = { userId: "2", staffRole: "coach", permissions: permissionsForRole("coach") };
const finance: StaffSession = { userId: "3", staffRole: "finance", permissions: permissionsForRole("finance") };
const readOnly: StaffSession = { userId: "4", staffRole: "read_only", permissions: permissionsForRole("read_only") };

// T1–T4 Dashboard
assert(dashboard.includes("AttentionCenter"), "T2 dashboard");
assert(dashboard.includes("DashboardQuickStatus"), "T2 quick status");
assert(dashboard.includes("buildAttentionQueue"), "T3 attention source");
assert(dashboard.includes("retryAttention") || dashboard.includes("attentionError"), "T4 error handling");
assert(!dashboard.includes("MRR"), "no fake MRR");

// T5–T10 Clients
assert(clients.includes("searchAdminClients") || clients.includes("AdminClient"), "T5 client list");
assert(client360.includes("Client360Header") || client360.includes("ClientHealthSnapshot"), "T8 client 360");
for (const section of ["overview", "training", "nutrition", "membership", "activity", "notes"]) {
  assert(CLIENT_360_SECTIONS.includes(section as never) || client360.includes(section), `T9 tab ${section}`);
}

// T11–T20 Training + Matrix
assert(trainingOps.includes("عمليات التدريب"), "T11 training ops");
assert(trainingReviews.includes("مراجعات"), "T12 review center");
assert(matrix.includes("SAFE_WITH_IMPACT"), "T13 matrix safe with impact");
assert(matrix.includes("ALTERNATIVE_RECOMMENDED"), "T14 matrix alternative");
assert(matrix.includes("BLOCKED"), "T15 matrix blocked");
assert(!matrix.includes("متابعة رغم"), "T16 no bypass copy");
assert(trainingWs.includes("confirmCoachOverride") || trainingWs.includes("MatrixImpactCard"), "T11 workspace");
assert(trainingWs.includes("BLOCKED"), "T17 blocked guard in workspace");
assert(isForbiddenAdminAction("matrix.bypass"), "T17 forbidden action listed");

// T21–T24 Libraries
assert(exerciseLib.includes("ExerciseLibraryManager") || exerciseLib.includes("admin_save_exercise"), "T22 exercise lib");
assert(exerciseLib.includes("LibraryImpactWarningCard") || exerciseLib.includes("detectExerciseSensitiveChanges"), "T23 sensitive");
assert(
  detectExerciseSensitiveChanges(
    { required_equipment: ["dumbbell"] },
    { required_equipment: ["barbell"] },
  ) !== null,
  "T23 detect",
);

// T25–T31 Nutrition
assert(nutritionOps.includes("عمليات التغذية") || nutritionOps.includes("التغذية"), "T25 nutrition ops");
assert(nutritionWs.includes("allergen") || nutritionWs.includes("Allergen"), "T28 allergy");
assert(mealLib.includes("NutritionLibraryManager") || mealLib.includes("detectMealSensitiveChanges"), "T29 meal lib");
assert(
  detectMealSensitiveChanges({ allergens: ["milk"] }, { allergens: ["milk", "nuts"] }, false) !== null,
  "T30 meal sensitive",
);

// T32–T42 Billing
assert(billing.includes("buildBillingQuickStatus"), "T32 billing overview");
assert(memberships.includes("filterMembershipRows"), "T32 memberships");
assert(payments.includes("legacy_payments") || payments.includes("canLegacyReview"), "T41 legacy gate");
assert(payments.includes("AdminPaymentExceptionsPanel"), "T39 exceptions");
assert(!payments.includes("Grant Premium"), "T43 no grant premium");
assert(FORBIDDEN_ADMIN_ACTIONS.includes("payment.psp.mark_paid"), "T43 psp mark paid forbidden");

// T46–T54 Roles
assert(hasAdminPermission(coach, "training.manage"), "T47 coach");
assert(!canAdmin(coach, "legacy_payments.manage"), "T48 coach payment blocked");
assert(canAdmin(finance, "legacy_payments.manage"), "T50 finance legacy");
assert(!canAdmin(readOnly, "training.manage"), "T51 read only");
assert(a7Migration.includes("prevent_staff_role_escalation"), "T52 self escalation");
assert(forbidden.includes("صلاحية غير كافية"), "T54 route protection");
assert(shell.includes("canAccessRoute"), "T54 shell route guard");

// T55–T59 Confirmations + audit
assert(confirm.includes("reasonRequired"), "T56 reason");
assert(confirm.includes("cc-dialog__diff"), "T57 before after");
assert(confirm.includes("submitting"), "T58 double submit");
assert(audit.includes("listAdminAuditEvents"), "T59 audit");

// T60–T70 Navigation / env / responsive
assert(ADMIN_NAV_GROUPS.length === 7, "T60 seven sections");
const hrefs = listAdminNavHrefs();
assert(hrefs.includes("/admin/clients"), "T60 clients route");
assert(hrefs.includes("/admin/billing"), "T60 billing route");
assert(shell.includes("AdminEnvironmentBadge"), "T61 environment");
assert(styles.includes("cc-shell--dark-nav"), "T62 rtl shell");
assert(styles.includes("@media (max-width: 700px)"), "T63 mobile");
assert(styles.includes("cc-mobile-cards") || styles.includes("cc-client-card-list"), "T63 mobile cards");

// T71–T75 Milestone regression hooks
assert(dashboard.includes("fetchAdminOperationsSnapshot"), "A3 regression");
assert(client360.includes("ClientMembershipWorkspace"), "A4 regression");
assert(trainingOps.includes("OpsAttentionQueue") || trainingOps.includes("buildTrainingQuickStatus"), "A5 regression");
assert(billing.includes("ProviderBindingBanner") || memberships.includes("ProviderBindingBanner"), "A6 regression");
assert(settings.includes("RequirePermission"), "A7 regression");

// Daily workflow scenario structure (static)
const attention = buildAttentionQueue({
  inbox: [
    {
      id: "1",
      memberId: "c1",
      memberName: "A",
      memberEmail: "a@x.com",
      memberAvatarPath: null,
      memberGoal: null,
      membershipTier: "premium",
      status: "waiting_for_reply",
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: "hi",
      lastMessageKind: "text",
      lastActor: "member",
      unreadCount: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  payments: [],
  paymentExceptions: [
    {
      exceptionId: "e1",
      exceptionType: "subscription_past_due",
      priority: "high",
      subjectLabel: "x",
      detail: "d",
      occurredAt: new Date().toISOString(),
      href: "/admin/memberships",
    },
  ],
});
assert(attention.length >= 1, "scenario attention queue");
assert(
  buildDashboardQuickStatus({
    snapshot: {
      unreadThreads: 1,
      waitingThreads: 0,
      pendingPayments: 0,
      legacyPendingPayments: 0,
      pspFailedEvents: 0,
      subscriptionAttention: 0,
      openSupport: 0,
    },
  }).length >= 1,
  "scenario quick status",
);

// Security static gates
assert(resolveAdminEnvironment() !== "production" || process.env.NODE_ENV === "production", "env not hardcoded prod in dev");
assert(!payments.includes("cvv") && !payments.includes("PAN"), "no card data ui");
assert(membershipWs.includes("دون تعديل يدوي"), "read only billing");
assert(classifyAdminAction("legacy_payment_approve") === "SENSITIVE", "sensitive legacy");
assert(STAFF_ROLE_LABELS.super_admin === "مدير النظام", "arabic role labels");
assert(Object.keys(ROUTE_REQUIRED_PERMISSION).length >= 10, "route permission map");

// Client scale simulation helpers
assert(canAccessNavItem(finance, "payments.read"), "finance nav payments");
assert(canAccessRoute(finance, "/admin/payments"), "finance route payments");
assert(!canAccessRoute(coach, "/admin/payments"), "coach blocked payments route");

// Prerequisite gate documentation (reports exist)
for (const report of [
  "docs/MAAKFIT_ADMIN_V1_A3_DASHBOARD_IMPLEMENTATION_REPORT.md",
  "docs/MAAKFIT_ADMIN_V1_A4_CLIENT_MANAGEMENT_REPORT.md",
  "docs/MAAKFIT_ADMIN_V1_A5_TRAINING_NUTRITION_OPERATIONS_REPORT.md",
  "docs/MAAKFIT_ADMIN_V1_A6_MEMBERSHIP_PAYMENTS_OPERATIONS_REPORT.md",
  "docs/MAAKFIT_ADMIN_V1_A7_ACTIONS_PERMISSIONS_REPORT.md",
]) {
  assert(read(report).length > 100, `report exists: ${report}`);
}

console.log("admin-a8.test.ts: all A8 validation assertions passed");
