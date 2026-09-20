#!/usr/bin/env node

/**
 * Read-only Production foundation audit.
 *
 * The Supabase CLI is used only to obtain its short-lived linked database
 * session variables. Credentials are kept in memory and are never printed.
 * Every SQL statement runs inside an explicitly read-only transaction.
 */

const { execFileSync, spawnSync } = require("node:child_process");

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

if (process.argv[2] === "--dump-schema") {
  const outputPath = process.argv[3];
  if (!outputPath) throw new Error("--dump-schema requires an output path");
  const dump = spawnSync(
    "/opt/homebrew/bin/pg_dump",
    [
      "--schema-only",
      "--no-data-for-failed-tables",
      "--no-owner",
      "--no-privileges",
      "--schema",
      "public",
      "--host",
      linkedValue("PGHOST"),
      "--port",
      linkedValue("PGPORT"),
      "--username",
      linkedValue("PGUSER"),
      "--dbname",
      linkedValue("PGDATABASE"),
      "--file",
      outputPath,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, PGPASSWORD: linkedValue("PGPASSWORD"), PGSSLMODE: "require" },
    },
  );
  if (dump.status !== 0) {
    process.stderr.write(dump.stderr || "Production schema dump failed.\n");
    process.exit(dump.status || 1);
  }
  process.stdout.write(`Production schema written to ${outputPath}\n`);
  process.exit(0);
}

const sql = String.raw`
\pset tuples_only on
\pset format unaligned
\set ON_ERROR_STOP on

BEGIN READ ONLY;
SET LOCAL statement_timeout = '45s';
SET LOCAL lock_timeout = '5s';

SELECT jsonb_build_object(
  'kind', 'audit_context',
  'transaction_read_only', current_setting('transaction_read_only'),
  'current_user', current_user,
  'session_user', session_user,
  'database', current_database(),
  'server_version', current_setting('server_version')
);

WITH requested(table_name) AS (
  VALUES
    ('program_templates'), ('program_template_exercises'),
    ('client_program_assignments'), ('client_program_exercises'),
    ('client_nutrition_assignments'), ('client_nutrition_profiles'),
    ('memberships'), ('profiles'), ('client_customer_journeys'),
    ('product_runtime_settings'), ('payments'), ('payment_provider_events'),
    ('user_roles'), ('staff_members'), ('promo_code_redemptions'),
    ('promo_codes'), ('product_prices'), ('product_promotions'),
    ('nutrition_templates'), ('nutrition_template_versions')
)
SELECT jsonb_build_object(
  'kind', 'table_presence',
  'table', table_name,
  'exists', to_regclass('public.' || table_name) IS NOT NULL,
  'select_allowed', CASE
    WHEN to_regclass('public.' || table_name) IS NULL THEN false
    ELSE has_table_privilege(current_user, to_regclass('public.' || table_name), 'SELECT')
  END
)
FROM requested
ORDER BY table_name;

SELECT format(
  'SELECT jsonb_build_object(''kind'',''row_count'',''table'',%L,''count'',count(*)) FROM public.%I;',
  c.relname,
  c.relname
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname = ANY (ARRAY[
    'program_templates','program_template_exercises',
    'client_program_assignments','client_program_exercises',
    'client_nutrition_assignments','client_nutrition_profiles',
    'memberships','profiles','client_customer_journeys',
    'product_runtime_settings','payments','payment_provider_events',
    'user_roles','staff_members','promo_code_redemptions','promo_codes',
    'product_prices','product_promotions','nutrition_templates',
    'nutrition_template_versions'
  ])
  AND has_table_privilege(current_user, c.oid, 'SELECT')
ORDER BY c.relname
\gexec

WITH requested(table_name, column_name) AS (
  VALUES
    ('memberships','tier'), ('memberships','is_active'),
    ('memberships','subscription_status'), ('memberships','source'),
    ('client_program_assignments','status'),
    ('client_program_assignments','generation_source'),
    ('client_program_assignments','progression_strategy'),
    ('client_nutrition_assignments','status'),
    ('client_nutrition_assignments','strategy_bucket'),
    ('client_customer_journeys','status'),
    ('client_customer_journeys','failure_code'),
    ('client_customer_journeys','grandfathered'),
    ('payments','status'), ('payments','method'), ('payments','provider'),
    ('payment_provider_events','processing_status'),
    ('payment_provider_events','provider'),
    ('profiles','gender'), ('profiles','goal'),
    ('user_roles','role'), ('staff_members','status')
)
SELECT format(
  'SELECT jsonb_build_object(''kind'',''distribution'',''table'',%L,''column'',%L,''value'',COALESCE(%I::text,''<NULL>''),''count'',count(*)) FROM public.%I GROUP BY %I ORDER BY %I::text NULLS FIRST;',
  r.table_name, r.column_name, r.column_name, r.table_name, r.column_name, r.column_name
)
FROM requested r
JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = r.table_name
 AND c.column_name = r.column_name
WHERE has_table_privilege(current_user, format('%I.%I', c.table_schema, c.table_name), 'SELECT')
ORDER BY r.table_name, r.column_name
\gexec

WITH requested(table_name, column_name) AS (
  VALUES
    ('program_templates','goal'), ('program_templates','level'),
    ('program_templates','days_per_week'),
    ('program_template_exercises','activity_role'),
    ('client_program_assignments','client_id'),
    ('client_program_assignments','source_template_id'),
    ('client_program_assignments','starts_on'),
    ('client_program_exercises','activity_role'),
    ('client_nutrition_assignments','client_id'),
    ('client_nutrition_assignments','resolved_snapshot'),
    ('client_nutrition_assignments','watch_allergens'),
    ('client_nutrition_profiles','allergy_status'),
    ('client_nutrition_profiles','known_allergens'),
    ('client_customer_journeys','goal'),
    ('client_customer_journeys','gender'),
    ('client_customer_journeys','preferred_training_days'),
    ('client_customer_journeys','normalized_training_days'),
    ('client_customer_journeys','training_meal_window'),
    ('memberships','user_id'), ('profiles','id'),
    ('payments','user_id'), ('payments','method')
)
SELECT format(
  'SELECT jsonb_build_object(''kind'',''null_count'',''table'',%L,''column'',%L,''count'',count(*) FILTER (WHERE %I IS NULL),''total'',count(*)) FROM public.%I;',
  r.table_name, r.column_name, r.column_name, r.table_name
)
FROM requested r
JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = r.table_name
 AND c.column_name = r.column_name
WHERE has_table_privilege(current_user, format('%I.%I', c.table_schema, c.table_name), 'SELECT')
ORDER BY r.table_name, r.column_name
\gexec

SELECT format(
  'SELECT jsonb_build_object(''kind'',''duplicate_active'',''table'',''client_program_assignments'',''groups'',count(*),''rows'',COALESCE(sum(n),0)) FROM (SELECT client_id,count(*) n FROM public.client_program_assignments WHERE status=''active'' GROUP BY client_id HAVING count(*)>1) d;'
)
WHERE to_regclass('public.client_program_assignments') IS NOT NULL
  AND has_table_privilege(current_user, 'public.client_program_assignments', 'SELECT')
\gexec

SELECT format(
  'SELECT jsonb_build_object(''kind'',''duplicate_active'',''table'',''client_nutrition_assignments'',''groups'',count(*),''rows'',COALESCE(sum(n),0)) FROM (SELECT client_id,count(*) n FROM public.client_nutrition_assignments WHERE status=''active'' GROUP BY client_id HAVING count(*)>1) d;'
)
WHERE to_regclass('public.client_nutrition_assignments') IS NOT NULL
  AND has_table_privilege(current_user, 'public.client_nutrition_assignments', 'SELECT')
\gexec

SELECT format(
  'SELECT jsonb_build_object(''kind'',''duplicate_active'',''table'',''memberships'',''groups'',count(*),''rows'',COALESCE(sum(n),0)) FROM (SELECT user_id,count(*) n FROM public.memberships WHERE is_active IS TRUE GROUP BY user_id HAVING count(*)>1) d;'
)
WHERE to_regclass('public.memberships') IS NOT NULL
  AND has_table_privilege(current_user, 'public.memberships', 'SELECT')
\gexec

SELECT format(
  'SELECT jsonb_build_object(''kind'',''duplicate_provider_event'',''groups'',count(*),''rows'',COALESCE(sum(n),0)) FROM (SELECT provider,provider_event_id,count(*) n FROM public.payment_provider_events GROUP BY provider,provider_event_id HAVING count(*)>1) d;'
)
WHERE to_regclass('public.payment_provider_events') IS NOT NULL
  AND has_table_privilege(current_user, 'public.payment_provider_events', 'SELECT')
\gexec

WITH enums(type_name) AS (
  VALUES ('payment_method'), ('payment_status'), ('subscription_status'),
         ('membership_tier'), ('app_role')
)
SELECT jsonb_build_object(
  'kind', 'enum_values',
  'enum', e.type_name,
  'values', COALESCE(jsonb_agg(v.enumlabel ORDER BY v.enumsortorder), '[]'::jsonb)
)
FROM enums e
LEFT JOIN (
  SELECT t.typname, x.enumlabel, x.enumsortorder
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum x ON x.enumtypid = t.oid
  WHERE n.nspname = 'public'
) v ON v.typname = e.type_name
GROUP BY e.type_name
ORDER BY e.type_name;

SELECT jsonb_build_object(
  'kind', 'has_role_grants',
  'signature', p.oid::regprocedure::text,
  'public', has_function_privilege('public', p.oid, 'EXECUTE'),
  'anon', has_function_privilege('anon', p.oid, 'EXECUTE'),
  'authenticated', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
  'service_role', has_function_privilege('service_role', p.oid, 'EXECUTE')
)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'has_role'
ORDER BY p.oid::regprocedure::text;

SELECT jsonb_build_object(
  'kind', 'provider_rpc_grants',
  'signature', p.oid::regprocedure::text,
  'public', has_function_privilege('public', p.oid, 'EXECUTE'),
  'anon', has_function_privilege('anon', p.oid, 'EXECUTE'),
  'authenticated', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
  'service_role', has_function_privilege('service_role', p.oid, 'EXECUTE')
)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'apply_provider_subscription_event';

COMMIT;
`;

const result = spawnSync(
  "/opt/homebrew/bin/psql",
  [
    "--no-psqlrc",
    "--set",
    "sslmode=require",
    "--host",
    linkedValue("PGHOST"),
    "--port",
    linkedValue("PGPORT"),
    "--username",
    linkedValue("PGUSER"),
    "--dbname",
    linkedValue("PGDATABASE"),
  ],
  {
    input: sql,
    encoding: "utf8",
    env: { ...process.env, PGPASSWORD: linkedValue("PGPASSWORD") },
    maxBuffer: 16 * 1024 * 1024,
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || "Production read-only audit failed.\n");
  process.exit(result.status || 1);
}

process.stdout.write(result.stdout);
