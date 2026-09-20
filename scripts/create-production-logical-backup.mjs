import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const envText = readFileSync(join(projectRoot, ".env"), "utf8");

function envValue(name) {
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!match) throw new Error(`Missing ${name}`);
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function writePrivate(path, content) {
  writeFileSync(path, content, { encoding: "utf8", mode: 0o600 });
  chmodSync(path, 0o600);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = join(projectRoot, ".launch-backups");
const backupDir = join(backupRoot, timestamp);
mkdirSync(backupDir, { recursive: true, mode: 0o700 });
chmodSync(backupRoot, 0o700);
chmodSync(backupDir, 0o700);

const baseUrl = envValue("VITE_SUPABASE_URL");
const projectRef = new URL(baseUrl).hostname.split(".")[0];
const keyMetadata = JSON.parse(
  execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ),
);
const serviceKey = keyMetadata.find(
  (entry) => entry.name === "service_role" && entry.type === "legacy",
)?.api_key;
if (!serviceKey) throw new Error("Production service-role backup key is unavailable");

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Accept-Profile": "public",
};

const openApiResponse = await fetch(`${baseUrl}/rest/v1/`, { headers });
if (!openApiResponse.ok) throw new Error(`OpenAPI backup failed (${openApiResponse.status})`);
const openApi = await openApiResponse.json();
const definitions = openApi.definitions ?? {};
const openApiText = `${JSON.stringify(openApi, null, 2)}\n`;
writePrivate(join(backupDir, "public-openapi-schema.json"), openApiText);

async function exportTable(table) {
  const output = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*`, {
      headers: { ...headers, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!response.ok && response.status !== 206) {
      throw new Error(`Export failed for ${table} (${response.status})`);
    }
    const page = await response.json();
    output.push(...page);
    if (page.length < pageSize) break;
  }
  const content = `${JSON.stringify(output, null, 2)}\n`;
  writePrivate(join(backupDir, `${table}.json`), content);
  return { rows: output.length, sha256: sha256(content) };
}

const requestedTables = [...new Set([
  ...Object.keys(definitions),
  "product_prices",
  "product_promotions",
  "promo_codes",
  "promo_code_redemptions",
  "nutrition_templates",
])].sort();

const tableManifest = {};
for (const table of requestedTables) {
  if (!definitions[table]) {
    tableManifest[table] = { present: false, rows: null, sha256: null };
    continue;
  }
  tableManifest[table] = { present: true, ...(await exportTable(table)) };
}

const linked = execFileSync(
  "supabase",
  ["db", "dump", "--linked", "--schema", "public", "--dry-run"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
function linkedValue(name) {
  const match = linked.match(new RegExp(`export ${name}="([^"]+)"`));
  if (!match) throw new Error(`Missing linked database value: ${name}`);
  return match[1];
}

function normalizeAuthUser(user) {
  return {
    id: user.id,
    email: user.email ?? null,
    aud: user.aud ?? null,
    role: user.role ?? null,
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
    confirmed_at: user.confirmed_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    banned_until: user.banned_until ?? null,
    deleted_at: user.deleted_at ?? null,
    providers: user.app_metadata?.providers ?? [],
    identities: Array.isArray(user.identities)
      ? user.identities.map((identity) => ({
          id: identity.id,
          provider: identity.provider,
          created_at: identity.created_at ?? null,
          updated_at: identity.updated_at ?? null,
        }))
      : [],
  };
}

const authUsers = [];
let authInventoryScope = "ALL_AUTH_USERS";
let authListError = null;
try {
  const authPageSize = 50;
  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${authPageSize}`,
      { headers },
    );
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }
    const payload = await response.json();
    const pageUsers = Array.isArray(payload?.users) ? payload.users : [];
    authUsers.push(...pageUsers.map(normalizeAuthUser));
    if (pageUsers.length < authPageSize) break;
  }
} catch (error) {
  authInventoryScope = "PROFILE_LINKED_USERS_ONLY";
  authListError = error instanceof Error ? error.message : String(error);
  const profiles = JSON.parse(readFileSync(join(backupDir, "profiles.json"), "utf8"));
  for (const profile of profiles) {
    const response = await fetch(`${baseUrl}/auth/v1/admin/users/${profile.id}`, { headers });
    if (response.ok) {
      authUsers.push(normalizeAuthUser(await response.json()));
    } else {
      authUsers.push({
        id: profile.id,
        email: profile.email ?? null,
        lookup_status: response.status,
        identities: [],
      });
    }
  }
}
const authContent = `${JSON.stringify(authUsers, null, 2)}\n`;
writePrivate(join(backupDir, "auth-users.json"), authContent);
const authInventory = {
  rows: authUsers.length,
  sha256: sha256(authContent),
  scope: authInventoryScope,
  complete: authInventoryScope === "ALL_AUTH_USERS",
  list_error: authListError,
};

const catalogSql = String.raw`
\pset tuples_only on
\pset format unaligned
\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL statement_timeout = '60s';

SELECT jsonb_build_object('kind','columns','rows',jsonb_agg(to_jsonb(c) ORDER BY c.table_name,c.ordinal_position))
FROM information_schema.columns c WHERE c.table_schema='public';

SELECT jsonb_build_object('kind','constraints','rows',jsonb_agg(jsonb_build_object(
  'table',cl.relname,'name',con.conname,'type',con.contype,'definition',pg_get_constraintdef(con.oid,true)
) ORDER BY cl.relname,con.conname))
FROM pg_constraint con JOIN pg_class cl ON cl.oid=con.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace
WHERE n.nspname='public';

SELECT jsonb_build_object('kind','indexes','rows',jsonb_agg(jsonb_build_object(
  'table',t.relname,'name',i.relname,'definition',pg_get_indexdef(i.oid)
) ORDER BY t.relname,i.relname))
FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_class t ON t.oid=x.indrelid
JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public';

SELECT jsonb_build_object('kind','functions','rows',jsonb_agg(jsonb_build_object(
  'signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid)
) ORDER BY p.oid::regprocedure::text))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public';

SELECT jsonb_build_object('kind','policies','rows',COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.tablename,p.policyname),'[]'::jsonb))
FROM pg_policies p WHERE p.schemaname='public';

SELECT jsonb_build_object('kind','table_grants','rows',COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.table_name,g.grantee,g.privilege_type),'[]'::jsonb))
FROM information_schema.role_table_grants g WHERE g.table_schema='public';

SELECT jsonb_build_object('kind','routine_grants','rows',COALESCE(jsonb_agg(to_jsonb(g) ORDER BY g.routine_name,g.grantee,g.privilege_type),'[]'::jsonb))
FROM information_schema.role_routine_grants g WHERE g.specific_schema='public';

SELECT jsonb_build_object('kind','triggers','rows',COALESCE(jsonb_agg(jsonb_build_object(
  'table',c.relname,'name',t.tgname,'definition',pg_get_triggerdef(t.oid,true)
) ORDER BY c.relname,t.tgname),'[]'::jsonb))
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND NOT t.tgisinternal;

SELECT jsonb_build_object('kind','enums','rows',COALESCE(jsonb_agg(jsonb_build_object(
  'type',typ.typname,'value',e.enumlabel,'sort',e.enumsortorder
) ORDER BY typ.typname,e.enumsortorder),'[]'::jsonb))
FROM pg_type typ JOIN pg_namespace n ON n.oid=typ.typnamespace JOIN pg_enum e ON e.enumtypid=typ.oid
WHERE n.nspname='public';

COMMIT;
`;

const catalog = spawnSync(
  "/opt/homebrew/bin/psql",
  [
    "--host", linkedValue("PGHOST"),
    "--port", linkedValue("PGPORT"),
    "--username", linkedValue("PGUSER"),
    "--dbname", linkedValue("PGDATABASE"),
    "--no-psqlrc",
  ],
  {
    input: catalogSql,
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: linkedValue("PGPASSWORD"), PGSSLMODE: "require" },
  },
);
if (catalog.status !== 0) throw new Error(`Catalog backup failed: ${catalog.stderr}`);
const catalogText = `${catalog.stdout.trim()}\n`;
writePrivate(join(backupDir, "database-catalog.jsonl"), catalogText);

const migrationHistory = execFileSync(
  "supabase",
  ["migration", "list", "--linked", "--output", "json"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const migrationHistoryText = `${migrationHistory.trim()}\n`;
writePrivate(join(backupDir, "migration-history.json"), migrationHistoryText);

const manifest = {
  created_at: new Date().toISOString(),
  project_ref: projectRef,
  backup_type: "LOGICAL_READ_ONLY_PRE_MIGRATION",
  pitr_enabled: false,
  files: {
    "public-openapi-schema.json": { sha256: sha256(openApiText) },
    "database-catalog.jsonl": { sha256: sha256(catalogText) },
    "migration-history.json": { sha256: sha256(migrationHistoryText) },
    "auth-users.json": authInventory,
  },
  tables: tableManifest,
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
writePrivate(join(backupDir, "manifest.json"), manifestText);

console.log(JSON.stringify({
  backup_dir: backupDir,
  pitr_enabled: false,
  exported_tables: Object.values(tableManifest).filter((entry) => entry.present).length,
  missing_tables: Object.entries(tableManifest).filter(([, entry]) => !entry.present).map(([table]) => table),
  total_rows: Object.values(tableManifest).reduce((sum, entry) => sum + (entry.rows ?? 0), 0),
  auth_users: authInventory.rows,
  auth_inventory_scope: authInventory.scope,
  auth_inventory_complete: authInventory.complete,
  manifest_sha256: sha256(manifestText),
}, null, 2));
