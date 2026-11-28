/**
 * PRODUCTION — idempotent reconcile via `supabase db query --linked` (no DB password).
 *
 * Policy: Exact+SAFE only auto-assigns. Never invents context. Never silent downgrade.
 * Free / non-entitled: review only. Coach override preserved.
 *
 * Usage:
 *   npx tsx src/lib/platform/training-auto-assign/reconcile-production.mts
 *   npx tsx src/lib/platform/training-auto-assign/reconcile-production.mts --apply
 */
import { spawnSync } from "node:child_process";
import {
  decideTrainingAssignment,
  buildTrainingAssignIdempotencyKey,
  fingerprintClientContext,
  type TrainingAssignmentDecisionState,
} from "@/lib/platform/training-auto-assign/types";
import { recommendTemplateForClient } from "@/lib/admin/admin-template-ui";
import { programTemplateContractFromMetadata } from "@/lib/admin/admin-program-builder";
import type { ResolvableTemplateRecord } from "@/lib/platform/training-templates";
import { mapClientTrainingLocation } from "@/lib/admin/admin-program-ops";
import {
  templateEnvironmentFromLocation,
  templateLevelFromProgramLevel,
} from "@/lib/platform/training-templates";
import { isPaidMembershipTier } from "@/lib/platform/membership";

const APPLY = process.argv.includes("--apply");

type ClientRow = {
  client_id: string;
  email: string | null;
  tier: string | null;
  assignment_id: string | null;
  source_template_id: string | null;
  progression_strategy: string | null;
  template_slug: string | null;
  goal: string | null;
  training_type: string | null;
  location_preference: string | null;
  answers: Record<string, unknown> | null;
  training_level: string | null;
};

type TemplateRow = {
  id: string;
  slug: string;
  version: number;
  is_published: boolean;
  metadata: Record<string, unknown> | null;
};

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function linkedQuery<T>(sql: string): T[] {
  const result = spawnSync("supabase", ["db", "query", "--linked", sql], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `supabase exit ${result.status}`);
  }
  const text = result.stdout.trim();
  // CLI returns JSON object with rows[] or a single aggregate row
  const parsed = JSON.parse(text) as { rows?: Array<Record<string, unknown>> } | T[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.rows)) {
    const rows = parsed.rows;
    if (rows.length === 1 && rows[0] && "data" in rows[0]) {
      const data = rows[0].data;
      if (Array.isArray(data)) return data as T[];
      if (typeof data === "string") return JSON.parse(data) as T[];
    }
    return rows as T[];
  }
  throw new Error("Unexpected supabase db query response shape");
}

function linkedExec(sql: string): void {
  const result = spawnSync("supabase", ["db", "query", "--linked", sql], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `supabase exec failed`);
  }
}

const counts: Record<string, number> = {
  AUTO_ASSIGNED: 0,
  AUTO_UPDATED: 0,
  NO_CHANGE_REQUIRED: 0,
  REVIEW_REQUIRED: 0,
  COACH_OVERRIDE_ACTIVE: 0,
  BLOCKED_NO_EXACT_MATCH: 0,
  SKIPPED_NOT_ENTITLED: 0,
  ACTIVATED: 0,
  ACTIVATION_NOOP: 0,
  ASSIGN_FAILURES: 0,
  REVIEWS_WRITTEN: 0,
};

const decisions: Array<Record<string, unknown>> = [];

const templates = linkedQuery<TemplateRow>(`
SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.slug), '[]'::jsonb) AS data
FROM (
  SELECT id::text, slug, version::int AS version, is_published, metadata
  FROM program_templates
  WHERE archived_at IS NULL AND is_published = true
) t;
`);

const catalog: ResolvableTemplateRecord[] = [];
for (const row of templates) {
  const contract = programTemplateContractFromMetadata(row.metadata ?? {});
  if (!contract) continue;
  catalog.push({
    id: row.id,
    slug: row.slug,
    version: Number(row.version),
    status: "PUBLISHED",
    is_published: true,
    archived: false,
    version_group_id: row.slug,
    contract,
  });
}
if (catalog.length === 0) throw new Error("No published contract templates on Production");

const clients = linkedQuery<ClientRow>(`
SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.email), '[]'::jsonb) AS data
FROM (
  WITH targets AS (
    SELECT DISTINCT client_id FROM client_program_assignments WHERE status = 'active'
    UNION
    SELECT user_id FROM memberships WHERE is_active = true
  )
  SELECT
    t.client_id::text AS client_id,
    p.email,
    m.tier::text AS tier,
    a.id::text AS assignment_id,
    a.source_template_id::text AS source_template_id,
    a.progression_strategy::text AS progression_strategy,
    pt.slug AS template_slug,
    tp.goal,
    tp.training_type,
    tp.location_preference,
    tp.answers,
    ctl.training_level
  FROM targets t
  LEFT JOIN profiles p ON p.id = t.client_id
  LEFT JOIN memberships m ON m.user_id = t.client_id AND m.is_active
  LEFT JOIN LATERAL (
    SELECT * FROM client_program_assignments x
    WHERE x.client_id = t.client_id AND x.status = 'active'
    ORDER BY x.assigned_at DESC NULLS LAST
    LIMIT 1
  ) a ON true
  LEFT JOIN program_templates pt ON pt.id = a.source_template_id
  LEFT JOIN training_profiles tp ON tp.user_id = t.client_id
  LEFT JOIN client_training_levels ctl ON ctl.user_id = t.client_id
) t;
`);

const admin = linkedQuery<{ user_id: string; email: string }>(`
SELECT ur.user_id::text AS user_id, p.email
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.role::text = 'admin'
ORDER BY CASE WHEN p.email LIKE '%staging-admin%' THEN 0 ELSE 1 END
LIMIT 1;
`)[0];
if (!admin) throw new Error("No admin user on Production");

for (const row of clients) {
  const answers = row.answers ?? {};
  const location = mapClientTrainingLocation(row.training_type ?? row.location_preference);
  const env =
    location === "BOTH"
      ? "BOTH"
      : templateEnvironmentFromLocation(location as "HOME" | "GYM") ?? String(location);
  const level =
    row.training_level && row.training_level !== "UNASSESSED"
      ? templateLevelFromProgramLevel(row.training_level) ?? row.training_level
      : null;
  const days =
    typeof answers.trainingDaysPerWeek === "number"
      ? Number(answers.trainingDaysPerWeek)
      : typeof answers.training_days_per_week === "number"
        ? Number(answers.training_days_per_week)
        : null;
  const equipment = Array.isArray(answers.availableEquipment)
    ? (answers.availableEquipment as string[])
    : null;

  const entitled = isPaidMembershipTier((row.tier as "free") ?? "free");
  const resolver = recommendTemplateForClient(
    {
      clientId: row.client_id,
      goal: row.goal,
      trainingType: env === "HOME" ? "home" : env === "GYM" ? "gym" : "both",
      level,
      daysPerWeek: days,
      fatLossPriority: Boolean(answers.fat_loss_priority ?? answers.fatLossPriority),
      availableEquipment: equipment,
    },
    catalog,
  );

  const decision = decideTrainingAssignment({
    clientKind: row.assignment_id ? "EXISTING" : "NEW",
    resolver,
    activeAssignment: row.assignment_id
      ? {
          id: row.assignment_id,
          source_template_id: row.source_template_id,
          status: "active",
          progression_strategy: row.progression_strategy,
        }
      : null,
    coachOverrideProtected: row.progression_strategy === "COACH_MANAGED",
  });

  let decisionState: TrainingAssignmentDecisionState = decision.decision_state;
  let shouldAssign = decision.should_assign;
  let reasonCode = decision.reason_code;
  let reasonSummary = decision.reason_summary;
  if (!entitled && shouldAssign) {
    decisionState = "REVIEW_REQUIRED";
    shouldAssign = false;
    reasonCode = "NOT_ENTITLED_FREE";
    reasonSummary = "عضوية غير مدفوعة — لا تعيين برنامج تلقائي";
    counts.SKIPPED_NOT_ENTITLED += 1;
  }

  const fp = fingerprintClientContext({
    quizGoal: row.goal,
    level,
    environment: env,
    days,
    equipment,
  });
  const key = buildTrainingAssignIdempotencyKey({
    clientId: row.client_id,
    decisionState,
    recommendedTemplateId: decision.recommended_template_id,
    activeAssignmentId: row.assignment_id,
    contextFingerprint: fp,
  });

  let assignedTemplateId: string | null = null;
  let assignedTemplateSlug: string | null = null;
  let newAssignmentId: string | null = null;

  if (APPLY && shouldAssign && decision.recommended_template_id) {
    const startsOn = new Date();
    if (row.assignment_id) startsOn.setDate(startsOn.getDate() + 1);
    const starts = startsOn.toISOString().slice(0, 10);
    try {
      const assigned = linkedQuery<{ id: string }>(`
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', ${sqlLiteral(admin.user_id)}, true);
  PERFORM set_config('request.jwt.claims', ${sqlLiteral(JSON.stringify({ sub: admin.user_id, role: "authenticated" }))}, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
SELECT (public.admin_assign_client_program(
  ${sqlLiteral(row.client_id)}::uuid,
  ${sqlLiteral(decision.recommended_template_id)}::uuid,
  ${sqlLiteral(starts)}::date,
  true
)->>'id') AS id;
`);
      newAssignmentId = assigned[0]?.id ?? null;
      assignedTemplateId = decision.recommended_template_id;
      assignedTemplateSlug = decision.recommended_template_slug;
    } catch (error) {
      counts.ASSIGN_FAILURES += 1;
      console.warn("assign failed", row.email ?? row.client_id, String(error));
    }
  }

  if (APPLY) {
    linkedExec(`
INSERT INTO training_assignment_reviews (
  client_id, client_kind, decision_state, quiz_goal, mapped_training_goal,
  training_level, training_environment, days_per_week, equipment_summary,
  previous_template_id, previous_template_slug, previous_assignment_id,
  recommended_template_id, recommended_template_slug,
  assigned_template_id, assigned_template_slug, assignment_id,
  assignment_source, reason_code, reason_summary, resolver_trace, client_context,
  idempotency_key, is_reviewed
) VALUES (
  ${sqlLiteral(row.client_id)}::uuid,
  'EXISTING',
  ${sqlLiteral(decisionState)},
  ${sqlLiteral(row.goal)},
  ${sqlLiteral(resolver.primary_strategy)},
  ${sqlLiteral(level)},
  ${sqlLiteral(env)},
  ${days == null ? "NULL" : String(days)},
  ${sqlLiteral((equipment ?? []).join(", ") || null)},
  ${row.source_template_id ? `${sqlLiteral(row.source_template_id)}::uuid` : "NULL"},
  ${sqlLiteral(row.template_slug)},
  ${row.assignment_id ? `${sqlLiteral(row.assignment_id)}::uuid` : "NULL"},
  ${decision.recommended_template_id ? `${sqlLiteral(decision.recommended_template_id)}::uuid` : "NULL"},
  ${sqlLiteral(decision.recommended_template_slug)},
  ${assignedTemplateId ? `${sqlLiteral(assignedTemplateId)}::uuid` : "NULL"},
  ${sqlLiteral(assignedTemplateSlug)},
  ${(newAssignmentId ?? row.assignment_id) ? `${sqlLiteral(newAssignmentId ?? row.assignment_id)}::uuid` : "NULL"},
  'RECONCILE',
  ${sqlLiteral(reasonCode)},
  ${sqlLiteral(reasonSummary)},
  ${sqlLiteral({
    status: resolver.status,
    fallback_class: resolver.fallback_class,
    compatibility_status: resolver.compatibility_status,
  })},
  ${sqlLiteral({
    email: row.email,
    tier: row.tier,
    goal: row.goal,
    level,
    env,
    days,
    entitled,
  })},
  ${sqlLiteral(key)},
  ${decisionState === "NO_CHANGE_REQUIRED" ? "TRUE" : "FALSE"}
)
ON CONFLICT (client_id, idempotency_key) DO UPDATE SET
  updated_at = training_assignment_reviews.updated_at;
`);
    counts.REVIEWS_WRITTEN += 1;
  }

  counts[decisionState] = (counts[decisionState] ?? 0) + 1;
  decisions.push({
    email: row.email,
    tier: row.tier,
    entitled,
    decision: decisionState,
    reason: reasonCode,
    recommended: decision.recommended_template_slug,
    previous: row.template_slug,
    would_assign: shouldAssign,
  });
}

const due = linkedQuery<{ client_id: string }>(`
SELECT DISTINCT client_id::text AS client_id
FROM client_program_assignments
WHERE status = 'scheduled' AND starts_on IS NOT NULL AND starts_on <= CURRENT_DATE;
`);

for (const { client_id } of due) {
  if (!APPLY) {
    counts.ACTIVATION_NOOP += 1;
    decisions.push({ activation_client: client_id, activation: "dry_run_due" });
    continue;
  }
  try {
    const rows = linkedQuery<{ result: Record<string, unknown> }>(`
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', ${sqlLiteral(admin.user_id)}, true);
  PERFORM set_config('request.jwt.claims', ${sqlLiteral(JSON.stringify({ sub: admin.user_id, role: "authenticated" }))}, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;
SELECT public.activate_due_client_program_assignment(${sqlLiteral(client_id)}::uuid) AS result;
`);
    const result = rows[0]?.result ?? {};
    if (result.activated === true) counts.ACTIVATED += 1;
    else counts.ACTIVATION_NOOP += 1;
    decisions.push({ activation_client: client_id, activation: result });
  } catch (error) {
    console.warn("activation failed", client_id, String(error));
  }
}

console.log(
  JSON.stringify(
    {
      STATUS: "PASS",
      MODE: APPLY ? "APPLY" : "DRY_RUN",
      PROJECT: "ufgrbpakuemamggwypdh",
      catalog_templates: catalog.length,
      scanned: clients.length,
      admin_actor: admin.email,
      counts,
      decisions,
    },
    null,
    2,
  ),
);
