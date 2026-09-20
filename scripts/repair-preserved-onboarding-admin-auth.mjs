import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ADMIN_ID = "907c3c72-ccd4-4035-88f6-a854496b10e6";
const ADMIN_EMAIL = "onboarding-admin@example.test";
const REQUIRED_CONFIRMATION = "REPAIR_PRESERVED_ONBOARDING_ADMIN_AUTH";
const apply = process.argv.includes("--apply");
const confirmation = process.argv.find((arg) => arg.startsWith("--confirm="))?.slice(10);
if (apply && confirmation !== REQUIRED_CONFIRMATION) {
  throw new Error(`Apply requires --confirm=${REQUIRED_CONFIRMATION}`);
}

const projectRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(projectRoot, ".launch-backups", `auth-admin-repair-${timestamp}`);
mkdirSync(backupDir, { recursive: true, mode: 0o700 });
chmodSync(backupDir, 0o700);

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function writePrivate(name, value) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  const path = join(backupDir, name);
  writeFileSync(path, content, { encoding: "utf8", mode: 0o600 });
  chmodSync(path, 0o600);
  return { path, sha256: sha256(content) };
}

function linkedQuery(sql) {
  const output = execFileSync(
    "supabase",
    ["db", "query", "--linked", "--output", "json", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const jsonStart = output.indexOf("{");
  if (jsonStart < 0) throw new Error("Supabase query returned no JSON result");
  return JSON.parse(output.slice(jsonStart));
}

const beforeSql = `
BEGIN READ ONLY;
SELECT jsonb_build_object(
  'auth_row', to_jsonb(u),
  'admin_roles', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM public.user_roles r WHERE r.user_id=u.id), '[]'::jsonb),
  'staff_rows', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM public.staff_members s WHERE s.user_id=u.id), '[]'::jsonb),
  'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id=u.id)
)
FROM auth.users u
WHERE u.id='${ADMIN_ID}'::uuid AND u.email='${ADMIN_EMAIL}';
COMMIT;`;

const beforeResult = linkedQuery(beforeSql);
if (!Array.isArray(beforeResult.rows) || beforeResult.rows.length !== 1) {
  throw new Error("Preserved admin Auth row is missing or ambiguous");
}
const before = beforeResult.rows[0].jsonb_build_object;
if (!before.admin_roles?.some((row) => row.role === "admin")) {
  throw new Error("Preserved account has no admin role");
}
if (!before.staff_rows?.some((row) => row.status === "active")) {
  throw new Error("Preserved account has no active staff row");
}

const beforeFile = writePrivate("auth-admin-before.json", before);

const report = {
  mode: apply ? "APPLY" : "DRY_RUN",
  admin_id: ADMIN_ID,
  admin_email: ADMIN_EMAIL,
  before_file: beforeFile,
  fields: ["confirmation_token", "recovery_token", "email_change", "email_change_token_new"],
  before_null: Object.fromEntries(
    ["confirmation_token", "recovery_token", "email_change", "email_change_token_new"]
      .map((field) => [field, before.auth_row[field] === null]),
  ),
  after: null,
  auth_service: null,
};

if (apply) {
  const repairSql = `
BEGIN;
DO $$
DECLARE v_updated integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.user_roles r ON r.user_id=u.id AND r.role='admin'
    JOIN public.staff_members s ON s.user_id=u.id AND s.status='active'
    WHERE u.id='${ADMIN_ID}'::uuid AND u.email='${ADMIN_EMAIL}'
  ) THEN
    RAISE EXCEPTION 'Preserved admin verification failed';
  END IF;

  UPDATE auth.users
  SET confirmation_token=COALESCE(confirmation_token,''),
      recovery_token=COALESCE(recovery_token,''),
      email_change=COALESCE(email_change,''),
      email_change_token_new=COALESCE(email_change_token_new,'')
  WHERE id='${ADMIN_ID}'::uuid AND email='${ADMIN_EMAIL}';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'Expected one Auth row update, got %', v_updated;
  END IF;
END $$;
COMMIT;

SELECT jsonb_build_object(
  'id',u.id,
  'email',u.email,
  'confirmation_token_fixed',u.confirmation_token='',
  'recovery_token_fixed',u.recovery_token='',
  'email_change_fixed',u.email_change='',
  'email_change_token_new_fixed',u.email_change_token_new='',
  'admin_role',EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=u.id AND r.role='admin'),
  'active_staff',EXISTS(SELECT 1 FROM public.staff_members s WHERE s.user_id=u.id AND s.status='active'),
  'profile_preserved',EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=u.id)
)
FROM auth.users u
WHERE u.id='${ADMIN_ID}'::uuid AND u.email='${ADMIN_EMAIL}';`;

  const afterResult = linkedQuery(repairSql);
  if (!Array.isArray(afterResult.rows) || afterResult.rows.length !== 1) {
    throw new Error("Auth repair verification returned an unexpected result");
  }
  report.after = afterResult.rows[0].jsonb_build_object;

  const envText = readFileSync(join(projectRoot, ".env"), "utf8");
  const envValue = (name) => {
    const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
    if (!match) throw new Error(`Missing ${name}`);
    return match[1].trim().replace(/^['\"]|['\"]$/g, "");
  };
  const baseUrl = envValue("VITE_SUPABASE_URL");
  const projectRef = new URL(baseUrl).hostname.split(".")[0];
  const keyMetadata = JSON.parse(execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ));
  const serviceKey = keyMetadata.find(
    (entry) => entry.name === "service_role" && entry.type === "legacy",
  )?.api_key;
  if (!serviceKey) throw new Error("Production service-role key unavailable");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const [singleResponse, listResponse] = await Promise.all([
    fetch(`${baseUrl}/auth/v1/admin/users/${ADMIN_ID}`, { headers }),
    fetch(`${baseUrl}/auth/v1/admin/users?page=1&per_page=50`, { headers }),
  ]);
  report.auth_service = {
    single_user_status: singleResponse.status,
    list_users_status: listResponse.status,
    pass: singleResponse.ok && listResponse.ok,
  };
}

const reportFile = writePrivate("repair-report.json", report);
const manifest = {
  created_at: new Date().toISOString(),
  backup_dir: backupDir,
  before: beforeFile,
  report: reportFile,
};
const manifestFile = writePrivate("manifest.json", manifest);

console.log(JSON.stringify({
  mode: report.mode,
  admin_id: ADMIN_ID,
  before_null: report.before_null,
  after: report.after,
  auth_service: report.auth_service,
  backup_dir: backupDir,
  manifest_sha256: manifestFile.sha256,
}, null, 2));
