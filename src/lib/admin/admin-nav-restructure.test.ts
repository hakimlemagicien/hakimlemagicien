import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_PRIMARY,
  isAdminNavActive,
  listAdminNavHrefs,
} from "./admin-nav";
import { adminNavIcon } from "./admin-nav-icons";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(
  ADMIN_NAV_PRIMARY.to === "/admin" && ADMIN_NAV_PRIMARY.label === "مركز التشغيل",
  "command center first",
);
assert(
  ADMIN_NAV_GROUPS.map((g) => g.id).join(",") ===
    "clients,training,nutrition,billing,content,system",
  "group order",
);

const clients = ADMIN_NAV_GROUPS.find((g) => g.id === "clients")
  ?.items.map((i) => i.to)
  .join(",");
assert(clients === "/admin/clients,/admin/messages,/admin/progress", "clients group");

const training = ADMIN_NAV_GROUPS.find((g) => g.id === "training")
  ?.items.map((i) => `${i.to}:${i.label}`)
  .join(",");
assert(
  training ===
    "/admin/programs:البرامج التدريبية,/admin/automation:أتمتة البرامج,/admin/exercises:مكتبة التمارين",
  "training group",
);

const nutrition = ADMIN_NAV_GROUPS.find((g) => g.id === "nutrition")
  ?.items.map((i) => i.to)
  .join(",");
assert(
  nutrition === "/admin/nutrition/templates,/admin/nutrition/operations,/admin/nutrition",
  "nutrition group",
);

const billing = ADMIN_NAV_GROUPS.find((g) => g.id === "billing")
  ?.items.map((i) => i.to)
  .join(",");
assert(billing === "/admin/memberships,/admin/payments,/admin/commercial", "billing group");

const hrefs = listAdminNavHrefs();
assert(hrefs[0] === "/admin", "primary href first");
assert(new Set(hrefs).size === hrefs.length, "no duplicate hrefs");
assert(!hrefs.includes("/admin/billing"), "billing overview not in sidebar");
assert(!hrefs.includes("/admin/training"), "training overview not in sidebar");
assert(hrefs.includes("/admin/nutrition/operations"), "nutrition ops is a live sidebar route");

assert(isAdminNavActive("/admin", "/admin"), "command center exact");
assert(!isAdminNavActive("/admin/clients", "/admin"), "clients not command center");
assert(isAdminNavActive("/admin/clients/abc", "/admin/clients"), "nested client 360");
assert(!isAdminNavActive("/admin/clients/abc", "/admin/messages"), "messages not on 360");
assert(isAdminNavActive("/admin/messages/xyz", "/admin/messages"), "nested messages");
const HomeIcon = adminNavIcon("home");
assert(Boolean(HomeIcon), "lucide home");

const system = ADMIN_NAV_GROUPS.find((g) => g.id === "system")?.items ?? [];
assert(
  system.some(
    (i) =>
      i.to === "/admin/settings" && i.label === "إدارة الفريق والصلاحيات" && i.status === "live",
  ),
  "staff at settings",
);
assert(!system.some((i) => i.to === "/admin/support"), "support not in sidebar");
assert(
  system.some((i) => i.to === "/admin/audit" && i.status === "live"),
  "audit is a live operational route",
);
assert(
  system.every((i) => i.status === "live"),
  "system operations are live",
);
assert(isAdminNavActive("/admin/support", "/admin/settings"), "support highlights team hub");
assert(!isAdminNavActive("/admin/audit", "/admin/settings"), "audit does not highlight team hub");
assert(isAdminNavActive("/admin/audit", "/admin/audit"), "audit highlights its own route");

import {
  ADMIN_MOBILE_BOTTOM_NAV,
  ADMIN_MOBILE_MORE_LINKS,
  isAdminMobileBottomNavActive,
} from "./admin-nav";

assert(
  ADMIN_MOBILE_BOTTOM_NAV.map((i) => i.label).join(",") === "الرئيسية,العملاء,التدريب,التغذية",
  "mobile tabs",
);
assert(ADMIN_MOBILE_MORE_LINKS.length >= 5, "more sheet has secondary modules");
assert(
  isAdminMobileBottomNavActive("/admin/training/reviews", "/admin/programs"),
  "training hub under programs tab",
);
assert(
  isAdminMobileBottomNavActive("/admin/nutrition/operations", "/admin/nutrition"),
  "nutrition ops under nutrition tab",
);
assert(!isAdminMobileBottomNavActive("/admin/clients", "/admin"), "clients not home");

console.log("admin-nav-restructure.test.ts passed");
