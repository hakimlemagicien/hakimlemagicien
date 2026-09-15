import { supabase } from "@/integrations/supabase/client";

export const MEMBERSHIP_OVERRIDE_TIERS = ["free", "essential", "premium", "vip"] as const;
export type MembershipOverrideTier = (typeof MEMBERSHIP_OVERRIDE_TIERS)[number];

export const MEMBERSHIP_OVERRIDE_PERIODS = [3, 6] as const;
export type MembershipOverridePeriod = (typeof MEMBERSHIP_OVERRIDE_PERIODS)[number];

export type MembershipOverrideResult = {
  ok: boolean;
  clientId: string;
  membershipId: string | null;
  previousTier: string | null;
  tier: string;
  endsAt: string | null;
  billingPeriodMonths: number | null;
  source: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function parseMembershipOverrideError(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("active_psp_subscription")) {
    return "لا يمكن التعديل: لدى العميل اشتراك مزوّد دفع نشط. أوقف الاشتراك من المزود أولاً.";
  }
  if (lower.includes("provider_history_conflict")) {
    return "تعذر التعديل بسبب سجل مرتبط بمزوّد دفع لنفس المستوى.";
  }
  if (lower.includes("invalid_billing_period")) {
    return "اختر مدة 3 أو 6 أشهر للعضوية المدفوعة.";
  }
  if (lower.includes("reason_required")) {
    return "السبب إلزامي (5 أحرف على الأقل).";
  }
  if (lower.includes("invalid_membership_tier")) {
    return "مستوى العضوية غير صالح.";
  }
  if (lower.includes("forbidden") || lower.includes("42501")) {
    return "صلاحية غير كافية — تفعيل العضوية متاح لمدير النظام.";
  }
  if (lower.includes("invalid_client")) {
    return "معرّف العميل غير صالح.";
  }
  return "تعذر تطبيق العضوية. حاول مرة أخرى أو راجع سجل التدقيق.";
}

export async function applyAdminMembershipOverride(input: {
  clientId: string;
  tier: MembershipOverrideTier;
  billingPeriodMonths: MembershipOverridePeriod | null;
  reason: string;
}): Promise<MembershipOverrideResult> {
  const { data, error } = await supabase.rpc("admin_apply_membership_override", {
    p_client_id: input.clientId,
    p_tier: input.tier,
    p_billing_period_months: input.tier === "free" ? null : (input.billingPeriodMonths ?? undefined),
    p_reason: input.reason.trim(),
  });
  if (error) throw error;

  const row = asRecord(data);
  return {
    ok: row.ok === true,
    clientId: typeof row.client_id === "string" ? row.client_id : input.clientId,
    membershipId: typeof row.membership_id === "string" ? row.membership_id : null,
    previousTier: typeof row.previous_tier === "string" ? row.previous_tier : null,
    tier: typeof row.tier === "string" ? row.tier : input.tier,
    endsAt: typeof row.ends_at === "string" ? row.ends_at : null,
    billingPeriodMonths:
      row.billing_period_months === 3 || row.billing_period_months === 6
        ? row.billing_period_months
        : null,
    source: typeof row.source === "string" ? row.source : null,
  };
}

export function estimateMembershipEndDate(
  tier: MembershipOverrideTier,
  periodMonths: MembershipOverridePeriod | null,
  from: Date = new Date(),
): Date | null {
  if (tier === "free" || !periodMonths) return null;
  const end = new Date(from);
  end.setMonth(end.getMonth() + periodMonths);
  return end;
}
