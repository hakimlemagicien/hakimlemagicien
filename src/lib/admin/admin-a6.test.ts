import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildBillingQuickStatus,
  filterMembershipRows,
  formatMembershipPlanPrice,
  membershipNeedsAttention,
  membershipPlanLabel,
  membershipSourceLabel,
  OFFICIAL_CATALOG_PRICES,
  resolveMembershipLifecycle,
} from "./admin-billing-ops-surfaces";
import type { AdminMemberSubscriptionRow } from "./admin-billing-ops-api";
import { ADMIN_NAV_GROUPS } from "./admin-nav";
import { resolveCatalogPrice } from "@/lib/payments/billing-present";
import { isInternalVipTier } from "./admin-client-ops";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const billingOverview = readFileSync(resolve(process.cwd(), "src/routes/admin/billing/index.tsx"), "utf8");
const membershipsPage = readFileSync(resolve(process.cwd(), "src/components/admin/AdminMembershipsPage.tsx"), "utf8");
const paymentsRoute = readFileSync(resolve(process.cwd(), "src/routes/admin/payments.tsx"), "utf8");
const membershipWorkspace = readFileSync(resolve(process.cwd(), "src/components/admin/ClientMembershipWorkspace.tsx"), "utf8");
const exceptionsPanel = readFileSync(resolve(process.cwd(), "src/components/admin/AdminPaymentExceptionsPanel.tsx"), "utf8");
const pspPanel = readFileSync(resolve(process.cwd(), "src/components/admin/AdminPspPaymentsPanel.tsx"), "utf8");
const providerPanel = readFileSync(resolve(process.cwd(), "src/components/admin/AdminProviderEventsPanel.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

const sampleRow = (overrides: Partial<AdminMemberSubscriptionRow>): AdminMemberSubscriptionRow => ({
  userId: "u1",
  email: "a@example.com",
  fullName: "Ahmed",
  tier: "essential",
  subscriptionStatus: "active",
  billingPeriodMonths: 3,
  priceAmount: 87,
  currency: "USD",
  autoRenew: true,
  cancelAtPeriodEnd: false,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  nextRenewalAt: null,
  paidPeriodEnd: null,
  provider: null,
  isActive: true,
  lastPaymentStatus: "paid",
  lastPaymentAt: null,
  exceptionState: null,
  ...overrides,
});

// T1 overview
assert(billingOverview.includes("الاشتراكات والمدفوعات"), "billing overview title");
assert(billingOverview.includes("buildBillingQuickStatus"), "quick status");

// T2 memberships
assert(membershipsPage.includes("BillingOpsSubnav"), "memberships subnav");
assert(membershipsPage.includes("filterMembershipRows"), "membership filters");

// T3 real KPI only
assert(!billingOverview.includes("MRR"), "no MRR");
assert(!billingOverview.includes("ARR"), "no ARR");

// T4–T7 list/search/filters/deep link
assert(membershipsPage.includes("فتح العميل"), "client CTA");
assert(membershipsPage.includes('tab: "membership"'), "membership tab deep link");
assert(membershipsPage.includes("type=\"search\""), "search input");

// T8–T11 plans
assert(membershipPlanLabel("free") !== "VIP", "free label");
assert(membershipPlanLabel("essential").includes("Essential") || membershipPlanLabel("essential") === "Essential", "essential");
assert(membershipPlanLabel("premium").includes("Premium") || membershipPlanLabel("premium") === "Premium", "premium");
assert(isInternalVipTier("vip"), "vip internal");

// T12–T15 catalog prices
assert(OFFICIAL_CATALOG_PRICES.essential3 === 87, "essential 3");
assert(OFFICIAL_CATALOG_PRICES.essential6 === 149, "essential 6");
assert(OFFICIAL_CATALOG_PRICES.premium3 === 147, "premium 3");
assert(OFFICIAL_CATALOG_PRICES.premium6 === 249, "premium 6");
assert(resolveCatalogPrice("essential", 3)?.amount === 87, "catalog essential 3");
assert(resolveCatalogPrice("premium", 6)?.amount === 249, "catalog premium 6");

// T16–T21 states
assert(resolveMembershipLifecycle(sampleRow({ subscriptionStatus: "active" })) === "ACTIVE", "active");
assert(resolveMembershipLifecycle(sampleRow({ subscriptionStatus: "past_due" })) === "PAST_DUE", "past due");
assert(
  resolveMembershipLifecycle(sampleRow({ cancelAtPeriodEnd: true, autoRenew: false, subscriptionStatus: "active" })) ===
    "CANCEL_AT_PERIOD_END",
  "cancel at period end",
);
assert(
  resolveMembershipLifecycle(
    sampleRow({ cancelAtPeriodEnd: true, autoRenew: false, subscriptionStatus: "cancel_at_period_end" }),
  ) === "PROVIDER_CONFIRMATION_PENDING",
  "provider confirmation pending",
);
assert(resolveMembershipLifecycle(sampleRow({ subscriptionStatus: "expired", isActive: false })) === "EXPIRED", "expired");
assert(resolveMembershipLifecycle(sampleRow({ subscriptionStatus: "refunded" })) === "REFUNDED", "refunded");

// T22–T28 payment history / exceptions / provider unavailable
assert(membershipWorkspace.includes("سجل المدفوعات"), "payment history");
assert(membershipWorkspace.includes("لا توجد معاملات مسجلة"), "empty payment history");
assert(pspPanel.includes("فتح العميل"), "psp client link");
assert(exceptionsPanel.includes("لا توجد استثناءات دفع"), "empty exceptions copy");
assert(billingOverview.includes("ProviderBindingBanner"), "provider banner");

// T29–T31 provider events
assert(providerPanel.includes("لا توجد أحداث مزود"), "provider events empty");
assert(!providerPanel.includes("raw_payload"), "no raw payload field");
assert(!providerPanel.includes("signature"), "no signature");

// T32–T34 legacy separation
assert(paymentsRoute.includes('"legacy"'), "legacy section");
assert(paymentsRoute.includes("acceptLeadPayment"), "legacy accept preserved");
assert(!membershipsPage.includes("Mark as Paid"), "no mark paid");

// T35–T40 trusted boundaries
assert(!membershipsPage.includes("Grant Premium"), "no grant premium");
assert(!pspPanel.includes("updateLeadPaymentStatus"), "psp no legacy mutation");
assert(!membershipWorkspace.includes("updateMembership"), "no membership mutation");
assert(!membershipWorkspace.includes("Mark as Paid"), "no mark paid in workspace");

// T41–T43 audit / source labels
assert(membershipWorkspace.includes("سجل العمليات"), "audit link");
assert(membershipSourceLabel("legacy_bank") === "LEGACY-MANUAL", "legacy source label");
assert(membershipWorkspace.includes("مصدر الحقيقة"), "source of truth");

// T44 dashboard integration — nav billing overview
const billingNav = ADMIN_NAV_GROUPS.find((group) => group.id === "billing");
assert(billingNav?.items.some((item) => item.to === "/admin/memberships"), "memberships nav");
assert(billingNav?.items.some((item) => item.to === "/admin/payments"), "payments nav");
assert(billingOverview.includes("createFileRoute"), "billing overview route kept");

// T46–T48 RTL/mobile/a11y basics
assert(styles.includes(".cc-mobile-membership-cards"), "mobile membership cards css");
assert(membershipsPage.includes("aria-label"), "a11y filters");
assert(membershipsPage.includes("AdminStatusBadge"), "status badges not color-only");

// T49–T50 empty/error
assert(exceptionsPanel.includes("AdminErrorState"), "error isolation exceptions");
assert(pspPanel.includes("تعذر تحميل بيانات المدفوعات"), "psp error copy");

// T51–T54 security surface
assert(!pspPanel.includes("cvv"), "no cvv");
assert(!pspPanel.includes("PAN"), "no pan");

// filters
const filtered = filterMembershipRows(
  [sampleRow({ tier: "premium" }), sampleRow({ tier: "essential" })],
  { plan: "premium", status: "all", needsAttention: false, autoRenew: "all", provider: "all" },
);
assert(filtered.length === 1 && filtered[0].tier === "premium", "plan filter");

assert(membershipNeedsAttention(sampleRow({ subscriptionStatus: "past_due" })), "needs attention past due");
assert(formatMembershipPlanPrice(sampleRow({ tier: "essential", billingPeriodMonths: 3, priceAmount: 87 })).includes("$87"), "price display");

const quick = buildBillingQuickStatus(
  {
    unreadThreads: 0,
    waitingCoaching: 0,
    subscriptionAttention: 2,
    legacyPendingPayments: 1,
    pspFailedEvents: 0,
    openSupportTickets: 0,
    trainingReviewsDue: 0,
    nutritionConflicts: 0,
  },
  [sampleRow({ subscriptionStatus: "past_due" })],
  [{ exceptionId: "1", exceptionType: "legacy_bank_pending", priority: "high", subjectLabel: "x", detail: "d", occurredAt: new Date().toISOString(), href: "/admin/payments?section=legacy" }],
);
assert(quick.legacyPending === 1, "legacy pending kpi");
assert(quick.paymentExceptions >= 1, "exceptions kpi");

console.log("admin-a6.test.ts: all assertions passed");
