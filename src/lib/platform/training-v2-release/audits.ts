import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

export function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

export function v2EngineFiles() {
  const dirs = [
    "src/lib/platform/prescription",
    "src/lib/platform/progression",
    "src/lib/platform/volume",
    "src/lib/platform/continuity",
    "src/lib/platform/goal-intelligence",
    "src/lib/platform/program-generation",
    "src/lib/platform/training-progress",
  ];
  const files: string[] = [];
  for (const dir of dirs) {
    for (const name of readdirSync(join(ROOT, dir))) {
      if (name.endsWith(".ts") && !name.endsWith(".test.ts")) files.push(join(dir, name));
    }
  }
  return files;
}

export function engineBlob() {
  return v2EngineFiles().map((file) => readSrc(file)).join("\n");
}

export function v2MigrationFiles() {
  return readdirSync(join(ROOT, "supabase/migrations"))
    .filter((name) => name.startsWith("20260821") || name === "20260821120000_training_engine_v2_data_contracts.sql")
    .sort();
}

export const V2_MIGRATIONS = [
  "20260821120000_training_engine_v2_data_contracts.sql",
  "20260821140000_exercise_library_v2_compatibility.sql",
  "20260821140100_exercise_library_v2_metadata_seed.sql",
  "20260821160000_progression_history_duration.sql",
  "20260821180000_client_loop_integration.sql",
] as const;
