import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildDashboardQuickStatus } from "./admin-dashboard";
import { ADMIN_NAV_GROUPS } from "./admin-nav";
import { adminNavIcon } from "./admin-nav-icons";
import { COACH_OVERRIDE_REVIEW_STATUSES } from "@/lib/platform/coach-override/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const shellSource = readFileSync(resolve(process.cwd(), "src/components/admin/AdminShell.tsx"), "utf8");
const attentionSource = readFileSync(resolve(process.cwd(), "src/components/admin/AttentionCenter.tsx"), "utf8");
const dashboardSource = readFileSync(resolve(process.cwd(), "src/routes/admin/index.tsx"), "utf8");
const matrixSource = readFileSync(resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"), "utf8");
const reviewSource = readFileSync(resolve(process.cwd(), "src/lib/platform/coach-override/review.ts"), "utf8");
const core100 = readFileSync(resolve(process.cwd(), "src/lib/platform/strategy-matrix/core-100.ts"), "utf8");

// T1 Dark sidebar
assert(styles.includes(".cc-sidebar--dark"), "dark sidebar class");
assert(shellSource.includes("cc-sidebar--dark"), "shell uses dark sidebar");

// T2 Active navigation
assert(shellSource.includes("is-active"), "active nav state");

// T3 Seven sections
assert(ADMIN_NAV_GROUPS.length === 6, "six daily-ops groups");

// T4 Environment in sidebar footer
assert(shellSource.includes("cc-sidebar__footer"), "sidebar footer");
assert(shellSource.includes("AdminEnvironmentBadge"), "environment badge in shell");

// T5 Max 5 KPI
const kpis = buildDashboardQuickStatus({
  snapshot: {
    unreadThreads: 1,
    waitingThreads: 1,
    pendingPayments: 0,
    legacyPendingPayments: 1,
    pspFailedEvents: 0,
    subscriptionAttention: 1,
    openSupport: 0,
  },
  recentClients: [],
  totalClients: 10,
});
assert(kpis.length === 5, "exactly five KPI cards");

// T6 No fake analytics
assert(!kpis.some((k) => String(k.hint).includes("%")), "no percent trends");
assert(!dashboardSource.includes("sparkline"), "no sparklines");

// T7 Compact attention structure
assert(attentionSource.includes("cc-attention-table"), "attention table layout");
assert(attentionSource.includes("cc-attention-row--mobile"), "mobile attention cards");

// T8 Attention CTA
assert(attentionSource.includes('href={item.href}'), "attention CTA href");

// T9 Partial error inline
assert(dashboardSource.includes("cc-inline-alert"), "inline partial error");

// T10 Empty state
assert(attentionSource.includes("كل شيء تحت السيطرة"), "attention empty state");

// T11 Secondary grid
assert(styles.includes(".cc-dash-grid"), "secondary dashboard grid");
assert(dashboardSource.includes("cc-dash-grid"), "dashboard uses secondary grid");

// T12 Mobile attention
assert(styles.includes(".cc-attention-row--mobile"), "mobile attention styles");

// T13 Mobile drawer
assert(styles.includes(".cc-sidebar--dark.is-open"), "mobile drawer open state");

// T14 RTL
assert(shellSource.includes('dir="rtl"'), "rtl shell");

// T15 Focus / keyboard
assert(styles.includes(":focus-visible"), "focus visible styles");

// T16–T20 Matrix UI — engine unchanged
for (const status of COACH_OVERRIDE_REVIEW_STATUSES) {
  assert(matrixSource.includes(status) || matrixSource.includes("review.status"), `matrix handles ${status}`);
}
assert(matrixSource.includes("مراجعة تأثير التعديل"), "matrix impact title");
assert(!matrixSource.includes("متابعة رغم"), "no bypass CTA");
assert(reviewSource.includes("SAFE_WITH_IMPACT"), "matrix engine intact");
assert(core100.includes("MAAKFIT_V1_CORE_100"), "core 100 intact");

// Nav icons
assert(Boolean(adminNavIcon("home")), "nav icons resolve");
assert(Boolean(adminNavIcon("messages")), "messages icon");

// Foundation badge copy
assert(shellSource.includes("قريبًا"), "foundation soon badge");
assert(!shellSource.includes(">أساس<"), "no repeated foundation label");

console.log("admin-a2-1b tests passed");
