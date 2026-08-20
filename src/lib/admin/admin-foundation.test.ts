import {
  ATTENTION_SIGNAL_CONTRACTS,
  CLIENT_360_SECTIONS,
  CLIENT_APP_PREFIX,
  COMMAND_CENTER_DOMAIN,
  COMMAND_CENTER_PRODUCT,
  CONTENT_PUBLISHING_STATES,
  NOTIFICATION_CHANNELS,
  PROGRAM_BOUNDARIES,
  isAdminAppPath,
  isClientAppPath,
} from "./admin-architecture";
import { CURRENT_STAFF_ROLE, PLANNED_STAFF_ROLES, isCurrentStaffRole } from "./admin-access";
import { ADMIN_NAV_GROUPS, listAdminNavHrefs } from "./admin-nav";
import { ADMIN_CLIENT_MIN_QUERY, ADMIN_CLIENT_PAGE_SIZE } from "./admin-clients-api";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(COMMAND_CENTER_PRODUCT === "MAAKFIT", "product identity is MAAKFIT");
assert(COMMAND_CENTER_DOMAIN === "hakimlemagicien.com", "domain is unchanged in phase 1");
assert(CLIENT_APP_PREFIX === "/app", "client prefix");
assert(isClientAppPath("/app"), "/app is client");
assert(isClientAppPath("/app/nutrition"), "/app child is client");
assert(!isClientAppPath("/admin"), "admin is not client");
assert(isAdminAppPath("/admin"), "/admin is admin");
assert(isAdminAppPath("/admin/payments"), "payments is admin");
assert(!isAdminAppPath("/app"), "client is not admin");

const hrefs = listAdminNavHrefs();
assert(hrefs.every((href) => href.startsWith("/admin")), "nav stays inside /admin");
assert(!hrefs.some((href) => href.startsWith("/app")), "nav never points at client app");
assert(hrefs.includes("/admin/messages"), "coaching inbox is in nav");
assert(hrefs.includes("/admin/payments"), "payments is in nav");
assert(hrefs.includes("/admin/clients"), "clients foundation is in nav");
assert(ADMIN_NAV_GROUPS.length === 5, "five nav groups");

const liveItems = ADMIN_NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.status === "live");
assert(
  liveItems.every((item) =>
    [
      "/admin",
      "/admin/clients",
      "/admin/messages",
      "/admin/payments",
      "/admin/audit",
      "/admin/support",
    ].includes(item.to),
  ),
  "live nav is operational surfaces only",
);
assert(liveItems.some((item) => item.to === "/admin/clients"), "clients table is live");
assert(liveItems.some((item) => item.to === "/admin/audit"), "audit read is live");
assert(liveItems.some((item) => item.to === "/admin/support"), "support queue is live");

assert(PROGRAM_BOUNDARIES.template !== PROGRAM_BOUNDARIES.assigned, "template ≠ assigned program");
assert(CONTENT_PUBLISHING_STATES.join(",") === "draft,review,published,archived", "publishing states");
assert(NOTIFICATION_CHANNELS.admin !== NOTIFICATION_CHANNELS.client, "admin vs client notifications");
assert(CLIENT_360_SECTIONS.includes("overview"), "client 360 has overview");
assert(CLIENT_360_SECTIONS.includes("history"), "client 360 has history");
assert(ATTENTION_SIGNAL_CONTRACTS.some((item) => item.status === "LIVE"), "live signals exist");
assert(ATTENTION_SIGNAL_CONTRACTS.some((item) => item.status === "DOMAIN_RULE_REQUIRED"), "domain rules deferred");

assert(CURRENT_STAFF_ROLE === "admin", "current role remains admin");
assert(isCurrentStaffRole("admin"), "admin is staff");
assert(!isCurrentStaffRole("user"), "member role is not staff");
assert(PLANNED_STAFF_ROLES.includes("coach"), "future coach role is planned, not activated");
assert(ADMIN_CLIENT_MIN_QUERY >= 2, "client search is not load-all");
assert(ADMIN_CLIENT_PAGE_SIZE <= 25, "client search is paginated");

console.log("admin-foundation tests passed");
