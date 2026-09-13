#!/usr/bin/env npx tsx
/**
 * Phase 6 — import Pilot 4 into LOCAL Supabase DB only.
 * Does NOT touch Staging/Production.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { importPilot4ToLocalDb } from "../src/lib/platform/training-templates/pilot-4/import-db.ts";

const first = await importPilot4ToLocalDb();
const second = await importPilot4ToLocalDb();

const outDir = join(process.cwd(), ".tmp/pilot-4-db-import");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "import-report.json"),
  JSON.stringify({ first, second, note: "second run must not create duplicates" }, null, 2),
);

console.log(JSON.stringify({ first, second }, null, 2));

if (first.imported_count !== 4 || first.broken_exercise_references !== 0) {
  console.error("Pilot DB import failed validation");
  process.exit(1);
}
if (second.created_count !== 0) {
  console.error("Idempotent import created duplicates/new rows on second run");
  process.exit(1);
}
if (first.published !== 4 || second.published !== 4) {
  console.error("Expected 4 published pilots");
  process.exit(1);
}

console.log("Pilot 4 LOCAL DB import OK — storage=LOCAL_DB database_applied=true");
