import type { ProgressionStrategy } from "./types";

export type ProgressionAuditRecord = {
  who: "SYSTEM" | "COACH";
  what: string;
  client_id: string;
  assignment_id: string;
  at: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  result: "applied" | "blocked" | "review" | "kept";
};

export function buildProgressionAudit(input: {
  who: "SYSTEM" | "COACH";
  what: string;
  clientId: string;
  assignmentId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  result: ProgressionAuditRecord["result"];
  at?: string;
}): ProgressionAuditRecord {
  return {
    who: input.who,
    what: input.what,
    client_id: input.clientId,
    assignment_id: input.assignmentId,
    at: input.at ?? new Date().toISOString(),
    before: input.before,
    after: input.after,
    reason: input.reason,
    result: input.result,
  };
}

export function strategyChangeAudit(input: {
  clientId: string;
  assignmentId: string;
  from: ProgressionStrategy;
  to: ProgressionStrategy;
  reason: string;
}): ProgressionAuditRecord {
  return buildProgressionAudit({
    who: "COACH",
    what: "progression_strategy",
    clientId: input.clientId,
    assignmentId: input.assignmentId,
    before: { strategy: input.from },
    after: { strategy: input.to },
    reason: input.reason,
    result: "applied",
  });
}

export function isStaleProgressionWrite(expectedUpdatedAt: string | null, currentUpdatedAt: string | null): boolean {
  if (!expectedUpdatedAt || !currentUpdatedAt) return false;
  return expectedUpdatedAt !== currentUpdatedAt;
}

export const STALE_PROGRESSION_MESSAGE = "تم تحديث البرنامج منذ فتح هذه الصفحة. راجع أحدث نسخة قبل الحفظ.";
