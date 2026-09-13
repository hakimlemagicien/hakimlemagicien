#!/usr/bin/env npx tsx
/**
 * Phase 5 Pilot 4 local import runner.
 * Does NOT touch Staging/Production databases.
 */
import { getPilot4Catalog } from "../src/lib/platform/training-templates/pilot-4/index.ts";
import { importPilot4Local } from "../src/lib/platform/training-templates/pilot-4/import-idempotent.ts";

const report = importPilot4Local({ force: true });
const catalog = getPilot4Catalog();

console.log(JSON.stringify({ report, audits: catalog.map((c) => c.exercise_audit) }, null, 2));

if (report.imported_count !== 4) {
  console.error("Expected 4 pilots");
  process.exit(1);
}
if (report.broken_exercise_references !== 0) {
  console.error("Broken exercise references");
  process.exit(1);
}
if (report.session_policy_issues.length) {
  console.error(report.session_policy_issues);
  process.exit(1);
}
if (report.contract_valid !== 4) {
  console.error("Contract validation failed");
  process.exit(1);
}

console.log("Pilot 4 local import OK — storage=LOCAL_CATALOG database_applied=false");
