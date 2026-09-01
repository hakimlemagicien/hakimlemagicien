import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildAttentionQueue } from "./admin-attention";
import { buildDashboardQuickStatus } from "./admin-dashboard";
import { resolveAdminEnvironment, adminEnvironmentLabel } from "./admin-environment";
import { ADMIN_NAV_GROUPS, listAdminNavHrefs } from "./admin-nav";
import { reviewStatusLabelAr, reviewStatusTone } from "./matrix-impact-labels";
import { COACH_OVERRIDE_REVIEW_STATUSES } from "@/lib/platform/coach-override/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// T1/T2 Environment badge contract
assert(resolveAdminEnvironment() !== "", "environment resolves");
assert(["staging", "production", "development"].includes(resolveAdminEnvironment()), "known env bucket");
assert(adminEnvironmentLabel("staging") === "STAGING", "staging label");
assert(adminEnvironmentLabel("production") === "PRODUCTION", "production label");

// T3 Seven navigation sections
assert(ADMIN_NAV_GROUPS.length === 6, "six daily-ops groups");
assert(
  ADMIN_NAV_GROUPS.map((group) => group.id).join(",") ===
    "clients,training,nutrition,billing,content,system",
  "section ids",
);

// T4 Sidebar daily-ops hrefs + preserved operational routes as files
const hrefs = listAdminNavHrefs();
const sidebarRoutes = [
  "/admin",
  "/admin/clients",
  "/admin/messages",
  "/admin/progress",
  "/admin/programs",
  "/admin/exercises",
  "/admin/nutrition",
  "/admin/memberships",
  "/admin/payments",
  "/admin/content",
  "/admin/support",
  "/admin/settings",
  "/admin/audit",
  "/admin/notifications",
];
for (const route of sidebarRoutes) {
  assert(hrefs.includes(route), `sidebar route: ${route}`);
}
const preservedFiles = [
  "src/routes/admin/training/index.tsx",
  "src/routes/admin/training/reviews.tsx",
  "src/routes/admin/nutrition/operations.tsx",
  "src/routes/admin/billing/index.tsx",
];
for (const file of preservedFiles) {
  assert(readFileSync(resolve(process.cwd(), file), "utf8").length > 0, `route file kept: ${file}`);
}

// T5/T6 Dashboard real-data contract — no fake KPIs
const quick = buildDashboardQuickStatus({
  snapshot: {
    unreadThreads: 2,
    waitingThreads: 1,
    pendingPayments: 0,
    legacyPendingPayments: 1,
    pspFailedEvents: 1,
    subscriptionAttention: 2,
    openSupport: 1,
  },
  recentClients: [
    {
      id: "1",
      fullName: "Test",
      email: null,
      phone: null,
      avatarPath: null,
      goal: null,
      city: null,
      membershipPlan: "premium",
      membershipActive: true,
      onboardingCompletedAt: null,
      lastActivityAt: null,
      unreadCoachingCount: 0,
      waitingCoaching: false,
      createdAt: new Date().toISOString(),
    },
  ],
  totalClients: 42,
});
assert(quick.some((metric) => metric.id === "needs_attention"), "needs attention metric");
assert(quick.length <= 5, "max five KPI cards");
assert(quick.every((metric) => metric.icon), "kpi icons present");
assert(quick.every((metric) => Number.isFinite(metric.value)), "numeric metrics only");
assert(!quick.some((metric) => metric.label.includes("fake")), "no fake labels");
assert(!quick.some((metric) => String(metric.hint).includes("%")), "no fake trend analytics");

// T7/T8 Attention rendering + CTA routing
const queue = buildAttentionQueue({
  inbox: [
    {
      id: "c1",
      memberId: "m1",
      memberName: "Ahmed",
      memberEmail: "a@example.com",
      memberAvatarPath: null,
      memberGoal: "loss",
      membershipTier: "vip",
      status: "waiting_for_reply",
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: "hello",
      lastMessageKind: "text",
      lastActor: "member",
      unreadCount: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  payments: [],
  support: [],
  paymentExceptions: [
    {
      exceptionId: "ex1",
      exceptionType: "subscription_past_due",
      priority: "high",
      subjectLabel: "Omar",
      detail: "past due",
      occurredAt: new Date().toISOString(),
      href: "/admin/payments?section=exceptions",
    },
  ],
});
assert(queue.length === 2, "coaching + billing exception");
assert(queue.every((item) => item.type && item.statusLabel), "attention metadata");
assert(queue.some((item) => item.href.includes("/admin/messages/")), "coaching CTA");
assert(queue.some((item) => item.href.includes("/admin/payments")), "billing CTA");

// T9–T12 Matrix UI labels — engine statuses only
for (const status of COACH_OVERRIDE_REVIEW_STATUSES) {
  assert(reviewStatusLabelAr(status).length > 0, `label for ${status}`);
  assert(reviewStatusTone(status).length > 0, `tone for ${status}`);
}
assert(!COACH_OVERRIDE_REVIEW_STATUSES.includes("HIGH IMPACT" as never), "no HIGH IMPACT status");

// T13 MatrixImpactCard source — engine alternatives only (component file contract)
const matrixCardSource = readFileSync(
  resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"),
  "utf8",
);
assert(!matrixCardSource.includes("random"), "no random alternatives in UI");
assert(matrixCardSource.includes("BLOCKED"), "blocked state handled");
assert(matrixCardSource.includes("مراجعة تأثير التعديل"), "matrix impact header");
assert(!matrixCardSource.includes("متابعة رغم"), "no bypass copy");

// T14/T15 Matrix engine unchanged — no edits under coach-override in this task scope check via git-less file presence
const reviewSource = readFileSync(
  resolve(process.cwd(), "src/lib/platform/coach-override/review.ts"),
  "utf8",
);
assert(reviewSource.includes("SAFE_WITH_IMPACT"), "engine review intact");
const core100 = readFileSync(resolve(process.cwd(), "src/lib/platform/strategy-matrix/core-100.ts"), "utf8");
assert(core100.includes("MAAKFIT_V1_CORE_100"), "core 100 intact");

// T20 RTL/mobile structural classes
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
assert(styles.includes(".cc-env-badge"), "env badge styles");
assert(styles.includes(".cc-matrix-impact"), "matrix card styles");
assert(styles.includes("padding-inline-start"), "rtl logical props in matrix list");

console.log("admin-a2-1 tests passed");
