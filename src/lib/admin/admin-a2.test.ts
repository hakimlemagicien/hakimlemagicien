import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CLIENT_360_SECTIONS,
  CLIENT_360_SECTION_LABELS,
  NUTRITION_BOUNDARIES,
  PROGRAM_BOUNDARIES,
  normalizeClient360Tab,
} from "./admin-architecture";
import { ADMIN_NAV_GROUPS, listAdminNavHrefs } from "./admin-nav";
import { isAdminNavActive } from "./admin-nav";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const shellSource = readFileSync(resolve(process.cwd(), "src/components/admin/AdminShell.tsx"), "utf8");
const clientRoute = readFileSync(resolve(process.cwd(), "src/routes/admin/clients/$clientId.tsx"), "utf8");
const matrixSource = readFileSync(resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"), "utf8");
const core100 = readFileSync(resolve(process.cwd(), "src/lib/platform/strategy-matrix/core-100.ts"), "utf8");
const reviewSource = readFileSync(resolve(process.cwd(), "src/lib/platform/coach-override/review.ts"), "utf8");
const routeGuard = readFileSync(resolve(process.cwd(), "src/routes/admin/route.tsx"), "utf8");

// T1 — 7 navigation sections
assert(ADMIN_NAV_GROUPS.length === 7, "seven nav sections");

// T2 — no duplicate navigation hrefs
const hrefs = listAdminNavHrefs();
assert(new Set(hrefs).size === hrefs.length, "no duplicate nav hrefs");
assert(!hrefs.includes("/admin/exercises") || hrefs.filter((h) => h === "/admin/exercises").length === 1, "single exercises link");

// T3 — active state helper
assert(isAdminNavActive("/admin/clients", "/admin/clients"), "clients active");
assert(!isAdminNavActive("/admin/clients/abc", "/admin/messages"), "messages not active on client 360");

// T4 — foundation badge
assert(shellSource.includes("قريبًا"), "foundation soon badge in shell");
assert(!shellSource.includes(">أساس<"), "no foundation label in shell");

// T5 — environment badge
assert(shellSource.includes("AdminEnvironmentBadge"), "environment badge preserved");

// T6 — truthful client search label
assert(shellSource.includes("ابحث عن عميل بالاسم أو البريد"), "truthful search placeholder");

// T7 — client route
assert(hrefs.includes("/admin/clients"), "clients in nav");
assert(clientRoute.includes('to="/admin/clients"'), "client directory link");

// T8 — Client 360 seven tabs
assert(CLIENT_360_SECTIONS.length === 7, "seven client 360 tabs");
assert(CLIENT_360_SECTIONS.join(",") === "overview,training,nutrition,progress,membership,activity,notes", "tab order");

// T9 — overview route
assert(CLIENT_360_SECTIONS[0] === "overview", "overview default section");
assert(normalizeClient360Tab(undefined) === "overview", "default tab");

// T10 — training workspace preserved
assert(clientRoute.includes("ClientTrainingWorkspace"), "training workspace");

// T11 — nutrition workspace preserved
assert(clientRoute.includes("ClientNutritionWorkspace"), "nutrition workspace");

// T12 — membership tab
assert(CLIENT_360_SECTIONS.includes("membership"), "membership tab");
assert(clientRoute.includes("ClientMembershipWorkspace"), "membership workspace");

// T13 — activity tab
assert(CLIENT_360_SECTIONS.includes("activity"), "activity tab");
assert(clientRoute.includes("ClientActivityPanel"), "activity panel");

// T14 — notes preserved
assert(CLIENT_360_SECTIONS.includes("notes"), "notes tab");
assert(clientRoute.includes("listAdminClientNotes"), "notes api");

// T15 — messages CTA (not tab)
assert(!CLIENT_360_SECTIONS.includes("messages" as never), "no messages tab");
assert(clientRoute.includes("مراسلة العميل"), "message CTA");

// T16 — library/assignment separation
assert(PROGRAM_BOUNDARIES.template !== PROGRAM_BOUNDARIES.assigned, "program boundary");
assert(NUTRITION_BOUNDARIES.library !== NUTRITION_BOUNDARIES.plan, "nutrition boundary");

// T17 — MatrixImpactCard preserved
assert(matrixSource.includes("MatrixImpactCard"), "matrix card component");

// T18 — BLOCKED cannot bypass
assert(!matrixSource.includes("متابعة رغم"), "no bypass copy");

// T19 — Core 100 unchanged
assert(core100.includes("MAAKFIT_V1_CORE_100"), "core 100 intact");
assert(reviewSource.includes("SAFE_WITH_IMPACT"), "matrix review intact");

// T20 — admin guard preserved
assert(routeGuard.includes("requireAdminRouteAccess") || routeGuard.includes("checkAdminAccess"), "admin guard");

// T21 — RTL
assert(shellSource.includes('dir="rtl"'), "rtl shell");
assert(styles.includes("padding-inline"), "rtl logical props");

// T22 — mobile navigation
assert(styles.includes(".cc-sidebar--dark.is-open"), "mobile drawer");

// T23 — no fake analytics in client 360
assert(!clientRoute.includes("sparkline"), "no fake analytics");

// T24 — payments routes preserved
assert(hrefs.includes("/admin/payments"), "payments route");
assert(hrefs.includes("/admin/memberships"), "memberships route");

// T25 — regression labels
assert(CLIENT_360_SECTION_LABELS.membership === "العضوية والفوترة", "membership label");
assert(normalizeClient360Tab("history") === "activity", "legacy history maps to activity");
assert(normalizeClient360Tab("messages") === "overview", "legacy messages maps to overview");

// Analytics in system nav (foundation)
const systemItems = ADMIN_NAV_GROUPS.find((g) => g.id === "system")?.items ?? [];
assert(systemItems.some((item) => item.to === "/admin/analytics" && item.status === "foundation"), "analytics foundation nav");

console.log("admin-a2 tests passed");
