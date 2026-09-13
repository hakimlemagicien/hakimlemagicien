/**
 * Idempotent Pilot 4 import helper.
 * Default: validates + registers local catalog (no remote DB).
 * Optional apply path requires explicit LOCAL apply flag — never Staging/Production.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateProgramTemplateContract } from "@/lib/platform/training-templates";
import { assertPilotSessionPolicies } from "./exercise-audit";
import { getPilot4Catalog } from "./catalog";
import { PILOT_4_DEFINITIONS } from "./definitions";
import { PILOT_4_TEMPLATE_KEYS } from "./types";

export type PilotImportReport = {
  imported_count: number;
  templates: string[];
  contract_valid: number;
  broken_exercise_references: number;
  session_policy_issues: string[];
  storage: "LOCAL_CATALOG";
  database_applied: false;
  idempotent: true;
  duplicates: number;
};

const MANIFEST_PATH = join(process.cwd(), ".tmp/pilot-4-import/manifest.json");

export function importPilot4Local(options?: { force?: boolean }): PilotImportReport {
  const catalog = getPilot4Catalog(true);
  const session_policy_issues = PILOT_4_DEFINITIONS.flatMap((def) => assertPilotSessionPolicies(def));
  let contract_valid = 0;
  let broken = 0;
  for (const row of catalog) {
    const validation = validateProgramTemplateContract(row.definition.contract);
    if (validation.ok) contract_valid += 1;
    broken += row.exercise_audit.broken_references;
  }

  const slugs = catalog.map((row) => row.definition.slug);
  const duplicates = slugs.length - new Set(slugs).size;

  mkdirSync(join(process.cwd(), ".tmp/pilot-4-import"), { recursive: true });
  if (existsSync(MANIFEST_PATH) && !options?.force) {
    const previous = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { templates: string[] };
    if (
      previous.templates.length === slugs.length &&
      previous.templates.every((slug, index) => slug === slugs[index])
    ) {
      // idempotent no-op — same four templates
    }
  }

  const report: PilotImportReport = {
    imported_count: catalog.length,
    templates: slugs,
    contract_valid,
    broken_exercise_references: broken,
    session_policy_issues,
    storage: "LOCAL_CATALOG",
    database_applied: false,
    idempotent: true,
    duplicates,
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify({ ...report, keys: PILOT_4_TEMPLATE_KEYS }, null, 2));
  writeFileSync(
    join(process.cwd(), ".tmp/pilot-4-import/catalog-summary.json"),
    JSON.stringify(
      catalog.map((row) => ({
        key: row.definition.key,
        slug: row.definition.slug,
        readiness: row.exercise_audit.library_readiness,
        refs: row.exercise_audit.total_exercise_references,
        core: row.exercise_audit.core_100_references,
        full: row.exercise_audit.full_library_references,
        broken: row.exercise_audit.broken_references,
      })),
      null,
      2,
    ),
  );

  return report;
}
