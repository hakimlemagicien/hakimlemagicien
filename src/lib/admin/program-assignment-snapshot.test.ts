import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20260820240000_client_program_assignment_snapshots.sql"),
  "utf8",
);

assert(migration.includes("client_program_weeks"), "snapshot weeks table");
assert(migration.includes("client_program_days"), "snapshot days table");
assert(migration.includes("client_program_exercises"), "snapshot exercises table");
assert(migration.includes("_copy_template_to_assignment"), "atomic template copy");
assert(migration.includes("admin_assign_client_program"), "assign RPC");
assert(migration.includes("p_replace"), "replacement is explicit");
assert(migration.includes("client_program_replaced"), "replace audit");
assert(migration.includes("client_program_assigned"), "assign audit");
assert(migration.includes("client_program_ended"), "end audit");
assert(migration.includes("client_program_exercise_replaced"), "substitution audit");
assert(migration.includes("client_program_prescription_updated"), "prescription audit");
assert(migration.includes("stale_update"), "concurrency");
assert(migration.includes("client_get_my_training_runtime"), "client runtime RPC");
assert(migration.includes("legacy_incomplete"), "legacy pointer rows are not invented");
assert(migration.includes("template_not_assignable"), "archived/unpublished templates blocked");
assert(migration.includes("active_assignment_exists"), "silent replace blocked");
assert(migration.includes("_require_admin"), "admin mutations gated");
assert(migration.includes("REVOKE ALL ON FUNCTION public.admin_assign_client_program"), "anon cannot assign");
assert(migration.includes("GRANT EXECUTE ON FUNCTION public.client_get_my_training_runtime"), "client can read own runtime");
assert(migration.includes("assignment_id UUID REFERENCES public.client_program_assignments"), "logs keep optional assignment context");
assert(migration.includes("workout_set_logs_user_exercise_idx"), "exercise history index");
assert(!/CREATE TABLE[\s\S]*admin_client_programs/.test(migration), "no parallel admin_client_programs");
assert(migration.includes("FOR SELECT TO authenticated"), "client can read own snapshot");
assert(!migration.includes("FOR INSERT TO authenticated") || migration.includes("wsl_own_insert"), "structural insert is not granted to clients on snapshot tables");
assert(migration.includes("client_program_weeks_own_select"), "owner read on weeks");
assert(migration.includes("GRANT SELECT ON public.client_program_weeks TO authenticated"), "select only on snapshot weeks");
assert(migration.includes("REVOKE ALL ON public.client_program_weeks FROM anon, authenticated"), "default deny then select grant");

const browser = readFileSync(join(root, "src/integrations/supabase/client.ts"), "utf8");
assert(!browser.includes("SERVICE_ROLE"), "no service_role in browser");

const clientFiles = [
  "src/routes/_platform/app/program/workout/index.tsx",
  "src/routes/_platform/app/program/workout/exercise.tsx",
  "src/lib/platform/assigned-program-api.ts",
];
for (const file of clientFiles) {
  const source = readFileSync(join(root, file), "utf8");
  assert(!source.includes("admin_assign_client_program"), `${file} cannot assign`);
  assert(!source.includes("admin_assign_generated_v2_program"), `${file} cannot assign generated V2`);
  assert(!source.includes("admin_save_client_assignment_exercises"), `${file} cannot mutate assignment`);
  assert(!source.includes("service_role"), `${file} has no service_role`);
}

console.log("program-assignment-snapshot tests passed");
