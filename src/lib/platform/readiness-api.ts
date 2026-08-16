import { supabase } from "@/integrations/supabase/client";
import type { DailyReadinessCheck } from "@/lib/platform/readiness";

type RemoteReadinessRow = {
  id: string;
  user_id: string;
  local_date: string;
  timezone: string;
  energy: DailyReadinessCheck["energy"] | null;
  sleep: DailyReadinessCheck["sleep"] | null;
  body: DailyReadinessCheck["body"] | null;
  score: number | null;
  level: DailyReadinessCheck["level"] | null;
  status: DailyReadinessCheck["status"];
  source: DailyReadinessCheck["source"];
  adjustment_decision: DailyReadinessCheck["adjustmentDecision"] | null;
  adjustment_choice: DailyReadinessCheck["adjustmentChoice"] | null;
  created_at: string;
  updated_at: string;
};

function fromRemote(row: RemoteReadinessRow): DailyReadinessCheck {
  return {
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    timezone: row.timezone,
    energy: row.energy ?? undefined,
    sleep: row.sleep ?? undefined,
    body: row.body ?? undefined,
    score: row.score ?? undefined,
    level: row.level ?? undefined,
    status: row.status,
    source: row.source,
    adjustmentDecision: row.adjustment_decision ?? undefined,
    adjustmentChoice: row.adjustment_choice ?? undefined,
    pendingSync: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRemote(record: DailyReadinessCheck) {
  return {
    id: record.id,
    user_id: record.userId,
    local_date: record.localDate,
    timezone: record.timezone,
    energy: record.energy ?? null,
    sleep: record.sleep ?? null,
    body: record.body ?? null,
    score: record.score ?? null,
    level: record.level ?? null,
    status: record.status,
    source: record.source,
    adjustment_decision: record.adjustmentDecision ?? null,
    adjustment_choice: record.adjustmentChoice ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /daily_readiness_checks/i.test(error.message ?? "")
  );
}

export async function fetchRemoteReadiness(
  userId: string,
  localDate: string,
): Promise<DailyReadinessCheck | null> {
  const { data, error } = await supabase
    .from("daily_readiness_checks")
    .select("*")
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  if (!data) return null;
  return fromRemote(data as RemoteReadinessRow);
}

export async function upsertRemoteReadiness(
  record: DailyReadinessCheck,
): Promise<DailyReadinessCheck | null> {
  const { data, error } = await supabase
    .from("daily_readiness_checks")
    .upsert(toRemote(record), { onConflict: "user_id,local_date" })
    .select("*")
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  if (!data) return { ...record, pendingSync: false };
  return fromRemote(data as RemoteReadinessRow);
}
