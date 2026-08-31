import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildAttentionQueue } from "./admin-attention";
import { buildDashboardQuickStatus } from "./admin-dashboard";
import { formatAuditEventLabel } from "./admin-dashboard-present";
import type { AdminAuditEvent } from "./admin-audit-api";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dashboardSource = readFileSync(resolve(process.cwd(), "src/routes/admin/index.tsx"), "utf8");
const attentionSource = readFileSync(resolve(process.cwd(), "src/components/admin/AttentionCenter.tsx"), "utf8");
const shellSource = readFileSync(resolve(process.cwd(), "src/components/admin/AdminShell.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const matrixSource = readFileSync(resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"), "utf8");

// T1 header
assert(dashboardSource.includes("dayGreeting"), "time-aware greeting");
assert(dashboardSource.includes("Coach Hakim"), "coach greeting");
assert(!dashboardSource.includes("COMMAND CENTER"), "no technical header");

// T2–T4 KPI
const kpis = buildDashboardQuickStatus({
  snapshot: {
    unreadThreads: 1,
    waitingThreads: 0,
    pendingPayments: 0,
    legacyPendingPayments: 1,
    pspFailedEvents: 0,
    subscriptionAttention: 2,
    openSupport: 0,
  },
  recentClients: [],
});
assert(kpis.length === 5, "max five KPI");
assert(!kpis.some((k) => String(k.hint).includes("%")), "no fake trends");

// T5 KPI routes
assert(kpis.every((k) => k.href), "kpi routes");

// T6–T8 attention
assert(dashboardSource.includes("يحتاج انتباهك"), "attention section");
assert(attentionSource.includes("cc-attention-table"), "compact attention rows");
assert(attentionSource.includes("cc-attention-row--mobile"), "mobile attention cards");

// T9 priority badges
assert(attentionSource.includes("AdminPriorityBadge"), "priority badges");

// T10 CTA routes
const queue = buildAttentionQueue({
  inbox: [
    {
      id: "c1",
      memberId: "m1",
      memberName: "Ahmed",
      memberEmail: "a@example.com",
      memberAvatarPath: null,
      memberGoal: "loss",
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
});
assert(queue[0]?.actionLabel === "فتح الرسائل", "contextual CTA");
assert(queue[0]?.clientId === "m1", "client id on attention");

// T11 empty
assert(attentionSource.includes("لا توجد حالات تتطلب تدخلك حاليًا"), "attention empty");

// T12 partial error
assert(dashboardSource.includes("cc-inline-alert"), "partial error");

// T13–T14 clients
assert(dashboardSource.includes("personInitials"), "client initials");
assert(dashboardSource.includes('to="/admin/clients/$clientId"'), "client links");

// T15 membership snapshot
assert(dashboardSource.includes("الاشتراكات والمدفوعات"), "membership snapshot");
assert(dashboardSource.includes("buildMembershipOperationalSnapshot"), "membership helper");

// T16 recent activity
assert(dashboardSource.includes("formatAuditEventLabel"), "readable audit labels");

// T17 quick actions
assert(dashboardSource.includes("QUICK_ACTIONS"), "quick actions");
assert((dashboardSource.match(/QUICK_ACTIONS/g) ?? []).length >= 1, "quick actions defined");

// T18 no raw audit payload
const sample: AdminAuditEvent = {
  id: "1",
  actorId: null,
  subjectUserId: null,
  eventType: "coach_override_applied",
  metadata: {},
  createdAt: new Date().toISOString(),
};
assert(formatAuditEventLabel(sample) !== "coach_override_applied", "no raw event type");

// T19 environment
assert(shellSource.includes("AdminEnvironmentBadge"), "environment badge");

// T20 search
assert(shellSource.includes("ابحث عن عميل بالاسم أو البريد"), "truthful search");

// T21 RTL
assert(shellSource.includes('dir="rtl"'), "rtl");

// T22–T24 layout classes
assert(styles.includes(".cc-kpi-grid"), "desktop kpi");
assert(styles.includes(".cc-dash-grid"), "secondary grid");
assert(styles.includes(".cc-attention-row--mobile"), "mobile attention");

// T25 accessibility
assert(styles.includes(":focus-visible"), "focus styles");
assert(shellSource.includes("aria-label"), "aria labels in shell");

// T26 admin auth
const routeSource = readFileSync(resolve(process.cwd(), "src/routes/admin/route.tsx"), "utf8");
assert(routeSource.includes("requireAdminRouteAccess"), "admin guard");

// Matrix unchanged
assert(!matrixSource.includes("متابعة رغم"), "matrix no bypass");

console.log("admin-a3 tests passed");
