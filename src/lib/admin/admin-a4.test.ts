import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildClientAttentionAlerts,
  buildClientDirectorySummary,
  clientNeedsAttention,
  directoryPlanLabelAr,
  directoryOperationalStatus,
  formatClientActivityEvent,
  isInternalVipTier,
  paginationPages,
  trainingLocationLabel,
} from "./admin-client-ops";
import type { AdminClientListItem, AdminClientOverview } from "./admin-clients-api";
import type { AdminAuditEvent } from "./admin-audit-api";
import { formatAdminActivityStamp } from "./admin-status";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const clientsIndex = readFileSync(resolve(process.cwd(), "src/routes/admin/clients/index.tsx"), "utf8");
const client360 = readFileSync(resolve(process.cwd(), "src/routes/admin/clients/$clientId.tsx"), "utf8");
const headerSource = readFileSync(resolve(process.cwd(), "src/components/admin/Client360Header.tsx"), "utf8");
const overviewSource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientOverviewWorkspace.tsx"), "utf8");
const attentionSource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientAttentionAlerts.tsx"), "utf8");
const activitySource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientActivityPanel.tsx"), "utf8");
const matrixSource = readFileSync(resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"), "utf8");
const membershipSource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientMembershipWorkspace.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const routeSource = readFileSync(resolve(process.cwd(), "src/routes/admin/route.tsx"), "utf8");

const sampleRow: AdminClientListItem = {
  id: "c1",
  fullName: "Ahmed",
  email: "a@example.com",
  phone: null,
  avatarPath: null,
  goal: "loss",
  city: null,
  membershipPlan: "premium",
  membershipActive: true,
  onboardingCompletedAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  unreadCoachingCount: 1,
  waitingCoaching: false,
  createdAt: new Date().toISOString(),
};

const baseOverview: AdminClientOverview = {
  id: "c1",
  full_name: "Ahmed",
  email: "a@example.com",
  phone: null,
  avatar_path: null,
  goal: "loss",
  city: null,
  training_type: "gym",
  program_start_date: null,
  onboarding_completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  membership: {
    tier: "premium",
    is_active: true,
    source: "stripe",
    starts_at: new Date().toISOString(),
    ends_at: null,
  },
  coaching: {
    conversation_id: "conv1",
    status: "open",
    last_message_at: new Date().toISOString(),
    unread_count: 2,
  },
  assignment: null,
  last_workout_at: null,
  nutrition_assignment: null,
  notes_count: 0,
};

// T1 directory renders
assert(clientsIndex.includes("العملاء"), "directory title");
assert(clientsIndex.includes("إدارة العملاء ومتابعة تقدمهم"), "directory subtitle");

// T2 search preserved
assert(clientsIndex.includes("AdminSearchInput"), "search input");
assert(clientsIndex.includes("ADMIN_CLIENT_MIN_QUERY"), "min query contract");

// T3 filters use real contracts
assert(clientsIndex.includes("searchAdminClients"), "real search rpc");
assert(clientsIndex.includes('value="vip"'), "vip plan filter");
assert(clientsIndex.includes("مسح الفلاتر"), "clear filters");

// T4 client opens
assert(clientsIndex.includes('to="/admin/clients/$clientId"'), "client links");
assert(clientsIndex.includes("فتح العميل"), "open client CTA");

// T5 header
assert(headerSource.includes("إرسال رسالة"), "message action");
assert(headerSource.includes("إضافة ملاحظة"), "add note action");
assert(
  /import\s*\{[^}]*trainingLocationLabel/.test(headerSource),
  "header imports trainingLocationLabel — missing import crashes overview",
);

// T6 overview
assert(client360.includes("ClientOverviewWorkspace"), "overview workspace");
assert(overviewSource.includes("ClientTrainingGoalCard"), "overview shows training goal editor");
assert(headerSource.includes("presentClientTrainingGoal"), "header uses mapped goal label");
const goalCardSource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientTrainingGoalCard.tsx"), "utf8");
assert(goalCardSource.includes("optgroup"), "goal picker groups men and women");
assert(goalCardSource.includes("ADMIN_GOAL_PICKER_GROUPS"), "uses grouped official goals");
assert(overviewSource.includes("يحتاج انتباهك"), "attention section");

// T7 health snapshot
assert(overviewSource.includes("العضوية"), "membership card");
assert(overviewSource.includes("التدريب"), "training card");
assert(!overviewSource.includes("Health Score"), "no fake health score");
assert(!overviewSource.includes("82.4"), "no invented weight");

// T8 attention
const alerts = buildClientAttentionAlerts(baseOverview, "c1");
assert(alerts.some((a) => a.id === "coaching-unread"), "unread alert");
assert(attentionSource.includes("AdminPriorityBadge"), "priority badges");

const inactiveAlerts = buildClientAttentionAlerts(
  {
    ...baseOverview,
    membership: { ...baseOverview.membership!, is_active: false },
  },
  "c1",
);
assert(
  inactiveAlerts.some((a) => a.id === "membership-inactive"),
  "inactive membership alert uses planLabel without crashing",
);

// T9 training tab
assert(client360.includes("ClientTrainingWorkspace"), "training workspace");

// T10 nutrition tab
assert(client360.includes("ClientNutritionWorkspace"), "nutrition workspace");

// T11 progress tab
assert(client360.includes('tab === "progress"'), "progress tab wiring");

// T12 membership tab
assert(client360.includes("ClientMembershipWorkspace"), "membership workspace");
assert(membershipSource.includes("billing_period_months"), "billing period field");

// T13 activity tab
assert(client360.includes("ClientActivityPanel"), "activity panel");
assert(activitySource.includes("formatClientActivityEvent"), "readable activity events");

// T14 notes
assert(client360.includes("listAdminClientNotes"), "notes api");
assert(client360.includes("client-note-draft"), "note draft id");

// T15 messages action
assert(headerSource.includes("/admin/messages/"), "messages handoff");

// T16–T19 membership tiers
assert(clientsIndex.includes('value="free"'), "free filter");
assert(clientsIndex.includes('value="essential"'), "essential filter");
assert(clientsIndex.includes('value="premium"'), "premium filter");
assert(isInternalVipTier("vip"), "vip internal");
assert(clientsIndex.includes("Internal VIP"), "vip not public product label");

// T20–T23 matrix states preserved
assert(matrixSource.includes('"SAFE"'), "matrix safe");
assert(matrixSource.includes("SAFE_WITH_IMPACT"), "matrix impact");
assert(matrixSource.includes("ALTERNATIVE_RECOMMENDED"), "matrix alternative");
assert(matrixSource.includes('"BLOCKED"'), "matrix blocked");
assert(!matrixSource.includes("متابعة رغم"), "no bypass CTA");
assert(!matrixSource.includes("Force Change"), "no force change");

// T24 core 100 unchanged — training workspace still references core engine
const trainingSource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
assert(trainingSource.includes("MatrixImpactCard"), "matrix card in training");

// T25 versioning
assert(trainingSource.includes("COACH_OVERRIDE"), "coach override preserved");

// T26 payment read-only
assert(!membershipSource.includes("updateMembership"), "no entitlement mutation");
assert(membershipSource.includes("دون تعديل يدوي"), "read only billing");

// T27 notes ≠ audit
assert(!client360.includes("AdminAudit"), "notes not audit log in client 360");

// T28 empty states
assert(attentionSource.includes("لا توجد حالات"), "attention empty");
assert(overviewSource.includes("لا بيانات تقدم كافية بعد"), "progress empty copy");

// T29 error states
assert(client360.includes("AdminErrorState"), "error states");

// T30 RTL
assert(styles.includes(".cc-health-snapshot") || styles.includes(".cc-health-mini"), "health snapshot styles");
assert(styles.includes("grid-template-columns"), "responsive grid");

// T31 mobile
assert(styles.includes(".cc-client-card-list"), "mobile client cards");
assert(clientsIndex.includes("cc-client-card-list"), "mobile list in directory");

// T32 accessibility
assert(headerSource.includes("aria-hidden"), "decorative avatar hidden");
assert(styles.includes(":focus-visible"), "focus styles");

// T33–T34 admin access
assert(routeSource.includes("requireAdminRouteAccess"), "admin guard");

// T35–T38 regressions — wiring still present
assert(trainingSource.includes("ClientTrainingWorkspace"), "training workspace exists");
const nutritionSource = readFileSync(resolve(process.cwd(), "src/components/admin/ClientNutritionWorkspace.tsx"), "utf8");
assert(nutritionSource.includes("ClientNutritionWorkspace"), "nutrition workspace exists");
assert(membershipSource.includes("ClientMembershipWorkspace"), "membership workspace exists");

// Directory summary real data
const summary = buildClientDirectorySummary([sampleRow], 10);
assert(summary.totalClients === 10, "total from rpc");
assert(clientNeedsAttention(sampleRow), "attention detection");

const event: AdminAuditEvent = {
  id: "1",
  actorId: "admin1",
  subjectUserId: "c1",
  eventType: "coach_override_applied",
  metadata: { source: "admin" },
  createdAt: new Date().toISOString(),
};
const formatted = formatClientActivityEvent(event);
assert(formatted.what.length > 0, "activity what");
assert(formatted.source === "admin", "activity source");
assert(trainingLocationLabel("both") === "منزل + نادي", "training location label");
assert(directoryPlanLabelAr("premium") === "احترافي", "arabic premium label");
assert(directoryOperationalStatus(sampleRow) === "attention", "unread is follow-up status");
assert(paginationPages(1, 11).includes("gap"), "pagination collapses long ranges");
assert(formatAdminActivityStamp(null) === "—", "missing activity is a dash");
assert(clientsIndex.includes("window.open(\"/quiz\""), "add client opens real signup, not a fake create rpc");
assert(!clientsIndex.includes("admin_create_client"), "no fake create client");
assert(membershipSource.includes("/admin/memberships"), "manage subscription is a real admin route");
assert(membershipSource.includes("/admin/payments"), "invoice history links to payments");

console.log("admin-a4 tests passed");
