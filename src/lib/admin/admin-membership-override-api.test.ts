import assert from "node:assert/strict";
import {
  estimateMembershipEndDate,
  parseMembershipOverrideError,
} from "./admin-membership-override-api";

assert.equal(estimateMembershipEndDate("free", 3), null, "free has no end");
const end = estimateMembershipEndDate("premium", 3, new Date("2026-01-15T12:00:00Z"));
assert.ok(end, "paid end exists");
assert.equal(end?.getUTCMonth(), 3, "adds 3 months from January → April");

assert.match(parseMembershipOverrideError({ message: "active_psp_subscription" }), /مزوّد/);
assert.match(parseMembershipOverrideError({ message: "reason_required" }), /السبب/);
assert.match(parseMembershipOverrideError({ message: "forbidden" }), /صلاحية/);

console.log("admin-membership-override-api.test.ts: passed");
