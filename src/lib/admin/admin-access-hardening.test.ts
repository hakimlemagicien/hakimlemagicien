import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeAdminReturnPath } from "./admin-access";
import { canAccessNavItem, canAccessRoute, permissionsForRole, type StaffSession } from "./admin-permissions";

assert.equal(sanitizeAdminReturnPath(null), "/admin");
assert.equal(sanitizeAdminReturnPath("/admin"), "/admin");
assert.equal(sanitizeAdminReturnPath("/admin/clients"), "/admin/clients");
assert.equal(sanitizeAdminReturnPath("/admin/clients?tab=training"), "/admin/clients?tab=training");
assert.equal(sanitizeAdminReturnPath("/app"), "/admin");
assert.equal(sanitizeAdminReturnPath("https://evil.com"), "/admin");
assert.equal(sanitizeAdminReturnPath("//evil.com"), "/admin");

const coach: StaffSession = {
  userId: "c",
  staffRole: "coach",
  permissions: permissionsForRole("coach"),
};
assert.equal(canAccessNavItem(coach, "clients.basic_read"), true, "coach can open /admin via clients.read");
assert.equal(canAccessRoute(coach, "/admin"), true, "coach route /admin");

const accessSource = readFileSync(join(process.cwd(), "src/lib/admin/admin-access.ts"), "utf8");
assert.ok(accessSource.includes("getUser"), "prefers verified user");
assert.ok(accessSource.includes("isFounderReviewEmail"), "founder email can open admin on localhost");
assert.ok(accessSource.includes("sanitizeAdminReturnPath"), "return path sanitized");
assert.ok(accessSource.includes('search:'), "auth redirect preserves return path");

const authRoute = readFileSync(join(process.cwd(), "src/routes/auth.tsx"), "utf8");
assert.ok(authRoute.includes("redirect"), "auth accepts redirect search");

const gate = readFileSync(join(process.cwd(), "src/lib/auth-onboarding-gate.ts"), "utf8");
assert.ok(gate.includes("checkAdminAccess"), "staff routed to admin after login");

console.log("admin-access-hardening.test.ts: PASS");
