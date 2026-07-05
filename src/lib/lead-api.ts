import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { LeadCredentials } from "@/lib/lead-storage";
import { setLeadCredentials } from "@/lib/lead-storage";
import type { PaymentMethod } from "@/lib/payment-method-map";
import { notifyAdminReceiptUpload } from "@/lib/payment-notifications-api";

const PAYMENT_PROOFS_BUCKET = "payment-proofs";

export type CreateLeadPayload = Json;
export type UpdateLeadPayload = Record<string, Json | string | number | null>;

export type CreateLeadResult = LeadCredentials;

type CreateLeadRpcResponse = {
  lead_id: string;
  access_token: string;
};

function isCreateLeadRpcResponse(value: unknown): value is CreateLeadRpcResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  return typeof record.lead_id === "string" && typeof record.access_token === "string";
}

function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function toRpcPayload(payload: UpdateLeadPayload): Json {
  return payload as Json;
}

export async function createLead(payload: CreateLeadPayload): Promise<CreateLeadResult> {
  const { data, error } = await supabase.rpc("create_lead", { p_payload: payload });

  if (error) throw error;

  if (!isCreateLeadRpcResponse(data)) {
    throw new Error("Lead created without credentials.");
  }

  const credentials = { leadId: data.lead_id, accessToken: data.access_token };
  setLeadCredentials(credentials);
  return credentials;
}

export async function updateLead(
  credentials: LeadCredentials,
  payload: UpdateLeadPayload,
): Promise<void> {
  const { error } = await supabase.rpc("update_lead", {
    p_lead_id: credentials.leadId,
    p_access_token: credentials.accessToken,
    p_payload: toRpcPayload(payload),
  });

  if (error) throw error;
}

export async function saveSelectedPlan(
  credentials: LeadCredentials,
  plan: {
    tierId: string;
    tierName: string;
    planPrice: number;
    trainingMode: string;
  },
): Promise<void> {
  await updateLead(credentials, {
    tier_id: plan.tierId,
    tier_name: plan.tierName,
    plan_price: plan.planPrice,
    training_mode: plan.trainingMode,
    status: "plan_selected",
  });
}

export async function savePaymentMethod(
  credentials: LeadCredentials,
  payment: {
    method: PaymentMethod;
    amount: number;
    currency?: string;
  },
): Promise<void> {
  await updateLead(credentials, {
    payment_method: payment.method,
    payment_amount: payment.amount,
    payment_currency: payment.currency ?? "USD",
  });
}

export async function reserveProofUpload(
  credentials: LeadCredentials,
  file: File,
): Promise<string> {
  const { data, error } = await supabase.rpc("reserve_proof_upload", {
    p_lead_id: credentials.leadId,
    p_access_token: credentials.accessToken,
    p_file_ext: getFileExtension(file),
  });

  if (error) throw error;
  if (typeof data !== "string" || data.length === 0) {
    throw new Error("Proof upload path was not reserved.");
  }

  return data;
}

export async function uploadPaymentProof(
  credentials: LeadCredentials,
  file: File,
): Promise<string> {
  const path = await reserveProofUpload(credentials, file);

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;
  return path;
}

export async function markPaymentSubmitted(
  credentials: LeadCredentials,
  proofPath: string,
): Promise<void> {
  const { error } = await supabase.rpc("submit_payment_proof_metadata", {
    p_lead_id: credentials.leadId,
    p_access_token: credentials.accessToken,
    p_proof_path: proofPath,
  });

  if (error) throw error;
}

export async function submitPaymentProof(
  credentials: LeadCredentials,
  file: File,
): Promise<string> {
  const proofPath = await uploadPaymentProof(credentials, file);
  await markPaymentSubmitted(credentials, proofPath);

  console.log("[submitPaymentProof] before notifyAdminReceiptUpload", {
    leadId: credentials.leadId,
  });
  try {
    await notifyAdminReceiptUpload(credentials.leadId, credentials.accessToken);
    console.log("[submitPaymentProof] after notifyAdminReceiptUpload", {
      leadId: credentials.leadId,
    });
  } catch (err) {
    console.warn("[submitPaymentProof] notifyAdminReceiptUpload failed", err);
  }

  return proofPath;
}
