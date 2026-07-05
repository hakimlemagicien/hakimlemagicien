import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  invokeAdminAcceptPayment,
  invokeAdminResendAccess,
  type AcceptPaymentOnboardingResult,
  type ResendAccessResult,
} from "@/lib/payment-notifications-api";

export type { AcceptPaymentOnboardingResult, ResendAccessResult };

const PAYMENT_PROOFS_BUCKET = "payment-proofs";
const PROOF_SIGNED_URL_TTL_SECONDS = 3600;

export type AdminSubmittedLead =
  Database["public"]["Functions"]["admin_list_submitted_leads"]["Returns"][number];

export type AdminApprovedLead =
  Database["public"]["Functions"]["admin_list_approved_leads"]["Returns"][number];

export type AdminPaymentDecision = "approved" | "rejected";

export async function checkAdminAccess(): Promise<{ userId: string }> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error("unauthenticated");
  }

  const userId = session.user.id;

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleError) {
    console.error("[checkAdminAccess] user_roles:", roleError.message);
    throw new Error("forbidden");
  }

  const isAdmin = roles?.some((row) => row.role === "admin") ?? false;
  if (!isAdmin) {
    throw new Error("forbidden");
  }

  return { userId };
}

export async function fetchSubmittedLeads(): Promise<AdminSubmittedLead[]> {
  const { data, error } = await supabase.rpc("admin_list_submitted_leads");
  if (error) throw error;
  return data ?? [];
}

export async function fetchApprovedLeads(): Promise<AdminApprovedLead[]> {
  const { data, error } = await supabase.rpc("admin_list_approved_leads");
  if (error) throw error;
  return data ?? [];
}

export async function resendClientAccessLink(leadId: string): Promise<ResendAccessResult> {
  return invokeAdminResendAccess(leadId);
}

export async function updateLeadPaymentStatus(
  leadId: string,
  status: AdminPaymentDecision,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_lead_payment_status", {
    p_lead_id: leadId,
    p_payment_status: status,
  });
  if (error) throw error;
}

const INVITE_PENDING_MESSAGE = "تم قبول الدفع، لكن لم يتم إرسال دعوة العميل بعد";

/** Confirm payment in DB, then invite/link client auth account (server edge function). */
export async function acceptLeadPayment(
  leadId: string,
): Promise<AcceptPaymentOnboardingResult> {
  await updateLeadPaymentStatus(leadId, "approved");

  try {
    return await invokeAdminAcceptPayment(leadId);
  } catch (err) {
    console.warn("[acceptLeadPayment] edge function unavailable:", err);
    return {
      ok: true,
      linked: false,
      invited: false,
      warning: "invite_not_sent",
      message: INVITE_PENDING_MESSAGE,
    };
  }
}

export function normalizeProofPath(proofPath: string): string {
  let path = proofPath.trim();
  if (!path) return "";

  const bucketPrefix = `${PAYMENT_PROOFS_BUCKET}/`;
  if (path.startsWith(bucketPrefix)) {
    path = path.slice(bucketPrefix.length);
  }

  return path.replace(/^\/+/, "");
}

export async function getProofSignedUrl(proofPath: string): Promise<string> {
  const objectPath = normalizeProofPath(proofPath);
  if (!objectPath) {
    throw new Error("مسار الإيصال غير صالح.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("يجب تسجيل الدخول لعرض الإيصال.");
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .download(objectPath);

  if (!downloadError && file) {
    const blobUrl = URL.createObjectURL(file);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return blobUrl;
  }

  const { data, error: signError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .createSignedUrl(objectPath, PROOF_SIGNED_URL_TTL_SECONDS);

  if (!signError && data?.signedUrl) {
    return data.signedUrl;
  }

  console.error("[getProofSignedUrl]", {
    objectPath,
    bucket: PAYMENT_PROOFS_BUCKET,
    downloadError: downloadError?.message,
    signError: signError?.message,
  });

  throw signError ?? downloadError ?? new Error("تعذر فتح الإيصال.");
}

export function openUrlInNewTab(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function openProofInNewTab(proofPath: string): Promise<void> {
  const url = await getProofSignedUrl(proofPath);
  openUrlInNewTab(url);
}

export function formatPaymentMethod(method: string | null): string {
  if (!method) return "—";
  const labels: Record<string, string> = {
    bank_nbd_uae: "Emirates NBD",
    bank_cih_morocco: "CIH Bank",
    bank_bmce_morocco: "BMCE Bank",
    binance: "Binance",
    paypal: "PayPal",
    wise: "Wise",
    skrill: "Skrill",
    stripe: "Stripe",
    other: "أخرى",
  };
  return labels[method] ?? method;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
