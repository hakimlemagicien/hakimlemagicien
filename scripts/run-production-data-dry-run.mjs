import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const projectRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const migrationsDir = join(projectRoot, "supabase", "migrations");
const databaseUrl = process.env.DRY_RUN_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
const backupDir = resolve(process.argv[2] ?? "");

if (!databaseUrl.includes("127.0.0.1:55322") && !databaseUrl.includes("localhost:55322")) {
  throw new Error("Safety stop: this script only accepts the isolated local dry-run database on port 55322");
}
if (!backupDir || !existsSync(join(backupDir, "manifest.json"))) {
  throw new Error("Pass a valid logical backup directory as the first argument");
}

const pendingVersions = new Set([
  "20260912180000",
  "20260912190000",
  "20260912191000",
  "20260913120000",
  "20260913160000",
  "20260917120000",
  "20260917123000",
  "20260917124500",
  "20260917130000",
  "20260917140000",
  "20260917141000",
  "20260918100000",
  "20260918101000",
  "20260918102000",
  "20260918103000",
  "20260918104000",
  "20260918105000",
  "20260920120000",
  "20260920150000",
  "20260920151000",
  "20260920160000",
]);

const allMigrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const versionOf = (file) => file.slice(0, 14);
const baselineFiles = allMigrationFiles.filter((file) => !pendingVersions.has(versionOf(file)));
const pendingFiles = allMigrationFiles.filter((file) => pendingVersions.has(versionOf(file)));
if (pendingFiles.length !== pendingVersions.size) {
  throw new Error(`Expected ${pendingVersions.size} pending migrations, found ${pendingFiles.length}`);
}

function psql(args, options = {}) {
  return execFileSync("psql", [databaseUrl, "--no-psqlrc", "-q", "-v", "ON_ERROR_STOP=1", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runMigration(file) {
  process.stdout.write(`APPLY ${file}\n`);
  psql(["-f", join(migrationsDir, file)]);
}

const manifest = JSON.parse(readFileSync(join(backupDir, "manifest.json"), "utf8"));
for (const [file, expected] of Object.entries(manifest.files)) {
  const content = readFileSync(join(backupDir, file));
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== expected.sha256) throw new Error(`Backup checksum mismatch: ${file}`);
}
for (const [table, expected] of Object.entries(manifest.tables)) {
  if (!expected.present) continue;
  const content = readFileSync(join(backupDir, `${table}.json`));
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== expected.sha256) throw new Error(`Backup checksum mismatch: ${table}.json`);
  const rows = JSON.parse(content);
  if (rows.length !== expected.rows) throw new Error(`Backup row-count mismatch: ${table}`);
}
process.stdout.write("BACKUP_CHECKSUMS PASS\n");

const profilesTableExists =
  psql(["-Atc", "select to_regclass('public.profiles') is not null"], { capture: true }).trim() === "t";
const existingProfiles = profilesTableExists
  ? Number(psql(["-Atc", "select count(*) from public.profiles"], { capture: true }).trim())
  : 0;
if (existingProfiles !== 0) {
  throw new Error(`Safety stop: isolated database is not empty (profiles=${existingProfiles})`);
}

const resetSql = String.raw`
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
DELETE FROM auth.users;
`;
psql(["-c", resetSql]);
process.stdout.write("ISOLATED_RESET PASS\n");

for (const file of baselineFiles) runMigration(file);
process.stdout.write(`BASELINE_REPLAY PASS (${baselineFiles.length})\n`);

const client = new Client({ connectionString: databaseUrl });
await client.connect();

const importOrder = [
  "membership_tiers",
  "profiles",
  "user_roles",
  "staff_members",
  "memberships",
  "exercise_muscle_groups",
  "exercises",
  "client_exercise_experience",
  "program_templates",
  "program_template_weeks",
  "program_template_days",
  "program_template_exercises",
  "client_program_assignments",
  "client_program_weeks",
  "client_program_days",
  "client_program_exercises",
  "client_nutrition_profiles",
  "meals",
  "meal_ingredients",
  "client_nutrition_assignments",
  "client_nutrition_targets",
  "client_nutrition_slots",
  "client_nutrition_meal_logs",
  "client_nutrition_consumption_events",
  "nutrition_meal_swaps",
  "nutrition_decision_traces",
  "client_customer_journeys",
  "product_runtime_settings",
  "payments",
  "payment_provider_events",
];

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function primaryKeyColumns(table) {
  const result = await client.query(
    `select a.attname as column_name
       from pg_index i
       join pg_class c on c.oid = i.indrelid
       join pg_namespace n on n.oid = c.relnamespace
       join unnest(i.indkey) with ordinality k(attnum, ord) on true
       join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
      where n.nspname = 'public' and c.relname = $1 and i.indisprimary
      order by k.ord`,
    [table],
  );
  return result.rows.map((row) => row.column_name);
}

async function writableColumns(table) {
  const result = await client.query(
    `select column_name, data_type, udt_name
       from information_schema.columns
      where table_schema='public' and table_name=$1
        and is_generated='NEVER' and is_identity='NO'
      order by ordinal_position`,
    [table],
  );
  return result.rows;
}

await client.query("begin");
try {
  const presentTables = importOrder.filter((table) => manifest.tables[table]?.present);
  if (presentTables.length) {
    await client.query(`truncate ${presentTables.map((table) => `public.${quoteIdent(table)}`).join(", ")} cascade`);
  }

  const profileRows = JSON.parse(readFileSync(join(backupDir, "profiles.json"), "utf8"));
  for (const row of profileRows) {
    await client.query(
      `insert into auth.users
        (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
       values ($1, 'authenticated', 'authenticated', $2, '', now(), '{}'::jsonb, '{}'::jsonb, $3, $4)
       on conflict (id) do nothing`,
      [row.id, row.email, row.created_at, row.updated_at],
    );
  }
  // Auth's creation trigger creates placeholder profile/role rows. Replace those
  // placeholders with the exact logical backup rows before importing dependencies.
  await client.query("truncate public.user_roles, public.profiles cascade");

  for (const table of importOrder) {
    const expected = manifest.tables[table];
    if (!expected?.present) continue;
    const rows = JSON.parse(readFileSync(join(backupDir, `${table}.json`), "utf8"));
    const allowed = await writableColumns(table);
    const allowedNames = allowed.map((column) => column.column_name);
    const columnTypes = new Map(allowed.map((column) => [column.column_name, column.data_type]));
    const primaryKey = await primaryKeyColumns(table);
    if (!primaryKey.length && rows.length) throw new Error(`No primary key for ${table}`);

    for (const row of rows) {
      const columns = allowedNames.filter((column) => Object.hasOwn(row, column));
      const values = columns.map((column) => {
        const value = row[column];
        return (columnTypes.get(column) === "json" || columnTypes.get(column) === "jsonb") && value !== null && typeof value === "object"
          ? JSON.stringify(value)
          : value;
      });
      const updates = columns
        .filter((column) => !primaryKey.includes(column))
        .map((column) => `${quoteIdent(column)}=excluded.${quoteIdent(column)}`);
      const conflict = updates.length ? `do update set ${updates.join(",")}` : "do nothing";
      await client.query(
        `insert into public.${quoteIdent(table)} (${columns.map(quoteIdent).join(",")})
         values (${columns.map((_, index) => `$${index + 1}`).join(",")})
         on conflict (${primaryKey.map(quoteIdent).join(",")}) ${conflict}`,
        values,
      );
    }
    const count = Number((await client.query(`select count(*)::int as count from public.${quoteIdent(table)}`)).rows[0].count);
    if (count !== expected.rows) {
      throw new Error(`Restored count mismatch for ${table}: expected ${expected.rows}, received ${count}`);
    }
    process.stdout.write(`RESTORE ${table} ${count}\n`);
  }
  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
process.stdout.write("LOGICAL_RESTORE PASS\n");

for (const file of pendingFiles) runMigration(file);
process.stdout.write(`PENDING_MIGRATIONS PASS (${pendingFiles.length})\n`);

const verificationSql = String.raw`
DO $$
DECLARE missing_count integer;
BEGIN
  SELECT count(*) INTO missing_count
  FROM (VALUES ('product_prices'),('product_promotions'),('promo_codes'),('promo_code_redemptions'),('nutrition_templates')) v(name)
  WHERE to_regclass('public.' || v.name) IS NULL;
  IF missing_count <> 0 THEN RAISE EXCEPTION 'missing release tables: %', missing_count; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' AND t.typname='payment_method' AND e.enumlabel='other'
  ) THEN RAISE EXCEPTION 'payment_method.other is missing'; END IF;
END $$;

SELECT 'profiles=' || count(*) FROM public.profiles;
SELECT 'memberships=' || count(*) FROM public.memberships;
SELECT 'program_templates=' || count(*) FROM public.program_templates;
SELECT 'client_program_assignments=' || count(*) FROM public.client_program_assignments;
SELECT 'client_nutrition_assignments=' || count(*) FROM public.client_nutrition_assignments;
SELECT 'payments=' || count(*) FROM public.payments;
SELECT 'provider_events=' || count(*) FROM public.payment_provider_events;
SELECT 'dry_run_complete';
`;
psql(["-c", verificationSql]);
process.stdout.write(`DATA_BEARING_DRY_RUN PASS (${basename(backupDir)})\n`);
